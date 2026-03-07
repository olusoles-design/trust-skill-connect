import { Award, BadgeCheck, Download, ExternalLink } from "lucide-react";

interface Credential {
  id: string;
  title: string;
  issuer: string;
  issuedDate: string;
  expiryDate?: string;
  type: "Certificate" | "Badge" | "Qualification" | "Endorsement";
  nqfLevel?: number;
  verified: boolean;
  color: string;
}

const MOCK: Credential[] = [
  {
    id: "1",
    title: "National Certificate: IT Support",
    issuer: "MICT SETA",
    issuedDate: "Jun 2024",
    type: "Qualification",
    nqfLevel: 3,
    verified: true,
    color: "from-primary/20 to-primary/5",
  },
  {
    id: "2",
    title: "Project Management Fundamentals",
    issuer: "PMI Chapter SA",
    issuedDate: "Mar 2024",
    expiryDate: "Mar 2027",
    type: "Certificate",
    nqfLevel: 4,
    verified: true,
    color: "from-accent/30 to-accent/10",
  },
  {
    id: "3",
    title: "Microsoft Azure Fundamentals (AZ-900)",
    issuer: "Microsoft",
    issuedDate: "Jan 2024",
    expiryDate: "Jan 2026",
    type: "Badge",
    verified: true,
    color: "from-secondary/20 to-secondary/5",
  },
  {
    id: "4",
    title: "Workplace Readiness Endorsement",
    issuer: "SkillsMark Platform",
    issuedDate: "Feb 2024",
    type: "Endorsement",
    verified: false,
    color: "from-muted to-muted/50",
  },
];

const typeColor: Record<Credential["type"], string> = {
  Qualification:  "bg-primary/15 text-primary",
  Certificate:    "bg-accent/30 text-accent-foreground",
  Badge:          "bg-secondary/15 text-secondary-foreground",
  Endorsement:    "bg-muted text-muted-foreground",
};

export function CredentialWalletWidget() {
  const verified = MOCK.filter(c => c.verified).length;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{MOCK.length} Credentials</p>
            <p className="text-xs text-muted-foreground">{verified} verified by SkillsMark</p>
          </div>
        </div>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Share profile
        </button>
      </div>

      {/* Credential cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOCK.map((cred) => (
          <div
            key={cred.id}
            className={`rounded-xl border border-border bg-gradient-to-br ${cred.color} p-4 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer`}
          >
            {cred.verified && (
              <div className="absolute top-3 right-3">
                <BadgeCheck className="w-4 h-4 text-primary" />
              </div>
            )}

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${typeColor[cred.type]}`}>
              {cred.type}
            </span>

            <p className="text-sm font-semibold text-foreground leading-tight mb-1 pr-5">{cred.title}</p>
            <p className="text-xs text-muted-foreground">{cred.issuer}</p>

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
        ))}
      </div>
    </div>
  );
}
