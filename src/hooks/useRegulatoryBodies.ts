import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BodyType = "seta" | "qcto" | "saqa" | "professional_body" | "other";

export interface RegulatoryBody {
  id: string;
  acronym: string;
  full_name: string;
  body_type: BodyType;
  sector: string | null;
  is_active: boolean;
  is_levy_funded: boolean;
  reporting_formats: string[];
  doc_rules: string[];
  website_url: string | null;
  notes: string | null;
  sort_order: number;
}

export function useRegulatoryBodies(filterType?: BodyType | BodyType[]) {
  return useQuery({
    queryKey: ["regulatory_bodies", filterType],
    queryFn: async () => {
      let q = supabase
        .from("regulatory_bodies" as never)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const result = await q;
      if (result.error) throw result.error;

      const rows = (result.data ?? []) as RegulatoryBody[];

      if (!filterType) return rows;
      const types = Array.isArray(filterType) ? filterType : [filterType];
      return rows.filter((b) => types.includes(b.body_type));
    },
    staleTime: 1000 * 60 * 10, // cache 10 min — bodies rarely change
  });
}

/** Convenience: just SETAs */
export function useSETAs() {
  return useRegulatoryBodies("seta");
}

/** Convenience: all quality councils (SAQA + QCTO + CHE + Umalusi) */
export function useQualityCouncils() {
  return useRegulatoryBodies(["saqa", "qcto", "other"]);
}

/** Convenience: professional bodies */
export function useProfessionalBodies() {
  return useRegulatoryBodies("professional_body");
}
