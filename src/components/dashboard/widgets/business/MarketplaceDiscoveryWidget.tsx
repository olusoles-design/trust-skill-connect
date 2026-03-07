import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Store, Star, MapPin, Search, Loader2, AlertCircle, SlidersHorizontal,
  ChevronDown, Globe, Languages, Award, Users, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProviderListing {
  id: string;
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
}

const SEARCH_MODES = [
  { key: "all",         label: "All",            placeholder: "Search providers, SDPs, practitioners…"               },
      { key: "facilitator", label: "Facilitators",   placeholder: "e.g. isiXhosa Facilitator, Electrical Engineering NQF4…"   },
  { key: "assessor",    label: "Assessors",      placeholder: "e.g. Registered MICT SETA Assessor, NQF5…"                   },
  { key: "moderator",   label: "Moderators",     placeholder: "e.g. merSETA Moderator, Construction NQF3…"                  },
  { key: "sdf",         label: "SDFs",           placeholder: "e.g. Skills Development Facilitator, Gauteng B-BBEE…"        },
  { key: "sdp",         label: "SDPs",           placeholder: "e.g. merSETA accredited SDP, 20 learners, Durban…"           },
  { key: "venue",       label: "Venues",          placeholder: "e.g. Cape Town, 30 seats, projector…"                       },
  { key: "material",    label: "Materials",       placeholder: "e.g. Learner Guides, welding consumables…"                  },
] as const;

type SearchMode = (typeof SEARCH_MODES)[number]["key"];

const CATEGORIES = [
  { key: "all",                  label: "All Services" },
  { key: "learning_material",   label: "Learning Materials" },
  { key: "furniture_equipment", label: "Furniture & Equipment" },
  { key: "reprographics",       label: "Reprographics" },
  { key: "training_equipment",  label: "Training Equipment" },
  { key: "venue_facility",      label: "Venues & Facilities" },
  { key: "technology",          label: "Technology" },
];

const LANGUAGES = ["isiZulu","isiXhosa","Afrikaans","Sesotho","Setswana","English","Sepedi","Xitsonga","siSwati","Tshivenda","isiNdebele"];
const PROVINCES  = ["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Limpopo","Mpumalanga","North West","Free State","Northern Cape"];
const NQF_LEVELS = ["NQF 1","NQF 2","NQF 3","NQF 4","NQF 5","NQF 6","NQF 7","NQF 8"];
const SETAS      = ["merSETA","SETA (Generic)","ETDP SETA","INSETA","MICT SETA","CHIETA","FoodBev SETA","W&RSETA","CATHSSETA","AgriSETA","BANKSETA","CETA","FASSET","HWSETA","LGSETA","MQA","POSHEITA","PSETA","SASSETA","SERVICES SETA","TETA"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-muted stroke-muted-foreground fill-none"}`}
        />
      ))}
    </div>
  );
}

function formatPrice(from: number | null, to: number | null, currency: string, model: string) {
  if (!from && !to) return "Contact for pricing";
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (model === "hourly") return `${fmt(from ?? 0)}/hr${to ? ` – ${fmt(to)}/hr` : ""}`;
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  return fmt(from ?? to ?? 0);
}

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
  const [selected, setSelected] = useState<ProviderListing | null>(null);

  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ["provider-listings", category],
    queryFn: async () => {
      let q = supabase
        .from("provider_listings")
        .select("id, title, category, description, pricing_model, price_from, price_to, currency, location, certifications, services, rating_avg, review_count")
        .eq("status", "active")
        .order("rating_avg", { ascending: false });
      if (category !== "all") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ProviderListing[];
    },
  });

  const filtered = listings.filter(l => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) &&
        !(l.description ?? "").toLowerCase().includes(search.toLowerCase()) &&
        !(l.services ?? []).some(s => s.toLowerCase().includes(search.toLowerCase())))
      return false;
    if (language && !(l.certifications ?? []).some(c => c.toLowerCase().includes(language.toLowerCase())) &&
        !(l.services ?? []).some(s => s.toLowerCase().includes(language.toLowerCase())))
      return false;
    if (province && l.location && !l.location.toLowerCase().includes(province.toLowerCase()))
      return false;
    if (nqf && !(l.certifications ?? []).some(c => c.includes(nqf)) &&
        !(l.services ?? []).some(s => s.includes(nqf)))
      return false;
    if (seta && !(l.certifications ?? []).some(c => c.toLowerCase().includes(seta.toLowerCase())))
      return false;
    return true;
  });

  const currentMode = SEARCH_MODES.find(m => m.key === mode)!;
  const hasFilters  = !!(language || province || nqf || seta || capacity);

  return (
    <div className="space-y-4">
      {/* Mode pills */}
      <div className="flex gap-1.5 flex-wrap">
        {SEARCH_MODES.map(m => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setSearch(""); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={currentMode.placeholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
            hasFilters || showFilters
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {hasFilters ? "Filtered" : "Filters"}
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
              {/* Language */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Languages className="w-3 h-3" /> Language
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">Any language</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {/* Province */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3 h-3" /> Province
                </label>
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">Any province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {/* NQF Level */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Award className="w-3 h-3" /> NQF Level
                </label>
                <select
                  value={nqf}
                  onChange={e => setNqf(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">Any level</option>
                  {NQF_LEVELS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {/* SETA */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Globe className="w-3 h-3" /> SETA Accreditation
                </label>
                <select
                  value={seta}
                  onChange={e => setSeta(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">Any SETA</option>
                  {SETAS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Learner capacity */}
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
              {/* Clear */}
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
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
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
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Services</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {filtered.map(listing => (
          <button
            key={listing.id}
            onClick={() => setSelected(selected?.id === listing.id ? null : listing)}
            className={`text-left p-4 rounded-xl border bg-card hover:shadow-sm transition-all space-y-3 ${selected?.id === listing.id ? "border-primary/50 bg-primary/5" : "border-border"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
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
              <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                {listing.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location}</span>
                )}
                <span className="font-semibold text-foreground">
                  {formatPrice(listing.price_from, listing.price_to, listing.currency, listing.pricing_model)}
                </span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${selected?.id === listing.id ? "rotate-90" : ""}`} />
            </div>

            {listing.services && listing.services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {listing.services.slice(0, 4).map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                ))}
                {listing.services.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{listing.services.length - 4} more</span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
