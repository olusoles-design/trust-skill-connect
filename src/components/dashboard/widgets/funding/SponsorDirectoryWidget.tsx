import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Search, BadgeCheck, Globe, Mail, Linkedin,
  Phone, SlidersHorizontal, ChevronDown,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface SponsorProfile {
  id: string;
  company_name: string;
  tagline: string | null;
  description: string | null;
  website_url: string | null;
  sectors: string[] | null;
  provinces: string[] | null;
  programme_types: string[] | null;
  annual_budget: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  linkedin_url: string | null;
  verified: boolean;
}

const SECTOR_OPTIONS = [
  "ICT", "Construction", "Finance", "Health", "Education",
  "Engineering", "Agriculture", "Hospitality", "Manufacturing",
  "Mining", "Retail", "Transport", "Energy",
];

const PROG_TYPE_OPTIONS = [
  "Learnership", "Internship", "Bursary", "Apprenticeship",
  "Skills Programme", "Graduate Programme",
];

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function SponsorCard({ sponsor }: { sponsor: SponsorProfile }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card hover:bg-muted/20 transition-all p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
          <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground">{sponsor.company_name}</p>
              {sponsor.verified && <BadgeCheck className="w-4 h-4 text-primary" aria-label="Verified Sponsor" />}
            </div>
            {sponsor.tagline && (
              <p className="text-xs text-muted-foreground mt-0.5">{sponsor.tagline}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Sector tags */}
      {(sponsor.sectors?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sponsor.sectors!.map(s => (
            <span key={s} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Programme type badges */}
      {(sponsor.programme_types?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sponsor.programme_types!.map(t => (
            <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-3 pt-1 border-t border-border">
          {sponsor.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{sponsor.description}</p>
          )}
          {(sponsor.provinces?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Provinces</p>
              <div className="flex flex-wrap gap-1">
                {sponsor.provinces!.map(p => (
                  <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{p}</span>
                ))}
              </div>
            </div>
          )}
          {sponsor.annual_budget && (
            <p className="text-xs text-foreground">
              <span className="font-semibold text-muted-foreground">Annual Skills Spend: </span>
              {sponsor.annual_budget}
            </p>
          )}
          {/* Contact */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
            {sponsor.website_url && (
              <a href={sponsor.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {sponsor.linkedin_url && (
              <a href={sponsor.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
            {sponsor.contact_email && (
              <a href={`mailto:${sponsor.contact_email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5" /> {sponsor.contact_email}
              </a>
            )}
            {sponsor.contact_phone && (
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{sponsor.contact_phone}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Widget ─────────────────────────────────────────────────────────── */
export function SponsorDirectoryWidget() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string | "all">("all");
  const [progFilter, setProgFilter] = useState<string | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sponsor-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_profiles" as any)
        .select("id, company_name, tagline, description, website_url, sectors, provinces, programme_types, annual_budget, contact_email, contact_phone, linkedin_url, verified")
        .eq("is_public", true)
        .order("verified", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SponsorProfile[];
    },
  });

  const sponsors = data ?? [];

  const filtered = useMemo(() => {
    return sponsors.filter(s => {
      const matchSector = sectorFilter === "all" || (s.sectors ?? []).includes(sectorFilter);
      const matchProg   = progFilter === "all"   || (s.programme_types ?? []).includes(progFilter);
      const matchSearch = !search || [s.company_name, s.tagline, s.description, ...(s.sectors ?? [])]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()));
      return matchSector && matchProg && matchSearch;
    });
  }, [sponsors, sectorFilter, progFilter, search]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sponsor Directory</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} sponsor{filtered.length !== 1 ? "s" : ""} · discover who funds learnerships & bursaries
          </p>
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sponsors by name, sector or programme…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sector</p>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip label="All Sectors" active={sectorFilter === "all"} onClick={() => setSectorFilter("all")} />
              {SECTOR_OPTIONS.map(s => (
                <FilterChip key={s} label={s} active={sectorFilter === s} onClick={() => setSectorFilter(s)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Programme Type</p>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip label="All Types" active={progFilter === "all"} onClick={() => setProgFilter("all")} />
              {PROG_TYPE_OPTIONS.map(t => (
                <FilterChip key={t} label={t} active={progFilter === t} onClick={() => setProgFilter(t)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          <Building2 className="w-4 h-4" /> Failed to load sponsor directory
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {sponsors.length === 0 ? "No sponsors have published a profile yet." : "No sponsors match your filters."}
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map(sponsor => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </div>
  );
}
