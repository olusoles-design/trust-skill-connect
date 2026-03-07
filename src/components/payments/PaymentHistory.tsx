import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  pending:    { icon: Clock,          color: "text-amber-400 bg-amber-400/10",   label: "Pending" },
  successful: { icon: CheckCircle2,   color: "text-emerald-400 bg-emerald-400/10", label: "Successful" },
  failed:     { icon: XCircle,        color: "text-destructive bg-destructive/10", label: "Failed" },
  refunded:   { icon: RefreshCw,      color: "text-muted-foreground bg-muted",     label: "Refunded" },
} as const;

const GATEWAY_LOGOS: Record<string, string> = {
  flutterwave: "🌊",
  paystack: "⚡",
  payfast: "🏦",
};

const TYPE_ICONS: Record<string, typeof ArrowUpRight> = {
  deposit: ArrowUpRight,
  subscription: ArrowUpRight,
  task_escrow: ArrowUpRight,
  withdrawal: ArrowDownLeft,
  payout: ArrowDownLeft,
};

export function PaymentHistory() {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["payment-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/40 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isCredit = ["deposit", "subscription", "task_escrow"].includes(tx.type);
        const statusCfg = STATUS_CONFIG[tx.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
        const StatusIcon = statusCfg.icon;
        const DirectionIcon = TYPE_ICONS[tx.type] ?? ArrowUpRight;

        return (
          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
            {/* Gateway logo */}
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">
              {GATEWAY_LOGOS[tx.gateway] ?? "💳"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground capitalize">
                  {tx.type.replace("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{tx.gateway}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              <span>{statusCfg.label}</span>
            </div>

            {/* Amount */}
            <div className={`flex items-center gap-1 text-sm font-semibold ${isCredit ? "text-emerald-400" : "text-foreground"}`}>
              <DirectionIcon className="w-3.5 h-3.5" />
              R{tx.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
