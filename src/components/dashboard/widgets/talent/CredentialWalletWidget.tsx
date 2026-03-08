import { Award, BadgeCheck, Download, ExternalLink, GraduationCap, FileText, Briefcase, Cpu, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, format } from "date-fns";

// ─── Role config ───────────────────────────────────────────────────────────────
type PractitionerRole = "Facilitator" | "Assessor" | "Moderator" | "SDF";

const ROLE_CONFIG: Record<PractitionerRole, { icon: React.ElementType; color: string; bg: string }> = {
  Facilitator: { icon: GraduationCap, color: "text-primary",        bg: "bg-primary/10"      },
  Assessor:    { icon: FileText,      color: "text-blue-600",        bg: "bg-blue-500/10"     },
  Moderator:   { icon: Briefcase,     color: "text-purple-600",      bg: "bg-purple-500/10"   },
  SDF:         { icon: Cpu,           color: "text-orange-600",      bg: "bg-orange-500/10"   },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function detectRole(docType: string): PractitionerRole | null {
  if (docType.includes("facilitator")) return "Facilitator";
  if (docType.includes("assessor"))    return "Assessor";
  if (docType.includes("moderator"))   return "Moderator";
  if (docType.includes("sdf"))         return "SDF";
  return null;
}

function expiryTag(expires_at: string | null) {
  if (!expires_at) return null;
  const days = differenceInDays(parseISO(expires_at), new Date());
  if (days < 0)  return <span className="text-[10px] text-destructive">Expired</span>;
  if (days < 30) return <span className="text-[10px] text-orange-600">Exp in {days}d</span>;
  return <span className="text-[10px] text-muted-foreground">{format(parseISO(expires_at), "dd MMM yyyy")}</span>;
}

interface VaultDoc {
  id: string;
  doc_type: string;
  label: string;
  file_url: string;
  file_name: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export function CredentialWalletWidget() {
  const { user } = useAuth();

  const { data: docs = [], isLoading } = useQuery<VaultDoc[]>({
    queryKey: ["credential_wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from("document_vault" as any) as any)
        .select("id, doc_type, label, file_url, file_name, status, expires_at, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as VaultDoc[];
    },
  });

  const verified   = docs.filter(d => d.status === "verified").length;
  const practDocs  = docs.filter(d => d.doc_type.startsWith("practitioner_"));
  const registrations = practDocs.filter(d => d.status === "verified");
  const otherDocs  = docs.filter(d => !d.doc_type.startsWith("practitioner_"));

  // Group practitioner docs by role
  const byRole = (role: PractitionerRole) =>
    practDocs.filter(d => detectRole(d.doc_type) === role);

  const activeRoles = (Object.keys(ROLE_CONFIG) as PractitionerRole[]).filter(r => byRole(r).length > 0);

  if (!user) return null;

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
  );

  if (docs.length === 0) return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Award className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Credential Wallet</p>
          <p className="text-xs text-muted-foreground">No credentials yet</p>
        </div>
      </div>
      <div className="text-center py-8 space-y-2">
        <Lock className="w-8 h-8 mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Upload documents in the Practitioner Accreditations section</p>
        <p className="text-xs text-muted-foreground/60">Verified documents will automatically appear here</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{docs.length} Credentials</p>
            <p className="text-xs text-muted-foreground">{verified} verified · {registrations.length} SETA registrations</p>
          </div>
        </div>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Share profile
        </button>
      </div>

      {/* Trust bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${docs.length === 0 ? 0 : Math.round((verified / docs.length) * 100)}%` }}
        />
      </div>

      {/* Active SETA Practitioner roles */}
      {activeRoles.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">SETA Practitioner Registrations</p>
          <div className="grid grid-cols-2 gap-2">
            {activeRoles.map(role => {
              const cfg = ROLE_CONFIG[role];
              const Icon = cfg.icon;
              const roleDocs = byRole(role);
              const hasVerified = roleDocs.some(d => d.status === "verified");
              const latest = roleDocs[0];
              return (
                <div key={role} className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-foreground leading-tight">{role}</p>
                    <p className="text-[10px] text-muted-foreground">{roleDocs.length} doc{roleDocs.length !== 1 ? "s" : ""}</p>
                    {latest?.expires_at && <div className="mt-0.5">{expiryTag(latest.expires_at)}</div>}
                  </div>
                  {hasVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All credential cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map(doc => {
          const role = detectRole(doc.doc_type);
          const roleCfg = role ? ROLE_CONFIG[role] : null;
          const RoleIcon = roleCfg?.icon;
          const isVerified = doc.status === "verified";
          const gradientClass = roleCfg
            ? role === "Assessor" ? "from-blue-500/15 to-blue-500/5"
            : role === "Moderator" ? "from-purple-500/15 to-purple-500/5"
            : role === "SDF" ? "from-orange-500/15 to-orange-500/5"
            : "from-primary/20 to-primary/5"
            : "from-muted to-muted/50";

          return (
            <div
              key={doc.id}
              className={`rounded-xl border border-border bg-gradient-to-br ${gradientClass} p-4 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer`}
            >
              {isVerified && (
                <div className="absolute top-3 right-3">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                </div>
              )}

              {/* Badges */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isVerified ? "bg-emerald-500/15 text-emerald-700" :
                  doc.status === "rejected" ? "bg-destructive/15 text-destructive" :
                  "bg-yellow-500/15 text-yellow-700"
                }`}>
                  {isVerified ? "Verified" : doc.status === "rejected" ? "Rejected" : "Pending"}
                </span>
                {role && roleCfg && RoleIcon && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${roleCfg.bg} ${roleCfg.color}`}>
                    <RoleIcon className="w-2.5 h-2.5" />{role}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-foreground leading-tight mb-1 pr-5">{doc.label}</p>
              <p className="text-xs text-muted-foreground">{doc.file_name}</p>

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-muted-foreground">
                  {doc.expires_at && expiryTag(doc.expires_at)}
                  {!doc.expires_at && (
                    <span>{format(parseISO(doc.created_at), "MMM yyyy")}</span>
                  )}
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
