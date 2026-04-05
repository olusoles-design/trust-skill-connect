import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Star, Clock, Award, Users, FileText, Briefcase, GraduationCap, Cpu, UserCheck, Building, CalendarClock } from "lucide-react";

// ─── Practitioner sub-types ────────────────────────────────────────────────

type PractitionerType = "facilitator" | "assessor" | "moderator" | "sdf";

interface PractitionerTypeMeta {
  label:       string;
  description: string;
  icon:        React.ElementType;
  color:       string;
  skills:      string[];
}

const PRACTITIONER_TYPES: Record<PractitionerType, PractitionerTypeMeta> = {
  facilitator: {
    label:       "Facilitator",
    description: "Delivers learning programmes to learners in classroom or workplace contexts.",
    icon:        GraduationCap,
    color:       "text-primary bg-primary/10",
    skills:      ["Programme Delivery", "Learner Support", "Group Facilitation", "Workplace Learning"],
  },
  assessor: {
    label:       "Assessor",
    description: "Assesses learner competence against unit standards / qualifications.",
    icon:        FileText,
    color:       "text-blue-600 bg-blue-500/10",
    skills:      ["Competence Assessment", "Portfolio of Evidence", "RPL Assessment", "Formative & Summative"],
  },
  moderator: {
    label:       "Moderator",
    description: "Moderates assessment practices to ensure quality and consistency.",
    icon:        Briefcase,
    color:       "text-purple-600 bg-purple-500/10",
    skills:      ["Assessment Moderation", "Quality Assurance", "ETQA Compliance", "Assessor Guidance"],
  },
  sdf: {
    label:       "Skills Development Facilitator",
    description: "Assists organisations with workplace skills planning, WSP/ATR submissions and SETA liaison.",
    icon:        Cpu,
    color:       "text-orange-600 bg-orange-500/10",
    skills:      ["WSP/ATR Compilation", "SETA Liaison", "Skills Audit", "Learnership Management", "B-BBEE Reporting"],
  },
};

// ─── Employment status ───────────────────────────────────────────────────────

type EmploymentStatus = "freelance" | "employed_permanent" | "employed_fixed";

interface EmploymentMeta {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const EMPLOYMENT_STATUSES: Record<EmploymentStatus, EmploymentMeta> = {
  freelance: {
    label: "Freelance / Independent",
    description: "Available for any contract, project or gig work",
    icon: UserCheck,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  employed_permanent: {
    label: "Employed – Permanent",
    description: "Permanently employed; may accept side work with employer consent",
    icon: Building,
    color: "text-blue-600 bg-blue-500/10",
  },
  employed_fixed: {
    label: "Employed – Fixed-Term",
    description: "On a fixed-term contract; available after end date or for parallel work",
    icon: CalendarClock,
    color: "text-orange-600 bg-orange-500/10",
  },
};

// ─── Contract data ────────────────────────────────────────────────────────────

interface Contract {
  id: string;
  client: string;
  programme: string;
  type: PractitionerType;
  startDate: string;
  endDate: string;
  days: number;
  rate: string;
  status: "active" | "upcoming" | "completed";
}

const CONTRACTS: Contract[] = [
  { id:"1", client:"Bytes Academy",   programme:"IT Support NQF3",         type:"facilitator", startDate:"15 Jan", endDate:"30 Nov", days:45, rate:"R1 800/day", status:"active"    },
  { id:"2", client:"TIH Training",    programme:"Data Analytics NQF4",      type:"assessor",    startDate:"01 Feb", endDate:"28 Feb", days:8,  rate:"R2 200/day", status:"upcoming"  },
  { id:"3", client:"Empower SA",      programme:"Management NQF4",          type:"moderator",   startDate:"Sep 24", endDate:"Nov 24", days:6,  rate:"R2 500/day", status:"completed" },
  { id:"4", client:"JSE Listed Co.",  programme:"Annual WSP/ATR & B-BBEE",  type:"sdf",         startDate:"Jan 25", endDate:"Mar 25", days:20, rate:"R1 950/day", status:"completed" },
];

const STATUS_CFG = {
  active:    "bg-emerald-500/10 text-emerald-600",
  upcoming:  "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
};

const reputationScore = 87;
const reputationLabel = reputationScore >= 90 ? "Elite" : reputationScore >= 75 ? "Trusted" : "Rising";
const reputationColor = reputationScore >= 90 ? "text-yellow-500" : reputationScore >= 75 ? "text-primary" : "text-muted-foreground";

export function AvailabilityToggleWidget() {
  const [available,        setAvailable]        = useState(true);
  const [visibility,       setVisibility]       = useState<"public" | "sdp_only">("public");
  const [activePractTypes, setActivePractTypes] = useState<PractitionerType[]>(["facilitator", "assessor"]);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("freelance");

  const toggleType = (t: PractitionerType) =>
    setActivePractTypes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );

  return (
    <div className="space-y-4">

      {/* ── Availability toggle ─────────────────────────────────────────────── */}
      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${available ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/30"}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full transition-colors ${available ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
              <p className="text-sm font-bold text-foreground">
                {available ? "Available for Work" : "Not Available"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {available ? "You appear in SDP & Employer search results" : "Hidden from all searches"}
            </p>
          </div>
          <Switch checked={available} onCheckedChange={setAvailable} className="data-[state=checked]:bg-emerald-500" />
        </div>

        {available && (
          <div className="mt-3 flex gap-2">
            {(["public", "sdp_only"] as const).map(v => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${visibility === v ? "bg-emerald-500 text-white border-emerald-500" : "border-border text-muted-foreground"}`}
              >
                {v === "public" ? "🌍 Fully Public" : "🔒 SDPs Only"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Employment Status ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Employment Status</p>
          <p className="text-[10px] text-muted-foreground">Select one</p>
        </div>
        <div className="flex flex-col gap-2">
          {(Object.entries(EMPLOYMENT_STATUSES) as [EmploymentStatus, EmploymentMeta][]).map(([key, meta]) => {
            const Icon = meta.icon;
            const active = employmentStatus === key;
            return (
              <button
                key={key}
                onClick={() => setEmploymentStatus(key)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  active ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? meta.color : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">{meta.label}</span>
                    <p className="text-[10px] text-muted-foreground leading-snug">{meta.description}</p>
                  </div>
                  {active && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">Selected</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Practitioner type selection ─────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">My Practitioner Roles</p>
          <p className="text-[10px] text-muted-foreground">Select all that apply</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(PRACTITIONER_TYPES) as [PractitionerType, PractitionerTypeMeta][]).map(([key, meta]) => {
            const Icon = meta.icon;
            const active = activePractTypes.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleType(key)}
                className={`text-left p-3 rounded-xl border-2 transition-all space-y-1.5 ${
                  active ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? meta.color : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground leading-tight">{meta.label}</span>
                  {active && (
                    <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active type skills preview */}
      {activePractTypes.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Search tags visible to SDPs & Employers</p>
          <div className="flex flex-wrap gap-1">
            {activePractTypes.flatMap(t => PRACTITIONER_TYPES[t].skills).map(skill => (
              <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Reputation Score ────────────────────────────────────────────────── */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <p className="text-xs font-semibold text-foreground">Reputation Score</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-black ${reputationColor}`}>{reputationScore}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${reputationColor} bg-muted`}>{reputationLabel}</span>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-yellow-500 transition-all duration-700" style={{ width: `${reputationScore}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          {[
            { label:"Learner Feedback", val:"4.7★" },
            { label:"Pass Rate",        val:"91%" },
            { label:"Contracts Done",   val:"7" },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-card border border-border p-2">
              <p className="text-xs font-bold text-foreground">{s.val}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contracts ───────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">My Contracts</p>
        <div className="space-y-2">
          {CONTRACTS.map(c => {
            const typeMeta = PRACTITIONER_TYPES[c.type];
            const TypeIcon = typeMeta.icon;
            return (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeMeta.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-foreground truncate">{c.client}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_CFG[c.status]}`}>{c.status}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${typeMeta.color}`}>{typeMeta.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.programme}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{c.startDate} – {c.endDate}</span>
                    <span className="font-semibold text-foreground">{c.rate}</span>
                    <span>{c.days} days</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
