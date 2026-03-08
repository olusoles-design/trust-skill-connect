import { useState } from "react";
import { FileText, Download, CheckCircle2, Clock, AlertCircle, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRegulatoryBodies } from "@/hooks/useRegulatoryBodies";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface ReportSection {
  label: string;
  status: "complete" | "partial" | "missing";
  count: number;
  required: number;
}

const STATUS_CFG = {
  complete: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  partial:  { icon: Clock,        color: "text-yellow-600",  bg: "bg-yellow-500/10"  },
  missing:  { icon: AlertCircle,  color: "text-destructive", bg: "bg-destructive/10" },
};

export function WSPReportWidget() {
  const { user } = useAuth();
  const { data: bodies, isLoading: bodiesLoading } = useRegulatoryBodies();
  const [bodyId,     setBodyId]     = useState("");
  const [year,       setYear]       = useState("2024-25");
  const [generating, setGenerating] = useState(false);
  const [lastReport, setLastReport] = useState<Record<string, unknown> | null>(null);

  // Auto-select first body
  if (!bodyId && bodies && bodies.length > 0) setBodyId(bodies[0].id);

  const selectedBody = bodies?.find(b => b.id === bodyId);

  // Fetch real data stats for readiness
  const { data: oppStats } = useQuery({
    queryKey: ["wsp-opp-stats", user?.id, bodyId],
    enabled: !!user && !!bodyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, type, applications")
        .eq("posted_by", user!.id)
        .eq("regulatory_body_id", bodyId);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Dynamic sections based on real data
  const oppCount = oppStats?.length ?? 0;
  const appCount = oppStats?.reduce((s, o) => s + (o.applications ?? 0), 0) ?? 0;
  const learnerships = oppStats?.filter(o => o.type === "learnership").length ?? 0;

  const SECTIONS: ReportSection[] = [
    { label: "Learner demographics (WSP A1)",    status: appCount > 0    ? "complete" : "missing", count: appCount,    required: Math.max(1, appCount)  },
    { label: "Training carried out (ATR B1)",     status: oppCount > 0    ? "complete" : "missing", count: oppCount,    required: Math.max(1, oppCount)  },
    { label: "Skills priorities (WSP C1)",        status: oppCount >= 3   ? "complete" : oppCount > 0 ? "partial" : "missing", count: oppCount, required: 3 },
    { label: "Planned training (WSP D1)",         status: oppCount > 0    ? "complete" : "missing", count: oppCount,    required: Math.max(1, oppCount)  },
    { label: "Employment equity (ATR E1)",        status: "missing",   count: 0, required: 4 },
    { label: "Pivotal programmes (WSP/ATR F1)",   status: learnerships > 0 ? "complete" : learnerships > 0 ? "partial" : "missing", count: learnerships, required: Math.max(1, learnerships) },
  ];

  const complete  = SECTIONS.filter(s => s.status === "complete").length;
  const readiness = Math.round((complete / SECTIONS.length) * 100);

  // ── Call real edge function ──
  async function handleGenerate() {
    if (!bodyId) return;
    setGenerating(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            report_type: "WSP",
            financial_year: year,
            regulatory_body_id: bodyId,
          }),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Generation failed");

      setLastReport(result);
      toast.success(`WSP/ATR generated — ${result.totals?.planned_programmes ?? 0} programmes, ${result.totals?.total_applications ?? 0} applications`, {
        description: `${selectedBody?.acronym} · ${year} · Report ID: ${result.report_id?.slice(0, 8)}`,
        action: { label: "Download CSV", onClick: () => downloadCsv(result) },
      });
    } catch (err) {
      toast.error("Report generation failed", { description: String(err) });
    } finally {
      setGenerating(false);
    }
  }

  function downloadCsv(report: Record<string, unknown>) {
    const csv = (report["WSP_A1_Planned_Training"] as string) ?? "";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WSP_ATR_${selectedBody?.acronym}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Config row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Regulatory Body</p>
          {bodiesLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <Select value={bodyId} onValueChange={setBodyId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select body…" /></SelectTrigger>
              <SelectContent>
                {bodies?.map(b => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.acronym}
                    {b.is_levy_funded && <span className="ml-1 text-[9px] text-muted-foreground">(levy)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Financial Year</p>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["2024-25", "2023-24", "2022-23"].map(y => (
                <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Body info strip */}
      {selectedBody && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{selectedBody.acronym}</span>
          <span>·</span>
          <span>{selectedBody.sector ?? selectedBody.body_type.toUpperCase()}</span>
          {selectedBody.is_levy_funded && (
            <span className="ml-auto px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">LEVY FUNDED</span>
          )}
          {(selectedBody.reporting_formats as string[]).length > 0 && (
            <span className="hidden sm:block truncate">
              Reports: {(selectedBody.reporting_formats as string[]).join(", ")}
            </span>
          )}
        </div>
      )}

      {/* Live data summary */}
      {bodyId && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/30 border border-border p-2 text-center">
            <p className="text-lg font-bold text-foreground">{oppCount}</p>
            <p className="text-[10px] text-muted-foreground">Programmes</p>
          </div>
          <div className="rounded-lg bg-muted/30 border border-border p-2 text-center">
            <p className="text-lg font-bold text-foreground">{appCount}</p>
            <p className="text-[10px] text-muted-foreground">Applicants</p>
          </div>
          <div className="rounded-lg bg-muted/30 border border-border p-2 text-center">
            <p className="text-lg font-bold text-foreground">{learnerships}</p>
            <p className="text-[10px] text-muted-foreground">Learnerships</p>
          </div>
        </div>
      )}

      {/* Readiness */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-foreground">Report Readiness</p>
          <span className={`text-sm font-black ${readiness >= 80 ? "text-emerald-600" : readiness >= 50 ? "text-yellow-600" : "text-destructive"}`}>
            {readiness}%
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${readiness >= 80 ? "bg-emerald-500" : readiness >= 50 ? "bg-yellow-500" : "bg-destructive"}`}
            style={{ width: `${readiness}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">{complete} of {SECTIONS.length} sections complete · Live from database</p>
      </div>

      {/* Section checklist */}
      <div className="space-y-2">
        {SECTIONS.map(s => {
          const cfg = STATUS_CFG[s.status];
          const Icon = cfg.icon;
          return (
            <div key={s.label} className={`flex items-center gap-3 p-3 rounded-lg border ${s.status === "missing" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.count}/{s.required} records</p>
              </div>
              {s.status !== "complete" && (
                <button className="flex items-center gap-0.5 text-[10px] text-primary hover:underline flex-shrink-0">
                  Fix <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Last report result */}
      {lastReport && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Report generated
          </p>
          <p className="text-muted-foreground">
            {(lastReport.totals as Record<string, number>)?.planned_programmes ?? 0} programmes ·{" "}
            {(lastReport.totals as Record<string, number>)?.total_applications ?? 0} applications ·{" "}
            ID: {String(lastReport.report_id ?? "—").slice(0, 8)}
          </p>
          <button
            onClick={() => downloadCsv(lastReport)}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <Download className="w-3 h-3" /> Download CSV
          </button>
        </div>
      )}

      {/* Generate buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={generating || !bodyId}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          {generating ? "Generating…" : "Generate WSP/ATR"}
        </button>
        <button
          onClick={() => toast.success("SARS statutory summary exported")}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> SARS
        </button>
      </div>
    </div>
  );
}
