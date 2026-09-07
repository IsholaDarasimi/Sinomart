// supabase/functions/_shared/audit.ts
import { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function logAuditEvent(
  serviceClient: SupabaseClient,
  params: {
    actorId: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    beforeState?: unknown;
    afterState?: unknown;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
  },
): Promise<void> {
  const { error } = await serviceClient.from("audit_logs").insert({
    actor_id: params.actorId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    before_state: params.beforeState ?? null,
    after_state: params.afterState ?? null,
    metadata: params.metadata ?? {},
    ip_address: params.ipAddress ?? null,
  });
  // Audit logging failures should never break the primary operation, but must be visible.
  if (error) {
    console.error("AUDIT_LOG_FAILED", params.action, params.resourceType, error);
  }
}
