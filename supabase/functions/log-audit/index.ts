/**
 * log-audit — Edge Function
 * Inserts an immutable audit log entry on behalf of the authenticated user.
 * Called from the client whenever a significant action occurs.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
    const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey      = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User-scoped client (validates JWT)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const body = await req.json();
    const {
      actor_role,
      action,
      entity_type,
      entity_id,
      entity_label,
      before_data,
      after_data,
      metadata,
    } = body;

    // Validate required fields
    if (!actor_role || !action || !entity_type || !entity_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: actor_role, action, entity_type, entity_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate action enum
    const VALID_ACTIONS = [
      "CREATE", "READ", "UPDATE", "DELETE", "VIEW",
      "APPROVE", "REJECT", "SUBMIT", "ASSIGN", "UPLOAD",
      "DOWNLOAD", "SIGN", "VERIFY", "DISBURSE", "ENROLL",
    ];
    if (!VALID_ACTIONS.includes(action.toUpperCase())) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enrich metadata with request context
    const enrichedMetadata = {
      ...(metadata ?? {}),
      user_agent: req.headers.get("user-agent") ?? "unknown",
      ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
      timestamp_ms: Date.now(),
    };

    // Service-role client to bypass RLS for the insert
    // (actor_id is explicitly set, so data integrity is maintained)
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { data, error } = await serviceClient
      .from("audit_logs")
      .insert({
        actor_id:     user.id,
        actor_role:   actor_role,
        action:       action.toUpperCase(),
        entity_type,
        entity_id:    String(entity_id),
        entity_label: entity_label ?? null,
        before_data:  before_data ?? null,
        after_data:   after_data  ?? null,
        metadata:     enrichedMetadata,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("audit_logs insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, log_id: data.id, created_at: data.created_at }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
