import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Zap, Building2, CheckCircle2, ArrowRight, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    period: "",
    description: "Get started with core features",
    features: ["Basic profile", "Browse opportunities", "3 applications/month", "Community access"],
    color: "border-border",
    badge: null,
  },
  {
    id: "professional",
    name: "Professional",
    price: "R299",
    period: "/month",
    description: "Full platform access for active professionals",
    features: ["Unlimited applications", "AI matching engine", "Credential wallet", "Priority support", "Advanced analytics"],
    color: "border-primary",
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "R999",
    period: "/month",
    description: "For businesses and institutions",
    features: ["All Professional features", "Multi-user workspace", "SETA compliance tools", "API access", "Dedicated manager", "Custom branding"],
    color: "border-gold",
    badge: "Best Value",
  },
];

const MOCK_TRANSACTIONS = [
  { id: "INV-001", date: "01 Mar 2026", amount: "R299.00", status: "paid",    description: "Professional Plan — March 2026" },
  { id: "INV-002", date: "01 Feb 2026", amount: "R299.00", status: "paid",    description: "Professional Plan — February 2026" },
  { id: "INV-003", date: "01 Jan 2026", amount: "R299.00", status: "paid",    description: "Professional Plan — January 2026" },
];

export function BillingSettings() {
  const { plan } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Billing & Plans</h2>
        <p className="text-sm text-muted-foreground">Manage your subscription and view payment history</p>
      </div>

      {/* Current Plan */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold text-foreground capitalize">{plan ?? "Starter"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/15 text-primary border-primary/30">Active</Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/payments")}>
                Manage Subscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Available Plans</h3>
        <div className="grid grid-cols-3 gap-3">
          {PLANS.map((p) => {
            const isCurrent = (plan ?? "starter") === p.id;
            return (
              <Card key={p.id} className={`border-2 shadow-sm transition-all ${isCurrent ? p.color : "border-border"} ${isCurrent ? "shadow-primary/10" : ""}`}>
                <CardHeader className="pb-3 pt-4 px-4">
                  {p.badge && (
                    <Badge className="w-fit mb-1 text-xs bg-gold/20 text-gold border-gold/30">{p.badge}</Badge>
                  )}
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold text-foreground">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                  <CardDescription className="text-xs">{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <ul className="space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full text-xs gap-1" onClick={() => navigate("/dashboard/payments")}>
                      Upgrade <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Payment History</CardTitle>
              <CardDescription>Download invoices for your records</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/payments")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {MOCK_TRANSACTIONS.map((tx, i) => (
            <div key={tx.id} className="flex items-center gap-4 px-6 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
              <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{tx.date} · {tx.id}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">{tx.amount}</span>
              <Badge variant="secondary" className="text-xs capitalize bg-primary/10 text-primary border-primary/20">{tx.status}</Badge>
              <Button variant="ghost" size="icon" className="w-7 h-7">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
