import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowLeft, ArrowRight, Loader2, Upload, CheckCircle2,
  Trash2, LogIn, UserPlus, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ROLE_PERSONA } from "@/lib/permissions";
import type { AppRole } from "@/lib/permissions";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = AppRole | null;
type PractitionerRole = "facilitator" | "assessor" | "moderator" | "sdf" | "mentor" | null;
type PlanName = "Starter" | "Professional" | "Enterprise" | null;

interface RoleCard {
  id: AppRole;
  emoji: string;
  title: string;
  description: string;
}

// ─── Hub definitions ──────────────────────────────────────────────────────────

const HUBS: {
  key: string;
  emoji: string;
  label: string;
  tagline: string;
  description: string;
  color: string;
  roles: RoleCard[];
}[] = [
  {
    key: "talent",
    emoji: "🎓",
    label: "Talent",
    tagline: "Learn · Earn · Grow",
    description: "Learners, practitioners and facilitators in the skills ecosystem.",
    color: "hsl(var(--teal))",
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
    description: "Companies, training providers and service suppliers.",
    color: "hsl(220 80% 60%)",
    roles: [
      { id: "employer",         emoji: "🏢", title: "Employer",          description: "Hiring talent and managing learner intakes" },
      { id: "provider",         emoji: "🏫", title: "Training Provider", description: "Accredited SDPs delivering programmes" },
      { id: "support_provider", emoji: "🛠️", title: "Support Provider",  description: "Materials, equipment & service suppliers" },
    ],
  },
  {
    key: "funding",
    emoji: "💰",
    label: "Funding",
    tagline: "Fund · Track · Impact",
    description: "Entities that finance and track skills development.",
    color: "hsl(var(--gold))",
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
    description: "Regulatory bodies, government entities and platform admins.",
    color: "hsl(var(--destructive))",
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

// ─── Document upload definitions ─────────────────────────────────────────────

interface DocRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

const ROLE_DOCUMENTS: Partial<Record<AppRole, DocRequirement[]>> = {
  learner: [
    { id: "id_document",   label: "SA ID / Passport",       description: "Clear copy, not expired", required: true },
    { id: "matric",        label: "Matric Certificate",     description: "Grade 12 or equivalent",  required: false },
    { id: "qualification", label: "Highest Qualification",  description: "If applicable",           required: false },
  ],
  practitioner: [
    { id: "id_document",       label: "SA ID / Passport",          description: "Clear copy, not expired",         required: true },
    { id: "etdp_registration", label: "ETDP Registration Cert",    description: "Assessor / Facilitator / Moderator", required: true },
    { id: "qualification",     label: "Relevant Qualification",    description: "NQF level 5+",                    required: false },
  ],
  provider: [
    { id: "accreditation_cert", label: "SETA Accreditation Cert",  description: "Valid accreditation letter",    required: true },
    { id: "company_reg",        label: "Company Registration",     description: "COR14.3 or similar",            required: true },
    { id: "bbbee_cert",         label: "B-BBEE Certificate",       description: "Current level certificate",     required: false },
  ],
  employer: [
    { id: "company_reg", label: "Company Registration", description: "COR14.3 or similar",            required: true },
    { id: "bbbee_cert",  label: "B-BBEE Certificate",   description: "Current level certificate",     required: false },
    { id: "levy_proof",  label: "SDL Levy Proof",        description: "SARS skills levy registration", required: false },
  ],
  sponsor: [
    { id: "company_reg",    label: "Company Registration",       description: "COR14.3 or similar",         required: true },
    { id: "bbbee_cert",     label: "B-BBEE Certificate",         description: "Current level certificate",  required: true },
    { id: "mandate_letter", label: "Mandate / Board Resolution", description: "Authorising skills funding", required: false },
  ],
  seta: [
    { id: "appointment_letter", label: "SETA Appointment Letter", description: "Official DHET / SETA letter", required: true },
    { id: "id_document",        label: "South African ID",        description: "Clear copy, not expired",    required: true },
  ],
  government: [
    { id: "appointment_letter", label: "Government Appointment Letter", description: "Departmental authorisation", required: true },
    { id: "id_document",        label: "South African ID",              description: "Clear copy, not expired",   required: true },
  ],
};

// ─── Role-specific extra fields ───────────────────────────────────────────────

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
        <option value="">Select a category</option>
        <option value="materials">Learning Material Development</option>
        <option value="furniture">Furniture & Classroom Equipment</option>
        <option value="reprographic">Reprographic & Printing Services</option>
        <option value="equipment">Training Equipment & Simulators</option>
        <option value="venue">Venue & Facility Rentals</option>
        <option value="technology">Technology & Software Solutions</option>
      </select>
    </FieldRow>
  ),
  seta: ({ form, onChange }) => (
    <FieldRow label="SETA Name">
      <select name="companyName" value={form.companyName} onChange={onChange} className={INPUT_CLS}>
        <option value="">Select your SETA</option>
        {["AGRISETA","BANKSETA","CHIETA","CTFL","CETA","ETDP SETA","FASSET","FOODBEV","HWSETA","INSETA","LGSETA","MERSETA","MICT SETA","MQA","POSHEITA","PSETA","SASSETA","SERVICES SETA","TETA","W&RSETA"].map(s => (
          <option key={s} value={s}>{s}</option>
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

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full px-3.5 py-2.5 rounded-lg bg-muted/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background text-sm transition-colors";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Progress stepper ─────────────────────────────────────────────────────────

function Stepper({ current, total, labels }: { current: number; total: number; labels?: string[] }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
            i < current - 1
              ? "bg-primary text-primary-foreground"
              : i === current - 1
              ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
              : "bg-muted text-muted-foreground"
          }`}>
            {i < current - 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {labels && <span className={`text-xs hidden sm:block transition-colors ${i === current - 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{labels[i]}</span>}
          {i < total - 1 && <div className={`h-px flex-1 transition-all duration-300 ${i < current - 1 ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
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
    <div className="space-y-2.5">
      {docs.map((doc) => {
        const uploaded = uploads.find((u) => u.docId === doc.id);
        return (
          <div key={doc.id} className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${uploaded ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${uploaded ? "bg-primary/10" : "bg-muted"}`}>
              {uploaded
                ? <CheckCircle2 className="w-4 h-4 text-primary" />
                : <Upload className="w-3.5 h-3.5 text-muted-foreground" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{doc.label}</span>
                {doc.required && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Required</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{uploaded ? uploaded.file.name : doc.description}</p>
            </div>
            <div className="flex-shrink-0">
              {uploaded ? (
                <button onClick={() => onRemove(doc.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={() => inputRefs.current[doc.id]?.click()} className="px-3 py-1.5 rounded-lg bg-background border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground text-xs font-medium transition-all">
                  Upload
                </button>
              )}
              <input ref={(el) => { inputRefs.current[doc.id] = el; }} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) onAdd(doc.id, file); e.target.value = ""; }} />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground text-center pt-1">PDF, JPG, PNG · Max 10MB · Reviewed within 24h</p>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GetStartedModal({ open, onClose, initialRole = null }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"entry" | "login" | "register" | "forgot">("entry");
  const [forgotSent, setForgotSent] = useState(false);

  const [step, setStep] = useState(1);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [additionalRoles, setAdditionalRoles] = useState<AppRole[]>([]);
  const [practitionerRole, setPractitionerRole] = useState<PractitionerRole>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const resetModal = useCallback(() => {
    setMode("entry"); setStep(1); setSelectedHub(null); setSelectedRole(null);
    setPractitionerRole(null); setAdditionalRoles([]); setSelectedPlan(null);
    setForm(EMPTY_FORM); setUploads([]); setForgotSent(false);
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

  const handleForgotPassword = async () => {
    if (!form.email) {
      toast({ title: "Email required", description: "Enter your email address.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      toast({ title: "Welcome back!" });
      handleClose();
      navigate("/dashboard");
    } catch (err: unknown) {
      toast({ title: "Sign-in failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
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
      const hasSession = !!data.session;

      if (uid && hasSession) {
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
        toast({ title: "Check your email!", description: "We sent a confirmation link." });
        handleClose();
      }
    } catch (err: unknown) {
      toast({ title: "Sign-up failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentHub      = HUBS.find(h => h.key === selectedHub);
  const allRoles        = HUBS.flatMap(h => h.roles);
  const roleData        = allRoles.find(r => r.id === selectedRole);
  const persona         = selectedRole ? ROLE_PERSONA[selectedRole] : null;
  const requiredDocs    = selectedRole ? ROLE_DOCUMENTS[selectedRole] ?? [] : [];
  const ExtraFields     = selectedRole ? ROLE_EXTRA_FIELDS[selectedRole] : null;
  const uploadedCount   = uploads.length;
  const requiredCount   = requiredDocs.filter(d => d.required).length;
  const showPractitionerPicker = mode === "register" && step === 2 && selectedRole === "practitioner" && !practitionerRole;

  const STEP_LABELS = ["Hub", "Role", "Profile", "Documents", "Plan", "Done"];

  const slide = { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 }, transition: { duration: 0.2 } };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-background border border-border rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
              {/* Back / breadcrumb */}
              <div className="flex items-center gap-2">
                {(mode === "login" || mode === "forgot" || (mode === "register" && step > 1 && step < 6)) ? (
                  <button
                    onClick={() => {
                      if (mode === "login" || mode === "forgot") { setMode("entry"); setForgotSent(false); }
                      else if (step === 2) { setStep(1); setSelectedRole(null); setPractitionerRole(null); }
                      else if (step === 3) { setStep(2); setSelectedRole(null); setPractitionerRole(null); }
                      else if (step === 4) setStep(3);
                      else if (step === 5) setStep(4);
                    }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-foreground">SkillsMark</span>
                )}
              </div>

              {/* Step indicator pill (register only) */}
              {mode === "register" && step >= 1 && step <= 5 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  Step {step} of 5
                </span>
              )}

              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pt-6 pb-8">

              {/* ── ENTRY ──────────────────────────────────────────────────── */}
              {mode === "entry" && (
                <motion.div {...slide}>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Get started</h2>
                    <p className="text-muted-foreground text-sm mt-1">Join SkillsMark or sign into your account.</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <button
                      onClick={() => { setMode("register"); setStep(1); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/40 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">Create account</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Start your free 30-day trial</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>

                    <button
                      onClick={() => setMode("login")}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border hover:bg-muted/40 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <LogIn className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">Sign in</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Access your dashboard</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  </div>

                  {/* Hub quick-jump */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-3">Or jump to your hub</p>
                    <div className="grid grid-cols-2 gap-2">
                      {HUBS.map(hub => (
                        <button
                          key={hub.key}
                          onClick={() => { setSelectedHub(hub.key); setMode("register"); setStep(2); }}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-border hover:bg-muted/40 transition-all text-left group"
                        >
                          <span className="text-lg">{hub.emoji}</span>
                          <div>
                            <div className="text-sm font-medium text-foreground">{hub.label}</div>
                            <div className="text-[10px] text-muted-foreground">{hub.tagline}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── LOGIN ──────────────────────────────────────────────────── */}
              {mode === "login" && (
                <motion.div key="login" {...slide} className="space-y-5">
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Welcome back</h2>
                    <p className="text-muted-foreground text-sm mt-1">Sign into your SkillsMark account.</p>
                  </div>
                  <FieldRow label="Email">
                    <input name="email" type="email" value={form.email} onChange={handleFormChange} className={INPUT_CLS} placeholder="you@example.com" autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()} />
                  </FieldRow>
                  <FieldRow label="Password">
                    <input name="password" type="password" value={form.password} onChange={handleFormChange} className={INPUT_CLS} placeholder="Your password"
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()} />
                  </FieldRow>
                  <div className="text-right -mt-2">
                    <button onClick={() => { setForgotSent(false); setMode("forgot"); }} className="text-xs text-primary hover:underline">Forgot password?</button>
                  </div>
                  <button onClick={handleSignIn} disabled={submitting}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    No account?{" "}
                    <button onClick={() => { setMode("register"); setStep(1); }} className="text-primary hover:underline font-medium">
                      Create one free
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── FORGOT PASSWORD ────────────────────────────────────────── */}
              {mode === "forgot" && (
                <motion.div {...slide} className="space-y-5">
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
                      {forgotSent ? "Check your inbox" : "Reset password"}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      {forgotSent ? `A reset link was sent to ${form.email}` : "We'll send a reset link to your email."}
                    </p>
                  </div>

                  {forgotSent ? (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📬</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-5">Check your spam folder if you don't see it within a minute.</p>
                      <button onClick={() => setMode("login")} className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-all">
                        Back to Sign In
                      </button>
                    </div>
                  ) : (
                    <>
                      <FieldRow label="Email Address">
                        <input name="email" type="email" value={form.email} onChange={handleFormChange} className={INPUT_CLS} placeholder="you@example.com" autoFocus />
                      </FieldRow>
                      <button onClick={handleForgotPassword} disabled={submitting}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── REGISTER — Step 1: Hub ─────────────────────────────────── */}
              {mode === "register" && step === 1 && (
                <motion.div {...slide}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Choose your hub</h2>
                    <p className="text-muted-foreground text-sm mt-1">Pick the hub that best describes your role in skills development.</p>
                  </div>
                  <div className="space-y-2.5">
                    {HUBS.map((hub) => (
                      <button
                        key={hub.key}
                        onClick={() => { setSelectedHub(hub.key); setStep(2); }}
                        className="w-full group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border hover:bg-muted/40 transition-all text-left"
                      >
                        <span className="text-2xl flex-shrink-0">{hub.emoji}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {hub.label}
                            <span className="text-[10px] font-normal text-muted-foreground">{hub.tagline}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {hub.roles.map(r => (
                              <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {r.title}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── REGISTER — Step 2: Role ────────────────────────────────── */}
              {mode === "register" && step === 2 && currentHub && !showPractitionerPicker && (
                <motion.div {...slide}>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{currentHub.emoji}</span>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currentHub.label} Hub</span>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Select your role</h2>
                    <p className="text-muted-foreground text-sm mt-1">Choose the role that best fits what you do.</p>
                  </div>
                  <div className="space-y-2.5">
                    {currentHub.roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => { setSelectedRole(role.id); if (role.id !== "practitioner") setStep(3); }}
                        className="w-full group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border hover:bg-muted/40 transition-all text-left"
                      >
                        <span className="text-xl flex-shrink-0">{role.emoji}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground">{role.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{role.description}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── REGISTER — Step 2: Practitioner sub-role ──────────────── */}
              {showPractitionerPicker && (
                <motion.div {...slide}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Your practitioner role</h2>
                    <p className="text-muted-foreground text-sm mt-1">What best describes your specialisation?</p>
                  </div>
                  <div className="space-y-2.5">
                    {PRACTITIONER_ROLES.map((r) => (
                      <button key={r.id}
                        onClick={() => { setPractitionerRole(r.id as PractitionerRole); setStep(3); }}
                        className="w-full group flex items-center justify-between p-4 rounded-xl border border-border hover:border-border hover:bg-muted/40 transition-all text-left">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{r.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{r.sub}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── REGISTER — Step 3: Profile form ───────────────────────── */}
              {mode === "register" && step === 3 && (
                <motion.div {...slide} className="space-y-5">
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Your profile</h2>
                    <p className="text-muted-foreground text-sm mt-1">Set up your account details.</p>
                  </div>

                  {/* Role chip */}
                  {roleData && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border border-border">
                      <span className="text-base">{roleData.emoji}</span>
                      <span className="text-sm font-medium text-foreground">{roleData.title}</span>
                      {currentHub && <span className="text-xs text-muted-foreground">· {currentHub.label} Hub</span>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FieldRow label="First Name">
                      <input name="firstName" value={form.firstName} onChange={handleFormChange} className={INPUT_CLS} placeholder="Jane" />
                    </FieldRow>
                    <FieldRow label="Last Name">
                      <input name="lastName" value={form.lastName} onChange={handleFormChange} className={INPUT_CLS} placeholder="Doe" />
                    </FieldRow>
                    <FieldRow label="Email">
                      <input name="email" type="email" value={form.email} onChange={handleFormChange} className={INPUT_CLS} placeholder="jane@example.com" />
                    </FieldRow>
                    <FieldRow label="Phone">
                      <input name="phone" type="tel" value={form.phone} onChange={handleFormChange} className={INPUT_CLS} placeholder="+27 xx xxx xxxx" />
                    </FieldRow>
                    {ExtraFields && (
                      <div className="col-span-2 grid grid-cols-2 gap-4">
                        <ExtraFields form={form} onChange={handleFormChange} />
                      </div>
                    )}
                    <div className="col-span-2">
                      <FieldRow label="Password">
                        <input name="password" type="password" value={form.password} onChange={handleFormChange} className={INPUT_CLS} placeholder="Min. 6 characters" />
                      </FieldRow>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">30-day free trial</span> — full access, no credit card needed.
                    </p>
                  </div>

                  <button onClick={handleSignUp} disabled={submitting}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>

                  <p className="text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">Sign in</button>
                  </p>
                </motion.div>
              )}

              {/* ── REGISTER — Step 4: Documents ──────────────────────────── */}
              {mode === "register" && step === 4 && (
                <motion.div {...slide} className="space-y-5">
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Upload documents</h2>
                    <p className="text-muted-foreground text-sm mt-1">Upload now or skip — you can always do this from your profile.</p>
                  </div>

                  {requiredDocs.length > 0 ? (
                    <>
                      <DocumentUploader
                        docs={requiredDocs} uploads={uploads}
                        onAdd={(id, f) => setUploads(p => [...p.filter(u => u.docId !== id), { docId: id, file: f }])}
                        onRemove={(id) => setUploads(p => p.filter(u => u.docId !== id))}
                      />
                      {uploadedCount > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {uploadedCount} document{uploadedCount !== 1 ? "s" : ""} ready
                            {requiredCount > uploadedCount ? ` · ${requiredCount - uploadedCount} required remaining` : ""}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-10 h-10 text-primary/40 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No documents required for this role.</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-sm font-medium transition-all">
                      Skip for now
                    </button>
                    <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── REGISTER — Step 5: Plan ────────────────────────────────── */}
              {mode === "register" && step === 5 && (
                <motion.div {...slide} className="space-y-4">
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Choose a plan</h2>
                    <p className="text-muted-foreground text-sm mt-1">Start free — upgrade anytime.</p>
                  </div>

                  <div className="space-y-3">
                    {([
                      { name: "Starter" as PlanName, price: "Free", period: "30-day trial", features: ["3 opportunity previews", "Basic profile", "Email support"], highlight: false, cta: "Start Free Trial" },
                      { name: "Professional" as PlanName, price: "R499", period: "/month", features: ["Unlimited access", "Priority matching", "B-BBEE dashboard", "Dedicated support"], highlight: true, badge: "Most Popular", cta: "Subscribe Now" },
                      { name: "Enterprise" as PlanName, price: "Custom", period: "pricing", features: ["Custom contracts", "API access", "Account manager", "SLA guarantee"], highlight: false, cta: "Contact Sales" },
                    ] as const).map((plan) => (
                      <button key={plan.name}
                        onClick={() => { setSelectedPlan(plan.name); setStep(6); }}
                        className={`w-full group flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-sm ${
                          plan.highlight
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-border hover:bg-muted/30"
                        }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                            {"badge" in plan && plan.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{plan.badge}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            {plan.features.map(f => (
                              <span key={f} className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <span className="text-primary">·</span> {f}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-foreground">{plan.price}</div>
                          <div className="text-[10px] text-muted-foreground">{plan.period}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── REGISTER — Step 6: Confirm ─────────────────────────────── */}
              {mode === "register" && step === 6 && (
                <motion.div {...slide} className="text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
                      {selectedPlan === "Enterprise" ? "Let's talk!" : "You're all set!"}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      {selectedPlan === "Starter"      && "Your 30-day free trial is ready. Explore the full platform."}
                      {selectedPlan === "Professional" && "Professional plan selected — R499/month, cancel anytime."}
                      {selectedPlan === "Enterprise"   && "Our team will reach out within 1 business day."}
                    </p>
                  </div>

                  <div className="bg-muted/40 border border-border rounded-xl p-4 text-left space-y-2">
                    {[
                      { label: "Role", value: roleData?.title ?? String(selectedRole) },
                      ...(currentHub ? [{ label: "Hub", value: currentHub.label }] : []),
                      { label: "Plan", value: String(selectedPlan) },
                      ...(uploadedCount > 0 ? [{ label: "Documents", value: `${uploadedCount} uploaded` }] : []),
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className="text-xs font-medium text-foreground">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { handleClose(); navigate("/dashboard"); }}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
                  >
                    {selectedPlan === "Enterprise" ? "Request a Demo →" : selectedPlan === "Starter" ? "Activate Free Trial →" : "Confirm Subscription →"}
                  </button>

                  <button onClick={() => setStep(5)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ← Change plan
                  </button>
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
