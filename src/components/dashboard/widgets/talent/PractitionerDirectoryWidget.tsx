import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Search, MapPin, Star, Award, Globe, Languages,
  ChevronRight, Loader2, AlertCircle, UserCheck, Filter,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Practitioner {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  location: string | null;
  bio: string | null;
  skills: string[] | null;
  languages: string[] | null;
  nqf_level: string | null;
  availability: string | null;
  avatar_url: string | null;
}

interface Accreditation {
  user_id: string;
  role_type: string;
  seta_body: string;
  status: string;
}

const ROLE_TYPES = [
  { key: "all",         label: "All Practitioners" },
  { key: "facilitator", label: "Facilitators" },
  { key: "assessor",    label: "Assessors" },
  { key: "moderator",   label: "Moderators" },
  { key: "sdf",         label: "SDFs" },
];

const PROVINCES = [
  "Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape",
  "Limpopo","Mpumalanga","North West","Free State","Northern Cape",
];

const LANGUAGES = [
  "English","isiZulu","isiXhosa","Afrikaans","Sesotho","Setswana",
  "Sepedi","Xitsonga","siSwati","Tshivenda","isiNdebele",
];

const SETAS = [
  "merSETA","ETDP SETA","MICT SETA","W&RSETA","FoodBev SETA",
  "CETA","MQA","TETA","CATHSSETA","AgriSETA","BANKSETA","CHIETA",
  "FASSET","HWSETA","INSETA","LGSETA","POSHEITA","PSETA",
  "SASSETA","SERVICES SETA",
];

const AVAIL_CONFIG: Record<string, { label: string; color: string }> = {
  available:   { label: "Available",    color: "bg-green-500/15 text-green-600" },
  flexible:    { label: "Flexible",     color: "bg-primary/15 text-primary" },
  unavailable: { label: "Unavailable",  color: "bg-muted text-muted-foreground" },
};

function InitialsAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  const colors = ["bg-primary/20 text-primary", "bg-secondary/20 text-secondary",
    "bg-accent/20 text-accent-foreground", "bg-muted text-muted-foreground"];
  const colorIdx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`${sizes[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {initials || "?"}
    </div>
  );
}

function RoleTypeBadge({ roleType }: { roleType: string }) {
  const configs: Record<string, string> = {
    facilitator: "bg-primary/10 text-primary",
    assessor:    "bg-secondary/10 text-secondary-foreground",
    moderator:   "bg-accent/20 text-accent-foreground",
    sdf:         "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${configs[roleType.toLowerCase()] ?? "bg-muted text-muted-foreground"}`}>
      {roleType}
    </span>
  );
}

export function PractitionerDirectoryWidget() {
  const [roleFilter, setRoleFilter]     = useState("all");
  const [search, setSearch]             = useState("");
  const [province, setProvince]         = useState("");
  const [language, setLanguage]         = useState("");
  const [seta, setSeta]                 = useState("");
  const [showFilters, setShowFilters]   = useState(false);
  const [selected, setSelected]         = useState<Practitioner | null>(null);

  // Fetch practitioners (profiles with availability set)
  const { data: practitioners = [], isLoading, error } = useQuery({
    queryKey: ["practitioner-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, job_title, location, bio, skills, languages, nqf_level, availability, avatar_url")
        .not("availability", "is", null)
        .order("first_name");
      if (error) throw error;
      return (data ?? []) as Practitioner[];
    },
  });

  // Fetch accreditations to enrich cards
  const { data: accreditations = [] } = useQuery({
    queryKey: ["practitioner-accreditations-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practitioner_accreditations")
        .select("user_id, role_type, seta_body, status")
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []) as Accreditation[];
    },
  });

  const accredByUser = accreditations.reduce<Record<string, Accreditation[]>>((acc, a) => {
    acc[a.user_id] = [...(acc[a.user_id] ?? []), a];
    return acc;
  }, {});

  const filtered = practitioners.filter(p => {
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
    const userAccreds = accredByUser[p.user_id] ?? [];

    if (roleFilter !== "all") {
      const hasRole = userAccreds.some(a => a.role_type.toLowerCase().includes(roleFilter));
      if (!hasRole) return false;
    }
    if (search && !name.includes(search.toLowerCase()) &&
        !(p.bio ?? "").toLowerCase().includes(search.toLowerCase()) &&
        !(p.job_title ?? "").toLowerCase().includes(search.toLowerCase()) &&
        !(p.skills ?? []).some(s => s.toLowerCase().includes(search.toLowerCase())))
      return false;
    if (province && p.location && !p.location.toLowerCase().includes(province.toLowerCase()))
      return false;
    if (language && !(p.languages ?? []).some(l => l.toLowerCase().includes(language.toLowerCase())))
      return false;
    if (seta && !userAccreds.some(a => a.seta_body.toLowerCase().includes(seta.toLowerCase())))
      return false;
    return true;
  });

  const hasFilters = !!(province || language || seta);

  return (
    <div className="space-y-4">
      {/* Role filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {ROLE_TYPES.map(r => (
          <button
            key={r.key}
            onClick={() => setRoleFilter(r.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
              roleFilter === r.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, skills, or bio…"
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
          <Filter className="w-3.5 h-3.5" />
          {hasFilters ? "Filtered" : "Filter"}
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
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3 h-3" /> Province
                </label>
                <select value={province} onChange={e => setProvince(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="">Any province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Languages className="w-3 h-3" /> Language
                </label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="">Any language</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Globe className="w-3 h-3" /> SETA
                </label>
                <select value={seta} onChange={e => setSeta(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-card px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="">Any SETA</option>
                  {SETAS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-end col-span-2 xl:col-span-1">
                <button
                  onClick={() => { setProvince(""); setLanguage(""); setSeta(""); }}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {isLoading ? "Loading…" : `${filtered.length} practitioner${filtered.length !== 1 ? "s" : ""} found`}
        {hasFilters && <span className="text-primary ml-1">(filtered)</span>}
      </p>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" /> Failed to load practitioners
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <Users className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No practitioners match your search.</p>
          {hasFilters && (
            <button onClick={() => { setProvince(""); setLanguage(""); setSeta(""); }}
              className="text-xs text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Selected detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={`${selected.first_name ?? ""} ${selected.last_name ?? ""}`} size="lg" />
                <div>
                  <h3 className="font-bold text-foreground">
                    {selected.first_name} {selected.last_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{selected.job_title}</p>
                  {selected.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{selected.location}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {selected.bio && <p className="text-xs text-muted-foreground">{selected.bio}</p>}

            {/* Accreditations */}
            {(accredByUser[selected.user_id] ?? []).length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Accreditations</p>
                <div className="flex flex-wrap gap-1.5">
                  {accredByUser[selected.user_id].map((a, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      <UserCheck className="w-2.5 h-2.5" />
                      {a.role_type} · {a.seta_body}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {selected.languages && selected.languages.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Languages</p>
                <div className="flex flex-wrap gap-1">
                  {selected.languages.map(l => (
                    <span key={l} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {selected.skills && selected.skills.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {selected.skills.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all">
              Send Enquiry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Practitioner cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {filtered.map(p => {
          const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unknown";
          const userAccreds = accredByUser[p.user_id] ?? [];
          const availCfg = AVAIL_CONFIG[p.availability ?? "flexible"] ?? AVAIL_CONFIG.flexible;
          const isSelected = selected?.user_id === p.user_id;

          return (
            <button
              key={p.user_id}
              onClick={() => setSelected(isSelected ? null : p)}
              className={`text-left p-4 rounded-xl border bg-card hover:shadow-sm transition-all space-y-3 ${
                isSelected ? "border-primary/50 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <InitialsAvatar name={fullName} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                    {p.job_title && <p className="text-xs text-muted-foreground truncate">{p.job_title}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${availCfg.color}`}>
                    {availCfg.label}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                </div>
              </div>

              {/* Role type badges from accreditations */}
              {userAccreds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {userAccreds.slice(0, 3).map((a, i) => (
                    <RoleTypeBadge key={i} roleType={a.role_type} />
                  ))}
                  {userAccreds.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{userAccreds.length - 3} more</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {p.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>
                )}
                {p.nqf_level && (
                  <span className="flex items-center gap-1"><Award className="w-3 h-3" />{p.nqf_level}</span>
                )}
                {(p.languages ?? []).length > 0 && (
                  <span className="flex items-center gap-1">
                    <Languages className="w-3 h-3" />
                    {(p.languages ?? []).slice(0, 2).join(", ")}
                    {(p.languages ?? []).length > 2 && ` +${(p.languages ?? []).length - 2}`}
                  </span>
                )}
              </div>

              {p.skills && p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.skills.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                  ))}
                  {p.skills.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{p.skills.length - 3} more</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
