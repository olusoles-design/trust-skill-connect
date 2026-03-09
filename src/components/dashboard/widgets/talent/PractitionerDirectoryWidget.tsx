import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Search, MapPin, Award, Globe, Languages, Filter,
  ChevronDown, Loader2, AlertCircle, UserCheck, ShieldCheck,
  Star, Grid3X3, List, Zap, Mail, Phone, BookOpen, TrendingUp,
  CheckCircle2, Clock, XCircle, SortAsc,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PractitionerListing {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  location: string | null;
  province: string | null;
  bio: string | null;
  skills: string[] | null;
  languages: string[] | null;
  nqf_level: string | null;
  availability: string;
  years_exp: number | null;
  is_verified: boolean;
  is_featured: boolean;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
}

interface Accred {
  listing_id: string;
  role_type: string;
  seta_body: string;
  reg_number: string | null;
  valid_from: string | null;
  valid_to: string | null;
  status: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const ROLE_TYPES = [
  { key: "all",         label: "All" },
  { key: "facilitator", label: "SME/Facilitator" },
  { key: "assessor",    label: "Assessor" },
  { key: "moderator",   label: "Moderator" },
  { key: "sdf",         label: "SDF" },
];

const ROLE_COLORS: Record<string, string> = {
  facilitator: "bg-primary/10 text-primary border-primary/20",
  assessor:    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  moderator:   "bg-amber-500/10 text-amber-600 border-amber-500/20",
  sdf:         "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const AVAIL_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  available:   { label: "Available Now",  dot: "bg-green-500",   badge: "bg-green-500/10 text-green-600 border-green-500/20" },
  flexible:    { label: "Flexible",       dot: "bg-primary",     badge: "bg-primary/10 text-primary border-primary/20" },
  unavailable: { label: "Unavailable",    dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
};

const PROVINCES = [
  "Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape",
  "Limpopo","Mpumalanga","North West","Free State","Northern Cape",
];
const LANGUAGES = [
  "English","isiZulu","isiXhosa","Afrikaans","Sesotho","Setswana",
  "Sepedi","Xitsonga","siSwati","Tshivenda","isiNdebele",
];
const SETAS = [
  "merSETA","ETDP SETA","MICT SETA","W&RSETA","FoodBev SETA","CETA","MQA","TETA",
  "CATHSSETA","AgriSETA","BANKSETA","CHIETA","FASSET","HWSETA","INSETA",
  "LGSETA","POSHEITA","PSETA","SASSETA","SERVICES SETA",
];
const SORT_OPTIONS = [
  { key: "available",    label: "Available First" },
  { key: "verified",     label: "Verified First" },
  { key: "experience",   label: "Most Experienced" },
  { key: "accreditations", label: "Most Accreditations" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-50`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

function InitialsAvatar({ name, size = "md", featured }: { name: string; size?: "sm"|"md"|"lg"; featured?: boolean }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const sz = { sm: "w-9 h-9 text-xs", md: "w-11 h-11 text-sm", lg: "w-14 h-14 text-base" }[size];
  const palettes = [
    "from-primary/30 to-primary/10 text-primary",
    "from-emerald-500/30 to-emerald-500/10 text-emerald-600",
    "from-amber-500/30 to-amber-500/10 text-amber-600",
    "from-purple-500/30 to-purple-500/10 text-purple-600",
  ];
  const color = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <div className={`${sz} bg-gradient-to-br ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0 relative ${featured ? "ring-2 ring-primary/40" : ""}`}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const key = role.toLowerCase();
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border capitalize ${ROLE_COLORS[key] ?? "bg-muted text-muted-foreground border-border"}`}>
      {role}
    </span>
  );
}

function NQFBar({ level }: { level: string | null }) {
  if (!level) return null;
  const num = parseInt(level.replace(/\D/g, "")) || 0;
  const pct = Math.min(100, (num / 10) * 100);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>NQF Level</span>
        <span className="font-semibold text-foreground">{level}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MatchScore({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-600 bg-green-500/10" : score >= 50 ? "text-amber-600 bg-amber-500/10" : "text-muted-foreground bg-muted";
  return (
    <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${color} flex items-center gap-1`}>
      <Zap className="w-2.5 h-2.5" />{score}% match
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: number | string; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${color}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div>
        <p className="text-sm font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function PractitionerDirectoryWidget() {
  const [roleFilter, setRoleFilter]     = useState("all");
  const [search, setSearch]             = useState("");
  const [province, setProvince]         = useState("");
  const [language, setLanguage]         = useState("");
  const [seta, setSeta]                 = useState("");
  const [sortBy, setSortBy]             = useState("available");
  const [availOnly, setAvailOnly]       = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [viewMode, setViewMode]         = useState<"grid" | "list">("grid");
  const [selected, setSelected]         = useState<PractitionerListing | null>(null);

  const { data: practitioners = [], isLoading, error } = useQuery({
    queryKey: ["practitioner-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practitioner_listings")
        .select("*")
        .eq("status", "active")
        .order("is_featured", { ascending: false });
      if (error) throw error;
      return data as PractitionerListing[];
    },
  });

  const { data: accreditations = [] } = useQuery({
    queryKey: ["practitioner-listing-accreds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practitioner_listing_accreds")
        .select("listing_id, role_type, seta_body, reg_number, valid_from, valid_to, status")
        .eq("status", "active");
      if (error) throw error;
      return data as Accred[];
    },
  });

  const accredByListing = useMemo(() =>
    accreditations.reduce<Record<string, Accred[]>>((acc, a) => {
      acc[a.listing_id] = [...(acc[a.listing_id] ?? []), a];
      return acc;
    }, {}),
    [accreditations]
  );

  // Stats
  const totalCount    = practitioners.length;
  const availCount    = practitioners.filter(p => p.availability === "available").length;
  const setaSet       = new Set(accreditations.map(a => a.seta_body));
  const verifiedCount = practitioners.filter(p => p.is_verified).length;

  // Compute match score when filters active
  const hasFilters = !!(search || province || language || seta || roleFilter !== "all" || availOnly);

  function computeMatch(p: PractitionerListing): number {
    if (!hasFilters) return 100;
    let score = 0; let checks = 0;
    const userAccreds = accredByListing[p.id] ?? [];
    if (search) {
      checks++;
      const q = search.toLowerCase();
      if ([p.first_name, p.last_name, p.job_title, p.bio, ...(p.skills ?? [])].some(v => v?.toLowerCase().includes(q))) score++;
    }
    if (province) { checks++; if (p.province?.toLowerCase().includes(province.toLowerCase())) score++; }
    if (language) { checks++; if ((p.languages ?? []).some(l => l.toLowerCase().includes(language.toLowerCase()))) score++; }
    if (seta)     { checks++; if (userAccreds.some(a => a.seta_body.toLowerCase().includes(seta.toLowerCase()))) score++; }
    if (roleFilter !== "all") { checks++; if (userAccreds.some(a => a.role_type.toLowerCase().includes(roleFilter))) score++; }
    if (availOnly) { checks++; if (p.availability === "available") score++; }
    return checks === 0 ? 100 : Math.round((score / checks) * 100);
  }

  const filtered = useMemo(() => {
    let list = practitioners.filter(p => {
      const userAccreds = accredByListing[p.id] ?? [];
      const q = search.toLowerCase();
      if (search && ![ p.first_name, p.last_name, p.job_title, p.bio, ...(p.skills ?? []) ].some(v => v?.toLowerCase().includes(q))) return false;
      if (province && !p.province?.toLowerCase().includes(province.toLowerCase())) return false;
      if (language && !(p.languages ?? []).some(l => l.toLowerCase().includes(language.toLowerCase()))) return false;
      if (seta && !userAccreds.some(a => a.seta_body.toLowerCase().includes(seta.toLowerCase()))) return false;
      if (roleFilter !== "all" && !userAccreds.some(a => a.role_type.toLowerCase().includes(roleFilter))) return false;
      if (availOnly && p.availability !== "available") return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "available") {
        const order = { available: 0, flexible: 1, unavailable: 2 };
        return (order[a.availability as keyof typeof order] ?? 2) - (order[b.availability as keyof typeof order] ?? 2);
      }
      if (sortBy === "verified") return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
      if (sortBy === "experience") return (b.years_exp ?? 0) - (a.years_exp ?? 0);
      if (sortBy === "accreditations") return (accredByListing[b.id]?.length ?? 0) - (accredByListing[a.id]?.length ?? 0);
      return 0;
    });
    return list;
  }, [practitioners, accredByListing, search, province, language, seta, roleFilter, availOnly, sortBy]);

  const featured = useMemo(() => practitioners.filter(p => p.is_featured), [practitioners]);

  return (
    <div className="space-y-5">
      {/* ── Stats Bar ── */}
      {!isLoading && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
          <StatCard icon={Users}       value={totalCount}    label="Practitioners"  color="bg-primary/5 text-primary" />
          <StatCard icon={CheckCircle2} value={availCount}   label="Available Now"  color="bg-green-500/5 text-green-600" />
          <StatCard icon={ShieldCheck}  value={verifiedCount} label="Verified"      color="bg-emerald-500/5 text-emerald-600" />
          <StatCard icon={Globe}        value={setaSet.size}  label="SETAs Covered" color="bg-purple-500/5 text-purple-600" />
        </div>
      )}

      {/* ── Featured Strip ── */}
      {!search && !hasFilters && featured.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500" /> Featured Practitioners
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {featured.map(p => {
              const accreds = accredByListing[p.id] ?? [];
              const avail = AVAIL_CONFIG[p.availability] ?? AVAIL_CONFIG.flexible;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  className={`flex-shrink-0 w-52 p-3 rounded-xl border-2 bg-card text-left transition-all space-y-2 ${
                    selected?.id === p.id ? "border-primary/60 bg-primary/5" : "border-primary/20 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <InitialsAvatar name={`${p.first_name} ${p.last_name}`} size="sm" featured />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{p.first_name} {p.last_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{p.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PulsingDot color={avail.dot} />
                    <span className="text-[10px] font-medium text-muted-foreground">{avail.label}</span>
                    {p.is_verified && <ShieldCheck className="w-3 h-3 text-primary ml-auto" />}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {accreds.slice(0, 2).map((a, i) => <RoleBadge key={i} role={a.role_type} />)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search Row ── */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, skills, bio…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        {/* Available Now toggle */}
        <button
          onClick={() => setAvailOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${
            availOnly ? "bg-green-500 text-white border-green-500" : "bg-card text-muted-foreground border-border hover:border-green-400 hover:text-green-600"
          }`}
        >
          <PulsingDot color={availOnly ? "bg-white" : "bg-green-500"} />
          Available
        </button>
        {/* Grid/List toggle */}
        <div className="flex border border-border rounded-xl overflow-hidden">
          <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode==="grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode==="list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
            showFilters || province || language || seta
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* ── Role Pills ── */}
      <div className="flex gap-1.5 flex-wrap">
        {ROLE_TYPES.map(r => (
          <button key={r.key} onClick={() => setRoleFilter(r.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              roleFilter === r.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >{r.label}</button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <SortAsc className="w-3.5 h-3.5 text-muted-foreground" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-2 py-1 text-muted-foreground focus:outline-none">
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Advanced Filters ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-xl border border-border bg-muted/20 p-4 grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: "Province", icon: MapPin, value: province, setValue: setProvince, options: PROVINCES },
                { label: "Language", icon: Languages, value: language, setValue: setLanguage, options: LANGUAGES },
                { label: "SETA", icon: Globe, value: seta, setValue: setSeta, options: SETAS },
              ].map(({ label, icon: Icon, value, setValue, options }) => (
                <div key={label}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                    <Icon className="w-3 h-3" /> {label}
                  </label>
                  <select value={value} onChange={e => setValue(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30">
                    <option value="">Any {label.toLowerCase()}</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex items-end">
                <button onClick={() => { setProvince(""); setLanguage(""); setSeta(""); setRoleFilter("all"); setAvailOnly(false); }}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                  Clear all
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results Count ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading…" : <><span className="font-semibold text-foreground">{filtered.length}</span> practitioner{filtered.length !== 1 ? "s" : ""} {hasFilters && <span className="text-primary">(filtered)</span>}</>}
        </p>
        {hasFilters && (
          <button onClick={() => { setSearch(""); setProvince(""); setLanguage(""); setSeta(""); setRoleFilter("all"); setAvailOnly(false); }}
            className="text-[10px] text-primary hover:underline">Clear all filters</button>
        )}
      </div>

      {/* ── Loading / Error ── */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" /> Failed to load practitioners
        </div>
      )}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-14 space-y-2">
          <Users className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground">No practitioners match</p>
          <p className="text-xs text-muted-foreground">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* ── Expanded Detail Panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={`${selected.first_name} ${selected.last_name}`} size="lg" featured={selected.is_featured} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-base">{selected.first_name} {selected.last_name}</h3>
                    {selected.is_verified && (
                      <div className="flex items-center gap-0.5 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{selected.job_title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {selected.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.location}</span>}
                    {selected.years_exp && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{selected.years_exp} yrs exp</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-sm p-1">✕</button>
            </div>

            {/* Availability */}
            {(() => { const av = AVAIL_CONFIG[selected.availability as keyof typeof AVAIL_CONFIG] ?? AVAIL_CONFIG.flexible; return (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${av.badge}`}>
                <PulsingDot color={av.dot} />
                <span className="text-xs font-semibold">{av.label}</span>
              </div>
            );})()}

            {/* Bio */}
            {selected.bio && <p className="text-xs text-muted-foreground leading-relaxed">{selected.bio}</p>}

            {/* NQF Bar */}
            <NQFBar level={selected.nqf_level} />

            {/* Accreditations */}
            {(accredByListing[selected.id] ?? []).length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Accreditations
                </p>
                <div className="space-y-1.5">
                  {accredByListing[selected.id].map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-border">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={a.role_type} />
                        <span className="text-xs font-medium text-foreground">{a.seta_body}</span>
                      </div>
                      {a.reg_number && <span className="text-[10px] text-muted-foreground font-mono">{a.reg_number}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages + Skills */}
            <div className="grid grid-cols-2 gap-4">
              {selected.languages && selected.languages.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.languages.map(l => <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{l}</span>)}
                  </div>
                </div>
              )}
              {selected.skills && selected.skills.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.skills.slice(0, 5).map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{s}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all">
                  <Mail className="w-3.5 h-3.5" /> Send Enquiry
                </a>
              )}
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-all">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Practitioner Cards ── */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 xl:grid-cols-2 gap-3" : "space-y-2"}>
        {filtered.map(p => {
          const fullName   = `${p.first_name} ${p.last_name}`;
          const accreds    = accredByListing[p.id] ?? [];
          const avail      = AVAIL_CONFIG[p.availability] ?? AVAIL_CONFIG.flexible;
          const isSelected = selected?.id === p.id;
          const matchScore = hasFilters ? computeMatch(p) : null;
          const uniqueRoles = [...new Set(accreds.map(a => a.role_type))];
          const uniqueSETAs = [...new Set(accreds.map(a => a.seta_body))];

          return (
            <motion.button
              key={p.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelected(isSelected ? null : p)}
              className={`text-left rounded-xl border bg-card transition-all hover:shadow-sm w-full ${
                isSelected ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
              } ${p.is_featured ? "ring-1 ring-primary/20" : ""} ${viewMode === "list" ? "p-3" : "p-4"}`}
            >
              {viewMode === "grid" ? (
                <div className="space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="relative">
                        <InitialsAvatar name={fullName} size="md" featured={p.is_featured} />
                        {p.is_verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                        {p.job_title && <p className="text-xs text-muted-foreground truncate">{p.job_title}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${avail.badge}`}>
                        <PulsingDot color={avail.dot} />{p.availability === "available" ? "Available" : p.availability === "flexible" ? "Flexible" : "Busy"}
                      </div>
                      {matchScore !== null && <MatchScore score={matchScore} />}
                    </div>
                  </div>

                  {/* Role badges */}
                  {uniqueRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {uniqueRoles.slice(0, 3).map(r => <RoleBadge key={r} role={r} />)}
                    </div>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {p.province && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.province.split(",")[0]}</span>}
                      {p.years_exp && <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{p.years_exp}y exp</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {uniqueSETAs.slice(0, 2).map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-muted font-medium">{s.split(" ")[0]}</span>
                      ))}
                      {uniqueSETAs.length > 2 && <span>+{uniqueSETAs.length - 2}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                /* List view */
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <InitialsAvatar name={fullName} size="sm" featured={p.is_featured} />
                    {p.is_verified && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center"><ShieldCheck className="w-2 h-2 text-primary-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{fullName}</p>
                      {uniqueRoles.slice(0, 2).map(r => <RoleBadge key={r} role={r} />)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.job_title} {p.province ? `· ${p.province.split(",")[0]}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {matchScore !== null && <MatchScore score={matchScore} />}
                    <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${avail.badge}`}>
                      <PulsingDot color={avail.dot} />{p.availability === "available" ? "Now" : p.availability === "flexible" ? "Flex" : "Busy"}
                    </div>
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
