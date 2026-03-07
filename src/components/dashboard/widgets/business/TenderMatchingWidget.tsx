import { ExternalLink, Calendar, Tag } from "lucide-react";

interface Tender {
  id: string;
  title: string;
  department: string;
  value: string;
  matchScore: number;
  closing: string;
  categories: string[];
  province: string;
  status: "new" | "closing_soon" | "open";
}

const MOCK: Tender[] = [
  {
    id:"1", title:"Provision of ICT Training Services — Western Cape",
    department:"DTPW", value:"R2.4M", matchScore:94,
    closing:"15 Nov 2025", categories:["ICT","Training"], province:"Western Cape", status:"closing_soon",
  },
  {
    id:"2", title:"Skills Development Programme for Youth — Gauteng",
    department:"COGTA", value:"R5.8M", matchScore:87,
    closing:"30 Nov 2025", categories:["Skills Dev","Youth"], province:"Gauteng", status:"new",
  },
  {
    id:"3", title:"E-Learning Platform Development & Support",
    department:"DHET", value:"R1.2M", matchScore:82,
    closing:"10 Dec 2025", categories:["EdTech","Software"], province:"National", status:"open",
  },
  {
    id:"4", title:"Supply of Learning Materials — KZN TVET Colleges",
    department:"KZN Education", value:"R890K", matchScore:78,
    closing:"25 Nov 2025", categories:["Materials","TVET"], province:"KwaZulu-Natal", status:"new",
  },
];

const statusConfig = {
  new:          { label:"New",          color:"bg-primary/15 text-primary" },
  closing_soon: { label:"Closing Soon", color:"bg-destructive/10 text-destructive" },
  open:         { label:"Open",         color:"bg-green-500/15 text-green-600" },
};

function MatchBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-green-600 bg-green-500/15" : score >= 80 ? "text-primary bg-primary/15" : "text-accent-foreground bg-accent/20";
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl ${color} flex-shrink-0`}>
      <span className="text-lg font-bold">{score}%</span>
      <span className="text-[10px] font-medium">Match</span>
    </div>
  );
}

export function TenderMatchingWidget() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{MOCK.length} tenders matched to your profile</p>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {MOCK.map(tender => {
        const cfg = statusConfig[tender.status];
        return (
          <div key={tender.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all cursor-pointer">
            <MatchBadge score={tender.matchScore} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground leading-tight">{tender.title}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{tender.department} · {tender.province}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground">{tender.value}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" /> {tender.closing}
                </span>
                {tender.categories.map(cat => (
                  <span key={cat} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    <Tag className="w-2.5 h-2.5" />{cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
