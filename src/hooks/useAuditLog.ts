/**
 * useAuditLog — lightweight client hook to fire audit events
 *
 * Usage:
 *   const { log } = useAuditLog();
 *   await log({ action: "UPDATE", entity_type: "profile", entity_id: userId, ... });
 *
 * The hook calls the log-audit edge function (fire-and-forget by default).
 * Pass { wait: true } for critical flows that need confirmation.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Valid audit actions ──────────────────────────────────────────────────────

export type AuditAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "APPROVE"
  | "REJECT"
  | "SUBMIT"
  | "ASSIGN"
  | "UPLOAD"
  | "DOWNLOAD"
  | "SIGN"
  | "VERIFY"
  | "DISBURSE"
  | "ENROLL";

// ─── Payload ──────────────────────────────────────────────────────────────────

export interface AuditPayload {
  action:        AuditAction;
  entity_type:   string;          // e.g. "profile", "application", "document_vault"
  entity_id:     string;          // UUID or identifier of the affected record
  entity_label?: string;          // human-readable label (name, title)
  before_data?:  Record<string, unknown> | null;
  after_data?:   Record<string, unknown> | null;
  metadata?:     Record<string, unknown>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuditLog() {
  const { role } = useAuth();

  const log = useCallback(
    async (payload: AuditPayload, options: { wait?: boolean } = {}) => {
      if (!role) return; // not authenticated — skip

      const invoke = () =>
        supabase.functions.invoke("log-audit", {
          body: {
            actor_role:   role,
            action:       payload.action,
            entity_type:  payload.entity_type,
            entity_id:    payload.entity_id,
            entity_label: payload.entity_label ?? null,
            before_data:  payload.before_data  ?? null,
            after_data:   payload.after_data   ?? null,
            metadata:     payload.metadata     ?? {},
          },
        });

      if (options.wait) {
        const { error } = await invoke();
        if (error) console.warn("[useAuditLog] log failed:", error);
      } else {
        // fire-and-forget — don't block the caller
        invoke().then(({ error }) => {
          if (error) console.warn("[useAuditLog] log failed:", error);
        });
      }
    },
    [role]
  );

  return { log };
}
