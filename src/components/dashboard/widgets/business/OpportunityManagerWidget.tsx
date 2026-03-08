import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Eye, Trash2, Users, Loader2, AlertCircle, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRegulatoryBodies } from "@/hooks/useRegulatoryBodies";

interface OppRow {
  id: string;
  title: string;
  type: string;
  applications: number;
  views: number;
  status: string;
  created_at: string;
  closing_date: string | null;
  organisation: string | null;
}

const statusColor: Record<string, string> = {
  active: "bg-green-500/15 text-green-600",
  draft:  "bg-muted text-muted-foreground",
  closed: "bg-destructive/10 text-destructive",
};
const typeColor: Record<string, string> = {
  job:           "bg-primary/10 text-primary",
  learnership:   "bg-accent/20 text-accent-foreground",
  programme:     "bg-secondary/15 text-secondary-foreground",
  gig:           "bg-muted text-muted-foreground",
  apprenticeship:"bg-teal/10 text-teal",
  bursary:       "bg-gold/10 text-gold",
};

const BLANK = {
  title: "", type: "job", description: "", organisation: "",
  location: "", stipend: "", duration: "", closing_date: "", status: "active",
};

export function OpportunityManagerWidget() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-opportunities", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, type, applications, views, status, created_at, closing_date, organisation")
        .eq("posted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OppRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("opportunities").insert({
        ...form,
        posted_by: user!.id,
        closing_date: form.closing_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-opportunities"] });
      setShowForm(false);
      setForm(BLANK);
      toast({ title: "Opportunity posted!" });
    },
    onError: (e) => toast({ title: "Failed to post", description: String(e), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-opportunities"] });
      toast({ title: "Listing removed" });
    },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  });

  const opps = data ?? [];
  const filtered = tab === "all" ? opps : opps.filter(o => o.status === tab);

  const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
  );
  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load opportunities
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Total Posted",    value: opps.length },
          { label:"Active",          value: opps.filter(o=>o.status==="active").length },
          { label:"Total Applicants",value: opps.reduce((s,o)=>s+o.applications,0) },
          { label:"Total Views",     value: opps.reduce((s,o)=>s+o.views,0) },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-muted/40 border border-border p-3 text-center">
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {(["all","active","draft","closed"] as const).map(t => (
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
          {showForm ? "Cancel" : "Post New"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">New Opportunity</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input {...field("title")} placeholder="Title *" className={INPUT} />
            <select {...field("type")} className={INPUT}>
              {["job","learnership","gig","programme","apprenticeship","bursary"].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
              ))}
            </select>
            <input {...field("organisation")} placeholder="Organisation" className={INPUT} />
            <input {...field("location")} placeholder="Location" className={INPUT} />
            <input {...field("stipend")} placeholder="Stipend / Salary" className={INPUT} />
            <input {...field("duration")} placeholder="Duration (e.g. 12 months)" className={INPUT} />
            <input {...field("closing_date")} type="date" className={INPUT} />
            <select {...field("status")} className={INPUT}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <textarea {...field("description")} placeholder="Description (optional)" rows={3} className={`${INPUT} resize-none`} />
          <button
            onClick={() => create.mutate()}
            disabled={!form.title || create.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Publish
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {opps.length === 0 && !showForm && (
          <div className="text-center py-10 space-y-2">
            <p className="text-sm text-muted-foreground">No listings yet. Post your first opportunity!</p>
          </div>
        )}
        {filtered.map(opp => (
          <div key={opp.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{opp.title}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeColor[opp.type] ?? "bg-muted text-muted-foreground"}`}>{opp.type}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusColor[opp.status] ?? "bg-muted text-muted-foreground"}`}>{opp.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{opp.applications} applicants</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{opp.views} views</span>
                {opp.closing_date && <span>Closes: {new Date(opp.closing_date).toLocaleDateString("en-ZA")}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => remove.mutate(opp.id)}
                disabled={remove.isPending}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
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
