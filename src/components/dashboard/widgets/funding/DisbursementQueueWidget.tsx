import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, AlertCircle, DollarSign, Loader2 } from "lucide-react";

interface TxRow {
  id: string;
  amount: number;
  type: string;
  status: string;
  currency: string;
  created_at: string;
  gateway: string;
  metadata: Record<string, unknown> | null;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending:   { label: "Pending",  icon: Clock,        color: "bg-muted text-muted-foreground" },
  completed: { label: "Approved", icon: CheckCircle2, color: "bg-green-500/15 text-green-600" },
  failed:    { label: "Failed",   icon: XCircle,      color: "bg-destructive/10 text-destructive" },
  query:     { label: "Query",    icon: AlertCircle,  color: "bg-accent/20 text-accent-foreground" },
};

export function DisbursementQueueWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["disbursement-queue", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("id, amount, type, status, currency, created_at, gateway, metadata")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as TxRow[];
    },
  });

  const pending = transactions.filter(t => t.status === "pending");
  const totalPending = pending.reduce((s, t) => s + t.amount, 0);
  const totalProcessed = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  if (isLoading) return (
    <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 p-4">
          <p className="text-xs text-primary/70">Awaiting Processing</p>
          <p className="text-2xl font-bold text-foreground">{pending.length}</p>
          <p className="text-xs text-muted-foreground">R{(totalPending / 1000).toFixed(1)}k total</p>
        </div>
        <div className="flex-1 rounded-xl bg-muted/40 border border-border p-4">
          <p className="text-xs text-muted-foreground">Processed</p>
          <p className="text-2xl font-bold text-foreground">R{(totalProcessed / 1000).toFixed(1)}k</p>
          <p className="text-xs text-primary">{transactions.filter(t => t.status === "completed").length} payments</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <DollarSign className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => {
            const cfg = statusConfig[tx.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground capitalize">{tx.type}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${cfg.color}`}>
                      <Icon className="w-2.5 h-2.5" /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{tx.gateway}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(tx.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-bold text-foreground">
                    {tx.currency} {tx.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
