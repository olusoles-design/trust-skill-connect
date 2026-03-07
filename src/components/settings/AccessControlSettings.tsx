import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, UserPlus, Settings } from "lucide-react";

const ROLES = [
  { role: "admin",            label: "Admin",            count: 2,  color: "bg-destructive/10 text-destructive",    perms: ["Full platform access", "User management", "System settings"] },
  { role: "employer",         label: "Employer",         count: 14, color: "bg-gold/10 text-gold",                  perms: ["Post opportunities", "Manage applications", "Team roster"] },
  { role: "learner",          label: "Learner",          count: 342,color: "bg-primary/10 text-primary",            perms: ["Browse opportunities", "Apply", "Profile management"] },
  { role: "provider",         label: "Provider",         count: 28, color: "bg-secondary/10 text-secondary",        perms: ["Marketplace listing", "RFQ responses", "Portfolio"] },
  { role: "practitioner",     label: "Practitioner",     count: 7,  color: "bg-accent/50 text-accent-foreground",   perms: ["Verify documents", "SETA reporting", "Compliance"] },
  { role: "seta",             label: "SETA Officer",     count: 3,  color: "bg-muted text-muted-foreground",        perms: ["SETA reports", "Analytics", "Compliance monitoring"] },
];

export function AccessControlSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Access Control</h2>
          <p className="text-sm text-muted-foreground">Manage roles, permissions, and delegated approvers</p>
        </div>
        <Button size="sm" className="gap-2">
          <UserPlus className="w-3.5 h-3.5" /> Invite User
        </Button>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map(({ role, label, count, color }) => (
          <div key={role} className="p-4 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <Badge className={`text-xs capitalize ${color} border-0`}>{label}</Badge>
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{count}</p>
            <p className="text-xs text-muted-foreground">users assigned</p>
          </div>
        ))}
      </div>

      {/* Role Details */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role Permissions Matrix</CardTitle>
          <CardDescription>View capabilities assigned to each role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ROLES.map(({ role, label, perms, color }) => (
            <div key={role} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/20 transition-colors border border-border">
              <Badge className={`text-xs capitalize mt-0.5 flex-shrink-0 ${color} border-0`}>{label}</Badge>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {perms.map((p) => (
                  <span key={p} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
              <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0">
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
