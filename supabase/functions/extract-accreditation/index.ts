import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pdfText } = await req.json();

    if (!pdfText) {
      return new Response(JSON.stringify({ error: "pdfText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert at extracting structured data from South African SETA accreditation and registration letters.

Your task is to extract EVERY qualification from the table in the letter plus the key registration details.

CRITICAL RULES:
1. Extract ALL rows from the qualifications table — do NOT skip any.
2. The registration/accreditation number is usually formatted like "RAS/07/2018/0051" — find it exactly.
3. For role_type, detect from the letter heading: "REGISTERED ASSESSOR" → "assessor", "REGISTERED FACILITATOR" → "facilitator", "REGISTERED MODERATOR" → "moderator", "SKILLS DEVELOPMENT FACILITATOR" → "sdf", "VERIFIER" → "verifier", "ETQA EVALUATOR" → "etqa_evaluator".
4. For valid_from and valid_to: look for a date range like "2021-10-12 to 2024-10-11" — extract both dates as YYYY-MM-DD. If only one date is present use it for valid_from. If no dates found, return null.
5. nqf_level must be in the format "Level X" e.g. "Level 5".
6. credits must be a number (integer), not a string.
7. practitioner_name is the full name in the letter (usually in large/bold text after "confirm that").
8. id_number is the ID number in brackets e.g. "(ID Number: A06100627)" → "A06100627".
9. seta_body: extract the full SETA name e.g. "MICT SETA".

Return ONLY this JSON structure (no markdown fences, no explanation):
{
  "practitioner_name": "Full name",
  "id_number": "ID number without brackets",
  "registration_number": "e.g. RAS/07/2018/0051",
  "seta_body": "e.g. MICT SETA",
  "role_type": "assessor|facilitator|moderator|sdf|verifier|etqa_evaluator",
  "valid_from": "YYYY-MM-DD or null",
  "valid_to": "YYYY-MM-DD or null",
  "qualifications": [
    {
      "saqa_id": "SAQA ID as string e.g. 71869",
      "title": "Full qualification title exactly as in the letter",
      "nqf_level": "Level X",
      "credits": 120
    }
  ],
  "evaluator_name": "Evaluator name if present or null",
  "senior_manager_name": "Senior manager name if present or null",
  "raw_notes": "Any other notable information or null"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract all information from this accreditation document:\n\n${pdfText}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI JSON:", cleaned);
      return new Response(JSON.stringify({ error: "AI returned unparseable JSON", raw: cleaned }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-accreditation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
