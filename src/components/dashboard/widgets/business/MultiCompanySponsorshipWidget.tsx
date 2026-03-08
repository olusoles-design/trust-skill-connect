import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Plus, Users, Percent, X, Save, Loader2,
  AlertCircle, Crown, Home, Wallet, ChevronRight, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

type ParticipantRole = "lead" | "host" | "funder";

interface Participant {
  id: string;
  opportunity_id: string;
  user_id: string;
  company_name: string;
  role: ParticipantRole;
  cost_share_percentage: number;
  bbbee_points_allocated: number;
  agreement_document_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface OppOption { id: string; title: string; type: string; }

// ── Config ────────────────────────────────────────────────────────────────────

const ROLE_META: Record<ParticipantRole, { label: string; icon: typeof Crown; color: string; desc: string }> = {
  lead:   { label: "Lead Employer",      icon: Crown,    color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20", desc: "Claims Section 12H. Signs SETA agreement." },
  host:   { label: "Host Employer",      icon: Home,     color: "text-primary bg-primary/10 border-primary/20",           desc: "Hosts learner on-site. Earns B-BBEE SD points." },
  funder: { label: "Funder / Sponsor",   icon: Wallet,   color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", desc: "Funds training cost. B-BBEE ESD/procurement impact." },
};

const BLANK_FORM = {
  company_name: "",
  role: "host" as ParticipantRole,
  cost_share_percentage: 0,
  bbbee_points_allocated: 0,
  notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MultiCompanySponsorshipWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedOpp, setSelectedOpp] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

  // ── Fetch user's opportunities ──
  const { data: rawOpps } = useQuery({
    queryKey: ["sponsor-opps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, type")
        .eq("posted_by", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OppOption[];
    },
  });
  const opps: OppOption[] = (rawOpps as OppOption[] | undefined) ?? [];

  // Auto-select first
  if (!selectedOpp && opps.length > 0) setSelectedOpp(opps[0].id);

  // ── Fetch participants for selected opportunity ──
  const { data: rawParticipants, isLoading } = useQuery({
    queryKey: ["company-participants", selectedOpp],
    enabled: !!selectedOpp,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_participants" as never)
        .select("*")
        .eq("opportunity_id", selectedOpp)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Participant[];
    },
  });
  const participants: Participant[] = (rawParticipants as Participant[] | undefined) ?? [];

  // ── Add participant ──
  const addParticipant = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("company_participants") as any)
        .insert({
          opportunity_id: selectedOpp,
          user_id: user!.id,
          company_name: form.company_name,
          role: form.role,
          cost_share_percentage: form.cost_share_percentage,
          bbbee_points_allocated: form.bbbee_points_allocated,
          notes: form.notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-participants", selectedOpp] });
      setShowForm(false);
      setForm(BLANK_FORM);
      toast({ title: "Company participant added" });
    },
    onError: (e) => toast({ title: "Failed to add participant", description: String(e), variant: "destructive" }),
  });

  // ── Remove participant ──
  const removeParticipant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_participants" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-participants", selectedOpp] });
      toast({ title: "Participant removed" });
    },
  });

  // ── Derived stats ──
  const totalCostShare = participants.reduce((s, p) => s + (p.cost_share_percentage ?? 0), 0);
  const totalBBBEE     = participants.reduce((s, p) => s + (p.bbbee_points_allocated ?? 0), 0);
  const leadExists     = participants.some(p => p.role === "lead");

  return (
    <div className="space-y-4">

      {/* Opportunity selector */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Programme / Opportunity</p>
        {opps.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
            <AlertCircle className="w-4 h-4" /> Post an active opportunity first to manage its participants.
          </div>
        ) : (
          <select
            value={selectedOpp}
            onChange={e => setSelectedOpp(e.target.value)}
            className={INPUT}
          >
            {opps.map(o => (
              <option key={o.id} value={o.id}>{o.title} ({o.type})</option>
            ))}
          </select>
        )}
      </div>

      {selectedOpp && (
        <>
          {/* Cost-share summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
              <p className="text-xl font-bold text-foreground">{participants.length}</p>
              <p className="text-xs text-muted-foreground">Companies</p>
            </div>
            <div className={`rounded-xl border p-3 text-center ${totalCostShare > 100 ? "bg-destructive/10 border-destructive/30" : "bg-muted/40 border-border"}`}>
              <p className={`text-xl font-bold ${totalCostShare > 100 ? "text-destructive" : "text-foreground"}`}>{totalCostShare.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Cost Share</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{totalBBBEE.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">B-BBEE pts</p>
            </div>
          </div>

          {/* Warnings */}
          {!leadExists && participants.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-700">
              <Crown className="w-3.5 h-3.5 flex-shrink-0" />
              No Lead Employer designated — only the lead can claim Section 12H tax allowance.
            </div>
          )}
          {totalCostShare > 100 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Total cost share exceeds 100% — review allocations.
            </div>
          )}

          {/* Participants list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Participating Companies</p>
              <button
                onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showForm ? "Cancel" : "Add"}
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Add Company</p>
                    <input
                      value={form.company_name}
                      onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                      placeholder="Company name *"
                      className={INPUT}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {(["lead","host","funder"] as ParticipantRole[]).map(r => {
                        const m = ROLE_META[r];
                        const Icon = m.icon;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setForm(p => ({ ...p, role: r }))}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              form.role === r ? m.color : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {m.label.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground -mt-1">{ROLE_META[form.role].desc}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Cost Share %</label>
                        <input
                          type="number" min={0} max={100} step={0.5}
                          value={form.cost_share_percentage}
                          onChange={e => setForm(p => ({ ...p, cost_share_percentage: parseFloat(e.target.value) || 0 }))}
                          className={INPUT}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">B-BBEE Points</label>
                        <input
                          type="number" min={0} step={0.5}
                          value={form.bbbee_points_allocated}
                          onChange={e => setForm(p => ({ ...p, bbbee_points_allocated: parseFloat(e.target.value) || 0 }))}
                          className={INPUT}
                        />
                      </div>
                    </div>
                    <input
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Notes (optional)"
                      className={INPUT}
                    />
                    <button
                      onClick={() => addParticipant.mutate()}
                      disabled={!form.company_name || addParticipant.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      {addParticipant.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Company
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              [1,2].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)
            ) : participants.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <Building2 className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No companies yet.</p>
                <p className="text-xs text-muted-foreground">Add a Lead Employer, then Hosts and Funders.</p>
              </div>
            ) : (
              participants.map(p => {
                const meta = ROLE_META[p.role];
                const Icon = meta.icon;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card group hover:bg-muted/20 transition-all">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.company_name}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className={`font-bold px-1.5 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                        <span className="flex items-center gap-0.5"><Percent className="w-2.5 h-2.5" />{p.cost_share_percentage}% cost</span>
                        <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" />{p.bbbee_points_allocated} B-BBEE pts</span>
                      </div>
                      {p.notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.notes}</p>}
                    </div>
                    <button
                      onClick={() => removeParticipant.mutate(p.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* B-BBEE breakdown */}
          {participants.length > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> B-BBEE Allocation Summary
              </p>
              {participants.map(p => {
                const meta = ROLE_META[p.role];
                const pct = totalBBBEE > 0 ? (p.bbbee_points_allocated / totalBBBEE) * 100 : 0;
                return (
                  <div key={p.id} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground truncate">{p.company_name}</span>
                      <span className="font-semibold text-foreground">{p.bbbee_points_allocated} pts</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground">
                <ChevronRight className="w-3 h-3" /> Only the Lead Employer may claim Section 12H tax incentive.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
