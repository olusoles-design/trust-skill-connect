import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { FileCheck, CheckCircle2, AlertCircle, Download, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FRAMEWORKS = [
  { id: "popia",   label: "POPIA",      desc: "Protection of Personal Information Act",     score: 91, status: "compliant" },
  { id: "iso",     label: "ISO 19796",  desc: "Quality Management for e-Learning",          score: 78, status: "in-progress" },
  { id: "nqf",     label: "NQF",        desc: "National Qualifications Framework",           score: 95, status: "compliant" },
  { id: "bbbee",   label: "B-BBEE",     desc: "Broad-Based Black Economic Empowerment",     score: 83, status: "compliant" },
  { id: "seta",    label: "SETA",       desc: "Sector Education and Training Authority",     score: 88, status: "compliant" },
];

const RETENTION_POLICIES = [
  { type: "User Profiles",      period: "7 years",  editable: false },
  { type: "Transaction Records", period: "5 years", editable: false },
  { type: "Activity Logs",      period: "2 years",  editable: true },
  { type: "Support Tickets",    period: "3 years",  editable: true },
];

export function ComplianceSettings() {
  const [autoReports, setAutoReports] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Compliance</h2>
        <p className="text-sm text-muted-foreground">Regulatory frameworks, data retention, and audit reports</p>
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-5 gap-3">
        {FRAMEWORKS.map((f) => (
          <div key={f.id} className="p-4 bg-muted/30 rounded-xl border border-border text-center">
            <div className="flex items-center justify-center mb-2">
              {f.status === "compliant" ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gold" />
              )}
            </div>
            <p className="text-lg font-bold text-foreground">{f.score}%</p>
            <p className="text-xs font-semibold text-foreground">{f.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
            <Badge
              className={`mt-2 text-xs capitalize ${f.status === "compliant" ? "bg-primary/10 text-primary border-primary/20" : "bg-gold/20 text-gold border-gold/30"}`}
            >
              {f.status}
            </Badge>
          </div>
        ))}
      </div>

      {/* Data Retention */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Data Retention Policies</CardTitle>
          <CardDescription>How long each data category is retained</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {RETENTION_POLICIES.map(({ type, period, editable }) => (
            <div key={type} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
              <FileCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm flex-1 text-foreground">{type}</p>
              <Badge variant="secondary" className="text-xs font-mono">{period}</Badge>
              {!editable && (
                <Badge variant="outline" className="text-xs text-muted-foreground">Locked</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Automated Reports */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Automated Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium">Monthly SETA Reports</p>
              <p className="text-xs text-muted-foreground">Auto-generated on the 1st of each month</p>
            </div>
            <Switch checked={autoReports} onCheckedChange={setAutoReports} className="data-[state=checked]:bg-primary" />
          </div>

          <div className="space-y-2">
            {[
              { name: "SETA Q4 2025 Report",     date: "01 Jan 2026", size: "1.2 MB" },
              { name: "POPIA Audit Feb 2026",     date: "01 Feb 2026", size: "850 KB" },
              { name: "B-BBEE Compliance Q1 2026",date: "01 Mar 2026", size: "2.1 MB" },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <FileCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.date} · {r.size}</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("Downloading report...")}>
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
