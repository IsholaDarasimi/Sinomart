// supabase/functions/product-import-validate/index.ts

import { handleCorsPreflight, corsHeaders } from "../_shared/cors.ts";
import {
  createUserClient,
  createServiceClient,
  requireUser,
  requireAdminPermission,
} from "../_shared/supabase-clients.ts";
import { AppError, errorResponse } from "../_shared/errors.ts";

interface ImportRow {
  id: string;
  row_number: number;

  parsed_name: string | null;
  parsed_sku: string | null;
  parsed_slug: string | null;
  parsed_brand: string | null;
  parsed_category_path: string | null;

  parsed_price: number | null;
  parsed_compare_at_price: number | null;
  parsed_stock_quantity: number | null;

  parsed_description: string | null;
  parsed_short_description: string | null;

  primary_image_url: string | null;

  raw_data?: Record<string, unknown> | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface RowError {
  import_id: string;
  row_id: string;
  row_number: number;
  field_name: string | null;
  error_code: string;
  error_message: string;
}

interface RowUpdate {
  id: string;
  row_status: "valid" | "draft" | "error";
  matched_category_id: string | null;
}

const CATEGORY_SUBCATEGORIES: Record<string, readonly string[]> = {
  "Home & Living": [
    "Furniture",
    "Home Decor",
    "Storage & Organization",
    "Bathroom",
    "Bedroom",
    "Cleaning & Laundry",
    "Lighting",
    "Curtains & Home Accessories",
  ],

  "Kitchen & Dining": [
    "Cookware",
    "Kitchen Utensils",
    "Drinkware",
    "Dinnerware",
    "Food Storage",
    "Lunch Boxes & Flasks",
    "Kitchen Organization",
    "Baking & Kitchen Tools",
  ],

  "Electronics & Appliances": [
    "Televisions",
    "Refrigerators & Freezers",
    "Washing Machines",
    "Air Conditioners",
    "Fans",
    "Small Kitchen Appliances",
    "Audio",
    "Gadgets & Accessories",
    "Power & Generators",
  ],

  "Fashion & Accessories": [
    "Men's Clothing",
    "Women's Clothing",
    "Footwear",
    "Bags",
    "Jewellery",
    "Watches",
    "Fashion Accessories",
  ],

  "Beauty & Personal Care": [
    "Face Care",
    "Skincare",
    "Makeup",
    "Hair Care",
    "Bath & Body",
    "Beauty Tools",
    "Fragrance",
  ],

  "Kids, Baby & Toys": [
    "Toys",
    "Dolls",
    "Stuffed Animals",
    "Baby Care",
    "Baby Accessories",
    "Kids Fashion",
    "School Essentials",
    "Educational Toys",
  ],

  "Sports & Outdoor": [
    "Skates",
    "Skateboards",
    "Fitness",
    "Sports Equipment",
    "Outdoor Games",
    "Camping & Outdoor",
  ],

  "Office & School": [
    "Stationery",
    "School Supplies",
    "Office Supplies",
    "Office Furniture",
    "Bags & Backpacks",
    "Educational Materials",
  ],

  "Pet Supplies": [
    "Pet Food & Treats",
    "Pet Toys",
    "Pet Grooming",
    "Pet Accessories",
    "Pet Cleaning",
  ],

  "Travel & Luggage": [
    "Suitcases",
    "Travel Bags",
    "Backpacks",
    "Travel Accessories",
    "Organizers",
  ],

  "Groceries & Everyday Essentials": [
    "Beverages",
    "Snacks",
    "Household Essentials",
    "Personal Essentials",
    "Pantry Items",
  ],

  "Tools & Hardware": [
    "Hand Tools",
    "Hardware",
    "Electrical Accessories",
    "Workshop Equipment",
    "DIY",
  ],
};

function cleanString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .replace(/\ufeff/g, "")
    .trim();
}

function normalize(value: unknown): string {
  return cleanString(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value)
    .replace(/₦/gi, "")
    .replace(/ngn/gi, "")
    .replace(/,/g, "")
    .trim();

  if (!cleaned) {
    return null;
  }

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function isValidNonNegativeNumber(value: unknown): boolean {
  const number = toNumber(value);

  return number !== null && number >= 0;
}

function isValidNonNegativeInteger(value: unknown): boolean {
  const number = toNumber(value);

  return (
    number !== null &&
    number >= 0 &&
    Number.isInteger(number)
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeExpectedSlug(
  name: string,
  sku: string,
): string {
  const nameSlug = slugify(name);
  const skuSlug = slugify(sku);

  if (!nameSlug) {
    return skuSlug;
  }

  if (!skuSlug) {
    return nameSlug;
  }

  return `${nameSlug}-${skuSlug}`;
}

function parseCategoryPath(
  value: string,
): { parent: string; child: string } | null {
  const parts = value
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) {
    return null;
  }

  return {
    parent: parts[0],
    child: parts[1],
  };
}

function resolveCategory(
  categoryPath: string,
  categories: Category[],
): string | null {
  const parsed = parseCategoryPath(categoryPath);

  if (!parsed) {
    return null;
  }

  const parentName = normalize(parsed.parent);
  const childName = normalize(parsed.child);

  const parent = categories.find(
    (category) =>
      category.parent_id === null &&
      normalize(category.name) === parentName,
  );

  if (!parent) {
    return null;
  }

  const child = categories.find(
    (category) =>
      category.parent_id === parent.id &&
      normalize(category.name) === childName,
  );

  return child?.id ?? null;
}

function getRawValue(
  row: ImportRow,
  key: string,
): unknown {
  if (!row.raw_data) {
    return null;
  }

  return row.raw_data[key];
}

function getRowName(row: ImportRow): string {
  return (
    cleanString(row.parsed_name) ||
    cleanString(getRawValue(row, "name")) ||
    cleanString(getRawValue(row, "product_name"))
  );
}

function getRowSku(row: ImportRow): string {
  return (
    cleanString(row.parsed_sku) ||
    cleanString(getRawValue(row, "sku"))
  );
}

function getRowBrand(row: ImportRow): string {
  return (
    cleanString(row.parsed_brand) ||
    cleanString(getRawValue(row, "brand"))
  );
}

function getRowCategoryPath(row: ImportRow): string {
  const parsedPath = cleanString(
    row.parsed_category_path,
  );

  if (parsedPath) {
    return parsedPath;
  }

  const rawPath = cleanString(
    getRawValue(row, "category_path"),
  );

  if (rawPath) {
    return rawPath;
  }

  const category = cleanString(
    getRawValue(row, "category"),
  );

  const subcategory = cleanString(
    getRawValue(row, "subcategory"),
  );

  if (category && subcategory) {
    return `${category} > ${subcategory}`;
  }

  return category;
}

function getRowPrice(row: ImportRow): number | null {
  const parsed = toNumber(row.parsed_price);

  if (parsed !== null) {
    return parsed;
  }

  return toNumber(getRawValue(row, "price"));
}

function getRowPreviousPrice(
  row: ImportRow,
): number | null {
  const parsed = toNumber(
    row.parsed_compare_at_price,
  );

  if (parsed !== null) {
    return parsed;
  }

  return toNumber(
    getRawValue(row, "compare_at_price"),
  ) ??
    toNumber(
      getRawValue(row, "previous_price"),
    );
}

function getRowStock(row: ImportRow): number | null {
  const parsed = toNumber(
    row.parsed_stock_quantity,
  );

  if (parsed !== null) {
    return parsed;
  }

  return (
    toNumber(
      getRawValue(row, "stock_quantity"),
    ) ??
    toNumber(
      getRawValue(row, "stock"),
    ) ??
    toNumber(
      getRawValue(row, "quantity"),
    )
  );
}

function getRowDescription(
  row: ImportRow,
): string {
  return (
    cleanString(row.parsed_description) ||
    cleanString(
      getRawValue(row, "description"),
    )
  );
}

function getRowShortDescription(
  row: ImportRow,
): string {
  return (
    cleanString(
      row.parsed_short_description,
    ) ||
    cleanString(
      getRawValue(row, "short_description"),
    )
  );
}

function makeError(
  importId: string,
  row: ImportRow,
  field: string | null,
  code: string,
  message: string,
): RowError {
  return {
    import_id: importId,
    row_id: row.id,
    row_number: row.row_number,
    field_name: field,
    error_code: code,
    error_message: message,
  };
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);

  if (preflight) {
    return preflight;
  }

  try {
    if (req.method !== "POST") {
      throw new AppError(
        "METHOD_NOT_ALLOWED",
        "Use POST",
        405,
      );
    }

    const body = await req.json().catch(() => ({}));

    const importId = cleanString(
      body?.import_id,
    );

    if (!importId) {
      throw new AppError(
        "INVALID_REQUEST",
        "import_id is required",
        400,
      );
    }

    const userClient = createUserClient(req);

    const user = await requireUser(userClient);

    const serviceClient = createServiceClient();

    await requireAdminPermission(
      serviceClient,
      user.id,
      "imports",
      "edit",
    );

    const {
      data: importRecord,
      error: importError,
    } = await serviceClient
      .from("product_imports")
      .select("id, status")
      .eq("id", importId)
      .maybeSingle();

    if (importError) {
      throw importError;
    }

    if (!importRecord) {
      throw new AppError(
        "INVALID_REQUEST",
        "Import not found",
        404,
      );
    }

    /*
     * IMPORTANT:
     *
     * Always reset rows from previous validation attempts.
     *
     * This prevents a previous failed validation from causing
     * the next validation to operate on stale row statuses.
     */
    const {
      error: resetRowsError,
    } = await serviceClient
      .from("product_import_rows")
      .update({
        row_status: "pending",
        matched_category_id: null,
      })
      .eq("import_id", importId);

    if (resetRowsError) {
      throw resetRowsError;
    }

    /*
     * Remove previous validation errors before creating
     * the new validation result.
     */
    const {
      error: deleteErrorsError,
    } = await serviceClient
      .from("product_import_errors")
      .delete()
      .eq("import_id", importId);

    if (deleteErrorsError) {
      throw deleteErrorsError;
    }

    /*
     * Fetch every parsed row.
     *
     * Do NOT depend on row_status = pending here.
     *
     * The parser is the source of truth for which rows belong
     * to this import.
     */
    const {
      data: rows,
      error: rowsError,
    } = await serviceClient
      .from("product_import_rows")
      .select(
        [
          "id",
          "row_number",
          "parsed_name",
          "parsed_sku",
          "parsed_slug",
          "parsed_brand",
          "parsed_category_path",
          "parsed_price",
          "parsed_compare_at_price",
          "parsed_stock_quantity",
          "parsed_description",
          "parsed_short_description",
          "primary_image_url",
          "raw_data",
        ].join(", "),
      )
      .eq("import_id", importId)
      .order("row_number", {
        ascending: true,
      });

    if (rowsError) {
      throw rowsError;
    }

    if (!rows || rows.length === 0) {
      throw new AppError(
        "INVALID_REQUEST",
        "No parsed product rows were found for this import.",
        404,
      );
    }

    /*
     * Load existing products.
     */
    const {
      data: existingProducts,
      error: productsError,
    } = await serviceClient
      .from("products")
      .select("sku, slug");

    if (productsError) {
      throw productsError;
    }

    /*
     * Load active categories.
     */
    const {
      data: categories,
      error: categoriesError,
    } = await serviceClient
      .from("categories")
      .select(
        "id, name, slug, parent_id",
      )
      .eq("is_active", true);

    if (categoriesError) {
      throw categoriesError;
    }

    const existingSkuSet = new Set(
      (existingProducts ?? [])
        .map((product) =>
          normalize(product.sku),
        )
        .filter(Boolean),
    );

    const existingSlugSet = new Set(
      (existingProducts ?? [])
        .map((product) =>
          normalize(product.slug),
        )
        .filter(Boolean),
    );

    const categoryRows =
      (categories ?? []) as Category[];

    const seenSkusInBatch = new Set<string>();
    const seenSlugsInBatch = new Set<string>();

    const errors: RowError[] = [];
    const updates: RowUpdate[] = [];

    let validCount = 0;
    let draftCount = 0;
    let errorCount = 0;

    for (const row of rows as ImportRow[]) {
      const rowErrors: RowError[] = [];

      let blocking = false;

      /*
       * Read values from parsed columns first.
       *
       * raw_data is used as a fallback so validation still
       * works if an older parser version populated raw_data
       * correctly but failed to populate one parsed_* column.
       */
      const name = getRowName(row);
      const sku = getRowSku(row);
      const brand = getRowBrand(row);
      const categoryPath =
        getRowCategoryPath(row);

      const price = getRowPrice(row);
      const previousPrice =
        getRowPreviousPrice(row);
      const stockQuantity =
        getRowStock(row);

      const description =
        getRowDescription(row);

      const shortDescription =
        getRowShortDescription(row);

      /*
       * PRODUCT NAME
       */
      if (!name) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "name",
            "MISSING_REQUIRED_FIELD",
            "Product Name is required.",
          ),
        );

        blocking = true;
      }

      /*
       * SKU
       */
      if (!sku) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "sku",
            "MISSING_REQUIRED_FIELD",
            "SKU is required.",
          ),
        );

        blocking = true;
      } else {
        const skuKey = normalize(sku);

        if (existingSkuSet.has(skuKey)) {
          rowErrors.push(
            makeError(
              importId,
              row,
              "sku",
              "DUPLICATE_SKU",
              `SKU "${sku}" already exists in the product database.`,
            ),
          );

          blocking = true;
        } else if (
          seenSkusInBatch.has(skuKey)
        ) {
          rowErrors.push(
            makeError(
              importId,
              row,
              "sku",
              "DUPLICATE_SKU",
              `SKU "${sku}" appears more than once in this import.`,
            ),
          );

          blocking = true;
        } else {
          seenSkusInBatch.add(skuKey);
        }
      }

      /*
       * SLUG
       *
       * Automatically generated from:
       *
       * Product Name + SKU
       */
      const generatedSlug =
        makeExpectedSlug(name, sku);

      if (generatedSlug) {
        const slugKey =
          normalize(generatedSlug);

        if (
          existingSlugSet.has(slugKey)
        ) {
          rowErrors.push(
            makeError(
              importId,
              row,
              "sku",
              "DUPLICATE_SLUG",
              `The generated product slug "${generatedSlug}" already exists in the product database.`,
            ),
          );

          blocking = true;
        } else if (
          seenSlugsInBatch.has(slugKey)
        ) {
          rowErrors.push(
            makeError(
              importId,
              row,
              "sku",
              "DUPLICATE_SLUG",
              `The generated product slug "${generatedSlug}" is duplicated in this import.`,
            ),
          );

          blocking = true;
        } else {
          seenSlugsInBatch.add(slugKey);
        }
      }

      /*
       * PRICE
       */
      if (
        !isValidNonNegativeNumber(price)
      ) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "price",
            "INVALID_PRICE",
            "Price must be a valid number greater than or equal to zero.",
          ),
        );

        blocking = true;
      }

      /*
       * PREVIOUS PRICE
       *
       * Optional.
       */
      if (
        previousPrice !== null &&
        !isValidNonNegativeNumber(
          previousPrice,
        )
      ) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "compare_at_price",
            "INVALID_PREVIOUS_PRICE",
            "Previous Price must be a valid number greater than or equal to zero.",
          ),
        );

        blocking = true;
      }

      if (
        previousPrice !== null &&
        price !== null &&
        isValidNonNegativeNumber(
          previousPrice,
        ) &&
        isValidNonNegativeNumber(price) &&
        previousPrice < price
      ) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "compare_at_price",
            "INVALID_PREVIOUS_PRICE",
            "Previous Price cannot be lower than the current Price.",
          ),
        );

        blocking = true;
      }

      /*
       * STOCK QUANTITY
       */
      if (
        !isValidNonNegativeInteger(
          stockQuantity,
        )
      ) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "stock_quantity",
            "INVALID_INVENTORY",
            "Stock Quantity must be a whole number greater than or equal to zero.",
          ),
        );

        blocking = true;
      }

      /*
       * CATEGORY + SUBCATEGORY
       */
      let matchedCategoryId:
        | string
        | null = null;

      if (!categoryPath) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "category_path",
            "INVALID_CATEGORY",
            "Category and Subcategory are required.",
          ),
        );

        blocking = true;
      } else {
        const categoryParts =
          parseCategoryPath(
            categoryPath,
          );

        if (!categoryParts) {
          rowErrors.push(
            makeError(
              importId,
              row,
              "category_path",
              "INVALID_CATEGORY",
              'Category must use the format "Category > Subcategory".',
            ),
          );

          blocking = true;
        } else {
          const categoryName =
            Object.keys(
              CATEGORY_SUBCATEGORIES,
            ).find(
              (category) =>
                normalize(category) ===
                normalize(
                  categoryParts.parent,
                ),
            );

          if (!categoryName) {
            rowErrors.push(
              makeError(
                importId,
                row,
                "category_path",
                "INVALID_CATEGORY",
                `Unknown category "${categoryParts.parent}".`,
              ),
            );

            blocking = true;
          } else {
            const allowedSubcategories =
              CATEGORY_SUBCATEGORIES[
                categoryName
              ];

            const expectedSubcategory =
              allowedSubcategories.find(
                (subcategory) =>
                  normalize(subcategory) ===
                  normalize(
                    categoryParts.child,
                  ),
              );

            if (!expectedSubcategory) {
              rowErrors.push(
                makeError(
                  importId,
                  row,
                  "category_path",
                  "INVALID_SUBCATEGORY",
                  `Subcategory "${categoryParts.child}" does not belong to "${categoryName}".`,
                ),
              );

              blocking = true;
            } else {
              const normalizedCategoryPath =
                `${categoryName} > ${expectedSubcategory}`;

              matchedCategoryId =
                resolveCategory(
                  normalizedCategoryPath,
                  categoryRows,
                );

              if (!matchedCategoryId) {
                rowErrors.push(
                  makeError(
                    importId,
                    row,
                    "category_path",
                    "CATEGORY_NOT_FOUND",
                    `The category "${normalizedCategoryPath}" does not exist in the database.`,
                  ),
                );

                blocking = true;
              }
            }
          }
        }
      }

      /*
       * BRAND
       *
       * Optional.
       *
       * It is intentionally not a blocking validation error.
       */
      void brand;

      /*
       * DESCRIPTION
       *
       * Optional.
       *
       * Missing descriptions are informational only.
       */
      if (!description) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "description",
            "MISSING_DESCRIPTION",
            "Product Description was not provided. The product can still be imported.",
          ),
        );
      }

      /*
       * SHORT DESCRIPTION
       *
       * Optional.
       */
      if (!shortDescription) {
        rowErrors.push(
          makeError(
            importId,
            row,
            "short_description",
            "MISSING_SHORT_DESCRIPTION",
            "Short Description was not provided. The product can still be imported.",
          ),
        );
      }

      /*
       * IMAGES
       *
       * Images are intentionally NOT required.
       *
       * Products without images are imported as DRAFTS.
       */
      const status:
        | "valid"
        | "draft"
        | "error" =
        blocking ? "error" : "draft";

      if (status === "error") {
        errorCount++;
      } else {
        draftCount++;
      }

      errors.push(...rowErrors);

      updates.push({
        id: row.id,
        row_status: status,
        matched_category_id:
          matchedCategoryId,
      });
    }

    /*
     * Update every row.
     */
    for (const update of updates) {
      const {
        error: updateError,
      } = await serviceClient
        .from("product_import_rows")
        .update({
          row_status:
            update.row_status,
          matched_category_id:
            update.matched_category_id,
        })
        .eq("id", update.id);

      if (updateError) {
        throw updateError;
      }
    }

    /*
     * Store validation errors.
     */
    if (errors.length > 0) {
      const {
        error: insertErrorsError,
      } = await serviceClient
        .from("product_import_errors")
        .insert(
          errors.map((error) => ({
            import_id:
              error.import_id,
            row_id:
              error.row_id,
            row_number:
              error.row_number,
            field_name:
              error.field_name,
            error_code:
              error.error_code,
            error_message:
              error.error_message,
          })),
        );

      if (insertErrorsError) {
        throw insertErrorsError;
      }
    }

    /*
     * Update import summary.
     *
     * valid_rows is intentionally 0 because all successful
     * spreadsheet products enter the system as DRAFT.
     */
    const {
      error: importUpdateError,
    } = await serviceClient
      .from("product_imports")
      .update({
        status: "previewed",
        valid_rows: validCount,
        draft_rows: draftCount,
        invalid_rows: errorCount,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", importId);

    if (importUpdateError) {
      throw importUpdateError;
    }

    return new Response(
      JSON.stringify({
        import_id: importId,
        total_rows: rows.length,
        valid_rows: validCount,
        draft_rows: draftCount,
        invalid_rows: errorCount,
        error_count: errors.length,
        errors: errors.map((error) => ({
          row: error.row_number,
          field: error.field_name,
          code: error.error_code,
          message: error.error_message,
        })),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  } catch (err) {
    console.error(
      "product-import-validate error:",
      err,
    );

    return errorResponse(
      err,
      corsHeaders,
    );
  }
});