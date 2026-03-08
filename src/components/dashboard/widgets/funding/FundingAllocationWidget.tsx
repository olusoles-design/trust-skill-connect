import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, Loader2 } from "lucide-react";

interface TxRow {
  id: string;
  amount: number;
  type: string;
  status: string;
  currency: string;
  created_at: string;
  metadata: { programme?: string; learner_name?: string } | null;
}

export function FundingAllocationWidget() {
  const { user } = useAuth();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["funding-transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("id, amount, type, status, currency, created_at, metadata")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as TxRow[];
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance, escrow_balance, currency")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Build sector breakdown from transactions
  const sectorMap: Record<string, { budget: number; spent: number }> = {};
  transactions.forEach(tx => {
    const sector = (tx.metadata as any)?.programme ?? "General";
    if (!sectorMap[sector]) sectorMap[sector] = { budget: 0, spent: 0 };
    if (tx.type === "disbursement" || tx.type === "payment") {
      sectorMap[sector].spent += tx.amount;
      sectorMap[sector].budget += tx.amount * 1.2; // estimate 80% utilization
    }
  });

  const allocation = Object.entries(sectorMap).slice(0, 5).map(([name, v]) => ({ name: name.slice(0, 10), ...v }));
  const totalDisbursed = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const learnersCount = new Set(transactions.map(t => (t.metadata as any)?.learner_name).filter(Boolean)).size;

  const recentPayments = transactions
    .filter(t => t.type === "disbursement" || t.type === "payment")
    .slice(0, 4);

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
  );

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Wallet Balance</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            R{((wallet?.balance ?? 0) / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Disbursed</span>
          </div>
          <p className="text-xl font-bold text-foreground">R{(totalDisbursed / 1000).toFixed(1)}k</p>
          <p className="text-xs text-primary mt-0.5">{transactions.filter(t => t.status === "completed").length} payments</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Learners Funded</span>
          </div>
          <p className="text-xl font-bold text-foreground">{learnersCount || transactions.length}</p>
          <p className="text-xs text-primary mt-0.5">transactions recorded</p>
        </div>
      </div>

      {/* Bar chart — only if we have data */}
      {allocation.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Budget vs Spend by Programme</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={allocation} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }}
                formatter={(v: number) => [`R${(v / 1000).toFixed(0)}k`]}
              />
              <Bar dataKey="budget" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Budget" />
              <Bar dataKey="spent" radius={[4, 4, 0, 0]} name="Spent">
                {allocation.map(entry => (
                  <Cell key={entry.name} fill={entry.budget > 0 && entry.spent / entry.budget > 0.9 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No funding transactions recorded yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Disbursements will appear here once recorded.</p>
        </div>
      )}

      {/* Recent disbursements */}
      {recentPayments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Recent Payments</p>
          <div className="space-y-1.5">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {(p.metadata as any)?.learner_name ?? p.type}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">{p.type} · {p.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">R{p.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
