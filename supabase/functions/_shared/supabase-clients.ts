// supabase/functions/_shared/supabase-clients.ts
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * User-scoped client: forwards the caller's JWT so Postgres RLS applies exactly as it
 * would for a direct client call. Use this for anything that should respect "this is
 * only MY cart / MY order / MY review" boundaries.
 */
export function createUserClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

/**
 * Service-role client: bypasses RLS entirely. Use ONLY for operations that have already
 * been authorized by other means (e.g. a verified Paystack webhook, a scheduled cron job,
 * or after this function has independently confirmed the caller is an admin).
 * NEVER return this client's results directly without your own authorization check first.
 */
export function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Extracts the authenticated user's id from their JWT, or throws if not authenticated. */
export async function requireUser(
  client: SupabaseClient,
): Promise<{ id: string; email: string | undefined }> {
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    throw new Error("UNAUTHENTICATED: sign in required");
  }
  return { id: data.user.id, email: data.user.email };
}

/** Confirms the authenticated caller has admin/super_admin role AND the given permission. */
export async function requireAdminPermission(
  serviceClient: SupabaseClient,
  userId: string,
  area: string,
  level: "view" | "edit" | "delete" = "edit",
): Promise<void> {
  const { data, error } = await serviceClient
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (error || !data || !data.is_active) {
    throw new Error("UNAUTHENTICATED: admin account not found or inactive");
  }
  if (data.role === "super_admin") return;
  if (data.role !== "admin") {
    throw new Error("UNAUTHENTICATED: admin role required");
  }

  const { data: perm, error: permErr } = await serviceClient
    .from("admin_permissions")
    .select("can_view, can_edit, can_delete")
    .eq("admin_id", userId)
    .eq("area_key", area)
    .maybeSingle();

  if (permErr || !perm) {
    throw new Error(`UNAUTHENTICATED: missing '${area}' permission`);
  }
  const allowed = level === "view" ? perm.can_view : level === "edit" ? perm.can_edit : perm.can_delete;
  if (!allowed) {
    throw new Error(`UNAUTHENTICATED: missing '${area}:${level}' permission`);
  }
}
