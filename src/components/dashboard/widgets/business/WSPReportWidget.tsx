import { useState } from "react";
import { FileText, Download, CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSETAs } from "@/hooks/useRegulatoryBodies";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportSection {
  label: string;
  status: "complete" | "partial" | "missing";
  count: number;
  required: number;
}

const SECTIONS: ReportSection[] = [
  { label:"Learner demographics (WSP A1)",       status:"complete",  count:8,  required:8  },
  { label:"Training carried out (ATR B1)",        status:"complete",  count:14, required:14 },
  { label:"Skills priorities (WSP C1)",           status:"partial",   count:3,  required:5  },
  { label:"Planned training (WSP D1)",            status:"complete",  count:6,  required:6  },
  { label:"Employment equity (ATR E1)",           status:"missing",   count:0,  required:4  },
  { label:"Pivotal programmes (WSP/ATR F1)",      status:"partial",   count:2,  required:4  },
];

const STATUS_CFG = {
  complete: { icon:CheckCircle2, color:"text-emerald-600", bg:"bg-emerald-500/10" },
  partial:  { icon:Clock,        color:"text-yellow-600",  bg:"bg-yellow-500/10"  },
  missing:  { icon:AlertCircle,  color:"text-destructive", bg:"bg-destructive/10" },
};

export function WSPReportWidget() {
  const { data: setas, isLoading } = useSETAs();
  const [seta,       setSeta]       = useState("");
  const [year,       setYear]       = useState("2024-25");
  const [generating, setGenerating] = useState(false);

  const complete  = SECTIONS.filter(s => s.status === "complete").length;
  const readiness = Math.round((complete / SECTIONS.length) * 100);

  // Set default once data arrives
  if (!seta && setas && setas.length > 0) setSeta(setas[0].acronym);

  function handleGenerate() {
    setGenerating(true);
    const bodyLabel = setas?.find(s => s.acronym === seta)?.acronym ?? seta;
    setTimeout(() => {
      setGenerating(false);
      toast.success(`WSP/ATR for ${bodyLabel} (${year}) generated — ready to download`, {
        description: "Formatted to statutory template. Review before submission.",
        action: { label: "Download", onClick: () => toast.success("Downloading WSP_ATR.xlsx") },
      });
    }, 1800);
  }

  return (
    <div className="space-y-4">
      {/* Config row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Regulatory Body</p>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <Select value={seta} onValueChange={setSeta}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select body…" /></SelectTrigger>
              <SelectContent>
                {setas?.map(s => (
                  <SelectItem key={s.id} value={s.acronym} className="text-xs">
                    {s.acronym}
                    {s.is_levy_funded && <span className="ml-1 text-[9px] text-muted-foreground">(levy)</span>}
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
              {["2024-25","2023-24","2022-23"].map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Body info strip */}
      {seta && setas && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
          {(() => {
            const b = setas.find(s => s.acronym === seta);
            if (!b) return null;
            const formats = b.reporting_formats as string[];
            return (
              <>
                <span className="font-semibold text-foreground">{b.acronym}</span>
                <span>·</span>
                <span>{b.sector ?? b.body_type.toUpperCase()}</span>
                {b.is_levy_funded && <span className="ml-auto px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">LEVY FUNDED</span>}
                {formats.length > 0 && <span className="hidden sm:block truncate">Reports: {formats.join(", ")}</span>}
              </>
            );
          })()}
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
        <p className="text-[10px] text-muted-foreground mt-1.5">{complete} of {SECTIONS.length} sections complete</p>
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

      {/* Generate buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={generating || !seta}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          {generating ? (
            <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          {generating ? "Generating…" : "Generate WSP/ATR"}
        </button>
        <button
          onClick={() => toast.success("Statutory summary exported")}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> SARS
        </button>
      </div>
    </div>
  );
}
