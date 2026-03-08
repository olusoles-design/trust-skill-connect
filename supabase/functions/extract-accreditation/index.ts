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
Extract ALL information from the document text provided and return it as valid JSON.

Return ONLY this JSON structure (no markdown, no explanation):
{
  "practitioner_name": "Full name as on the letter",
  "id_number": "ID or reference number",
  "registration_number": "Registration/accreditation number e.g. RAS/07/2018/0051",
  "seta_body": "Full SETA or body name e.g. MICT SETA",
  "role_type": "assessor|facilitator|moderator|sdf|verifier|etqa_evaluator",
  "valid_from": "YYYY-MM-DD or null",
  "valid_to": "YYYY-MM-DD or null",
  "qualifications": [
    {
      "saqa_id": "SAQA ID number as string",
      "title": "Full qualification title",
      "nqf_level": "e.g. Level 5",
      "credits": 120
    }
  ],
  "issuing_body_address": "Address if present",
  "evaluator_name": "Name if present",
  "senior_manager_name": "Name if present",
  "raw_notes": "Any other notable information"
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
