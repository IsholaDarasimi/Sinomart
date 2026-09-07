// supabase/functions/review-reminder-dispatch/index.ts
//
// Scheduled function (e.g. daily). Finds orders that became 'delivered' or 'collected'
// exactly REMINDER_DELAY_DAYS ago, that still have no review submitted for them, and
// queues one review_reminder email per qualifying order (not per item, to avoid spamming
// a customer with one email per line item on a multi-product order).

import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-clients.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const REMINDER_DELAY_DAYS = Number(Deno.env.get("REVIEW_REMINDER_DELAY_DAYS") ?? "3");

Deno.serve(async (req: Request) => {
  if (CRON_SECRET) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const serviceClient = createServiceClient();

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - REMINDER_DELAY_DAYS);
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Orders that reached delivered/collected on the target day.
  const { data: candidateOrders, error: ordersErr } = await serviceClient
    .from("order_status_history")
    .select("order_id, orders!inner(id, customer_id, order_number, status, profiles!inner(email))")
    .in("to_status", ["delivered", "collected"])
    .gte("created_at", dayStart.toISOString())
    .lte("created_at", dayEnd.toISOString());

  if (ordersErr) {
    console.error("REVIEW_REMINDER_QUERY_FAILED", ordersErr);
    return new Response("Failed to query candidate orders", { status: 500 });
  }
  if (!candidateOrders || candidateOrders.length === 0) {
    return new Response(JSON.stringify({ queued: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let queued = 0;

  for (const row of candidateOrders as unknown as Array<{
    order_id: string;
    orders: { id: string; customer_id: string; order_number: string; status: string; profiles: { email: string } };
  }>) {
    const order = row.orders;
    if (!order || !["delivered", "collected"].includes(order.status)) continue;

    // Skip if a review_reminder was already queued for this order (idempotency across
    // repeated cron runs, e.g. if the function is invoked more than once per day).
    const { data: existingReminder } = await serviceClient
      .from("email_logs")
      .select("id")
      .eq("related_order_id", order.id)
      .eq("email_type", "review_reminder")
      .maybeSingle();
    if (existingReminder) continue;

    // Skip if every item on the order already has a review from this customer.
    const { data: itemCount } = await serviceClient
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id);
    const { data: reviewCount } = await serviceClient
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id)
      .eq("customer_id", order.customer_id);

    const totalItems = (itemCount as unknown as { length: number } | null)?.length ?? 0;
    const totalReviews = (reviewCount as unknown as { length: number } | null)?.length ?? 0;
    if (totalItems > 0 && totalReviews >= totalItems) continue;

    const { error: insertErr } = await serviceClient.from("email_logs").insert({
      recipient_email: order.profiles.email,
      customer_id: order.customer_id,
      email_type: "review_reminder",
      related_order_id: order.id,
      status: "queued",
    });
    if (!insertErr) queued++;
  }

  return new Response(JSON.stringify({ queued }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
