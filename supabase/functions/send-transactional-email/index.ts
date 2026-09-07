// supabase/functions/send-transactional-email/index.ts
//
// Scheduled function: drains `email_logs` rows with status='queued' (created by other
// functions/triggers — e.g. fn_process_payment_success queues a 'payment_confirmation'
// row) and sends them via SMTP. SMTP credentials are Supabase project secrets and are
// never touched by the database or the client.

import nodemailer from "npm:nodemailer@6";
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-clients.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SMTP_HOST = Deno.env.get("SMTP_HOST")!;
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USER = Deno.env.get("SMTP_USER")!;
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD")!;
const EMAIL_FROM_ADDRESS = Deno.env.get("EMAIL_FROM_ADDRESS") ?? "orders@sinomart.ng";
const BATCH_SIZE = 25;

type EmailLogRow = {
  id: string;
  recipient_email: string;
  email_type: string;
  related_order_id: string | null;
};

function buildEmail(row: EmailLogRow, order: Record<string, unknown> | null) {
  const orderNumber = (order?.order_number as string) ?? "";
  const total = order?.total ? `₦${Number(order.total).toLocaleString("en-NG")}` : "";

  const templates: Record<string, { subject: string; text: string }> = {
    welcome: {
      subject: "Welcome to Sinomart Super Store",
      text: "Thanks for creating an account with Sinomart Super Store — Lagos's home for everything.",
    },
    order_confirmation: {
      subject: `Order ${orderNumber} received`,
      text: `We've received your order ${orderNumber}. We'll email you again once payment is confirmed.`,
    },
    payment_confirmation: {
      subject: `Payment confirmed for order ${orderNumber}`,
      text: `Your payment of ${total} for order ${orderNumber} was successful. We're preparing your order now.`,
    },
    order_processing: {
      subject: `Order ${orderNumber} is being processed`,
      text: `Order ${orderNumber} is now being prepared for ${order?.fulfillment_type === "pickup" ? "pickup" : "delivery"}.`,
    },
    order_dispatched: {
      subject: `Order ${orderNumber} is on its way`,
      text: `Order ${orderNumber} has been dispatched. Track it at sinomart.ng/orders/${orderNumber}.`,
    },
    order_delivered: {
      subject: `Order ${orderNumber} delivered`,
      text: `Order ${orderNumber} has been marked as delivered. We hope you enjoy your purchase!`,
    },
    password_reset: {
      subject: "Reset your Sinomart password",
      text: "A password reset was requested for your account. If this wasn't you, you can ignore this email.",
    },
    security_alert: {
      subject: "Security alert on your Sinomart account",
      text: "We noticed a sign-in from a new device or location. If this wasn't you, please reset your password.",
    },
    review_reminder: {
      subject: `How was your order ${orderNumber}?`,
      text: `We'd love to hear what you thought. Leave a review for items from order ${orderNumber} at sinomart.ng/orders/${orderNumber}.`,
    },
    newsletter: {
      subject: "This week at Sinomart Super Store",
      text: "Check out this week's deals across Home, Kitchen, Electronics, and more.",
    },
    admin_alert: {
      subject: "Sinomart admin alert",
      text: "An event requiring admin attention has occurred. Please check the admin dashboard.",
    },
  };

  return templates[row.email_type] ?? {
    subject: "Sinomart Super Store",
    text: "You have a notification from Sinomart Super Store.",
  };
}

Deno.serve(async (req: Request) => {
  if (CRON_SECRET) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const serviceClient = createServiceClient();

  const { data: queued, error: queryErr } = await serviceClient
    .from("email_logs")
    .select("id, recipient_email, email_type, related_order_id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (queryErr) {
    console.error("EMAIL_QUEUE_QUERY_FAILED", queryErr);
    return new Response("Failed to read email queue", { status: 500 });
  }
  if (!queued || queued.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  let sent = 0;
  let failed = 0;

  for (const row of queued as EmailLogRow[]) {
    let order: Record<string, unknown> | null = null;
    if (row.related_order_id) {
      const { data } = await serviceClient
        .from("orders")
        .select("order_number, total, fulfillment_type")
        .eq("id", row.related_order_id)
        .maybeSingle();
      order = data;
    }

    const { subject, text } = buildEmail(row, order);

    try {
      await transporter.sendMail({
        from: EMAIL_FROM_ADDRESS,
        to: row.recipient_email,
        subject,
        text,
      });
      await serviceClient
        .from("email_logs")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } catch (err) {
      console.error("EMAIL_SEND_FAILED", row.id, err);
      await serviceClient
        .from("email_logs")
        .update({
          status: "failed",
          failure_reason: err instanceof Error ? err.message : String(err),
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
