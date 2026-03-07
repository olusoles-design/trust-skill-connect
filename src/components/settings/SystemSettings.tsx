import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Monitor, CheckCircle2, AlertCircle, Clock, Database, Cpu, HardDrive, Activity } from "lucide-react";

const SERVICES = [
  { name: "Authentication Service",    status: "operational", uptime: 99.98 },
  { name: "Match Engine",              status: "operational", uptime: 99.95 },
  { name: "Payment Gateway",           status: "operational", uptime: 99.9 },
  { name: "File Storage",              status: "operational", uptime: 100 },
  { name: "Push Notifications",        status: "degraded",    uptime: 97.2 },
  { name: "Email Delivery",            status: "operational", uptime: 99.8 },
];

const FEATURE_FLAGS = [
  { id: "ai_matching",       label: "AI Matching Engine",      desc: "Enable ML-based opportunity matching",       enabled: true },
  { id: "micro_tasks",       label: "Micro-Task Board",        desc: "Short-duration gig task marketplace",        enabled: true },
  { id: "marketplace",       label: "Provider Marketplace",    desc: "B2B service discovery and RFQ",              enabled: true },
  { id: "seta_reporting",    label: "SETA Reporting",          desc: "Automated regulatory report generation",     enabled: false },
  { id: "credential_wallet", label: "Credential Wallet",       desc: "Blockchain-verified credential storage",     enabled: true },
  { id: "mobile_money",      label: "Mobile Money Payouts",    desc: "Instant EFT and mobile wallet disbursements",enabled: false },
];

export function SystemSettings() {
  const [flags, setFlags] = useState(FEATURE_FLAGS);

  const toggleFlag = (id: string) =>
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">System</h2>
        <p className="text-sm text-muted-foreground">Registration controls, feature flags, and service health</p>
      </div>

      {/* System Health */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Service Health
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">All Systems Operational</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {SERVICES.map((svc) => (
            <div key={svc.name} className="flex items-center gap-4">
              {svc.status === "operational" ? (
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gold flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{svc.name}</p>
                  <span className="text-xs text-muted-foreground ml-2">{svc.uptime}%</span>
                </div>
                <Progress value={svc.uptime} className="h-1.5" />
              </div>
              <Badge
                variant="secondary"
                className={`text-xs capitalize flex-shrink-0 ${svc.status === "operational" ? "bg-primary/10 text-primary" : "bg-gold/20 text-gold"}`}
              >
                {svc.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resource Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Cpu,       label: "CPU",     value: 34, color: "bg-primary" },
              { icon: HardDrive, label: "Storage", value: 61, color: "bg-gold" },
              { icon: Database,  label: "DB",      value: 48, color: "bg-secondary" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="p-4 bg-muted/40 rounded-xl text-center">
                <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{value}%</p>
                <p className="text-xs text-muted-foreground">{label} used</p>
                <Progress value={value} className="h-1.5 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Feature Flags</CardTitle>
          <CardDescription>Enable or disable platform features globally</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{flag.label}</p>
                <p className="text-xs text-muted-foreground">{flag.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={`text-xs ${flag.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {flag.enabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => toggleFlag(flag.id)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
