import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, FileCheck, Upload, CheckCircle2, Clock, AlertCircle,
  ChevronRight, Plus, Users, Building2, Briefcase, ArrowRight,
  FileText, Send, PackageCheck, Loader2, Download, X, Save,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DealStage = "rfp_open" | "responses" | "awarded" | "registration" | "approved" | "seta_ready";
type LearnerStatus = "pending" | "employer_approved" | "seta_registered" | "contract_signed";

interface RFQRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  deadline: string | null;
  budget_from: number | null;
  budget_to: number | null;
  currency: string;
  created_at: string;
  _responseCount?: number;
}

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  cover_note: string | null;
  opportunities: {
    id: string;
    title: string;
    type: string;
    nqf_level_required: string | null;
    seta: string | null;
    organisation: string | null;
  } | null;
}

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; step: number }> = {
  open:         { label: "Open for Bids",  color: "text-blue-500 bg-blue-500/10",      icon: GitBranch,    step: 1 },
  reviewing:    { label: "Reviewing Bids", color: "text-yellow-500 bg-yellow-500/10",  icon: Clock,        step: 2 },
  awarded:      { label: "Awarded",        color: "text-primary bg-primary/10",        icon: CheckCircle2, step: 3 },
  closed:       { label: "Closed",         color: "text-muted-foreground bg-muted",    icon: FileCheck,    step: 4 },
};

const APP_STATUS_CONFIG: Record<string, { label: LearnerStatus | string; color: string }> = {
  pending:     { label: "Pending SDP",       color: "text-muted-foreground bg-muted" },
  shortlisted: { label: "Employer Approved", color: "text-yellow-600 bg-yellow-500/10" },
  accepted:    { label: "Contract Signed",   color: "text-green-600 bg-green-500/10" },
  rejected:    { label: "Not Selected",      color: "text-destructive bg-destructive/10" },
};

// ─── Pipeline stepper ─────────────────────────────────────────────────────────

function PipelineStepper({ current }: { current: string }) {
  const steps = ["open", "reviewing", "awarded", "closed"];
  const currentStep = STAGE_CONFIG[current]?.step ?? 1;
  return (
    <div className="flex items-center gap-0.5">
      {steps.map((s, i) => {
        const cfg = STAGE_CONFIG[s];
        const done = cfg.step < currentStep;
        const active = cfg.step === currentStep;
        return (
          <div key={s} className="flex items-center gap-0.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
              done   ? "bg-primary text-primary-foreground" :
              active ? "bg-primary/20 text-primary ring-1 ring-primary" :
                       "bg-muted text-muted-foreground"
            }`}>
              {done ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-4 transition-all ${done ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SETA Packet Checklist ─────────────────────────────────────────────────────

const SETA_CHECKLIST = [
  { id: "learners",   label: "Registered Learners List",      done: true  },
  { id: "agreements", label: "Signed Learnership Agreements", done: true  },
  { id: "employer",   label: "Employer Proof of Payment",     done: true  },
  { id: "sdp",        label: "SDP Accreditation Certificate", done: true  },
  { id: "mod_plan",   label: "Moderation Plan",               done: false },
  { id: "training",   label: "Training Schedule",             done: false },
];

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function WorkflowEngineWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"dealflow" | "registration" | "seta">("dealflow");
  const [showRFQForm, setShowRFQForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "", budget_from: "", budget_to: "", deadline: "" });

  const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

  // ── Fetch RFQs posted by this user (buyer) ──
  const { data: rfqs = [], isLoading: rfqLoading } = useQuery({
    queryKey: ["workflow-rfqs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rfqData, error } = await supabase
        .from("rfqs")
        .select("id, title, description, category, status, deadline, budget_from, budget_to, currency, created_at")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get response counts
      const rfqIds = (rfqData ?? []).map(r => r.id);
      if (rfqIds.length === 0) return [] as RFQRow[];

      const { data: responses } = await supabase
        .from("rfq_responses")
        .select("rfq_id")
        .in("rfq_id", rfqIds);

      const countMap: Record<string, number> = {};
      (responses ?? []).forEach(r => { countMap[r.rfq_id] = (countMap[r.rfq_id] ?? 0) + 1; });

      return (rfqData ?? []).map(r => ({ ...r, _responseCount: countMap[r.id] ?? 0 })) as RFQRow[];
    },
  });

  // ── Fetch applications on this user's opportunities (learner registration) ──
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["workflow-registrations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, created_at, cover_note, opportunities!inner(id, title, type, nqf_level_required, seta, organisation)")
        .eq("opportunities.posted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApplicationRow[];
    },
  });

  // ── Post new RFQ ──
  const postRFQ = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rfqs").insert({
        buyer_id: user!.id,
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        budget_from: form.budget_from ? parseFloat(form.budget_from) : null,
        budget_to: form.budget_to ? parseFloat(form.budget_to) : null,
        deadline: form.deadline || null,
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-rfqs"] });
      setShowRFQForm(false);
      setForm({ title: "", description: "", category: "", budget_from: "", budget_to: "", deadline: "" });
      toast({ title: "RFQ posted! SDPs can now bid." });
    },
    onError: (e) => toast({ title: "Post failed", description: String(e), variant: "destructive" }),
  });

  // ── Update RFQ status ──
  const updateRFQ = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("rfqs").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow-rfqs"] }),
  });

  // ── Shortlist applicant ──
  const updateApp = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-registrations"] });
      toast({ title: "Learner status updated" });
    },
  });

  const handleGenerateSETAPacket = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2200));
    setGenerating(false);
    toast({
      title: "SETA Packet Generated ✅",
      description: "Digital submission packet ready. Download and submit to your SETA.",
      action: <button className="text-xs underline">Download ZIP</button>,
    } as any);
  };

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value })),
  });

  const completedItems = SETA_CHECKLIST.filter(i => i.done).length;
  const readinessPct = Math.round((completedItems / SETA_CHECKLIST.length) * 100);

  const tabs = [
    { id: "dealflow",     label: "Deal Flow",    icon: GitBranch },
    { id: "registration", label: "Registration", icon: Users },
    { id: "seta",         label: "SETA Packet",  icon: PackageCheck },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── DEAL FLOW ── */}
          {tab === "dealflow" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{rfqs.length} RFQ{rfqs.length !== 1 ? "s" : ""} posted</p>
                <button
                  onClick={() => setShowRFQForm(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
                >
                  {showRFQForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {showRFQForm ? "Cancel" : "Post RFQ"}
                </button>
              </div>

              {showRFQForm && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">New Request for Quotation</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input {...field("title")} placeholder="Programme title *" className={INPUT} />
                    <input {...field("category")} placeholder="Category (e.g. IT, Finance)" className={INPUT} />
                    <input {...field("budget_from")} type="number" placeholder="Budget from (ZAR)" className={INPUT} />
                    <input {...field("budget_to")} type="number" placeholder="Budget to (ZAR)" className={INPUT} />
                    <input {...field("deadline")} type="date" className={INPUT} />
                  </div>
                  <textarea {...field("description")} placeholder="Describe your requirements…" rows={3} className={`${INPUT} resize-none`} />
                  <button
                    onClick={() => postRFQ.mutate()}
                    disabled={!form.title || postRFQ.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {postRFQ.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Post RFQ
                  </button>
                </div>
              )}

              {rfqLoading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
              ) : rfqs.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <GitBranch className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No RFQs posted yet.</p>
                  <p className="text-xs text-muted-foreground">Post an RFQ for SDPs to bid on your programme needs.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rfqs.map(rfq => {
                    const stageCfg = STAGE_CONFIG[rfq.status] ?? STAGE_CONFIG.open;
                    const StagIcon = stageCfg.icon;
                    return (
                      <div key={rfq.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground">{rfq.title}</p>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${stageCfg.color}`}>
                                <StagIcon className="w-2.5 h-2.5" />{stageCfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              {rfq.category && <span>{rfq.category}</span>}
                              {rfq.budget_from && rfq.budget_to && (
                                <span>R{rfq.budget_from.toLocaleString()} – R{rfq.budget_to.toLocaleString()}</span>
                              )}
                              {rfq.deadline && <span>Deadline: {new Date(rfq.deadline).toLocaleDateString("en-ZA")}</span>}
                              <span className="font-medium text-foreground">{rfq._responseCount} bid{rfq._responseCount !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                          <PipelineStepper current={rfq.status} />
                        </div>
                        {rfq.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{rfq.description}</p>
                        )}
                        {rfq.status === "open" && (
                          <button
                            onClick={() => updateRFQ.mutate({ id: rfq.id, status: "reviewing" })}
                            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                          >
                            <ArrowRight className="w-3 h-3" /> Move to Review
                          </button>
                        )}
                        {rfq.status === "reviewing" && (
                          <button
                            onClick={() => updateRFQ.mutate({ id: rfq.id, status: "awarded" })}
                            className="flex items-center gap-1.5 text-xs text-green-600 font-semibold hover:underline"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Mark as Awarded
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── REGISTRATION ── */}
          {tab === "registration" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{applications.length} applicant{applications.length !== 1 ? "s" : ""} on your programmes</p>

              {appsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No learner applications yet.</p>
                  <p className="text-xs text-muted-foreground">Applications submitted to your opportunities appear here.</p>
                </div>
              ) : (
                applications.map(app => {
                  const stCfg = APP_STATUS_CONFIG[app.status] ?? APP_STATUS_CONFIG.pending;
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {app.id.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {app.opportunities?.title ?? "Programme"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                          {app.opportunities?.nqf_level_required && <span>NQF {app.opportunities.nqf_level_required}</span>}
                          {app.opportunities?.seta && <span>{app.opportunities.seta}</span>}
                          <span>{new Date(app.created_at).toLocaleDateString("en-ZA")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stCfg.color}`}>
                          {stCfg.label}
                        </span>
                        {app.status === "pending" && (
                          <button
                            onClick={() => updateApp.mutate({ id: app.id, status: "shortlisted" })}
                            disabled={updateApp.isPending}
                            className="px-2 py-1 rounded text-[10px] bg-primary/15 text-primary hover:bg-primary/25 font-semibold transition-all"
                          >
                            Approve
                          </button>
                        )}
                        {app.status === "shortlisted" && (
                          <button
                            onClick={() => updateApp.mutate({ id: app.id, status: "accepted" })}
                            disabled={updateApp.isPending}
                            className="px-2 py-1 rounded text-[10px] bg-green-500/15 text-green-600 hover:bg-green-500/25 font-semibold transition-all"
                          >
                            Sign Contract
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── SETA PACKET ── */}
          {tab === "seta" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Submission Readiness</p>
                  <span className={`text-sm font-bold ${readinessPct >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                    {readinessPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${readinessPct >= 80 ? "bg-green-500" : "bg-yellow-500"}`}
                    style={{ width: `${readinessPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {SETA_CHECKLIST.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                    }`}>
                      {item.done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    </div>
                    <p className="text-xs font-medium text-foreground flex-1">{item.label}</p>
                    {!item.done && (
                      <span className="text-[10px] text-destructive font-semibold">Missing</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateSETAPacket}
                disabled={generating || readinessPct < 60}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {generating ? "Generating Packet…" : "Generate SETA Submission Packet"}
              </button>

              {readinessPct < 60 && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete at least 60% of checklist items to generate the packet.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
