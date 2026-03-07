import { useState } from "react";
import { Wallet, History, CreditCard, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WalletCard } from "@/components/payments/WalletCard";
import { PaymentHistory } from "@/components/payments/PaymentHistory";
import { SubscriptionPlans } from "@/components/payments/SubscriptionPlans";
import { Link } from "react-router-dom";

type Tab = "wallet" | "history" | "subscription";

const TABS: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "wallet",       label: "Wallet",       icon: Wallet },
  { id: "history",      label: "Transactions", icon: History },
  { id: "subscription", label: "Plans",        icon: CreditCard },
];

export default function Payments() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("wallet");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <DashboardHeader />
          </header>

          <main className="flex-1 p-6 overflow-auto max-w-5xl mx-auto w-full space-y-6">
            {/* Page header */}
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Payment Hub</h1>
                <p className="text-sm text-muted-foreground">Manage your wallet, transactions & subscription</p>
              </div>
              {/* Gateway badges */}
              <div className="ml-auto flex items-center gap-2">
                {["🌊 Flutterwave", "⚡ PayStack", "🏦 PayFast"].map(g => (
                  <span key={g} className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      tab === t.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            {tab === "wallet" && (
              <div className="max-w-sm">
                <WalletCard />
              </div>
            )}

            {tab === "history" && (
              <div>
                <h2 className="text-base font-semibold text-foreground mb-4">Transaction History</h2>
                <PaymentHistory />
              </div>
            )}

            {tab === "subscription" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-foreground">Choose Your Plan</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unlock features tailored to your role. Pay securely via Flutterwave, PayStack, or PayFast.
                  </p>
                </div>
                <SubscriptionPlans />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
