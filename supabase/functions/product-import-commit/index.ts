// supabase/functions/product-import-commit/index.ts
//
// POST body: { import_id: string }
//
// Step 3 (final) of the import pipeline — only runs after product-import-validate has
// produced a preview. Converts every row with row_status IN ('valid','draft') into a real
// product, using the exact same sequence as admin_seed_product() (019): insert as draft ->
// attach image(s)/category/purchase-option/inventory -> only THEN flip to 'active' for rows
// that had a primary image ('valid' rows). 'draft' rows (missing only an image) are left as
// status='draft' — never publicly visible — exactly per the activation-guard trigger in 015.
// 'error' rows are left untouched; they were never eligible and remain visible in
// product_import_errors for the admin to fix and re-upload.

import { handleCorsPreflight, corsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient, requireUser, requireAdminPermission } from "../_shared/supabase-clients.ts";
import { AppError, errorResponse } from "../_shared/errors.ts";
import { logAuditEvent } from "../_shared/audit.ts";

interface ImportRow {
  id: string;
  row_number: number;
  parsed_name: string;
  parsed_sku: string;
  parsed_slug: string | null;
  parsed_brand: string | null;
  parsed_price: number;
  parsed_compare_at_price: number | null;
  parsed_stock_quantity: number;
  parsed_description: string | null;
  parsed_short_description: string | null;
  primary_image_url: string | null;
  additional_image_urls: string[];
  matched_category_id: string | null;
  row_status: "valid" | "draft";
}

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function getOrCreateBrandId(
  serviceClient: ReturnType<typeof createServiceClient>,
  brandName: string | null,
): Promise<string | null> {
  if (!brandName) return null;
  const slug = slugify(brandName);
  const { data: existing } = await serviceClient.from("brands").select("id").eq("slug", slug).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await serviceClient
    .from("brands")
    .insert({ name: brandName, slug })
    .select("id")
    .single();
  if (error) {
    // Race with another concurrent import creating the same brand — re-fetch rather than fail.
    const { data: retry } = await serviceClient.from("brands").select("id").eq("slug", slug).maybeSingle();
    return retry?.id ?? null;
  }
  return created.id;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "Use POST", 405);

    const { import_id } = await req.json().catch(() => ({}));
    if (!import_id) throw new AppError("INVALID_REQUEST", "import_id is required", 400);

    const userClient = createUserClient(req);
    const user = await requireUser(userClient);
    const serviceClient = createServiceClient();
    await requireAdminPermission(serviceClient, user.id, "imports", "edit");

    const { data: importRecord, error: importErr } = await serviceClient
      .from("product_imports")
      .select("id, status")
      .eq("id", import_id)
      .single();
    if (importErr || !importRecord) throw new AppError("INVALID_REQUEST", "Import not found", 404);
    if (importRecord.status !== "previewed") {
      throw new AppError(
        "INVALID_REQUEST",
        `Import must be in 'previewed' status before committing (currently '${importRecord.status}')`,
        409,
      );
    }

    await serviceClient.from("product_imports").update({ status: "importing" }).eq("id", import_id);

    const { data: rows, error: rowsErr } = await serviceClient
      .from("product_import_rows")
      .select("*")
      .eq("import_id", import_id)
      .in("row_status", ["valid", "draft"])
      .order("row_number", { ascending: true });
    if (rowsErr) throw rowsErr;

    let imported = 0;
    let failed = 0;

    for (const row of (rows ?? []) as ImportRow[]) {
      try {
        const brandId = await getOrCreateBrandId(serviceClient, row.parsed_brand);
        const slug = `${row.parsed_slug || slugify(row.parsed_name)}-${row.parsed_sku.toLowerCase()}`;

        const { data: product, error: productErr } = await serviceClient
          .from("products")
          .insert({
            name: row.parsed_name,
            slug,
            sku: row.parsed_sku,
            brand_id: brandId,
            short_description: row.parsed_short_description,
            description: row.parsed_description,
            base_price: row.parsed_price,
            compare_at_price: row.parsed_compare_at_price,
            status: "draft", // flipped to active at the very end, only for 'valid' rows
            product_type: "simple",
            created_by: user.id,
          })
          .select("id")
          .single();
        if (productErr) throw productErr;
        const productId = product.id;

        if (row.primary_image_url) {
          await serviceClient.from("product_images").insert({
            product_id: productId,
            image_url: row.primary_image_url,
            is_primary: true,
            sort_order: 0,
          });
        }
        for (const [i, url] of (row.additional_image_urls ?? []).entries()) {
          await serviceClient.from("product_images").insert({
            product_id: productId,
            image_url: url,
            is_primary: false,
            sort_order: i + 1,
          });
        }

        if (row.matched_category_id) {
          await serviceClient.from("product_categories").insert({
            product_id: productId,
            category_id: row.matched_category_id,
            is_primary: true,
          });
        }

        await serviceClient.from("purchase_options").insert({
          product_id: productId,
          name: "1 Piece",
          unit_type: "piece",
          units_per_purchase: 1,
          price: row.parsed_price,
          compare_at_price: row.parsed_compare_at_price,
          is_default: true,
          is_active: true,
        });

        const { data: inventoryRow, error: invErr } = await serviceClient
          .from("inventory")
          .insert({ product_id: productId, quantity_on_hand: row.parsed_stock_quantity, quantity_reserved: 0 })
          .select("id")
          .single();
        if (invErr) throw invErr;

        await serviceClient.from("inventory_movements").insert({
          inventory_id: inventoryRow.id,
          product_id: productId,
          movement_type: "initial_stock",
          previous_quantity: 0,
          quantity_change: row.parsed_stock_quantity,
          resulting_quantity: row.parsed_stock_quantity,
          reason: `bulk import ${import_id}, row ${row.row_number}`,
          actor_id: user.id,
        });

        if (row.row_status === "valid" && row.primary_image_url) {
          // Triggers enforce_product_activation_requirements (015) here — will raise if
          // anything above was somehow skipped, which is exactly the safety net we want.
          const { error: activateErr } = await serviceClient
            .from("products")
            .update({ status: "active" })
            .eq("id", productId);
          if (activateErr) throw activateErr;
        }

        await serviceClient
          .from("product_import_rows")
          .update({ row_status: "imported", resulting_product_id: productId })
          .eq("id", row.id);

        imported++;
      } catch (rowErr) {
        console.error("IMPORT_ROW_COMMIT_FAILED", row.id, rowErr);
        await serviceClient.from("product_import_errors").insert({
          import_id,
          row_id: row.id,
          row_number: row.row_number,
          error_code: "COMMIT_FAILED",
          error_message: rowErr instanceof Error ? rowErr.message : String(rowErr),
        });
        failed++;
      }
    }

    await serviceClient
      .from("product_imports")
      .update({
        status: "completed",
        imported_rows: imported,
        failed_rows: failed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", import_id);

    await logAuditEvent(serviceClient, {
      actorId: user.id,
      action: "product_import.commit",
      resourceType: "product_imports",
      resourceId: import_id,
      metadata: { imported, failed },
    });

    return new Response(
      JSON.stringify({ import_id, imported, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return errorResponse(err, corsHeaders);
  }
});
