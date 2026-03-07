import { Award, BadgeCheck, Download, ExternalLink, GraduationCap, FileText, Briefcase, Cpu } from "lucide-react";

// ─── Practitioner role badge types ───────────────────────────────────────────

type PractitionerRole = "Facilitator" | "Assessor" | "Moderator" | "SDF";

const PRACTITIONER_ROLE_CONFIG: Record<PractitionerRole, { icon: React.ElementType; color: string; bg: string }> = {
  Facilitator: { icon: GraduationCap, color: "text-primary",        bg: "bg-primary/10"      },
  Assessor:    { icon: FileText,      color: "text-blue-600",        bg: "bg-blue-500/10"     },
  Moderator:   { icon: Briefcase,     color: "text-purple-600",      bg: "bg-purple-500/10"   },
  SDF:         { icon: Cpu,           color: "text-orange-600",      bg: "bg-orange-500/10"   },
};

// ─── Credential types ─────────────────────────────────────────────────────────

interface Credential {
  id: string;
  title: string;
  issuer: string;
  issuedDate: string;
  expiryDate?: string;
  type: "Certificate" | "Badge" | "Qualification" | "Endorsement" | "Registration";
  nqfLevel?: number;
  practitionerRole?: PractitionerRole;
  seta?: string;
  regNumber?: string;
  verified: boolean;
  color: string;
}

const MOCK: Credential[] = [
  {
    id: "1",
    title: "Facilitator: ODETDP Unit Standards",
    issuer: "ETDP SETA",
    issuedDate: "Jun 2023",
    expiryDate: "Jun 2026",
    type: "Registration",
    nqfLevel: 5,
    practitionerRole: "Facilitator",
    seta: "ETDP SETA",
    regNumber: "ETDP-FAC-2023-04712",
    verified: true,
    color: "from-primary/20 to-primary/5",
  },
  {
    id: "2",
    title: "Registered Assessor: MICT SETA",
    issuer: "MICT SETA",
    issuedDate: "Mar 2022",
    expiryDate: "Mar 2025",
    type: "Registration",
    nqfLevel: 5,
    practitionerRole: "Assessor",
    seta: "MICT SETA",
    regNumber: "MICT-ASS-2022-00891",
    verified: true,
    color: "from-blue-500/15 to-blue-500/5",
  },
  {
    id: "3",
    title: "Moderator: MerSETA Engineering",
    issuer: "merSETA",
    issuedDate: "Sep 2023",
    type: "Registration",
    nqfLevel: 6,
    practitionerRole: "Moderator",
    seta: "merSETA",
    regNumber: "MERSETA-MOD-2023-00321",
    verified: true,
    color: "from-purple-500/15 to-purple-500/5",
  },
  {
    id: "4",
    title: "Skills Development Facilitator (SDF)",
    issuer: "SABPP / SETA Network",
    issuedDate: "Jan 2024",
    type: "Certificate",
    nqfLevel: 5,
    practitionerRole: "SDF",
    verified: true,
    color: "from-orange-500/15 to-orange-500/5",
  },
  {
    id: "5",
    title: "National Certificate: ODETDP",
    issuer: "ETDP SETA",
    issuedDate: "Nov 2021",
    type: "Qualification",
    nqfLevel: 5,
    verified: true,
    color: "from-accent/30 to-accent/10",
  },
  {
    id: "6",
    title: "Workplace Readiness Endorsement",
    issuer: "SkillsMark Platform",
    issuedDate: "Feb 2024",
    type: "Endorsement",
    verified: false,
    color: "from-muted to-muted/50",
  },
];

const typeColor: Record<Credential["type"], string> = {
  Qualification: "bg-primary/15 text-primary",
  Certificate:   "bg-accent/30 text-accent-foreground",
  Badge:         "bg-secondary/15 text-secondary-foreground",
  Endorsement:   "bg-muted text-muted-foreground",
  Registration:  "bg-emerald-500/15 text-emerald-700",
};

export function CredentialWalletWidget() {
  const verified = MOCK.filter(c => c.verified).length;
  const registrations = MOCK.filter(c => c.type === "Registration");

  return (
    <div className="space-y-4">

      {/* ── Header stats ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{MOCK.length} Credentials</p>
            <p className="text-xs text-muted-foreground">{verified} verified · {registrations.length} SETA registrations</p>
          </div>
        </div>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Share profile
        </button>
      </div>

      {/* ── Active SETA registrations ── */}
      {registrations.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">SETA Practitioner Registrations</p>
          <div className="grid grid-cols-2 gap-2">
            {registrations.map(reg => {
              const roleMeta = reg.practitionerRole ? PRACTITIONER_ROLE_CONFIG[reg.practitionerRole] : null;
              const RoleIcon = roleMeta?.icon ?? Award;
              return (
                <div key={reg.id} className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${roleMeta?.bg ?? "bg-muted"}`}>
                    <RoleIcon className={`w-3.5 h-3.5 ${roleMeta?.color ?? "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-foreground leading-tight">{reg.practitionerRole}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{reg.seta ?? reg.issuer}</p>
                    {reg.regNumber && (
                      <p className="text-[9px] font-mono text-muted-foreground/60 truncate">{reg.regNumber}</p>
                    )}
                    {reg.expiryDate && (
                      <p className="text-[9px] text-muted-foreground">Exp: {reg.expiryDate}</p>
                    )}
                  </div>
                  {reg.verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── All credential cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOCK.map((cred) => {
          const roleMeta = cred.practitionerRole ? PRACTITIONER_ROLE_CONFIG[cred.practitionerRole] : null;
          const RoleIcon = roleMeta?.icon;
          return (
            <div
              key={cred.id}
              className={`rounded-xl border border-border bg-gradient-to-br ${cred.color} p-4 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer`}
            >
              {cred.verified && (
                <div className="absolute top-3 right-3">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                </div>
              )}

              <div className="flex items-center gap-1.5 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${typeColor[cred.type]}`}>
                  {cred.type}
                </span>
                {cred.practitionerRole && roleMeta && RoleIcon && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${roleMeta.bg} ${roleMeta.color}`}>
                    <RoleIcon className="w-2.5 h-2.5" />{cred.practitionerRole}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-foreground leading-tight mb-1 pr-5">{cred.title}</p>
              <p className="text-xs text-muted-foreground">{cred.issuer}</p>

              {cred.regNumber && (
                <p className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">{cred.regNumber}</p>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-muted-foreground">
                  {cred.nqfLevel && <span className="mr-2">NQF {cred.nqfLevel}</span>}
                  <span>{cred.issuedDate}</span>
                  {cred.expiryDate && <span className="text-muted-foreground/60"> → {cred.expiryDate}</span>}
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
