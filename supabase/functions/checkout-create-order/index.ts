// supabase/functions/checkout-create-order/index.ts

import { handleCorsPreflight, corsHeaders } from "../_shared/cors.ts";

import {
  createUserClient,
  createServiceClient,
  requireUser,
} from "../_shared/supabase-clients.ts";

import { AppError, errorResponse } from "../_shared/errors.ts";

import { paystackInitializeTransaction } from "../_shared/paystack.ts";

function getCheckoutCallbackUrl(req: Request): string {
  const configuredUrl = Deno.env.get("CHECKOUT_CALLBACK_URL");

  const origin = req.headers.get("origin");

  if (
    origin &&
    (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    )
  ) {
    return `${origin}/checkout/callback`;
  }

  if (configuredUrl) {
    return configuredUrl;
  }

  return "https://sinomart.ng/checkout/callback";
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

    const {
      cart_id,
      fulfillment_type,
      delivery_zone_id = null,
      pickup_location_id = null,
      address,
      coupon_code = null,
      idempotency_key,
      utm_source = null,
      utm_medium = null,
      utm_campaign = null,
    } = body;

    if (
      !cart_id ||
      !fulfillment_type ||
      !idempotency_key
    ) {
      throw new AppError(
        "INVALID_REQUEST",
        "cart_id, fulfillment_type, and idempotency_key are required",
        400,
      );
    }

    if (
      fulfillment_type !== "delivery" &&
      fulfillment_type !== "pickup"
    ) {
      throw new AppError(
        "INVALID_REQUEST",
        "fulfillment_type must be delivery or pickup",
        400,
      );
    }

    if (
      fulfillment_type === "delivery" &&
      !delivery_zone_id
    ) {
      throw new AppError(
        "INVALID_REQUEST",
        "delivery_zone_id is required for delivery orders",
        400,
      );
    }

    if (
      fulfillment_type === "pickup" &&
      !pickup_location_id
    ) {
      throw new AppError(
        "INVALID_REQUEST",
        "pickup_location_id is required for pickup orders",
        400,
      );
    }

    const userClient = createUserClient(req);
    const user = await requireUser(userClient);

    if (!user.email) {
      throw new AppError(
        "INVALID_REQUEST",
        "Account has no email on file",
        400,
      );
    }

    const contactSnapshot = {
      full_name: address?.full_name ?? null,
      email: user.email,
      phone: address?.phone ?? null,
    };

    /*
     * The database function is authoritative for:
     *
     * - product prices
     * - subtotal
     * - discounts
     * - delivery fee
     * - delivery zone
     * - final order total
     *
     * Never trust totals supplied by the browser.
     */

    const {
      data: orderId,
      error: orderErr,
    } = await userClient.rpc(
      "fn_create_order_from_cart",
      {
        p_cart_id: cart_id,
        p_customer_id: user.id,
        p_fulfillment: fulfillment_type,

        // Kept for backwards compatibility with the RPC
        // signature. The database function resolves the
        // authoritative delivery zone from the customer's LGA.
        p_delivery_zone_id: delivery_zone_id,

        p_pickup_location_id: pickup_location_id,
        p_address_snapshot: address ?? null,
        p_contact_snapshot: contactSnapshot,
        p_coupon_code: coupon_code,
        p_idempotency_key: idempotency_key,
        p_utm_source: utm_source,
        p_utm_medium: utm_medium,
        p_utm_campaign: utm_campaign,
      },
    );

    if (orderErr) {
      throw orderErr;
    }

    if (!orderId) {
      throw new AppError(
        "INTERNAL_ERROR",
        "Order could not be created",
        500,
      );
    }

    const {
      data: order,
      error: fetchErr,
    } = await userClient
      .from("orders")
      .select(
        "id, order_number, total, payment_status",
      )
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      throw new AppError(
        "INTERNAL_ERROR",
        "Order was created but could not be retrieved",
        500,
      );
    }

    /*
     * Idempotency:
     *
     * If this checkout attempt already resulted in a
     * successful payment, do not create another Paystack
     * transaction.
     */

    if (order.payment_status === "successful") {
      return new Response(
        JSON.stringify({
          order_id: order.id,
          order_number: order.order_number,
          already_paid: true,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    /*
     * Generate the reference before initializing Paystack.
     *
     * We intentionally create the pending payment record
     * BEFORE sending the customer to Paystack.
     *
     * This is important because the Paystack webhook may arrive
     * later and needs an existing payments row to match the
     * transaction reference.
     */

    const reference = `${order.order_number}-${Date.now()}`;

    const serviceClient = createServiceClient();

    /*
     * Create the authoritative pending payment first.
     *
     * If this fails, we MUST stop checkout.
     *
     * Previously this error was treated as non-fatal, which meant
     * a customer could be sent to Paystack even though Sinomart
     * had never recorded the payment.
     */

    const {
      error: paymentInsertErr,
    } = await serviceClient
      .from("payments")
      .insert({
        order_id: order.id,
        provider: "paystack",
        reference,
        amount: order.total,
        status: "pending",
        metadata: {},
      });

    if (paymentInsertErr) {
      console.error(
        "PENDING_PAYMENT_INSERT_FAILED",
        {
          reference,
          order_id: order.id,
          error: paymentInsertErr,
        },
      );

      throw new AppError(
        "INTERNAL_ERROR",
        "Payment could not be initialized. Please try again.",
        500,
      );
    }

    /*
     * Initialize Paystack using the server-calculated
     * order total.
     */

    let paystack;

    try {
      paystack = await paystackInitializeTransaction({
        email: user.email,
        amountNaira: Number(order.total),
        reference,
        callbackUrl: getCheckoutCallbackUrl(req),
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          customer_id: user.id,
        },
      });
    } catch (err) {
      /*
       * Paystack initialization failed after we created the
       * pending payment record.
       *
       * Mark it failed so we don't leave a misleading pending
       * payment behind.
       */

      console.error(
        "PAYSTACK_INITIALIZATION_FAILED",
        {
          reference,
          order_id: order.id,
          error: err,
        },
      );

      await serviceClient
        .from("payments")
        .update({
          status: "failed",
          metadata: {
            initialization_error:
              err instanceof Error
                ? err.message
                : String(err),
          },
        })
        .eq("reference", reference);

      throw err;
    }

    /*
     * Store the Paystack access code against the payment.
     *
     * The reference already exists in the database before the
     * transaction is initialized, so the webhook always has a
     * payment record to find.
     */

    const {
      error: paymentMetadataErr,
    } = await serviceClient
      .from("payments")
      .update({
        metadata: {
          access_code: paystack.access_code,
        },
      })
      .eq("reference", reference);

    if (paymentMetadataErr) {
      console.error(
        "PAYMENT_METADATA_UPDATE_FAILED",
        {
          reference,
          order_id: order.id,
          error: paymentMetadataErr,
        },
      );

      /*
       * Do not send the customer to Paystack if we cannot
       * reliably finish recording the transaction state.
       */

      throw new AppError(
        "INTERNAL_ERROR",
        "Payment could not be prepared. Please try again.",
        500,
      );
    }

    /*
     * Everything is ready.
     *
     * At this point:
     *
     * 1. Order exists.
     * 2. Payment exists as pending.
     * 3. Paystack transaction exists.
     * 4. Paystack access code is stored.
     * 5. The webhook can match the reference.
     *
     * Only now do we send the customer to Paystack.
     */

    return new Response(
      JSON.stringify({
        order_id: order.id,
        order_number: order.order_number,
        total: order.total,
        reference,
        authorization_url:
          paystack.authorization_url,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    return errorResponse(err, corsHeaders);
  }
});