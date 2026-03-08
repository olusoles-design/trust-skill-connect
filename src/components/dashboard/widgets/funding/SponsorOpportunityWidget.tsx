import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, X, Save, Loader2, AlertCircle, Users, Eye,
  ChevronDown, ChevronUp, Banknote, CalendarDays, MapPin, Award,
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
  requirements: string[];
  status: string;
  created_at: string;
}

interface EOIRow {
  id: string;
  provider_id: string;
  message: string | null;
  status: string;
  created_at: string;
  accreditations: string[];
}

const PROG_TYPES = ["learnership", "internship", "bursary", "apprenticeship", "skills_programme"];
const PROG_LABELS: Record<string, string> = {
  learnership: "Learnership", internship: "Internship", bursary: "Bursary",
  apprenticeship: "Apprenticeship", skills_programme: "Skills Programme",
};

const STATUS_COLOR: Record<string, string> = {
  open:    "bg-green-500/15 text-green-600",
  closed:  "bg-muted text-muted-foreground",
  awarded: "bg-primary/10 text-primary",
};

const EOI_STATUS_COLOR: Record<string, string> = {
  pending:     "bg-amber-500/15 text-amber-600",
  shortlisted: "bg-primary/10 text-primary",
  awarded:     "bg-green-500/15 text-green-600",
  rejected:    "bg-destructive/10 text-destructive",
};

const BLANK = {
  title: "", programme_type: "learnership", description: "",
  sector: "", nqf_level: "", seats_available: "10",
  budget_per_learner: "", total_budget: "", province: "",
  duration: "", start_date: "", application_deadline: "",
};

const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

// ─── Component ────────────────────────────────────────────────────────────────

export function SponsorOpportunityWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [tab, setTab]         = useState<"open" | "closed" | "awarded">("open");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]        = useState(BLANK);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  // ── Fetch own funding opportunities ──────────────────────────────────────
  const { data: opps = [], isLoading, error } = useQuery({
    queryKey: ["sponsor-funding-opps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding_opportunities")
        .select("*")
        .eq("sponsor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FundingOpp[];
    },
  });

  // ── Fetch EOIs for expanded opportunity ──────────────────────────────────
  const { data: eois = [] } = useQuery({
    queryKey: ["sponsor-eois", expandedId],
    enabled: !!expandedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eoi_submissions")
        .select("id, provider_id, message, status, created_at, accreditations")
        .eq("funding_opp_id", expandedId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EOIRow[];
    },
  });

  // ── Create opportunity ────────────────────────────────────────────────────
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("funding_opportunities").insert({
        sponsor_id:          user!.id,
        title:               form.title,
        programme_type:      form.programme_type,
        description:         form.description || null,
        sector:              form.sector || null,
        nqf_level:           form.nqf_level || null,
        seats_available:     parseInt(form.seats_available) || 1,
        budget_per_learner:  form.budget_per_learner ? parseFloat(form.budget_per_learner) : null,
        total_budget:        form.total_budget ? parseFloat(form.total_budget) : null,
        province:            form.province || null,
        duration:            form.duration || null,
        start_date:          form.start_date || null,
        application_deadline: form.application_deadline || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsor-funding-opps"] });
      setShowForm(false);
      setForm(BLANK);
      toast({ title: "Funding opportunity posted!" });
    },
    onError: (e) => toast({ title: "Failed to post", description: String(e), variant: "destructive" }),
  });

  // ── Close/reopen ─────────────────────────────────────────────────────────
  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("funding_opportunities")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sponsor-funding-opps"] }),
  });

  // ── Update EOI status ─────────────────────────────────────────────────────
  const updateEOI = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("eoi_submissions")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsor-eois"] });
      toast({ title: "EOI status updated" });
    },
  });

  const filtered = opps.filter(o => o.status === tab);

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalSeats     = opps.reduce((s, o) => s + o.seats_available, 0);
  const totalBudget    = opps.reduce((s, o) => s + (o.total_budget ?? 0), 0);

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
  );
  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load funding opportunities
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Posted",        value: opps.length },
          { label: "Seats Available", value: totalSeats },
          { label: "Total Budget",  value: totalBudget > 0 ? `R${(totalBudget/1000).toFixed(0)}k` : "—" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-muted/40 border border-border p-3 text-center">
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Post CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {(["open","closed","awarded"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>{t}</button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Post Funding Brief"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">New Funding Opportunity</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input {...field("title")} placeholder="Programme Title *" className={`${INPUT} sm:col-span-2`} />

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Programme Type</p>
              <select {...field("programme_type")} className={INPUT}>
                {PROG_TYPES.map(t => <option key={t} value={t}>{PROG_LABELS[t]}</option>)}
              </select>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Sector</p>
              <input {...field("sector")} placeholder="e.g. ICT, Construction, Finance" className={INPUT} />
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">NQF Level</p>
              <select {...field("nqf_level")} className={INPUT}>
                <option value="">— Any —</option>
                {["1","2","3","4","5","6","7","8","9","10"].map(l => <option key={l} value={l}>NQF {l}</option>)}
              </select>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Province</p>
              <select {...field("province")} className={INPUT}>
                <option value="">— All Provinces —</option>
                {["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Limpopo","Mpumalanga","North West","Free State","Northern Cape"].map(p =>
                  <option key={p} value={p}>{p}</option>
                )}
              </select>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Seats Available *</p>
              <input {...field("seats_available")} type="number" min="1" placeholder="10" className={INPUT} />
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Duration</p>
              <input {...field("duration")} placeholder="e.g. 12 months" className={INPUT} />
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Budget per Learner (ZAR)</p>
              <input {...field("budget_per_learner")} type="number" placeholder="e.g. 30000" className={INPUT} />
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Total Budget (ZAR)</p>
              <input {...field("total_budget")} type="number" placeholder="e.g. 300000" className={INPUT} />
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Programme Start Date</p>
              <input {...field("start_date")} type="date" className={INPUT} />
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Application Deadline</p>
              <input {...field("application_deadline")} type="date" className={INPUT} />
            </div>

            <div className="sm:col-span-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Description & Requirements</p>
              <textarea {...field("description")} placeholder="Describe the programme, expected outcomes, required provider accreditations…" rows={4} className={`${INPUT} resize-none`} />
            </div>
          </div>

          <button
            onClick={() => create.mutate()}
            disabled={!form.title || create.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Publish Funding Brief
          </button>
        </div>
      )}

      {/* Listings */}
      <div className="space-y-3">
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-10 rounded-xl border border-dashed border-border bg-muted/20">
            <Banknote className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No {tab} funding briefs yet.</p>
          </div>
        )}

        {filtered.map(opp => {
          const isExpanded = expandedId === opp.id;
          return (
            <div key={opp.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header row */}
              <div className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-foreground">{opp.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[opp.status] ?? "bg-muted text-muted-foreground"}`}>{opp.status}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground">
                      {PROG_LABELS[opp.programme_type] ?? opp.programme_type}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {opp.sector      && <span className="flex items-center gap-1"><Award className="w-3 h-3" />{opp.sector}</span>}
                    {opp.nqf_level   && <span>NQF {opp.nqf_level}</span>}
                    {opp.province    && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.province}</span>}
                    {opp.duration    && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{opp.duration}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{opp.seats_available} seats</span>
                    {opp.budget_per_learner && (
                      <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />R{opp.budget_per_learner.toLocaleString()}/learner</span>
                    )}
                    {opp.application_deadline && (
                      <span className="text-amber-600">Deadline: {new Date(opp.application_deadline).toLocaleDateString("en-ZA")}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Close/Reopen */}
                  <button
                    onClick={() => toggleStatus.mutate({ id: opp.id, status: opp.status === "open" ? "closed" : "open" })}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    {opp.status === "open" ? "Close" : "Reopen"}
                  </button>
                  {/* Expand EOIs */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <Eye className="w-3 h-3" /> EOIs
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* EOI panel */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/20 p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Expressions of Interest ({eois.length})</p>
                  {eois.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No providers have expressed interest yet.</p>
                  ) : eois.map(eoi => (
                    <div key={eoi.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-foreground">Provider EOI</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${EOI_STATUS_COLOR[eoi.status] ?? "bg-muted text-muted-foreground"}`}>{eoi.status}</span>
                        </div>
                        {eoi.message && <p className="text-xs text-muted-foreground line-clamp-2">{eoi.message}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(eoi.created_at).toLocaleDateString("en-ZA")}</p>
                      </div>
                      {eoi.status === "pending" && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => updateEOI.mutate({ id: eoi.id, status: "shortlisted" })}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                          >Shortlist</button>
                          <button
                            onClick={() => updateEOI.mutate({ id: eoi.id, status: "rejected" })}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                          >Reject</button>
                        </div>
                      )}
                      {eoi.status === "shortlisted" && (
                        <button
                          onClick={() => updateEOI.mutate({ id: eoi.id, status: "awarded" })}
                          className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-green-500/15 text-green-700 hover:bg-green-500/25 transition-all"
                        >Award Contract</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
