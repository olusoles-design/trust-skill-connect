import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRegulatoryBodies } from "@/hooks/useRegulatoryBodies";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, X, Save, Loader2, AlertCircle, Eye, Users,
  Trash2, GraduationCap, Banknote, CalendarDays, MapPin,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface ProgrammeRow {
  id: string;
  title: string;
  type: string;
  organisation: string | null;
  location: string | null;
  stipend: string | null;
  duration: string | null;
  closing_date: string | null;
  status: string;
  applications: number;
  views: number;
  created_at: string;
  description: string | null;
  nqf_level_required: string | null;
  regulatory_body_id: string | null;
  bbee_points: boolean | null;
}

const PROG_TYPES = ["learnership", "internship", "bursary", "apprenticeship", "skills_programme"] as const;
const PROG_LABELS: Record<string, string> = {
  learnership: "Learnership",
  internship: "Internship",
  bursary: "Bursary",
  apprenticeship: "Apprenticeship",
  skills_programme: "Skills Programme",
};

const TYPE_COLOR: Record<string, string> = {
  learnership:    "bg-primary/10 text-primary",
  internship:     "bg-accent/20 text-accent-foreground",
  bursary:        "bg-secondary/15 text-secondary-foreground",
  apprenticeship: "bg-muted text-muted-foreground",
  skills_programme: "bg-primary/5 text-primary",
};

const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-500/15 text-green-600",
  draft:  "bg-muted text-muted-foreground",
  closed: "bg-destructive/10 text-destructive",
};

const NQF_LEVELS = ["1","2","3","4","5","6","7","8","9","10"];

const BLANK = {
  title: "", type: "learnership", description: "",
  organisation: "", location: "", stipend: "",
  duration: "", closing_date: "", status: "active",
  regulatory_body_id: "", nqf_level_required: "",
  bbee_points: false,
};

const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

/* ─── Component ─────────────────────────────────────────────────────────── */
export function SponsorProgrammeWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: bodies } = useRegulatoryBodies();

  const [tab, setTab]           = useState<"all" | "active" | "draft" | "closed">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(BLANK);

  /* ── Fetch sponsor's own listings ─────────────────────────────────────── */
  const { data, isLoading, error } = useQuery({
    queryKey: ["sponsor-programmes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, type, organisation, location, stipend, duration, closing_date, status, applications, views, created_at, description, nqf_level_required, regulatory_body_id, bbee_points")
        .eq("posted_by", user!.id)
        .in("type", PROG_TYPES as unknown as string[])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProgrammeRow[];
    },
  });

  /* ── Create ───────────────────────────────────────────────────────────── */
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("opportunities").insert({
        title: form.title,
        type: form.type,
        description: form.description || null,
        organisation: form.organisation || null,
        location: form.location || null,
        stipend: form.stipend || null,
        duration: form.duration || null,
        closing_date: form.closing_date || null,
        status: form.status,
        nqf_level_required: form.nqf_level_required || null,
        regulatory_body_id: form.regulatory_body_id || null,
        bbee_points: form.bbee_points,
        posted_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsor-programmes"] });
      setShowForm(false);
      setForm(BLANK);
      toast({ title: "Programme listed!", description: "Learners and SDPs can now discover it." });
    },
    onError: (e) => toast({ title: "Failed to post", description: String(e), variant: "destructive" }),
  });

  /* ── Delete ───────────────────────────────────────────────────────────── */
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsor-programmes"] });
      toast({ title: "Listing removed" });
    },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  });

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const programmes = data ?? [];
  const filtered   = tab === "all" ? programmes : programmes.filter(p => p.status === tab);
  const totalApps  = programmes.reduce((s, p) => s + p.applications, 0);
  const totalViews = programmes.reduce((s, p) => s + p.views, 0);

  /* ── Render ───────────────────────────────────────────────────────────── */
  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load programmes
    </div>
  );

  return (
    <div className="space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Listed",       value: programmes.length },
          { label: "Active",       value: programmes.filter(p => p.status === "active").length },
          { label: "Applicants",   value: totalApps },
          { label: "Views",        value: totalViews },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-muted/40 border border-border p-3 text-center">
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-foreground">
        <GraduationCap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p>Programmes listed here appear in the <strong>public Browse Opportunities</strong> feed for learners to apply, and in the <strong>Sponsor Funding Briefs</strong> feed for SDPs to submit delivery EOIs.</p>
      </div>

      {/* Tabs + CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {(["all","active","draft","closed"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >{t}</button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "List Programme"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" /> New Sponsored Programme
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input {...field("title")} placeholder="Programme title *" className={INPUT} />
            <select {...field("type")} className={INPUT}>
              {PROG_TYPES.map(t => (
                <option key={t} value={t}>{PROG_LABELS[t]}</option>
              ))}
            </select>
            <input {...field("organisation")} placeholder="Sponsoring organisation" className={INPUT} />
            <input {...field("location")} placeholder="Location / Province" className={INPUT} />
            <input {...field("stipend")} placeholder="Stipend / Allowance (e.g. R3 500/month)" className={INPUT} />
            <input {...field("duration")} placeholder="Duration (e.g. 12 months)" className={INPUT} />
            <input {...field("closing_date")} type="date" className={INPUT} />
            <select {...field("status")} className={INPUT}>
              <option value="active">Active — visible to learners & SDPs</option>
              <option value="draft">Draft — hidden until ready</option>
            </select>
            <select {...field("nqf_level_required")} className={INPUT}>
              <option value="">NQF Level required (optional)</option>
              {NQF_LEVELS.map(l => <option key={l} value={l}>NQF {l}</option>)}
            </select>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background">
              <input
                type="checkbox"
                id="bbee"
                checked={form.bbee_points}
                onChange={e => setForm(p => ({ ...p, bbee_points: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="bbee" className="text-sm text-foreground cursor-pointer">Earns B-BBEE points</label>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">SETA / Regulatory Body</p>
              <select {...field("regulatory_body_id")} className={INPUT}>
                <option value="">— None / General —</option>
                {(bodies ?? []).map(b => (
                  <option key={b.id} value={b.id}>{b.acronym} — {b.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            {...field("description")}
            placeholder="Programme description — what learners will learn, requirements, outcomes..."
            rows={3}
            className={`${INPUT} resize-none`}
          />
          <button
            onClick={() => create.mutate()}
            disabled={!form.title || create.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Publish Programme
          </button>
        </div>
      )}

      {/* Listings */}
      <div className="space-y-2">
        {programmes.length === 0 && !showForm && (
          <div className="text-center py-12 space-y-2">
            <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm text-muted-foreground">No programmes listed yet.</p>
            <p className="text-xs text-muted-foreground">Post your first learnership, bursary or internship to attract learners and delivery partners.</p>
          </div>
        )}
        {filtered.map(prog => (
          <div key={prog.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group">
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Title + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{prog.title}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[prog.type] ?? "bg-muted text-muted-foreground"}`}>
                  {PROG_LABELS[prog.type] ?? prog.type}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[prog.status] ?? "bg-muted text-muted-foreground"}`}>
                  {prog.status}
                </span>
                {prog.bbee_points && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">
                    B-BBEE
                  </span>
                )}
                {prog.nqf_level_required && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    NQF {prog.nqf_level_required}
                  </span>
                )}
              </div>
              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                {prog.organisation && (
                  <span className="font-medium text-foreground">{prog.organisation}</span>
                )}
                {prog.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{prog.location}</span>
                )}
                {prog.stipend && (
                  <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{prog.stipend}</span>
                )}
                {prog.duration && (
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{prog.duration}</span>
                )}
              </div>
              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{prog.applications} applicants</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{prog.views} views</span>
                {prog.closing_date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Closes: {new Date(prog.closing_date).toLocaleDateString("en-ZA")}
                  </span>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => remove.mutate(prog.id)}
                disabled={remove.isPending}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                title="Remove listing"
              >
                {remove.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
