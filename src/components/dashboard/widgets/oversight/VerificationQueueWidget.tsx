import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

interface DocRow {
  id: string;
  user_id: string;
  label: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  reviewer_note: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending:   { label: "Pending",   icon: Clock,        color: "bg-muted text-muted-foreground" },
  in_review: { label: "In Review", icon: Eye,          color: "bg-primary/15 text-primary" },
  approved:  { label: "Approved",  icon: CheckCircle2, color: "bg-green-500/15 text-green-600" },
  rejected:  { label: "Rejected",  icon: XCircle,      color: "bg-destructive/10 text-destructive" },
};

type FilterType = "all" | "pending" | "in_review" | "approved" | "rejected";

export function VerificationQueueWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: docs = [], isLoading, error } = useQuery({
    queryKey: ["verification-queue"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_vault")
        .select("id, user_id, label, doc_type, file_name, file_url, status, created_at, expires_at, reviewer_note")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      const { error } = await supabase
        .from("document_vault")
        .update({
          status,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          reviewer_note: note ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { status }) => {
      qc.invalidateQueries({ queryKey: ["verification-queue"] });
      toast({ title: status === "approved" ? "Document approved ✅" : "Document rejected" });
    },
    onError: (e) => toast({ title: "Action failed", description: String(e), variant: "destructive" }),
  });

  const filtered = filter === "all" ? docs : docs.filter(d => d.status === filter);
  const pendingCount = docs.filter(d => d.status === "pending" || d.status === "in_review").length;
  const approvedCount = docs.filter(d => d.status === "approved").length;
  const rejectedCount = docs.filter(d => d.status === "rejected").length;

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
  );

  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load verification queue
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center">
          <p className="text-xl font-bold text-destructive">{pendingCount}</p>
          <p className="text-xs text-destructive/70">Pending</p>
        </div>
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p className="text-xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-xs text-green-600/70">Approved</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{rejectedCount}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{docs.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {(["all", "pending", "in_review", "approved", "rejected"] as FilterType[]).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${
              filter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>{t.replace("_", " ")}</button>
        ))}
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No documents in the verification queue.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const cfg = statusConfig[doc.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={doc.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.doc_type} · {doc.file_name}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(doc.created_at).toLocaleDateString("en-ZA")}
                    {doc.expires_at && ` · Expires: ${new Date(doc.expires_at).toLocaleDateString("en-ZA")}`}
                  </p>
                  {(doc.status === "pending" || doc.status === "in_review") && (
                    <div className="mt-2 flex gap-2 items-center">
                      <input
                        placeholder="Reviewer note (optional)"
                        value={reviewNotes[doc.id] ?? ""}
                        onChange={e => setReviewNotes(p => ({ ...p, [doc.id]: e.target.value }))}
                        className="flex-1 px-2 py-1 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                    <Icon className="w-2.5 h-2.5" /> {cfg.label}
                  </span>
                  {(doc.status === "pending" || doc.status === "in_review") && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus.mutate({ id: doc.id, status: "rejected", note: reviewNotes[doc.id] })}
                        disabled={updateStatus.isPending}
                        className="px-2 py-1 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-all"
                      >
                        {updateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Reject"}
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: doc.id, status: "approved", note: reviewNotes[doc.id] })}
                        disabled={updateStatus.isPending}
                        className="px-2 py-1 rounded text-xs bg-primary/15 text-primary hover:bg-primary/25 font-medium transition-all"
                      >
                        {updateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Approve"}
                      </button>
                    </div>
                  )}
                  {doc.reviewer_note && (
                    <p className="text-[10px] text-muted-foreground italic max-w-[120px] text-right">"{doc.reviewer_note}"</p>
                  )}
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    <Eye className="w-2.5 h-2.5" /> View File
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
