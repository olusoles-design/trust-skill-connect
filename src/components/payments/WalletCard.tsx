import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WithdrawModal } from "./WithdrawModal";
import { GatewaySelector } from "./GatewaySelector";

export function WalletCard() {
  const { user } = useAuth();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data: wallet, isLoading, refetch } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="rounded-2xl bg-gradient-to-br from-card to-card/60 border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">My Wallet</h3>
            <p className="text-xs text-muted-foreground">ZAR Balance</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Balance */}
      {isLoading ? (
        <div className="h-16 bg-muted/40 animate-pulse rounded-xl" />
      ) : (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 border border-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-foreground">
              R {(wallet?.balance ?? 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </p>
          </div>
          {(wallet?.escrow_balance ?? 0) > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400">
                R {wallet!.escrow_balance.toLocaleString("en-ZA", { minimumFractionDigits: 2 })} in escrow
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setShowDeposit(!showDeposit); setShowWithdraw(false); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Deposit
        </button>
        <button
          onClick={() => { setShowWithdraw(!showWithdraw); setShowDeposit(false); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
        >
          <TrendingDown className="w-4 h-4" />
          Withdraw
        </button>
      </div>

      {/* Inline Deposit */}
      {showDeposit && (
        <div className="border-t border-border pt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Deposit Amount (ZAR)</label>
            <DepositForm onClose={() => setShowDeposit(false)} />
          </div>
        </div>
      )}

      {/* Inline Withdraw */}
      {showWithdraw && (
        <div className="border-t border-border pt-4">
          <WithdrawModal
            availableBalance={wallet?.balance ?? 0}
            onClose={() => setShowWithdraw(false)}
            onSuccess={refetch}
          />
        </div>
      )}
    </div>
  );
}

function DepositForm({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState(200);

  const presets = [100, 500, 1000, 2000];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              amount === p ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40 text-muted-foreground"
            }`}
          >
            R{p}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        min={50}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none"
        placeholder="Custom amount"
      />
      <GatewaySelector amount={amount} type="deposit" onSuccess={onClose} />
    </div>
  );
}
