// supabase/functions/newsletter-subscribe/index.ts
//
// POST body: { email: string, action?: "subscribe" | "unsubscribe" (default "subscribe") }
//
// Kept as an Edge Function (rather than a direct client insert into newsletter_subscribers)
// so basic abuse protection (rate limiting, optional captcha token verification) can be
// layered in front of the table later without a schema or RLS change. Handles resubscribe
// correctly: the partial unique index uq_newsletter_active_email (012) only enforces
// uniqueness among status='subscribed' rows, so a previously-unsubscribed email can
// subscribe again cleanly.

import { handleCorsPreflight, corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-clients.ts";
import { AppError, errorResponse } from "../_shared/errors.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "Use POST", 405);

    const { email, action = "subscribe" } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      throw new AppError("INVALID_REQUEST", "A valid email address is required", 400);
    }
    if (!["subscribe", "unsubscribe"].includes(action)) {
      throw new AppError("INVALID_REQUEST", "action must be 'subscribe' or 'unsubscribe'", 400);
    }

    const serviceClient = createServiceClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data: existing } = await serviceClient
      .from("newsletter_subscribers")
      .select("id, status")
      .ilike("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (action === "unsubscribe") {
      if (!existing) {
        return new Response(JSON.stringify({ status: "not_found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await serviceClient
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
      return new Response(JSON.stringify({ status: "unsubscribed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // action === 'subscribe'
    if (existing && existing.status === "subscribed") {
      return new Response(JSON.stringify({ status: "already_subscribed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (existing && existing.status === "unsubscribed") {
      const { error } = await serviceClient
        .from("newsletter_subscribers")
        .update({ status: "subscribed", subscribed_at: new Date().toISOString(), unsubscribed_at: null })
        .eq("id", existing.id);
      if (error) throw error;
      return new Response(JSON.stringify({ status: "resubscribed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertErr } = await serviceClient
      .from("newsletter_subscribers")
      .insert({ email: normalizedEmail, status: "subscribed" });
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ status: "subscribed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err, corsHeaders);
  }
});
