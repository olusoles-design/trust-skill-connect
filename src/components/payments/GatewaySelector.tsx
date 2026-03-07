import { useState } from "react";
import { CreditCard, Zap, Building2, Check, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GATEWAYS = [
  {
    id: "flutterwave",
    name: "Flutterwave",
    logo: "🌊",
    tagline: "Cards, EFT, Mobile Money",
    color: "from-orange-500/20 to-amber-500/10 border-orange-500/30",
    badge: "Pan-African",
    badgeColor: "bg-orange-500/10 text-orange-400",
  },
  {
    id: "paystack",
    name: "PayStack",
    logo: "⚡",
    tagline: "Cards, Bank Transfer, USSD",
    color: "from-teal-500/20 to-emerald-500/10 border-teal-500/30",
    badge: "Developer Favourite",
    badgeColor: "bg-teal-500/10 text-teal-400",
  },
  {
    id: "payfast",
    name: "PayFast",
    logo: "🏦",
    tagline: "EFT, Cards, SnapScan, Mobicred",
    color: "from-primary/20 to-primary/5 border-primary/30",
    badge: "SA Leader",
    badgeColor: "bg-primary/10 text-primary",
  },
];

interface GatewaySelectorProps {
  amount: number;
  type: string;
  plan?: string;
  onSuccess?: () => void;
}

export function GatewaySelector({ amount, type, plan, onSuccess }: GatewaySelectorProps) {
  const { session } = useAuth();
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!selectedGateway || !session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("payment-initiate", {
        body: { gateway: selectedGateway, amount, type, plan, metadata: {} },
      });
      if (error || !data?.checkoutUrl) throw new Error(error?.message ?? "Failed to initiate payment");
      toast.success("Redirecting to payment gateway…");
      window.open(data.checkoutUrl, "_blank");
      onSuccess?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Select your preferred payment gateway</p>

      <div className="grid gap-3">
        {GATEWAYS.map((gw) => (
          <button
            key={gw.id}
            onClick={() => setSelectedGateway(gw.id)}
            className={`relative flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r transition-all text-left ${gw.color} ${
              selectedGateway === gw.id
                ? "ring-2 ring-primary scale-[1.01]"
                : "hover:scale-[1.005] opacity-80 hover:opacity-100"
            }`}
          >
            <span className="text-2xl">{gw.logo}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-foreground text-sm">{gw.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${gw.badgeColor}`}>{gw.badge}</span>
              </div>
              <p className="text-xs text-muted-foreground">{gw.tagline}</p>
            </div>
            {selectedGateway === gw.id && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handlePay}
        disabled={!selectedGateway || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <ExternalLink className="w-4 h-4" />
            Pay R{amount.toLocaleString()} with {selectedGateway ? GATEWAYS.find(g => g.id === selectedGateway)?.name : "..."}
          </>
        )}
      </button>
    </div>
  );
}
