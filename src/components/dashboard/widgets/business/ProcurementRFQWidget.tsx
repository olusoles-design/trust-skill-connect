import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShoppingCart, Plus, X, Save, Loader2, Eye, CheckCircle, XCircle,
  Users, Clock, AlertCircle, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RFQ {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_from: number | null;
  budget_to: number | null;
  currency: string;
  deadline: string | null;
  status: string;
  created_at: string;
  response_count?: number;
}

interface RFQResponse {
  id: string;
  provider_id: string;
  quote_amount: number | null;
  currency: string;
  proposal: string | null;
  timeline: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  open:      "bg-green-500/15 text-green-600",
  reviewing: "bg-primary/15 text-primary",
  awarded:   "bg-accent/20 text-accent-foreground",
  closed:    "bg-muted text-muted-foreground",
};

const BLANK_RFQ = {
  title: "", description: "", category: "learning_material",
  budget_from: "", budget_to: "", deadline: "",
};

const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";
const CATEGORIES = [
  "learning_material", "furniture_equipment", "reprographics",
  "training_equipment", "venue_facility", "technology",
];

function formatBudget(from: number | null, to: number | null, currency: string) {
  if (!from && !to) return "Open budget";
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  return fmt(from ?? to ?? 0);
}

export function ProcurementRFQWidget() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_RFQ);
  const { toast } = useToast();
  const qc = useQueryClient();

  // My RFQs
  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ["my-rfqs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfqs" as never)
        .select("id, title, description, category, budget_from, budget_to, currency, deadline, status, created_at")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RFQ[];
    },
  });

  // Responses for selected RFQ
  const { data: responses = [] } = useQuery({
    queryKey: ["rfq-responses", selectedRFQ],
    enabled: !!selectedRFQ,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfq_responses" as never)
        .select("id, provider_id, quote_amount, currency, proposal, timeline, status, created_at")
        .eq("rfq_id", selectedRFQ!)
        .order("quote_amount", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RFQResponse[];
    },
  });

  const createRFQ = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as any)("rfqs").insert({
        buyer_id: user!.id,
        title: form.title,
        description: form.description || null,
        category: form.category,
        budget_from: form.budget_from ? parseFloat(form.budget_from) : null,
        budget_to: form.budget_to ? parseFloat(form.budget_to) : null,
        currency: "ZAR",
        deadline: form.deadline || null,
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-rfqs"] });
      setShowForm(false);
      setForm(BLANK_RFQ);
      toast({ title: "RFQ published! Providers will be notified." });
    },
    onError: (e) => toast({ title: "Failed to create RFQ", description: String(e), variant: "destructive" }),
  });

  const updateResponseStatus = useMutation({
    mutationFn: async ({ responseId, status }: { responseId: string; status: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as any)("rfq_responses")
        .update({ status })
        .eq("id", responseId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ["rfq-responses"] });
      toast({ title: status === "accepted" ? "Quote accepted! 🎉" : "Quote rejected" });
    },
  });

  const closeRFQ = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as any)("rfqs").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-rfqs"] });
      toast({ title: "RFQ closed" });
    },
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const selected = rfqs.find(r => r.id === selectedRFQ);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedRFQ && (
            <button onClick={() => setSelectedRFQ(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              {selected ? selected.title : "Procurement & RFQs"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selected ? `${responses.length} response${responses.length !== 1 ? "s" : ""}` : `${rfqs.length} active request${rfqs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {!selectedRFQ && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancel" : "Post RFQ"}
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && !selectedRFQ && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">New Request for Quote</p>
          <input {...field("title")} placeholder="Title / What do you need? *" className={INPUT} />
          <div className="grid grid-cols-2 gap-3">
            <select {...field("category")} className={INPUT}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
            <input {...field("deadline")} type="date" className={INPUT} />
            <input {...field("budget_from")} type="number" placeholder="Budget from (ZAR)" className={INPUT} />
            <input {...field("budget_to")} type="number" placeholder="Budget to (ZAR)" className={INPUT} />
          </div>
          <textarea {...field("description")} placeholder="Detailed requirements, specifications, quantities…" rows={3} className={`${INPUT} resize-none`} />
          <button
            onClick={() => createRFQ.mutate()}
            disabled={!form.title || createRFQ.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {createRFQ.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Publish RFQ
          </button>
        </div>
      )}

      {/* RFQ list */}
      {!selectedRFQ && (
        <>
          {isLoading && (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
          )}
          {!isLoading && rfqs.length === 0 && !showForm && (
            <div className="text-center py-10 space-y-2">
              <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No RFQs yet. Post your first request to get quotes from providers.</p>
            </div>
          )}
          <div className="space-y-2">
            {rfqs.map(rfq => (
              <div key={rfq.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group cursor-pointer"
                onClick={() => setSelectedRFQ(rfq.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{rfq.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[rfq.status] ?? "bg-muted text-muted-foreground"}`}>
                      {rfq.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>{formatBudget(rfq.budget_from, rfq.budget_to, rfq.currency)}</span>
                    {rfq.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due {new Date(rfq.deadline).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View quotes
                  </button>
                  {rfq.status === "open" && (
                    <button
                      onClick={e => { e.stopPropagation(); closeRFQ.mutate(rfq.id); }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >Close</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Responses view */}
      {selectedRFQ && (
        <div className="space-y-3">
          {responses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm space-y-1">
              <Users className="w-7 h-7 mx-auto mb-2" />
              <p>No quotes received yet.</p>
              <p className="text-xs">Providers matching your requirements will be notified.</p>
            </div>
          ) : (
            responses.map(resp => (
              <div key={resp.id} className={`p-4 rounded-xl border transition-all ${
                resp.status === "accepted" ? "border-green-500/30 bg-green-500/5" :
                resp.status === "rejected" ? "border-destructive/20 bg-destructive/5 opacity-60" :
                "border-border bg-card"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {resp.quote_amount && (
                      <p className="text-base font-bold text-foreground">
                        {resp.currency} {resp.quote_amount.toLocaleString()}
                      </p>
                    )}
                    {resp.timeline && <p className="text-xs text-muted-foreground">Timeline: {resp.timeline}</p>}
                    {resp.proposal && <p className="text-sm text-foreground mt-1 line-clamp-2">{resp.proposal}</p>}
                  </div>
                  {resp.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateResponseStatus.mutate({ responseId: resp.id, status: "rejected" })}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateResponseStatus.mutate({ responseId: resp.id, status: "accepted" })}
                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-600 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {resp.status !== "pending" && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      resp.status === "accepted" ? "bg-green-500/15 text-green-600" : "bg-destructive/10 text-destructive"
                    }`}>{resp.status}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
