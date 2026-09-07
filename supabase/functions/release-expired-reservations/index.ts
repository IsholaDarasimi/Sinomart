// supabase/functions/release-expired-reservations/index.ts
//
// Intended to be invoked on a schedule (Supabase Scheduled Functions / pg_cron calling
// this via `net.http_post`, or an external scheduler hitting this URL with the service
// role key as a bearer token). Idempotent and safe to run as often as every minute.

import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-clients.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET"); // shared secret so this isn't publicly triggerable

Deno.serve(async (req: Request) => {
  if (CRON_SECRET) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient.rpc("fn_release_expired_reservations");
    if (error) throw error;

    return new Response(
      JSON.stringify({ released_count: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("RELEASE_EXPIRED_RESERVATIONS_FAILED", err);
    return new Response(
      JSON.stringify({ error: "Failed to release expired reservations" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
