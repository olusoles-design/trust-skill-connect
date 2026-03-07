import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Loader2, Upload, CheckCircle2, Plus, Trash2, LogIn, UserPlus, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ROLE_PERSONA } from "@/lib/permissions";
import type { AppRole } from "@/lib/permissions";

// ─── Types ──────────────────────────────────────────────────────────────────

type Role = AppRole | null;
type PractitionerRole = "facilitator" | "assessor" | "moderator" | "sdf" | "mentor" | null;
type PlanName = "Starter" | "Professional" | "Enterprise" | null;

interface RoleCard {
  id: AppRole;
  emoji: string;
  title: string;
  description: string;
}

// ─── Hub definitions (step 1) ─────────────────────────────────────────────────

const HUBS: {
  key: string;
  emoji: string;
  label: string;
  tagline: string;
  description: string;
  accentClass: string;
  borderClass: string;
  bgGlow: string;
  roles: RoleCard[];
}[] = [
  {
    key: "talent",
    emoji: "🎓",
    label: "Talent",
    tagline: "Learn · Earn · Grow",
    description: "For individuals seeking skills, learnerships, bursaries and employment.",
    accentClass: "text-primary",
    borderClass: "border-primary/30 hover:border-primary",
    bgGlow: "hover:bg-primary/5",
    roles: [
      { id: "learner",      emoji: "🎓", title: "Learner",       description: "Seeking learnerships, bursaries & jobs" },
      { id: "practitioner", emoji: "👨‍🏫", title: "Practitioner",  description: "Facilitators, assessors, moderators & SDFs" },
    ],
  },
  {
    key: "business",
    emoji: "🏢",
    label: "Business",
    tagline: "Hire · Train · Comply",
    description: "For companies, training providers and service suppliers driving skills development.",
    accentClass: "text-accent-foreground",
    borderClass: "border-accent/40 hover:border-accent",
    bgGlow: "hover:bg-accent/5",
    roles: [
      { id: "employer",        emoji: "🏢", title: "Employer",          description: "Hiring talent and managing learner intakes" },
      { id: "provider",        emoji: "🏫", title: "Training Provider", description: "Accredited SDPs delivering programmes" },
      { id: "support_provider",emoji: "🛠️", title: "Support Provider",  description: "Materials, equipment & service suppliers" },
    ],
  },
  {
    key: "funding",
    emoji: "💰",
    label: "Funding",
    tagline: "Fund · Track · Impact",
    description: "For entities that finance skills development and track training investment.",
    accentClass: "text-gold",
    borderClass: "border-gold/30 hover:border-gold",
    bgGlow: "hover:bg-gold/5",
    roles: [
      { id: "sponsor", emoji: "💼", title: "Sponsor", description: "B-BBEE funding, hiring & learner pipelines" },
      { id: "fundi",   emoji: "💰", title: "Fundi",   description: "Independent learner funders & bursary bodies" },
    ],
  },
  {
    key: "oversight",
    emoji: "🏛️",
    label: "Oversight",
    tagline: "Regulate · Verify · Report",
    description: "For regulatory bodies, government entities and platform administrators.",
    accentClass: "text-destructive",
    borderClass: "border-destructive/30 hover:border-destructive",
    bgGlow: "hover:bg-destructive/5",
    roles: [
      { id: "seta",       emoji: "🏛️", title: "SETA Official",  description: "Accreditation, verification & sector reporting" },
      { id: "government", emoji: "🏗️", title: "Government",     description: "Tender oversight, skills reporting & policy" },
      { id: "admin",      emoji: "🛡️", title: "Platform Admin", description: "Full platform management & moderation" },
    ],
  },
];

const PRACTITIONER_ROLES = [
  { id: "facilitator", label: "Facilitator",                    sub: "Delivers accredited training" },
  { id: "assessor",    label: "Assessor",                       sub: "Evaluates learner competency" },
  { id: "moderator",   label: "Moderator",                      sub: "Quality assures assessments" },
  { id: "sdf",         label: "Skills Development Facilitator", sub: "Strategic L&D advisor" },
  { id: "mentor",      label: "Mentor",                         sub: "Coaching & workplace guidance" },
];

// ─── Document upload definitions ──────────────────────────────────────────────

interface DocRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

const ROLE_DOCUMENTS: Partial<Record<AppRole, DocRequirement[]>> = {
  learner: [
    { id: "id_document",   label: "South African ID / Passport",  description: "Clear copy, not expired", required: true },
    { id: "matric",        label: "Matric Certificate",           description: "Grade 12 or equivalent",  required: false },
    { id: "qualification", label: "Highest Qualification",        description: "If applicable",           required: false },
  ],
  practitioner: [
    { id: "id_document",       label: "South African ID / Passport",   description: "Clear copy, not expired",                    required: true },
    { id: "etdp_registration", label: "ETDP Registration Certificate", description: "Assessor / Facilitator / Moderator",          required: true },
    { id: "qualification",     label: "Relevant Qualification",        description: "NQF level 5+",                               required: false },
  ],
  provider: [
    { id: "accreditation_cert", label: "SETA Accreditation Certificate", description: "Valid accreditation letter",    required: true },
    { id: "company_reg",        label: "Company Registration (CIPC)",    description: "COR14.3 or similar",            required: true },
    { id: "bbbee_cert",         label: "B-BBEE Certificate",             description: "Current level certificate",     required: false },
  ],
  employer: [
    { id: "company_reg", label: "Company Registration (CIPC)", description: "COR14.3 or similar",            required: true },
    { id: "bbbee_cert",  label: "B-BBEE Certificate",          description: "Current level certificate",     required: false },
    { id: "levy_proof",  label: "SDL Levy Proof",              description: "SARS skills levy registration", required: false },
  ],
  sponsor: [
    { id: "company_reg",    label: "Company Registration (CIPC)",  description: "COR14.3 or similar",         required: true },
    { id: "bbbee_cert",     label: "B-BBEE Certificate",           description: "Current level certificate",  required: true },
    { id: "mandate_letter", label: "Mandate / Board Resolution",   description: "Authorising skills funding", required: false },
  ],
  seta: [
    { id: "appointment_letter", label: "SETA Appointment Letter", description: "Official DHET / SETA letter", required: true },
    { id: "id_document",        label: "South African ID",         description: "Clear copy, not expired",    required: true },
  ],
  government: [
    { id: "appointment_letter", label: "Government Appointment Letter", description: "Departmental authorisation", required: true },
    { id: "id_document",        label: "South African ID",              description: "Clear copy, not expired",   required: true },
  ],
};

// Role-specific extra fields shown in Step 3
const ROLE_EXTRA_FIELDS: Partial<Record<AppRole, React.FC<{ form: FormState; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void }>>> = {
  sponsor: ({ form, onChange }) => (
    <>
      <FieldRow label="Company Name">
        <input name="companyName" value={form.companyName} onChange={onChange} className={INPUT_CLS} placeholder="Acme Corp (Pty) Ltd" />
      </FieldRow>
      <FieldRow label="Job Title">
        <input name="jobTitle" value={form.jobTitle} onChange={onChange} className={INPUT_CLS} placeholder="HR / L&D Manager" />
      </FieldRow>
    </>
  ),
  employer: ({ form, onChange }) => (
    <>
      <FieldRow label="Company Name">
        <input name="companyName" value={form.companyName} onChange={onChange} className={INPUT_CLS} placeholder="Company (Pty) Ltd" />
      </FieldRow>
      <FieldRow label="Job Title">
        <input name="jobTitle" value={form.jobTitle} onChange={onChange} className={INPUT_CLS} placeholder="HR Director" />
      </FieldRow>
    </>
  ),
  fundi: ({ form, onChange }) => (
    <FieldRow label="Organisation / Fund Name">
      <input name="companyName" value={form.companyName} onChange={onChange} className={INPUT_CLS} placeholder="e.g. Ubuntu Bursary Trust" />
    </FieldRow>
  ),
  provider: ({ form, onChange }) => (
    <>
      <FieldRow label="SDP / Institution Name">
        <input name="sdpName" value={form.sdpName} onChange={onChange} className={INPUT_CLS} placeholder="ABC Training Institute" />
      </FieldRow>
      <FieldRow label="SETA Accreditation Number">
        <input name="accreditationNumber" value={form.accreditationNumber} onChange={onChange} className={INPUT_CLS} placeholder="e.g. ETDP/ACC/0001/22" />
      </FieldRow>
    </>
  ),
  practitioner: ({ form, onChange }) => (
    <FieldRow label="ETDP / Assessor Registration">
      <input name="accreditationNumber" value={form.accreditationNumber} onChange={onChange} className={INPUT_CLS} placeholder="Registration or certificate number" />
    </FieldRow>
  ),
  support_provider: ({ form, onChange }) => (
    <FieldRow label="Service Category">
      <select name="serviceCategory" value={form.serviceCategory} onChange={onChange} className={INPUT_CLS}>
        <option value="" className="bg-navy">Select a category</option>
        <option value="materials"    className="bg-navy">Learning Material Development</option>
        <option value="furniture"    className="bg-navy">Furniture & Classroom Equipment</option>
        <option value="reprographic" className="bg-navy">Reprographic & Printing Services</option>
        <option value="equipment"    className="bg-navy">Training Equipment & Simulators</option>
        <option value="venue"        className="bg-navy">Venue & Facility Rentals</option>
        <option value="technology"   className="bg-navy">Technology & Software Solutions</option>
      </select>
    </FieldRow>
  ),
  seta: ({ form, onChange }) => (
    <FieldRow label="SETA Name">
      <select name="companyName" value={form.companyName} onChange={onChange} className={INPUT_CLS}>
        <option value="" className="bg-navy">Select your SETA</option>
        {["AGRISETA","BANKSETA","CHIETA","CTFL","CETA","ETDP SETA","FASSET","FOODBEV","HWSETA","INSETA","LGSETA","MERSETA","MICT SETA","MQA","POSHEITA","PSETA","SASSETA","SERVICES SETA","TETA","W&RSETA"].map(s => (
          <option key={s} value={s} className="bg-navy">{s}</option>
        ))}
      </select>
    </FieldRow>
  ),
  government: ({ form, onChange }) => (
    <FieldRow label="Department / Entity">
      <input name="companyName" value={form.companyName} onChange={onChange} className={INPUT_CLS} placeholder="e.g. DHET, DPSA, COGTA" />
    </FieldRow>
  ),
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT_CLS = "w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm transition-colors";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/60 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-white/40">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? "text-teal" : "text-white"}`}>{value}</span>
    </div>
  );
}

// ─── Document Uploader ────────────────────────────────────────────────────────

interface UploadedFile { docId: string; file: File; }

function DocumentUploader({ docs, uploads, onAdd, onRemove }: {
  docs: DocRequirement[];
  uploads: UploadedFile[];
  onAdd: (docId: string, file: File) => void;
  onRemove: (docId: string) => void;
}) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  return (
    <div className="space-y-3">
      {docs.map((doc) => {
        const uploaded = uploads.find((u) => u.docId === doc.id);
        return (
          <div key={doc.id} className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${uploaded ? "border-teal/40 bg-teal/5" : "border-white/10 bg-white/3"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white">{doc.label}</span>
                {doc.required && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Required</span>}
                {uploaded && <CheckCircle2 className="w-4 h-4 text-teal ml-auto flex-shrink-0" />}
              </div>
              <p className="text-xs text-white/40 mt-0.5">{doc.description}</p>
              {uploaded && <p className="text-xs text-teal/70 mt-1 truncate">{uploaded.file.name}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {uploaded ? (
                <button onClick={() => onRemove(doc.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive/70 hover:text-destructive transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={() => inputRefs.current[doc.id]?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition-all">
                  <Upload className="w-3 h-3" /> Upload
                </button>
              )}
              <input ref={(el) => { inputRefs.current[doc.id] = el; }} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) onAdd(doc.id, file); e.target.value = ""; }} />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-white/30 text-center pt-1">Accepted: PDF, JPG, PNG · Max 10MB · Reviewed within 24h</p>
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  username: string; email: string; password: string;
  firstName: string; lastName: string; phone: string;
  companyName: string; jobTitle: string; sdpName: string;
  accreditationNumber: string; serviceCategory: string;
}
const EMPTY_FORM: FormState = {
  username: "", email: "", password: "", firstName: "", lastName: "", phone: "",
  companyName: "", jobTitle: "", sdpName: "", accreditationNumber: "", serviceCategory: "",
};

interface Props { open: boolean; onClose: () => void; initialRole?: Role; }

// ─── Hub accent helpers ───────────────────────────────────────────────────────

const HUB_ACCENT: Record<string, string> = {
  talent: "text-primary border-primary/30 bg-primary/10",
  business: "text-accent-foreground border-accent/30 bg-accent/10",
  funding: "text-gold border-gold/30 bg-gold/10",
  oversight: "text-destructive border-destructive/30 bg-destructive/10",
};

// ─── Progress stepper ─────────────────────────────────────────────────────────

function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < current ? "bg-teal" : "bg-white/10"}`} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GetStartedModal({ open, onClose, initialRole = null }: Props) {
  const { toast } = useToast();

  // Mode: "entry" | "login" | "register"
  const [mode, setMode]                         = useState<"entry" | "login" | "register">("entry");

  // Register sub-steps: 1=hub, 2=role, 3=form, 4=docs, 5=plan, 6=confirm
  const [step, setStep]                         = useState(1);
  const [selectedHub, setSelectedHub]           = useState<string | null>(null);
  const [selectedRole, setSelectedRole]         = useState<Role>(initialRole);
  const [additionalRoles, setAdditionalRoles]   = useState<AppRole[]>([]);
  const [practitionerRole, setPractitionerRole] = useState<PractitionerRole>(null);
  const [selectedPlan, setSelectedPlan]         = useState<PlanName>(null);
  const [submitting, setSubmitting]             = useState(false);
  const [form, setForm]                         = useState<FormState>(EMPTY_FORM);
  const [uploads, setUploads]                   = useState<UploadedFile[]>([]);

  // Sync initial role
  useEffect(() => {
    if (open) {
      if (initialRole) {
        const hub = HUBS.find(h => h.roles.some(r => r.id === initialRole));
        setSelectedHub(hub?.key ?? null);
        setSelectedRole(initialRole);
        setMode("register");
        setStep(3);
      } else {
        setMode("entry");
        setStep(1);
        setSelectedHub(null);
        setSelectedRole(null);
      }
    }
  }, [open, initialRole]);

  // ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const resetModal = useCallback(() => {
    setMode("entry"); setStep(1); setSelectedHub(null); setSelectedRole(null);
    setPractitionerRole(null); setAdditionalRoles([]); setSelectedPlan(null);
    setForm(EMPTY_FORM); setUploads([]);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(resetModal, 300);
  }, [onClose, resetModal]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleAdditionalRole = (role: AppRole) => {
    if (role === selectedRole) return;
    setAdditionalRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  // ── Sign In ───────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "Signed in successfully." });
      handleClose();
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      toast({ title: "Sign-in failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;

      const uid = data.user?.id;
      const hasSession = !!data.session; // auto-confirm gives a session immediately

      if (uid && hasSession) {
        // User is immediately authenticated — safe to write profile & role
        await supabase.from("profiles").upsert({
          user_id: uid,
          first_name: form.firstName || null,
          last_name: form.lastName || null,
          username: form.username || null,
          phone: form.phone || null,
        });
        if (selectedRole) {
          await supabase.from("user_roles").upsert({ user_id: uid, role: selectedRole });
        }
        for (const role of additionalRoles) {
          await supabase.from("user_roles").upsert({ user_id: uid, role });
        }
        setStep(4);
      } else {
        // Email confirmation required — show a friendly message
        toast({
          title: "Check your email!",
          description: "We sent a confirmation link. Click it to activate your account.",
        });
        handleClose();
      }
    } catch (err: unknown) {
      toast({ title: "Sign-up failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentHub      = HUBS.find(h => h.key === selectedHub);
  const allRoles        = HUBS.flatMap(h => h.roles);
  const roleData        = allRoles.find(r => r.id === selectedRole);
  const persona         = selectedRole ? ROLE_PERSONA[selectedRole] : null;
  const requiredDocs    = selectedRole ? ROLE_DOCUMENTS[selectedRole] ?? [] : [];
  const ExtraFields     = selectedRole ? ROLE_EXTRA_FIELDS[selectedRole] : null;
  const uploadedCount   = uploads.length;
  const requiredCount   = requiredDocs.filter(d => d.required).length;

  const showPractitionerPicker = mode === "register" && step === 2 && selectedRole === "practitioner" && !practitionerRole;

  // ── Modal header config ───────────────────────────────────────────────────
  const modalTitle = (() => {
    if (mode === "login") return "Welcome back";
    if (mode === "entry") return "Join SkillsMark";
    if (step === 1) return "Choose your hub";
    if (step === 2 && !showPractitionerPicker) return `${currentHub?.label ?? ""} roles`;
    if (showPractitionerPicker) return "Select your practitioner role";
    if (step === 3) return `Set up your profile`;
    if (step === 4) return "Upload documents";
    if (step === 5) return "Choose your plan";
    return "You're almost in!";
  })();

  const modalSubtitle = (() => {
    if (mode === "entry") return "Select how you'd like to get started";
    if (mode === "login") return "Sign in to your SkillsMark account";
    if (step === 1) return "Pick the hub that best describes your role in skills development";
    if (step === 2 && !showPractitionerPicker) return `Select your specific role within the ${currentHub?.label} Hub`;
    if (step === 4) return "Upload your documents now or skip — verify later from your profile";
    return null;
  })();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative bg-navy border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button onClick={handleClose} className="absolute right-4 top-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">

              {/* ── Header ────────────────────────────────────────────────── */}
              <div className="text-center mb-7">
                {/* Hub badge */}
                {mode === "register" && currentHub && (
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border mb-3 ${HUB_ACCENT[currentHub.key]}`}>
                    {currentHub.emoji} {currentHub.label} Hub
                  </span>
                )}
                <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Sora, sans-serif" }}>
                  {modalTitle}
                </h2>
                {modalSubtitle && (
                  <p className="text-white/50 text-sm mt-2">{modalSubtitle}</p>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* ENTRY — Choose Sign In or Register                        */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {mode === "entry" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Sign In card */}
                    <button
                      onClick={() => setMode("login")}
                      className="group flex flex-col items-center text-center p-6 rounded-2xl border border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/25 transition-all duration-200"
                    >
                      <div className="w-12 h-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <LogIn className="w-5 h-5 text-teal" />
                      </div>
                      <span className="font-bold text-white text-base mb-1">Sign In</span>
                      <span className="text-xs text-white/50 leading-relaxed">Already have an account? Access your dashboard</span>
                    </button>

                    {/* Create Account card */}
                    <button
                      onClick={() => { setMode("register"); setStep(1); }}
                      className="group flex flex-col items-center text-center p-6 rounded-2xl border border-teal/30 bg-teal/5 hover:bg-teal/10 hover:border-teal/50 transition-all duration-200"
                    >
                      <div className="w-12 h-12 rounded-xl bg-teal/15 border border-teal/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-5 h-5 text-teal" />
                      </div>
                      <span className="font-bold text-white text-base mb-1">Create Account</span>
                      <span className="text-xs text-white/50 leading-relaxed">New to SkillsMark? Start your free 30-day trial</span>
                    </button>
                  </div>

                  {/* Hub preview pills */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {HUBS.map(hub => (
                      <button
                        key={hub.key}
                        onClick={() => { setSelectedHub(hub.key); setMode("register"); setStep(2); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all hover:scale-105 ${HUB_ACCENT[hub.key]}`}
                      >
                        <span>{hub.emoji}</span> {hub.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-white/30 mt-3">Or jump straight to your hub above</p>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* LOGIN                                                      */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {mode === "login" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className="space-y-4 max-w-sm mx-auto">
                  <FieldRow label="Email Address">
                    <input name="email" type="email" value={form.email} onChange={handleFormChange} className={INPUT_CLS} placeholder="you@example.com" autoFocus />
                  </FieldRow>
                  <FieldRow label="Password">
                    <input name="password" type="password" value={form.password} onChange={handleFormChange} className={INPUT_CLS} placeholder="Your password" />
                  </FieldRow>
                  <div className="text-right">
                    <button className="text-xs text-teal hover:underline">Forgot password?</button>
                  </div>
                  <button onClick={handleSignIn} disabled={submitting}
                    className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
                  </button>
                  <p className="text-center text-xs text-white/40">
                    No account?{" "}
                    <button onClick={() => { setMode("register"); setStep(1); }} className="text-teal hover:underline">
                      Create one free
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* REGISTER — Step 1: Hub selection                           */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {mode === "register" && step === 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {HUBS.map((hub) => (
                      <button
                        key={hub.key}
                        onClick={() => { setSelectedHub(hub.key); setStep(2); }}
                        className={`group flex flex-col p-5 rounded-2xl border bg-white/3 text-left transition-all duration-200 hover:scale-[1.02] ${hub.borderClass} ${hub.bgGlow}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{hub.emoji}</span>
                          <div>
                            <div className={`font-bold text-base ${hub.accentClass}`}>{hub.label} Hub</div>
                            <div className="text-[10px] text-white/40 font-medium tracking-wide">{hub.tagline}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 ml-auto transition-colors" />
                        </div>
                        <p className="text-xs text-white/55 leading-relaxed">{hub.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {hub.roles.map(r => (
                            <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/50">
                              {r.title}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* REGISTER — Step 2: Role selection within hub               */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {mode === "register" && step === 2 && currentHub && !showPractitionerPicker && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className="space-y-3 max-w-md mx-auto">
                  {currentHub.roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => { setSelectedRole(role.id); setStep(3); }}
                      className="w-full group flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/3 hover:border-white/30 hover:bg-white/8 transition-all text-left"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-200 flex-shrink-0">{role.emoji}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm">{role.title}</div>
                        <div className="text-xs text-white/45 mt-0.5">{role.description}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-teal transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* REGISTER — Step 2: Practitioner sub-role picker            */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {showPractitionerPicker && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className="space-y-2 max-w-md mx-auto">
                  {PRACTITIONER_ROLES.map((r) => (
                    <button key={r.id} onClick={() => { setPractitionerRole(r.id as PractitionerRole); }}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/30 transition-all text-left group">
                      <div>
                        <div className="font-semibold text-white text-sm">{r.label}</div>
                        <div className="text-xs text-teal/70 mt-0.5">{r.sub}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-teal transition-colors" />
                    </button>
                  ))}
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* REGISTER — Step 3: Profile form                            */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {mode === "register" && step === 3 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className="space-y-4 max-w-md mx-auto">
                  <Stepper current={2} total={4} />

                  {/* Role badge */}
                  {roleData && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/3 mb-2">
                      <span className="text-xl">{roleData.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-white">{roleData.title}</div>
                        {persona && currentHub && (
                          <div className={`text-xs mt-0.5 ${currentHub.accentClass}`}>{currentHub.label} Hub</div>
                        )}
                      </div>
                      {/* Additional roles */}
                      <div className="ml-auto flex flex-wrap gap-1.5 max-w-[200px] justify-end">
                        {allRoles.filter(r => r.id !== selectedRole).map(r => {
                          const isAdded = additionalRoles.includes(r.id);
                          return (
                            <button key={r.id} onClick={() => toggleAdditionalRole(r.id)}
                              title={`Add ${r.title} role`}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${isAdded ? "border-teal/50 bg-teal/15 text-teal" : "border-white/10 bg-white/5 text-white/35 hover:text-white/60 hover:border-white/20"}`}>
                              <span>{r.emoji}</span>
                              {isAdded && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {additionalRoles.length === 0 && (
                    <p className="text-[10px] text-white/25 -mt-2 flex items-center gap-1"><Plus className="w-3 h-3" /> Tap role badges above to add multiple roles</p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FieldRow label="First Name">
                      <input name="firstName" value={form.firstName} onChange={handleFormChange} className={INPUT_CLS} placeholder="Jane" />
                    </FieldRow>
                    <FieldRow label="Last Name">
                      <input name="lastName" value={form.lastName} onChange={handleFormChange} className={INPUT_CLS} placeholder="Doe" />
                    </FieldRow>
                  </div>
                  <FieldRow label="Email Address">
                    <input name="email" type="email" value={form.email} onChange={handleFormChange} className={INPUT_CLS} placeholder="jane@example.com" />
                  </FieldRow>
                  <FieldRow label="Phone Number">
                    <input name="phone" type="tel" value={form.phone} onChange={handleFormChange} className={INPUT_CLS} placeholder="+27 xx xxx xxxx" />
                  </FieldRow>
                  {ExtraFields && <ExtraFields form={form} onChange={handleFormChange} />}
                  <FieldRow label="Password">
                    <input name="password" type="password" value={form.password} onChange={handleFormChange} className={INPUT_CLS} placeholder="Create a secure password" />
                  </FieldRow>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-teal/10 border border-teal/20">
                    <span className="text-teal text-sm mt-0.5">✦</span>
                    <p className="text-xs text-white/60">
                      Your <span className="text-teal font-semibold">free 30-day trial</span> gives you full access. Choose a plan after sign-up.
                    </p>
                  </div>

                  <button onClick={handleSignUp} disabled={submitting}
                    className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* REGISTER — Step 4: Document upload                        */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {mode === "register" && step === 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className="max-w-md mx-auto space-y-5">
                  <Stepper current={3} total={4} />
                  {requiredDocs.length > 0 ? (
                    <>
                      <DocumentUploader docs={requiredDocs} uploads={uploads} onAdd={(id, f) => setUploads(p => [...p.filter(u => u.docId !== id), { docId: id, file: f }])} onRemove={(id) => setUploads(p => p.filter(u => u.docId !== id))} />
                      {uploadedCount > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-teal/10 border border-teal/20">
                          <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                          <span className="text-xs text-white/70">{uploadedCount} document{uploadedCount !== 1 ? "s" : ""} ready{requiredCount > uploadedCount ? ` · ${requiredCount - uploadedCount} required remaining` : ""}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-teal/40 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">No documents required for this role.</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium transition-all">Skip for now</button>
                    <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* REGISTER — Step 5: Plan selection                         */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {mode === "register" && step === 5 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className="max-w-2xl mx-auto">
                  <Stepper current={4} total={4} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {([
                      { name: "Starter" as PlanName, price: "Free", period: "30-day trial", features: ["3 opportunity previews", "Basic profile", "Email support"], highlight: false, badge: null, cta: "Start Free Trial" },
                      { name: "Professional" as PlanName, price: "R499", period: "per month", features: ["Unlimited access", "Priority matching", "B-BBEE dashboard", "Dedicated support"], highlight: true, badge: "Most Popular", cta: "Subscribe Now" },
                      { name: "Enterprise" as PlanName, price: "Custom", period: "pricing", features: ["Custom contracts", "API access", "Dedicated account manager", "SLA guarantee"], highlight: false, badge: null, cta: "Contact Sales" },
                    ] as const).map((plan) => (
                      <button key={plan.name}
                        onClick={() => { setSelectedPlan(plan.name); setStep(6); }}
                        className={`group flex flex-col p-5 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] ${plan.highlight ? "border-teal bg-teal/10 shadow-teal" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
                        {plan.badge && <span className="text-xs font-bold uppercase tracking-wider text-teal mb-2">{plan.badge}</span>}
                        <div className="font-bold text-xl text-white">{plan.name}</div>
                        <div className="mt-1 mb-4">
                          <span className="text-2xl font-bold text-white">{plan.price}</span>
                          <span className="text-xs text-white/40 ml-1">{plan.period}</span>
                        </div>
                        <ul className="space-y-1.5 flex-1">
                          {plan.features.map(f => (
                            <li key={f} className="text-xs text-white/60 flex items-center gap-2"><span className="text-teal">✓</span>{f}</li>
                          ))}
                        </ul>
                        <div className={`mt-4 py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${plan.highlight ? "gradient-teal text-white group-hover:opacity-90" : "border border-white/20 text-white/70 group-hover:border-white/40 group-hover:text-white"}`}>
                          {plan.cta}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* REGISTER — Step 6: Confirmation                           */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {mode === "register" && step === 6 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl">{selectedPlan === "Starter" ? "🚀" : selectedPlan === "Professional" ? "⭐" : "🏢"}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {selectedPlan === "Enterprise" ? "Let's talk!" : `${selectedPlan} plan selected`}
                  </h3>
                  <p className="text-white/50 text-sm mb-6">
                    {selectedPlan === "Starter"      && "Your 30-day free trial gives you full access to explore the platform."}
                    {selectedPlan === "Professional" && "You're subscribing to Professional at R499/month. Billed monthly — cancel anytime."}
                    {selectedPlan === "Enterprise"   && "Our team will reach out within 1 business day to build a custom package for you."}
                  </p>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-1">
                    <SummaryRow label="Role"   value={roleData?.title ?? String(selectedRole)} />
                    {additionalRoles.length > 0 && (
                      <SummaryRow label="Additional" value={additionalRoles.map(r => allRoles.find(x => x.id === r)?.title ?? r).join(", ")} />
                    )}
                    {currentHub && <SummaryRow label="Hub"    value={`${currentHub.label} Hub`} />}
                    <SummaryRow label="Plan"   value={String(selectedPlan)} />
                    <SummaryRow label="Billing" value={selectedPlan === "Starter" ? "Free for 30 days" : selectedPlan === "Professional" ? "R499 / month" : "Custom"} />
                    {uploadedCount > 0 && <SummaryRow label="Documents" value={`${uploadedCount} uploaded`} highlight />}
                  </div>
                  <button onClick={() => { handleClose(); window.location.href = "/dashboard"; }}
                    className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all">
                    {selectedPlan === "Enterprise" ? "Request a Demo →" : selectedPlan === "Starter" ? "Activate Free Trial →" : "Confirm Subscription →"}
                  </button>
                  <button onClick={() => setStep(5)} className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors">← Change plan</button>
                </motion.div>
              )}

              {/* ── Footer nav ────────────────────────────────────────────── */}
              <div className="flex items-center justify-between mt-7 pt-5 border-t border-white/10">
                {/* Back */}
                {(mode === "login" || (mode === "register" && step > 1 && step < 6)) ? (
                  <button
                    onClick={() => {
                      if (mode === "login") { setMode("entry"); }
                      else if (step === 2) { setStep(1); setSelectedRole(null); setPractitionerRole(null); }
                      else if (step === 3) { setStep(2); setSelectedRole(null); setPractitionerRole(null); }
                      else if (step === 4) setStep(3);
                      else if (step === 5) setStep(4);
                    }}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                ) : <div />}

                {/* Toggle sign-in / register */}
                {step < 6 && (
                  <button
                    onClick={() => { mode === "login" ? (setMode("register"), setStep(1)) : setMode("entry"); }}
                    className="text-xs text-white/40 hover:text-teal transition-colors"
                  >
                    {mode === "login" ? "New here? Get Started" : mode === "entry" ? "" : "Already have an account? Sign In"}
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
