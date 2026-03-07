import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Scoring helpers ──────────────────────────────────────────────────────────

function calcSkillMatch(
  profileSkills: string[] | null,
  oppTags: string[] | null,
  profileNQF?: string | null,
  oppNQF?: string | null,
): number {
  let overlap = 50;
  if (profileSkills?.length && oppTags?.length) {
    const pLow = profileSkills.map((s) => s.toLowerCase());
    const oLow = oppTags.map((t) => t.toLowerCase());
    const matched = pLow.filter((s) =>
      oLow.some((t) => t.includes(s) || s.includes(t))
    );
    overlap = Math.min(
      100,
      (matched.length / Math.max(pLow.length, oLow.length)) * 100 + 20,
    );
  }
  let nqfBonus = 10;
  if (profileNQF && oppNQF) {
    const pLevel = parseInt(profileNQF.replace(/\D/g, "") || "0");
    const oLevel = parseInt(oppNQF.replace(/\D/g, "") || "0");
    nqfBonus = pLevel >= oLevel ? 20 : oLevel - pLevel <= 1 ? 10 : 0;
  }
  return Math.min(100, Math.max(0, overlap + nqfBonus - 10));
}

function calcDemoMatch(
  profileDemo: Record<string, boolean> | null,
  oppDemo: Record<string, boolean> | null,
): number {
  if (!oppDemo || Object.keys(oppDemo).length === 0) return 100;
  if (!profileDemo || Object.keys(profileDemo).length === 0) return 60;
  let matches = 0, total = 0;
  for (const [key, val] of Object.entries(oppDemo)) {
    if (val) {
      total++;
      if (profileDemo[key]) matches++;
    }
  }
  return total === 0 ? 100 : Math.round((matches / total) * 100);
}

function calcLocationMatch(
  profileLoc: string | null,
  oppLoc: string | null,
): number {
  if (!profileLoc || !oppLoc) return 70;
  const pLow = profileLoc.toLowerCase();
  const oLow = oppLoc.toLowerCase();
  if (oLow.includes("nationwide") || oLow.includes("remote")) return 100;
  if (pLow === oLow) return 100;
  const PROVINCES = [
    "gauteng", "gp", "western cape", "wc", "kwazulu-natal", "kzn",
    "eastern cape", "ec", "free state", "fs", "northern cape", "nc",
    "limpopo", "lp", "mpumalanga", "mp", "north west", "nw",
  ];
  const pProv = PROVINCES.find((p) => pLow.includes(p));
  const oProv = PROVINCES.find((p) => oLow.includes(p));
  if (pProv && oProv && pProv === oProv) return 80;
  return 40;
}

function calcAvailMatch(
  availability: string | null,
  closingDate: string | null,
): number {
  if (!closingDate) return 80;
  const daysLeft =
    (new Date(closingDate).getTime() - Date.now()) / 86_400_000;
  if (daysLeft < 0) return 0;
  if (availability === "immediate") return 100;
  if (daysLeft < 7 && availability === "flexible") return 70;
  return 85;
}

function calcLangMatch(
  profileLangs: string[] | null,
  oppLangs: string[] | null,
): number {
  if (!oppLangs?.length) return 100;
  if (!profileLangs?.length) return 70;
  const pLow = profileLangs.map((l) => l.toLowerCase());
  const oLow = oppLangs.map((l) => l.toLowerCase());
  return pLow.some((l) => oLow.includes(l)) ? 100 : 50;
}

function generateExplanation(
  factors: Record<string, number>,
  opp: Record<string, unknown>,
  profile: Record<string, unknown> | null,
): string {
  const parts: string[] = [];
  if (factors.skill >= 75) parts.push("Strong skills alignment");
  else if (factors.skill >= 45) parts.push("Partial skills match");
  if (factors.location === 100)
    parts.push(
      String(opp.location ?? "").toLowerCase().includes("remote")
        ? "Remote-friendly"
        : "Great location match",
    );
  if (factors.demographics === 100 && profile?.demographics)
    parts.push("Meets demographic criteria");
  if (opp.verified) parts.push("Verified opportunity");
  if (opp.featured) parts.push("Featured listing");
  if (parts.length === 0) parts.push("Potential match based on your profile");
  return parts.join(" · ");
}

function calculateMatchScore(
  profile: Record<string, unknown> | null,
  opp: Record<string, unknown>,
): { score: number; factors: Record<string, number>; explanation: string } {
  const skillScore = calcSkillMatch(
    profile?.skills as string[] | null,
    opp.tags as string[] | null,
    profile?.nqf_level as string | null,
    opp.nqf_level_required as string | null,
  );
  const demoScore = calcDemoMatch(
    profile?.demographics as Record<string, boolean> | null,
    opp.demographics_target as Record<string, boolean> | null,
  );
  const locScore = calcLocationMatch(
    profile?.location as string | null,
    opp.location as string | null,
  );
  const availScore = calcAvailMatch(
    profile?.availability as string | null,
    opp.closing_date as string | null,
  );
  const langScore = calcLangMatch(
    profile?.languages as string[] | null,
    opp.languages_required as string[] | null,
  );

  const score = Math.round(
    skillScore * 0.40 +
      demoScore * 0.20 +
      locScore * 0.15 +
      availScore * 0.15 +
      langScore * 0.10,
  );

  const factors = {
    skill: Math.round(skillScore),
    demographics: Math.round(demoScore),
    location: Math.round(locScore),
    availability: Math.round(availScore),
    language: Math.round(langScore),
  };

  return { score, factors, explanation: generateExplanation(factors, opp, profile) };
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Authenticate caller
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, location, nqf_level, demographics, languages, availability")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch active opportunities
    const { data: opportunities, error: oppErr } = await supabase
      .from("opportunities")
      .select(
        "id, title, type, category, location, tags, nqf_level_required, demographics_target, languages_required, closing_date, stipend, organisation, verified, featured",
      )
      .eq("status", "active");

    if (oppErr) throw oppErr;
    if (!opportunities?.length) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Score all opportunities
    const scored = opportunities
      .map((opp) => {
        const { score, factors, explanation } = calculateMatchScore(
          profile as Record<string, unknown> | null,
          opp as Record<string, unknown>,
        );
        return { ...opp, match_score: score, match_factors: factors, match_explanation: explanation };
      })
      .sort((a, b) => b.match_score - a.match_score);

    // Upsert top 20 matches into match_results
    const upserts = scored.slice(0, 20).map((m) => ({
      user_id: user.id,
      opportunity_id: m.id,
      score: m.match_score,
      factors: m.match_factors,
      explanation: m.match_explanation,
      updated_at: new Date().toISOString(),
    }));

    await supabase
      .from("match_results")
      .upsert(upserts, { onConflict: "user_id,opportunity_id" });

    return new Response(JSON.stringify({ matches: scored }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
