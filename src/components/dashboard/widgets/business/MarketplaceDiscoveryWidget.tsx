import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Store, Star, MapPin, Search, Loader2, AlertCircle, SlidersHorizontal,
  ChevronDown, Globe, Languages, Award, Users, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Unified listing shape ─────────────────────────────────────────────── */

interface UnifiedListing {
  id: string;
  source: "provider" | "practitioner";
  title: string;
  category: string;
  description: string | null;
  pricing_model: string;
  price_from: number | null;
  price_to: number | null;
  currency: string;
  location: string | null;
  certifications: string[] | null;
  services: string[] | null;
  rating_avg: number;
  review_count: number;
  // practitioner-specific
  seta_body?: string;
  role_type?: string;
  province?: string;
  languages?: string[] | null;
  nqf_level?: string | null;
}

/* ── Constants ──────────────────────────────────────────────────────────── */

const SEARCH_MODES = [
  { key: "all",         label: "All",              placeholder: "Search providers, SDPs, practitioners…" },
  { key: "facilitator", label: "SME/Facilitators",  placeholder: "e.g. isiXhosa SME/Facilitator, Electrical Engineering NQF4…" },
  { key: "assessor",    label: "Assessors",         placeholder: "e.g. Registered MICT SETA Assessor, NQF5…" },
  { key: "moderator",   label: "Moderators",        placeholder: "e.g. merSETA Moderator, Construction NQF3…" },
  { key: "sdf",         label: "SDFs",              placeholder: "e.g. Skills Development Facilitator, Gauteng B-BBEE…" },
  { key: "sdp",         label: "SDPs",              placeholder: "e.g. merSETA accredited SDP, 20 learners, Durban…" },
  { key: "venue",       label: "Venues",            placeholder: "e.g. Cape Town, 30 seats, projector…" },
  { key: "material",    label: "Materials",         placeholder: "e.g. Learner Guides, welding consumables…" },
] as const;

type SearchMode = (typeof SEARCH_MODES)[number]["key"];

const ROLE_MAP: Record<string, string> = {
  facilitator: "SME/Facilitator",
  assessor: "Assessor",
  moderator: "Moderator",
  sdf: "SDF",
};

const CATEGORIES = [
  { key: "all",                 label: "All Services" },
  { key: "learning_material",   label: "Learning Materials" },
  { key: "furniture_equipment", label: "Furniture & Equipment" },
  { key: "reprographics",      label: "Reprographics" },
  { key: "training_equipment",  label: "Training Equipment" },
  { key: "venue_facility",      label: "Venues & Facilities" },
  { key: "technology",          label: "Technology" },
];

const LANGUAGES_LIST = ["isiZulu","isiXhosa","Afrikaans","Sesotho","Setswana","English","Sepedi","Xitsonga","siSwati","Tshivenda","isiNdebele"];
const PROVINCES  = ["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Limpopo","Mpumalanga","North West","Free State","Northern Cape"];
const NQF_LEVELS = ["NQF 1","NQF 2","NQF 3","NQF 4","NQF 5","NQF 6","NQF 7","NQF 8"];
const SETAS      = ["merSETA","SETA (Generic)","ETDP SETA","INSETA","MICT SETA","CHIETA","FoodBev SETA","W&RSETA","CATHSSETA","AgriSETA","BANKSETA","CETA","FASSET","HWSETA","LGSETA","MQA","POSHEITA","PSETA","SASSETA","SERVICES SETA","TETA"];

/* ── Helpers ────────────────────────────────────────────────────────────── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-muted stroke-muted-foreground fill-none"}`}
        />
      ))}
    </div>
  );
}

function formatPrice(from: number | null, to: number | null, currency: string, model: string) {
  if (!from && !to) return "Contact for pricing";
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  return fmt(from ?? to ?? 0);
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function MarketplaceDiscoveryWidget() {
  const [mode, setMode]         = useState<SearchMode>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch]     = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [language, setLanguage] = useState("");
  const [province, setProvince] = useState("");
  const [nqf, setNqf]           = useState("");
  const [seta, setSeta]         = useState("");
  const [capacity, setCapacity] = useState("");
  const [selected, setSelected] = useState<UnifiedListing | null>(null);

  /* ── Fetch provider_listings ─────────────────────────────────────────── */
  const { data: providerListings = [], isLoading: loadingProviders, error: errorProviders } = useQuery({
    queryKey: ["discovery-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_listings")
        .select("id, title, category, description, pricing_model, price_from, price_to, currency, location, certifications, services, rating_avg, review_count")
        .eq("status", "active")
        .order("rating_avg", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p): UnifiedListing => ({
        ...p,
        source: "provider",
        certifications: p.certifications as string[] | null,
        services: p.services as string[] | null,
      }));
    },
  });

  /* ── Fetch practitioner_listings + accreds ────────────────────────────── */
  const { data: practitionerListings = [], isLoading: loadingPractitioners, error: errorPractitioners } = useQuery({
    queryKey: ["discovery-practitioners"],
    queryFn: async () => {
      const { data: listings, error } = await supabase
        .from("practitioner_listings")
        .select("id, first_name, last_name, job_title, bio, location, province, skills, languages, nqf_level, availability, status, years_exp")
        .eq("status", "active")
        .order("is_featured", { ascending: false });
      if (error) throw error;

      // Fetch accreditations for all listings
      const ids = (listings ?? []).map(l => l.id);
      let accredMap: Record<string, { seta_body: string; role_type: string }[]> = {};
      if (ids.length > 0) {
        const { data: accreds } = await supabase
          .from("practitioner_listing_accreds")
          .select("listing_id, seta_body, role_type")
          .in("listing_id", ids);
        (accreds ?? []).forEach(a => {
          if (!accredMap[a.listing_id]) accredMap[a.listing_id] = [];
          accredMap[a.listing_id].push({ seta_body: a.seta_body, role_type: a.role_type });
        });
      }

      return (listings ?? []).map((p): UnifiedListing => {
        const accreds = accredMap[p.id] || [];
        const primaryAccred = accreds[0];
        const roleLabel = primaryAccred?.role_type || p.job_title || "Practitioner";
        const setaLabel = primaryAccred?.seta_body || "";
        const title = `${setaLabel ? setaLabel + " " : ""}${roleLabel}${p.job_title && p.job_title !== roleLabel ? " – " + p.job_title : ""}`;

        return {
          id: p.id,
          source: "practitioner",
          title: `${p.first_name} ${p.last_name} — ${title}`,
          category: accreds.length > 0 ? mapRoleToCategory(accreds[0].role_type) : "consulting",
          description: p.bio,
          pricing_model: "daily",
          price_from: null,
          price_to: null,
          currency: "ZAR",
          location: p.location || p.province,
          certifications: accreds.map(a => `${a.seta_body} ${a.role_type}`),
          services: p.skills as string[] | null,
          rating_avg: 0,
          review_count: 0,
          seta_body: primaryAccred?.seta_body,
          role_type: primaryAccred?.role_type,
          province: p.province ?? undefined,
          languages: p.languages as string[] | null,
          nqf_level: p.nqf_level,
        };
      });
    },
  });

  const isLoading = loadingProviders || loadingPractitioners;
  const error = errorProviders || errorPractitioners;

  /* ── Merge + filter ──────────────────────────────────────────────────── */
  const allListings = useMemo(() => [...practitionerListings, ...providerListings], [practitionerListings, providerListings]);

  const filtered = useMemo(() => {
    return allListings.filter(l => {
      // Mode filter — practitioner role types
      if (mode !== "all") {
        const roleType = ROLE_MAP[mode];
        if (roleType) {
          // Practitioner role filter
          if (l.source !== "practitioner") return false;
          if (l.role_type !== roleType) return false;
        } else if (mode === "sdp") {
          if (l.source !== "provider") return false;
        } else if (mode === "venue") {
          if (l.category !== "venue_facility") return false;
        } else if (mode === "material") {
          if (l.category !== "learning_material") return false;
        }
      }

      // Category filter
      if (category !== "all" && l.category !== category) return false;

      // Text search
      if (search) {
        const q = search.toLowerCase();
        const haystack = [l.title, l.description, ...(l.services ?? []), ...(l.certifications ?? [])].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Advanced filters
      if (language && !(l.languages ?? []).some(lang => lang.toLowerCase().includes(language.toLowerCase())) &&
          !(l.certifications ?? []).some(c => c.toLowerCase().includes(language.toLowerCase())))
        return false;

      if (province) {
        const prov = province.toLowerCase();
        if (l.province && !l.province.toLowerCase().includes(prov) && l.location && !l.location.toLowerCase().includes(prov))
          return false;
        if (!l.province && l.location && !l.location.toLowerCase().includes(prov))
          return false;
        if (!l.province && !l.location) return false;
      }

      if (nqf) {
        const nqfMatch = [l.nqf_level, ...(l.certifications ?? []), ...(l.services ?? [])].filter(Boolean).join(" ").toLowerCase().includes(nqf.toLowerCase());
        if (!nqfMatch) return false;
      }

      if (seta) {
        const setaMatch = [l.seta_body, ...(l.certifications ?? [])].filter(Boolean).join(" ").toLowerCase().includes(seta.toLowerCase());
        if (!setaMatch) return false;
      }

      return true;
    });
  }, [allListings, mode, category, search, language, province, nqf, seta]);

  const currentMode = SEARCH_MODES.find(m => m.key === mode)!;
  const hasFilters  = !!(language || province || nqf || seta || capacity);

  return (
    <div className="space-y-5">
      {/* Mode pills */}
      <div className="flex gap-2 flex-wrap">
        {SEARCH_MODES.map(m => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setSearch(""); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
              mode === m.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={currentMode.placeholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
            hasFilters || showFilters
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-muted/20 p-4 grid grid-cols-2 xl:grid-cols-3 gap-3">
              <FilterSelect icon={<Languages className="w-3 h-3" />} label="Language" value={language} onChange={setLanguage} placeholder="Any language" options={LANGUAGES_LIST} />
              <FilterSelect icon={<MapPin className="w-3 h-3" />} label="Province" value={province} onChange={setProvince} placeholder="Any province" options={PROVINCES} />
              <FilterSelect icon={<Award className="w-3 h-3" />} label="NQF Level" value={nqf} onChange={setNqf} placeholder="Any level" options={NQF_LEVELS} />
              <FilterSelect icon={<Globe className="w-3 h-3" />} label="SETA Accreditation" value={seta} onChange={setSeta} placeholder="Any SETA" options={SETAS} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Users className="w-3 h-3" /> Min. Capacity
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setLanguage(""); setProvince(""); setNqf(""); setSeta(""); setCapacity(""); }}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
              category === cat.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} provider{filtered.length !== 1 ? "s" : ""} found
        {hasFilters && <span className="text-primary ml-1">(filtered)</span>}
      </p>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" /> Failed to load providers
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-10 space-y-2">
          <Store className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No providers match your search.</p>
          {hasFilters && (
            <button
              onClick={() => { setLanguage(""); setProvince(""); setNqf(""); setSeta(""); setCapacity(""); }}
              className="text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">{selected.title}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{selected.category.replace(/_/g, " ")}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
            {selected.description && <p className="text-xs text-muted-foreground">{selected.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {selected.location && (
                <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3 h-3" />{selected.location}</div>
              )}
              <div className="font-semibold text-foreground">{formatPrice(selected.price_from, selected.price_to, selected.currency, selected.pricing_model)}</div>
            </div>
            {selected.certifications && selected.certifications.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Accreditations</p>
                <div className="flex flex-wrap gap-1">
                  {selected.certifications.map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {selected.services && selected.services.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Services / Skills</p>
                <div className="flex flex-wrap gap-1">
                  {selected.services.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all">
                Send Enquiry
              </button>
              <button className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
                Request Quote (RFQ)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listing cards — full-width like the screenshot */}
      <div className="space-y-3">
        {filtered.map(listing => (
          <button
            key={listing.id}
            onClick={() => setSelected(selected?.id === listing.id ? null : listing)}
            className={`w-full text-left p-5 rounded-xl border bg-card hover:shadow-sm transition-all space-y-3 ${selected?.id === listing.id ? "border-primary/50 bg-primary/5" : "border-border"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{listing.title}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                  {listing.category.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <StarRating rating={listing.rating_avg} />
                <span className="text-[10px] text-muted-foreground">({listing.review_count})</span>
              </div>
            </div>

            {listing.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
            )}

            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                {listing.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location}</span>
                )}
                <span className="font-semibold text-foreground">
                  {formatPrice(listing.price_from, listing.price_to, listing.currency, listing.pricing_model)}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selected?.id === listing.id ? "rotate-90" : ""}`} />
            </div>

            {listing.services && listing.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {listing.services.slice(0, 5).map(s => (
                  <span key={s} className="text-[10px] px-2.5 py-0.5 rounded-full border border-border bg-card text-muted-foreground">{s}</span>
                ))}
                {listing.services.length > 5 && (
                  <span className="text-[10px] text-muted-foreground self-center">+{listing.services.length - 5} more</span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function FilterSelect({ icon, label, value, onChange, placeholder, options }: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder: string; options: string[];
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
        {icon} {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ── Utility ───────────────────────────────────────────────────────────── */

function mapRoleToCategory(roleType: string): string {
  switch (roleType) {
    case "SME/Facilitator": return "training_equipment";
    case "Assessor": return "learning_material";
    case "Moderator": return "learning_material";
    case "SDF": return "consulting";
    default: return "consulting";
  }
}
