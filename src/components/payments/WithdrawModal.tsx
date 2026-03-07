import { useState } from "react";
import { Loader2, Building2, Smartphone, Banknote, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const METHODS = [
  { id: "bank_eft", label: "Bank EFT", icon: Building2, desc: "Standard bank transfer (1-2 days)" },
  { id: "capitec_pay", label: "Capitec Pay", icon: Banknote, desc: "Instant via Capitec bank account" },
  { id: "mobile_money", label: "Mobile Money", icon: Smartphone, desc: "Airtime / mobile wallet" },
  { id: "voucher", label: "Voucher", icon: Gift, desc: "Digital voucher for unbanked" },
];

interface WithdrawModalProps {
  availableBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function WithdrawModal({ availableBalance, onClose, onSuccess }: WithdrawModalProps) {
  const [method, setMethod] = useState<string>("bank_eft");
  const [amount, setAmount] = useState(200);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (amount < 50) { toast.error("Minimum withdrawal is R50"); return; }
    if (amount > availableBalance) { toast.error("Insufficient balance"); return; }
    if ((method === "bank_eft" || method === "capitec_pay") && (!bankName || !accountNumber || !accountHolder)) {
      toast.error("Please fill in all bank details"); return;
    }
    if (method === "mobile_money" && !mobileNumber) { toast.error("Please enter a mobile number"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("wallet-withdraw", {
        body: { amount, method, bankName, accountNumber, accountHolder, mobileNumber },
      });
      if (error || !data?.success) throw new Error(error?.message ?? data?.error ?? "Withdrawal failed");
      toast.success("Withdrawal request submitted! Processing within 1-2 business days.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Method selector */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Payout Method</p>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all text-xs ${
                  method === m.id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/30 text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{m.label}</p>
                  <p className="text-muted-foreground leading-tight">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Amount (ZAR) — Available: R{availableBalance.toFixed(2)}</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          min={50}
          max={availableBalance}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none"
        />
      </div>

      {/* Bank fields */}
      {(method === "bank_eft" || method === "capitec_pay") && (
        <div className="space-y-2">
          <input placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none" />
          <input placeholder="Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none" />
          <input placeholder="Account Holder Name" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none" />
        </div>
      )}

      {/* Mobile field */}
      {(method === "mobile_money" || method === "voucher") && (
        <input
          placeholder="Mobile Number (e.g. 0821234567)"
          value={mobileNumber}
          onChange={e => setMobileNumber(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none"
        />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Withdraw R${amount}`}
        </button>
      </div>
    </div>
  );
}
