import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Star, Clock, FileText, Briefcase, GraduationCap, Cpu, UserCheck, Building, CalendarClock, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

// ─── Contract type ─────────────────────────────────────────────────────────

interface Contract {
  id: string;
  client_name: string;
  programme: string;
  practitioner_type: PractitionerType;
  start_date: string | null;
  end_date: string | null;
  total_days: number;
  daily_rate: number;
  currency: string;
  status: string;
}

const STATUS_CFG: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-600",
  upcoming:  "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
};

export function AvailabilityToggleWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [available, setAvailable]               = useState(true);
  const [visibility, setVisibility]             = useState<"public" | "sdp_only">("public");
  const [activePractTypes, setActivePractTypes] = useState<PractitionerType[]>(["facilitator", "assessor"]);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("freelance");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showAddContract, setShowAddContract] = useState(false);
  const [newContract, setNewContract] = useState({ client_name: "", programme: "", practitioner_type: "facilitator" as PractitionerType, total_days: 1, daily_rate: 0, status: "active" });
  const [contractSaving, setContractSaving] = useState(false);

  // ── Load from profile + contracts ───────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, contractsRes] = await Promise.all([
        supabase.from("profiles").select("availability, demographics").eq("user_id", user.id).maybeSingle(),
        supabase.from("practitioner_contracts").select("*").eq("practitioner_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) {
        setAvailable(profileRes.data.availability === "available" || profileRes.data.availability === "flexible");
        const demo = (profileRes.data.demographics ?? {}) as Record<string, unknown>;
        if (demo.visibility === "sdp_only") setVisibility("sdp_only");
        if (demo.employment_status && typeof demo.employment_status === "string") {
          setEmploymentStatus(demo.employment_status as EmploymentStatus);
        }
        if (Array.isArray(demo.practitioner_types)) {
          setActivePractTypes(demo.practitioner_types as PractitionerType[]);
        }
      }
      if (contractsRes.data) {
        setContracts(contractsRes.data.map(c => ({
          ...c,
          practitioner_type: c.practitioner_type as PractitionerType,
        })));
      }
      setLoading(false);
    })();
  }, [user]);

  const addContract = async () => {
    if (!user || !newContract.client_name || !newContract.programme) return;
    setContractSaving(true);
    const { data, error } = await supabase.from("practitioner_contracts").insert({
      practitioner_id: user.id,
      ...newContract,
    }).select().single();
    setContractSaving(false);
    if (error) {
      toast({ title: "Failed to add contract", description: error.message, variant: "destructive" });
    } else if (data) {
      setContracts(prev => [{ ...data, practitioner_type: data.practitioner_type as PractitionerType }, ...prev]);
      setNewContract({ client_name: "", programme: "", practitioner_type: "facilitator", total_days: 1, daily_rate: 0, status: "active" });
      setShowAddContract(false);
      toast({ title: "Contract added" });
    }
  };

  // ── Save to profile ─────────────────────────────────────────────────────
  const save = useCallback(async (
    avail: boolean, vis: string, empStatus: string, practTypes: PractitionerType[]
  ) => {
    if (!user) return;
    setSaving(true);

    // First get current demographics to merge
    const { data: current } = await supabase
      .from("profiles")
      .select("demographics")
      .eq("user_id", user.id)
      .maybeSingle();

    const existingDemo = (current?.demographics ?? {}) as Record<string, unknown>;

    const { error } = await supabase
      .from("profiles")
      .update({
        availability: avail ? (vis === "sdp_only" ? "available" : "available") : "unavailable",
        demographics: {
          ...existingDemo,
          visibility: vis,
          employment_status: empStatus,
          practitioner_types: practTypes,
        },
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    }
  }, [user, toast]);

  // Auto-save on changes
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => save(available, visibility, employmentStatus, activePractTypes), 600);
    return () => clearTimeout(t);
  }, [available, visibility, employmentStatus, activePractTypes, loading, save]);

  const toggleType = (t: PractitionerType) =>
    setActivePractTypes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );

  const reputationScore = 87;
  const reputationLabel = reputationScore >= 90 ? "Elite" : reputationScore >= 75 ? "Trusted" : "Rising";
  const reputationColor = reputationScore >= 90 ? "text-yellow-500" : reputationScore >= 75 ? "text-primary" : "text-muted-foreground";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving…
        </div>
      )}

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
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground">My Contracts</p>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setShowAddContract(!showAddContract)}>
            {showAddContract ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showAddContract ? "Cancel" : "Add"}
          </Button>
        </div>

        {showAddContract && (
          <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2 mb-3">
            <Input placeholder="Client name" value={newContract.client_name} onChange={e => setNewContract(p => ({ ...p, client_name: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Programme" value={newContract.programme} onChange={e => setNewContract(p => ({ ...p, programme: e.target.value }))} className="h-8 text-xs" />
            <div className="grid grid-cols-3 gap-2">
              <select value={newContract.practitioner_type} onChange={e => setNewContract(p => ({ ...p, practitioner_type: e.target.value as PractitionerType }))} className="h-8 text-xs rounded-md border border-border bg-background px-2">
                {(Object.entries(PRACTITIONER_TYPES) as [PractitionerType, PractitionerTypeMeta][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <Input type="number" placeholder="Days" value={newContract.total_days} onChange={e => setNewContract(p => ({ ...p, total_days: +e.target.value }))} className="h-8 text-xs" />
              <Input type="number" placeholder="Rate/day" value={newContract.daily_rate || ""} onChange={e => setNewContract(p => ({ ...p, daily_rate: +e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={newContract.status} onChange={e => setNewContract(p => ({ ...p, status: e.target.value }))} className="h-8 text-xs rounded-md border border-border bg-background px-2">
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
              <Button size="sm" className="h-8 text-xs" onClick={addContract} disabled={contractSaving || !newContract.client_name}>
                {contractSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Contract"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {contracts.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-4">No contracts yet. Click "Add" to create one.</p>
          )}
          {contracts.map(c => {
            const typeMeta = PRACTITIONER_TYPES[c.practitioner_type] ?? PRACTITIONER_TYPES.facilitator;
            const TypeIcon = typeMeta.icon;
            const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }) : "—";
            return (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeMeta.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-foreground truncate">{c.client_name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_CFG[c.status]}`}>{c.status}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${typeMeta.color}`}>{typeMeta.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.programme}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{fmtDate(c.start_date)} – {fmtDate(c.end_date)}</span>
                    <span className="font-semibold text-foreground">R{c.daily_rate.toLocaleString()}/day</span>
                    <span>{c.total_days} days</span>
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
