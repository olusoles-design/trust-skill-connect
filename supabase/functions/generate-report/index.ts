import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

// ── CSV helpers ───────────────────────────────────────────────────────────────

function escapeCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const lines: string[] = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  return lines.join("\n");
}

// ── Report builders ───────────────────────────────────────────────────────────

async function buildWSP(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  financialYear: string,
  bodyId: string,
) {
  // Fetch opportunities linked to this body posted by the user
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, title, type, location, nqf_level_required, seta, stipend, duration, applications, created_at, closing_date")
    .eq("posted_by", userId)
    .eq("regulatory_body_id", bodyId);

  // Fetch applications for those opportunities
  const oppIds = (opps ?? []).map((o: Record<string, unknown>) => o.id);
  let applications: Record<string, unknown>[] = [];
  if (oppIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, status, created_at, opportunity_id")
      .in("opportunity_id", oppIds);
    applications = (apps ?? []) as Record<string, unknown>[];
  }

  // WSP Section A1 – Planned training
  const wspRows = (opps ?? []).map((o: Record<string, unknown>) => ({
    "Programme Title": o.title,
    "Programme Type": o.type,
    "NQF Level": o.nqf_level_required ?? "Not specified",
    "Location": o.location ?? "Not specified",
    "Duration": o.duration ?? "Not specified",
    "Stipend/Salary": o.stipend ?? "Not specified",
    "Closing Date": o.closing_date ?? "",
    "No. of Planned Learners": o.applications,
    "Financial Year": financialYear,
  }));

  // ATR Section B1 – Training carried out
  const atrRows = applications.map((a: Record<string, unknown>) => {
    const opp = (opps ?? []).find((o: Record<string, unknown>) => o.id === a.opportunity_id) as Record<string, unknown> | undefined;
    return {
      "Application ID": a.id,
      "Programme": opp?.title ?? "Unknown",
      "NQF Level": opp?.nqf_level_required ?? "",
      "Application Status": a.status,
      "Applied Date": new Date(a.created_at as string).toLocaleDateString("en-ZA"),
      "Financial Year": financialYear,
    };
  });

  return {
    "WSP_A1_Planned_Training": toCsv(wspRows, [
      "Programme Title", "Programme Type", "NQF Level", "Location", "Duration",
      "Stipend/Salary", "Closing Date", "No. of Planned Learners", "Financial Year",
    ]),
    "ATR_B1_Training_Carried_Out": toCsv(atrRows, [
      "Application ID", "Programme", "NQF Level", "Application Status",
      "Applied Date", "Financial Year",
    ]),
    totals: {
      planned_programmes: (opps ?? []).length,
      total_applications: applications.length,
      accepted: applications.filter((a: Record<string, unknown>) => a.status === "accepted").length,
    },
  };
}

async function buildOFO(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  _financialYear: string,
) {
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, title, type, nqf_level_required, category, tags")
    .eq("posted_by", userId);

  const ofoRows = (opps ?? []).map((o: Record<string, unknown>) => ({
    "Occupation Title": o.title,
    "Occupation Type": o.type,
    "Category": o.category ?? "",
    "NQF Level": o.nqf_level_required ?? "",
    "OFO Code": "TBC",  // Placeholder – requires OFO lookup table
    "Tags": Array.isArray(o.tags) ? (o.tags as string[]).join("; ") : "",
  }));

  return {
    "OFO_Occupational_Report": toCsv(ofoRows, [
      "Occupation Title", "Occupation Type", "Category", "NQF Level", "OFO Code", "Tags",
    ]),
    totals: { occupations: (opps ?? []).length },
  };
}

async function buildPivotal(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  financialYear: string,
  bodyId: string,
) {
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, title, type, nqf_level_required, duration, applications")
    .eq("posted_by", userId)
    .eq("regulatory_body_id", bodyId)
    .in("type", ["learnership", "apprenticeship", "programme"]);

  const pivotalRows = (opps ?? []).map((o: Record<string, unknown>) => ({
    "PIVOTAL Programme": o.title,
    "Type": o.type,
    "NQF Level": o.nqf_level_required ?? "",
    "Duration": o.duration ?? "",
    "Learners Enrolled": o.applications,
    "Financial Year": financialYear,
  }));

  return {
    "Pivotal_Report": toCsv(pivotalRows, [
      "PIVOTAL Programme", "Type", "NQF Level", "Duration", "Learners Enrolled", "Financial Year",
    ]),
    totals: { pivotal_programmes: (opps ?? []).length },
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { report_type, financial_year, regulatory_body_id } = body as {
      report_type: string;
      financial_year: string;
      regulatory_body_id: string;
    };

    if (!report_type || !financial_year) {
      return new Response(
        JSON.stringify({ error: "report_type and financial_year are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch regulatory body info
    let bodyInfo: Record<string, unknown> | null = null;
    if (regulatory_body_id) {
      const { data: bd } = await supabase
        .from("regulatory_bodies")
        .select("id, acronym, full_name, body_type, reporting_formats")
        .eq("id", regulatory_body_id)
        .single();
      bodyInfo = (bd as Record<string, unknown>) ?? null;
    }

    // Build report data
    let reportData: Record<string, unknown> = {};
    if (report_type === "WSP" || report_type === "ATR") {
      reportData = await buildWSP(supabase, user.id, financial_year, regulatory_body_id);
    } else if (report_type === "OFO Report" || report_type === "OFO") {
      reportData = await buildOFO(supabase, user.id, financial_year);
    } else if (report_type === "Pivotal") {
      reportData = await buildPivotal(supabase, user.id, financial_year, regulatory_body_id);
    } else {
      // Generic compliance summary
      reportData = await buildWSP(supabase, user.id, financial_year, regulatory_body_id);
    }

    // Persist snapshot to reports table
    const snapshot = {
      report_type,
      financial_year,
      body: bodyInfo,
      ...reportData,
    };

    const { data: savedReport, error: saveError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        regulatory_body_id: regulatory_body_id ?? null,
        report_type,
        financial_year,
        data_snapshot: snapshot,
        status: "generated",
      })
      .select("id")
      .single();

    if (saveError) {
      console.error("Failed to persist report:", saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_id: savedReport?.id ?? null,
        report_type,
        financial_year,
        body: bodyInfo,
        ...reportData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-report error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
