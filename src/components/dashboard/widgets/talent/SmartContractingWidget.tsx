import { useState } from "react";
import { FileText, Clock, MapPin, CheckCircle2, Download, Play, Square, Plus } from "lucide-react";
import { toast } from "sonner";

interface Timesheet {
  id: string;
  date: string;
  client: string;
  venue: string;
  location: string;
  clockIn: string;
  clockOut: string | null;
  hours: number | null;
  geoVerified: boolean;
  status: "active" | "submitted" | "approved" | "invoiced";
}

const SHEETS: Timesheet[] = [
  { id:"1", date:"Mon 06 Jan", client:"Bytes Academy",  venue:"Braamfontein Hub",  location:"Johannesburg", clockIn:"08:04", clockOut:"17:12", hours:9.1,  geoVerified:true, status:"approved"  },
  { id:"2", date:"Tue 07 Jan", client:"Bytes Academy",  venue:"Braamfontein Hub",  location:"Johannesburg", clockIn:"07:58", clockOut:"17:05", hours:9.1,  geoVerified:true, status:"approved"  },
  { id:"3", date:"Wed 08 Jan", client:"Bytes Academy",  venue:"Braamfontein Hub",  location:"Johannesburg", clockIn:"08:10", clockOut:"16:55", hours:8.8,  geoVerified:true, status:"submitted" },
  { id:"4", date:"Thu 09 Jan", client:"Bytes Academy",  venue:"Braamfontein Hub",  location:"Johannesburg", clockIn:"08:01", clockOut:null,    hours:null, geoVerified:true, status:"active"    },
];

const STATUS_CFG = {
  active:    "bg-emerald-500/10 text-emerald-600",
  submitted: "bg-yellow-500/10 text-yellow-600",
  approved:  "bg-primary/10 text-primary",
  invoiced:  "bg-muted text-muted-foreground",
};

const SLA_TEMPLATES = [
  "Facilitation Services Agreement",
  "Assessment & Moderation SLA",
  "Coaching & Mentoring Contract",
  "Curriculum Development SLA",
];

export function SmartContractingWidget() {
  const [tab, setTab] = useState<"timesheets" | "sla">("timesheets");
  const [clocked, setClocked] = useState(false);

  const approved  = SHEETS.filter(s => s.status === "approved");
  const totalHrs  = approved.reduce((s, sh) => s + (sh.hours ?? 0), 0);
  const weekRate  = 1_800;
  const weekEarns = totalHrs * weekRate;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {(["timesheets","sla"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t === "timesheets" ? "Timesheets" : "SLA Templates"}
          </button>
        ))}
      </div>

      {tab === "timesheets" ? (
        <div className="space-y-4">
          {/* Week summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
              <p className="text-lg font-black text-foreground">{totalHrs.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Hrs Approved</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-lg font-black text-primary">R{weekEarns.toLocaleString("en-ZA")}</p>
              <p className="text-[10px] text-primary/70">Earned (week)</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
              <p className="text-lg font-black text-foreground">{SHEETS.length}</p>
              <p className="text-[10px] text-muted-foreground">Days Logged</p>
            </div>
          </div>

          {/* Clock in/out */}
          <div className={`p-4 rounded-xl border-2 transition-all ${clocked ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${clocked ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                  {clocked ? "Clocked In — Session active" : "Not clocked in"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />Geo-tagged on clock-in
                </p>
              </div>
              <button
                onClick={() => { setClocked(p => !p); toast.success(clocked ? "Clocked out — timesheet saved" : "Clocked in — session started"); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${clocked ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
              >
                {clocked ? <><Square className="w-3 h-3" /> Clock Out</> : <><Play className="w-3 h-3" /> Clock In</>}
              </button>
            </div>
          </div>

          {/* Timesheet list */}
          <div className="space-y-2">
            {SHEETS.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="text-center min-w-[52px]">
                  <p className="text-[10px] font-bold text-foreground">{s.date.split(" ").slice(0,2).join(" ")}</p>
                  <p className="text-[10px] text-muted-foreground">{s.date.split(" ")[2]}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{s.client} · {s.venue}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.clockIn} – {s.clockOut ?? "Active"}{s.hours ? ` · ${s.hours}h` : ""}
                    {s.geoVerified && <span className="ml-1.5 text-emerald-600">✓ Geo</span>}
                  </p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_CFG[s.status]}`}>{s.status}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => toast.success("Invoice generated for R" + weekEarns.toLocaleString("en-ZA"))}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> Generate Invoice
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">SETA-compliant SLA templates for practitioner engagements</p>
          {SLA_TEMPLATES.map(tpl => (
            <div key={tpl} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{tpl}</p>
                <p className="text-[10px] text-muted-foreground">SETA-compliant · Editable PDF</p>
              </div>
              <button
                onClick={() => toast.success(`Downloaded: ${tpl}`)}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-primary font-semibold transition-opacity"
              >
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          ))}
          <button
            onClick={() => toast.info("Custom SLA builder — coming soon")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/30 text-xs font-semibold text-primary hover:bg-primary/5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Create Custom SLA
          </button>
        </div>
      )}
    </div>
  );
}
