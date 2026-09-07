// supabase/functions/checkout-start/index.ts
//
// POST body: { cart_id: string, ttl_minutes?: number }
//
// Reserves physical stock for every line item in the customer's cart via
// fn_reserve_inventory (SECURITY DEFINER, row-locked — see migration 015). If ANY item
// fails to reserve (insufficient stock, invalid quantity, unavailable product), every
// reservation already made in this same call is rolled back before returning the error,
// so a partial checkout never silently locks stock a customer didn't actually get.
//
// Returns the reservation ids + a shared expiry so the client can show a checkout timer.

import { handleCorsPreflight, corsHeaders } from "../_shared/cors.ts";
import { createUserClient, requireUser } from "../_shared/supabase-clients.ts";
import { AppError, errorResponse } from "../_shared/errors.ts";

interface ReservationResult {
  cart_item_id: string;
  reservation_id: string;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "Use POST", 405);
    }

    const body = await req.json().catch(() => ({}));
    const cartId: string | undefined = body.cart_id;
    const ttlMinutes: number = Number.isFinite(body.ttl_minutes) ? body.ttl_minutes : 15;

    if (!cartId) {
      throw new AppError("INVALID_REQUEST", "cart_id is required", 400);
    }

    const supabase = createUserClient(req);
    const user = await requireUser(supabase);

    // RLS (carts_owner_all) ensures this only returns the cart if it belongs to `user`.
    const { data: cart, error: cartErr } = await supabase
      .from("carts")
      .select("id, customer_id, status")
      .eq("id", cartId)
      .single();

    if (cartErr || !cart) {
      throw new AppError("PRODUCT_UNAVAILABLE", "Cart not found or not accessible", 404);
    }
    if (cart.status !== "active") {
      throw new AppError("PRODUCT_UNAVAILABLE", "This cart has already been converted or abandoned", 409);
    }

    const { data: items, error: itemsErr } = await supabase
      .from("cart_items")
      .select("id, product_id, variant_id, purchase_option_id, quantity")
      .eq("cart_id", cartId);

    if (itemsErr) throw itemsErr;
    if (!items || items.length === 0) {
      throw new AppError("PRODUCT_UNAVAILABLE", "Cart is empty", 400);
    }

    const succeeded: ReservationResult[] = [];
    let failure: unknown = null;

    for (const item of items) {
      const { data: reservationId, error: reserveErr } = await supabase.rpc(
        "fn_reserve_inventory",
        {
          p_cart_id: cartId,
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
          p_purchase_option_id: item.purchase_option_id,
          p_quantity: item.quantity,
          p_ttl_minutes: ttlMinutes,
        },
      );

      if (reserveErr) {
        failure = reserveErr;
        break;
      }

      succeeded.push({ cart_item_id: item.id, reservation_id: reservationId as string });
    }

    if (failure) {
      // Roll back every reservation made earlier in this same checkout attempt.
      for (const r of succeeded) {
        const { error: releaseErr } = await supabase.rpc("fn_release_reservation", {
          p_reservation_id: r.reservation_id,
          p_reason: "rolled back: a later item in the same cart failed to reserve",
        });
        if (releaseErr) {
          console.error("ROLLBACK_RELEASE_FAILED", r.reservation_id, releaseErr);
        }
      }
      throw failure;
    }

    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();

    return new Response(
      JSON.stringify({ reservations: succeeded, expires_at: expiresAt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return errorResponse(err, corsHeaders);
  }
});
