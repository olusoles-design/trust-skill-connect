import { useState } from "react";
import { Check, Star, Zap, Shield, Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GatewaySelector } from "./GatewaySelector";

const PLANS = [
  {
    id: "starter",
    label: "Starter",
    price: 0,
    icon: Zap,
    color: "border-border",
    headerColor: "bg-muted/50",
    badgeColor: "bg-muted text-muted-foreground",
    features: ["3 opportunity views/month", "5 micro-task views", "Credential wallet", "Learning tracker"],
    cta: "Current Plan",
    ctaDisabled: true,
  },
  {
    id: "professional",
    label: "Professional",
    price: 499,
    icon: Star,
    color: "border-primary",
    headerColor: "bg-primary/5",
    badgeColor: "bg-primary/10 text-primary",
    popular: true,
    features: ["Unlimited opportunities", "Post jobs & tasks", "B-BBEE scorecard", "Analytics & reports", "Manage learners", "Priority support"],
    cta: "Upgrade Now",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    price: 1999,
    icon: Crown,
    color: "border-accent",
    headerColor: "bg-accent/5",
    badgeColor: "bg-accent/20 text-accent-foreground",
    features: ["Everything in Professional", "Full audit trail", "SETA reporting", "Procurement management", "API access", "Dedicated account manager"],
    cta: "Go Enterprise",
  },
] as const;

export function SubscriptionPlans() {
  const { plan: currentPlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const isCurrent = currentPlan === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${p.color} ${
                isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
              }`}
            >
              {/* Header */}
              <div className={`p-5 ${p.headerColor}`}>
                {p.popular && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground mb-3 inline-block">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.badgeColor}`}>{p.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  {p.price === 0 ? (
                    <span className="text-2xl font-bold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-foreground">R{p.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="p-5 space-y-2">
                {p.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium text-center">
                    ✓ Current Plan
                  </div>
                ) : p.price > 0 ? (
                  <button
                    onClick={() => setSelectedPlan(selectedPlan === p.id ? null : p.id)}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    {p.cta}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment flow for selected plan */}
      {selectedPlan && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">
              Upgrade to {PLANS.find(p => p.id === selectedPlan)?.label}
            </h4>
            <button onClick={() => setSelectedPlan(null)} className="text-muted-foreground hover:text-foreground text-sm">✕ Cancel</button>
          </div>
          <GatewaySelector
            amount={PLANS.find(p => p.id === selectedPlan)?.price ?? 0}
            type="subscription"
            plan={selectedPlan}
            onSuccess={() => setSelectedPlan(null)}
          />
        </div>
      )}
    </div>
  );
}
