import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Calculator, Download, Info } from "lucide-react";
import { toast } from "sonner";

// Section 12H of the Income Tax Act (SA)
// NQF 1-6:  R40k commencement + R20k completion per learner (non-disabled)
// NQF 7-10: R60k commencement + R30k completion per learner (non-disabled)
// Disabled: Double the above allowances

interface NQFBand { label: string; comm: number; comp: number; commD: number; compD: number; }
const NQF_BANDS: Record<"lower" | "higher", NQFBand> = {
  lower: { label: "NQF 1–6", comm: 40_000,  comp: 20_000,  commD: 80_000,  compD: 40_000  },
  higher:{ label: "NQF 7–10",comm: 60_000,  comp: 30_000,  commD: 120_000, compD: 60_000  },
};

const fmtR = (n: number) => `R${n.toLocaleString("en-ZA")}`;

export function TaxCalculatorWidget() {
  const [nqfBand,    setNqfBand]    = useState<"lower" | "higher">("lower");
  const [learners,   setLearners]   = useState(10);
  const [disabled,   setDisabled]   = useState(2);
  const [completed,  setCompleted]  = useState(8);
  const [taxRate,    setTaxRate]    = useState(27); // Corporate tax rate %

  const band = NQF_BANDS[nqfBand];
  const normal   = Math.max(0, learners - disabled);
  const disCount = Math.min(disabled, learners);
  const compNorm = Math.min(completed, normal);
  const compDis  = Math.max(0, completed - compNorm);

  // Commencement allowances
  const commAllowance = normal * band.comm + disCount * band.commD;
  // Completion allowances
  const compAllowance = compNorm * band.comp + compDis * band.compD;
  const totalAllowance = commAllowance + compAllowance;
  const taxSaving = totalAllowance * (taxRate / 100);
  const netCost   = totalAllowance - taxSaving; // effective spend after tax

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-lg font-black text-foreground">{fmtR(totalAllowance)}</p>
          <p className="text-[10px] text-muted-foreground">Section 12H Allowance</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
          <p className="text-lg font-black text-primary">{fmtR(taxSaving)}</p>
          <p className="text-[10px] text-primary/70">Tax Saving</p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p className="text-lg font-black text-emerald-600">{fmtR(netCost)}</p>
          <p className="text-[10px] text-emerald-600/70">Net Effective Cost</p>
        </div>
      </div>

      {/* NQF Band toggle */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">NQF Band</p>
        <div className="flex gap-2">
          {(["lower", "higher"] as const).map(b => (
            <button
              key={b}
              onClick={() => setNqfBand(b)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${nqfBand === b ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >
              {NQF_BANDS[b].label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Learners</span>
            <span className="font-semibold text-foreground">{learners}</span>
          </div>
          <Slider min={1} max={100} step={1} value={[learners]} onValueChange={([v]) => setLearners(v)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Of which Disabled</span>
            <span className="font-semibold text-foreground">{Math.min(disabled, learners)}</span>
          </div>
          <Slider min={0} max={learners} step={1} value={[Math.min(disabled, learners)]} onValueChange={([v]) => setDisabled(v)} />
          <p className="text-[10px] text-muted-foreground">Disabled learners attract double the allowance</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Learners Completed</span>
            <span className="font-semibold text-foreground">{Math.min(completed, learners)}</span>
          </div>
          <Slider min={0} max={learners} step={1} value={[Math.min(completed, learners)]} onValueChange={([v]) => setCompleted(v)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Corporate Tax Rate</span>
            <span className="font-semibold text-foreground">{taxRate}%</span>
          </div>
          <Slider min={15} max={45} step={1} value={[taxRate]} onValueChange={([v]) => setTaxRate(v)} />
          <p className="text-[10px] text-muted-foreground">Standard: 27% · Small business: 28%</p>
        </div>
      </div>

      {/* Breakdown table */}
      <div className="rounded-xl border border-border overflow-hidden text-xs">
        <div className="bg-muted/50 px-4 py-2 border-b border-border font-semibold text-foreground">Allowance Breakdown</div>
        <div className="divide-y divide-border">
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-muted-foreground">Commencement ({normal} normal + {disCount} disabled)</span>
            <span className="font-medium text-foreground">{fmtR(commAllowance)}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-muted-foreground">Completion ({completed} learners)</span>
            <span className="font-medium text-foreground">{fmtR(compAllowance)}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5 bg-primary/5">
            <span className="font-semibold text-foreground">Total Deductible Allowance</span>
            <span className="font-black text-primary">{fmtR(totalAllowance)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
        <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground">
          Based on Section 12H of the Income Tax Act. Figures are estimates only. Consult your tax advisor before submission.
        </p>
      </div>

      <button
        onClick={() => toast.success("Tax summary exported to CSV")}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-all"
      >
        <Download className="w-3.5 h-3.5" /> Export for SARS Submission
      </button>
    </div>
  );
}
