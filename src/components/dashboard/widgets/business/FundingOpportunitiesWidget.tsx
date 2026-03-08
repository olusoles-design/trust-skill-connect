import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronUp,
  Loader2, Banknote, Users, MapPin, CalendarDays, Award,
  Send, CheckCircle, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FundingOpp {
  id: string;
  title: string;
  programme_type: string;
  sector: string | null;
  nqf_level: string | null;
  seats_available: number;
  budget_per_learner: number | null;
  total_budget: number | null;
  currency: string;
  province: string | null;
  duration: string | null;
  start_date: string | null;
  application_deadline: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

const PROG_LABELS: Record<string, string> = {
  learnership: "Learnership", internship: "Internship", bursary: "Bursary",
  apprenticeship: "Apprenticeship", skills_programme: "Skills Programme",
};

const PROG_COLORS: Record<string, string> = {
      learnership:   "bg-primary/10 text-primary",
  internship:    "bg-secondary/20 text-secondary-foreground",
  bursary:       "bg-accent/20 text-accent-foreground",
  apprenticeship:"bg-muted text-muted-foreground",
  skills_programme: "bg-muted text-muted-foreground",
};

const EOI_BLANK = { message: "", accreditations: "" };
const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

// ─── Component ────────────────────────────────────────────────────────────────

export function FundingOpportunitiesWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch]               = useState("");
  const [typeFilter, setTypeFilter]       = useState<string>("all");
  const [showFilters, setShowFilters]     = useState(false);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [eoiForm, setEoiForm]             = useState<Record<string, typeof EOI_BLANK>>({});

  // ── Fetch all open funding opportunities ─────────────────────────────────
  const { data: opps = [], isLoading, error } = useQuery({
    queryKey: ["funding-opportunities-browse"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding_opportunities")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FundingOpp[];
    },
  });

  // ── Fetch own submitted EOIs (to check if already applied) ───────────────
  const { data: myEois = [] } = useQuery({
    queryKey: ["my-eois", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eoi_submissions")
        .select("funding_opp_id, status")
        .eq("provider_id", user!.id);
      if (error) throw error;
      return (data ?? []) as { funding_opp_id: string; status: string }[];
    },
  });

  const myEoiMap = useMemo(() =>
    Object.fromEntries(myEois.map(e => [e.funding_opp_id, e.status])),
    [myEois]
  );

  // ── Submit EOI ────────────────────────────────────────────────────────────
  const submitEOI = useMutation({
    mutationFn: async ({ oppId }: { oppId: string }) => {
      const f = eoiForm[oppId] ?? EOI_BLANK;
      const accList = f.accreditations
        ? f.accreditations.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      const { error } = await supabase.from("eoi_submissions").insert({
        funding_opp_id: oppId,
        provider_id:    user!.id,
        message:        f.message || null,
        accreditations: accList,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["my-eois"] });
      setExpandedId(null);
      setEoiForm(p => ({ ...p, [vars.oppId]: EOI_BLANK }));
      toast({ title: "Expression of interest submitted!" });
    },
    onError: (e) => toast({ title: "Failed to submit", description: String(e), variant: "destructive" }),
  });

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return opps.filter(o => {
      const matchType = typeFilter === "all" || o.programme_type === typeFilter;
      const matchSearch = !search || [o.title, o.sector ?? "", o.province ?? "", o.description ?? ""]
        .some(s => s.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [opps, typeFilter, search]);

  const uniqueTypes = [...new Set(opps.map(o => o.programme_type))];

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
  );
  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load funding opportunities
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sponsor Funding Briefs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} open opportunities · Express interest to deliver
          </p>
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
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
          placeholder="Search by title, sector, province…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
        />
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Programme Type</p>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip label="All Types"  active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
            {uniqueTypes.map(t => (
              <FilterChip key={t} label={PROG_LABELS[t] ?? t} active={typeFilter === t} onClick={() => setTypeFilter(t)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <Banknote className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No open funding briefs match your filters.</p>
        </div>
      )}

      {/* Opportunity cards */}
      <div className="space-y-3">
        {filtered.map(opp => {
          const isExpanded = expandedId === opp.id;
          const myStatus   = myEoiMap[opp.id];
          const f          = eoiForm[opp.id] ?? EOI_BLANK;
          const setF       = (key: keyof typeof EOI_BLANK, val: string) =>
            setEoiForm(p => ({ ...p, [opp.id]: { ...(p[opp.id] ?? EOI_BLANK), [key]: val } }));

          const isUrgent = opp.application_deadline &&
            new Date(opp.application_deadline) <= new Date(Date.now() + 7 * 86400_000);

          return (
            <div key={opp.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all">
              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <p className="text-sm font-semibold text-foreground">{opp.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PROG_COLORS[opp.programme_type] ?? "bg-muted text-muted-foreground"}`}>
                        {PROG_LABELS[opp.programme_type] ?? opp.programme_type}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Closing Soon</span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                      {opp.sector    && <span className="flex items-center gap-1"><Award className="w-3 h-3" />{opp.sector}</span>}
                      {opp.nqf_level && <span>NQF {opp.nqf_level}</span>}
                      {opp.province  && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.province}</span>}
                      {opp.duration  && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{opp.duration}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{opp.seats_available} seats</span>
                      {opp.budget_per_learner && (
                        <span className="flex items-center gap-1 text-primary font-semibold">
                          <Banknote className="w-3 h-3" />R{opp.budget_per_learner.toLocaleString()}/learner
                        </span>
                      )}
                    </div>

                    {opp.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{opp.description}</p>
                    )}

                    {opp.application_deadline && (
                      <p className={`text-xs mt-1.5 font-medium ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                        Deadline: {new Date(opp.application_deadline).toLocaleDateString("en-ZA")}
                      </p>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="flex-shrink-0">
                    {myStatus ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-muted px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {myStatus === "shortlisted" ? "Shortlisted" :
                         myStatus === "awarded"     ? "Awarded" :
                         myStatus === "rejected"    ? "Not Selected" : "EOI Submitted"}
                      </div>
                    ) : user ? (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Express Interest
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sign in to apply</p>
                    )}
                  </div>
                </div>
              </div>

              {/* EOI Form */}
              {isExpanded && !myStatus && (
                <div className="border-t border-border bg-muted/20 p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground">Submit Expression of Interest</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Cover Message *</p>
                      <textarea
                        value={f.message}
                        onChange={e => setF("message", e.target.value)}
                        placeholder="Briefly describe your organisation, experience delivering this programme type, and why you are best placed to deliver it…"
                        rows={4}
                        className={`${INPUT} resize-none`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Relevant Accreditations (comma-separated)</p>
                      <input
                        value={f.accreditations}
                        onChange={e => setF("accreditations", e.target.value)}
                        placeholder="e.g. merSETA, QCTO Assessor, FASSET Accredited SDP"
                        className={INPUT}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => submitEOI.mutate({ oppId: opp.id })}
                      disabled={!f.message || submitEOI.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      {submitEOI.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Submit EOI
                    </button>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
