// supabase/functions/paystack-webhook/index.ts
//
// Receives Paystack's webhook POST. Security model:
//   1. Verify `x-paystack-signature` (HMAC-SHA512 over the RAW body) before trusting
//      anything in the payload at all.
//   2. Never act on the webhook payload's own `status` field — independently call
//      Paystack's `/transaction/verify/:reference` endpoint server-to-server and act on
//      THAT response instead. This defeats a forged webhook POST even if an attacker
//      somehow obtained a valid-looking signature for stale data.
//   3. fn_process_payment_success/fn_process_payment_failure (015) are themselves
//      idempotent on `payments.reference` (UNIQUE) — so even if Paystack redelivers the
//      same webhook multiple times (which it does on any non-2xx response), no duplicate
//      order confirmation, stock deduction, or email is produced.
//
// Always configure this URL in the Paystack dashboard as the webhook endpoint (NOT the
// callback_url used in checkout-create-order, which is only where the *browser* redirects
// after payment — it is not a trustworthy source of payment confirmation on its own).

import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-clients.ts";
import { verifyPaystackSignature, paystackVerifyTransaction } from "../_shared/paystack.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const validSignature = await verifyPaystackSignature(rawBody, signature);
  if (!validSignature) {
    console.error("PAYSTACK_WEBHOOK_INVALID_SIGNATURE");
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event: string; data: { reference: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const reference = event?.data?.reference;
  if (!reference) {
    // Acknowledge with 200 so Paystack doesn't retry an event we'll never be able to act on.
    return new Response("ok", { status: 200 });
  }

  const serviceClient = createServiceClient();

  try {
    // Independently re-verify with Paystack — never trust the webhook body's own status.
    const verified = await paystackVerifyTransaction(reference);

    const { data: paymentRow } = await serviceClient
      .from("payments")
      .select("order_id")
      .eq("reference", reference)
      .maybeSingle();

    const orderId = paymentRow?.order_id ?? (verified.metadata?.order_id as string | undefined);
    if (!orderId) {
      console.error("PAYSTACK_WEBHOOK_NO_MATCHING_ORDER", reference);
      return new Response("ok", { status: 200 }); // nothing sane to retry into
    }

    if (verified.status === "success") {
      const { error } = await serviceClient.rpc("fn_process_payment_success", {
        p_reference: reference,
        p_order_id: orderId,
        p_amount: verified.amount / 100, // kobo -> naira
        p_channel: verified.channel,
        p_gateway_response: verified.gateway_response,
        p_metadata: verified.metadata ?? {},
      });
      if (error) throw error;
    } else {
      const { error } = await serviceClient.rpc("fn_process_payment_failure", {
        p_reference: reference,
        p_order_id: orderId,
        p_gateway_response: verified.gateway_response,
      });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // A 5xx here causes Paystack to retry the webhook later, which is desirable for
    // transient failures (DB hiccup, network blip) — the handler is idempotent, so a
    // retry is always safe.
    console.error("PAYSTACK_WEBHOOK_PROCESSING_FAILED", reference, err);
    return new Response("Processing error", { status: 500 });
  }
});
