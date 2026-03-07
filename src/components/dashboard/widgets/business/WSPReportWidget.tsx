import { useState } from "react";
import { FileText, Download, CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const SETAS = [
  "MERSETA","MICT SETA","ETDP SETA","SERVICES SETA","INSETA","CHIETA",
  "FASSET","HWSETA","CATHSSETA","AGRISETA","TETA","W&RSETA","CETA","BANKSETA",
];

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
  const [seta,   setSeta]   = useState("MICT SETA");
  const [year,   setYear]   = useState("2024-25");
  const [generating, setGenerating] = useState(false);

  const complete  = SECTIONS.filter(s => s.status === "complete").length;
  const readiness = Math.round((complete / SECTIONS.length) * 100);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success(`WSP/ATR for ${seta} (${year}) generated — ready to download`, {
        description: "Formatted to SETA template. Review before submission.",
        action: { label: "Download", onClick: () => toast.success("Downloading WSP_ATR_2024-25.xlsx") },
      });
    }, 1800);
  }

  return (
    <div className="space-y-4">
      {/* Config row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">SETA</p>
          <Select value={seta} onValueChange={setSeta}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{SETAS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
          </Select>
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
          disabled={generating}
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
          onClick={() => toast.success("SARS summary exported")}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> SARS
        </button>
      </div>
    </div>
  );
}
