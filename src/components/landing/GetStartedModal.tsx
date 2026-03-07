import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Loader2, Upload, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ROLE_PERSONA } from "@/lib/permissions";
import type { AppRole } from "@/lib/permissions";

// ─── Types ──────────────────────────────────────────────────────────────────

type Role = AppRole | null;
type PractitionerRole = "facilitator" | "assessor" | "moderator" | "sdf" | "mentor" | null;
type PlanName = "Starter" | "Professional" | "Enterprise" | null;

// ─── Role definitions ────────────────────────────────────────────────────────

interface RoleCard {
  id: AppRole;
  emoji: string;
  title: string;
  description: string;
  borderClass: string;
  bgClass: string;
  badgeClass: string;
}

// Grouped by persona for the selection grid
const PERSONA_GROUPS: {
  key: string;
  label: string;
  description: string;
  roles: RoleCard[];
}[] = [
  {
    key: "talent",
    label: "Talent",
    description: "Individuals seeking skills, work and growth",
    roles: [
      {
        id: "learner",
        emoji: "🎓",
        title: "Learner",
        description: "Seeking learnerships, bursaries & jobs",
        borderClass: "border-primary/30 hover:border-primary",
        bgClass: "hover:bg-primary/5",
        badgeClass: "bg-primary/10 text-primary",
      },
      {
        id: "practitioner",
        emoji: "👨‍🏫",
        title: "Practitioner",
        description: "Facilitators, assessors, moderators & SDFs",
        borderClass: "border-secondary/30 hover:border-secondary",
        bgClass: "hover:bg-secondary/5",
        badgeClass: "bg-secondary/10 text-secondary-foreground",
      },
    ],
  },
  {
    key: "business",
    label: "Business",
    description: "Companies and service providers driving skills",
    roles: [
      {
        id: "employer",
        emoji: "🏢",
        title: "Employer",
        description: "Hiring talent and managing learner intakes",
        borderClass: "border-accent/40 hover:border-accent",
        bgClass: "hover:bg-accent/5",
        badgeClass: "bg-accent/20 text-accent-foreground",
      },
      {
        id: "provider",
        emoji: "🏫",
        title: "Training Provider",
        description: "Accredited SDPs delivering programmes",
        borderClass: "border-primary/30 hover:border-primary",
        bgClass: "hover:bg-primary/5",
        badgeClass: "bg-primary/10 text-primary",
      },
      {
        id: "support_provider",
        emoji: "🛠️",
        title: "Support Provider",
        description: "Materials, equipment & service suppliers",
        borderClass: "border-secondary/30 hover:border-secondary",
        bgClass: "hover:bg-secondary/5",
        badgeClass: "bg-secondary/10 text-secondary-foreground",
      },
    ],
  },
  {
    key: "funding",
    label: "Funding",
    description: "Entities that finance and track skills investment",
    roles: [
      {
        id: "sponsor",
        emoji: "💼",
        title: "Sponsor",
        description: "B-BBEE funding, hiring & learner pipelines",
        borderClass: "border-accent/40 hover:border-accent",
        bgClass: "hover:bg-accent/5",
        badgeClass: "bg-accent/20 text-accent-foreground",
      },
      {
        id: "fundi",
        emoji: "💰",
        title: "Fundi",
        description: "Independent learner funders & bursary bodies",
        borderClass: "border-primary/30 hover:border-primary",
        bgClass: "hover:bg-primary/5",
        badgeClass: "bg-primary/10 text-primary",
      },
    ],
  },
  {
    key: "oversight",
    label: "Oversight",
    description: "Regulatory, compliance and platform administration",
    roles: [
      {
        id: "seta",
        emoji: "🏛️",
        title: "SETA Official",
        description: "Accreditation, verification & sector reporting",
        borderClass: "border-destructive/30 hover:border-destructive",
        bgClass: "hover:bg-destructive/5",
        badgeClass: "bg-destructive/10 text-destructive",
      },
      {
        id: "government",
        emoji: "🏗️",
        title: "Government",
        description: "Tender oversight, skills reporting & policy",
        borderClass: "border-destructive/30 hover:border-destructive",
        bgClass: "hover:bg-destructive/5",
        badgeClass: "bg-destructive/10 text-destructive",
      },
      {
        id: "admin",
        emoji: "🛡️",
        title: "Platform Admin",
        description: "Full platform management & moderation",
        borderClass: "border-destructive/30 hover:border-destructive",
        bgClass: "hover:bg-destructive/5",
        badgeClass: "bg-destructive/10 text-destructive",
      },
    ],
  },
];

const PRACTITIONER_ROLES = [
  { id: "facilitator", label: "Facilitator",                   sub: "Delivers accredited training" },
  { id: "assessor",    label: "Assessor",                      sub: "Evaluates learner competency" },
  { id: "moderator",   label: "Moderator",                     sub: "Quality assures assessments" },
  { id: "sdf",         label: "Skills Development Facilitator", sub: "Strategic L&D advisor" },
  { id: "mentor",      label: "Mentor",                        sub: "Coaching & workplace guidance" },
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
    { id: "id_document",   label: "South African ID / Passport",   description: "Clear copy, not expired", required: true },
    { id: "matric",        label: "Matric Certificate",            description: "Grade 12 or equivalent",   required: false },
    { id: "qualification", label: "Highest Qualification",         description: "If applicable",            required: false },
  ],
  practitioner: [
    { id: "id_document",       label: "South African ID / Passport",    description: "Clear copy, not expired", required: true },
    { id: "etdp_registration", label: "ETDP Registration Certificate",  description: "Assessor / Facilitator / Moderator", required: true },
    { id: "qualification",     label: "Relevant Qualification",         description: "NQF level 5+",           required: false },
  ],
  provider: [
    { id: "accreditation_cert", label: "SETA Accreditation Certificate", description: "Valid accreditation letter",    required: true },
    { id: "company_reg",        label: "Company Registration (CIPC)",    description: "COR14.3 or similar",           required: true },
    { id: "bbbee_cert",         label: "B-BBEE Certificate",             description: "Current level certificate",    required: false },
  ],
  employer: [
    { id: "company_reg",  label: "Company Registration (CIPC)",  description: "COR14.3 or similar",        required: true },
    { id: "bbbee_cert",   label: "B-BBEE Certificate",           description: "Current level certificate",  required: false },
    { id: "levy_proof",   label: "SDL Levy Proof",               description: "SARS skills levy registration", required: false },
  ],
  sponsor: [
    { id: "company_reg",  label: "Company Registration (CIPC)",  description: "COR14.3 or similar",        required: true },
    { id: "bbbee_cert",   label: "B-BBEE Certificate",           description: "Current level certificate",  required: true },
    { id: "mandate_letter", label: "Mandate / Board Resolution", description: "Authorising skills funding", required: false },
  ],
  seta: [
    { id: "appointment_letter", label: "SETA Appointment Letter", description: "Official DHET / SETA letter",   required: true },
    { id: "id_document",        label: "South African ID",         description: "Clear copy, not expired",      required: true },
  ],
  government: [
    { id: "appointment_letter", label: "Government Appointment Letter", description: "Departmental authorisation", required: true },
    { id: "id_document",        label: "South African ID",              description: "Clear copy, not expired",   required: true },
  ],
};

// Role-specific extra fields shown in Step 2
const ROLE_EXTRA_FIELDS: Partial<Record<AppRole, React.FC<{ form: FormState; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void }>>> = {
  sponsor: ({ form, onChange }) => (
    <>
      <FieldRow label="Company Name">
        <input name="companyName" value={form.companyName} onChange={onChange}
          className={INPUT_CLS} placeholder="Acme Corp (Pty) Ltd" />
      </FieldRow>
      <FieldRow label="Job Title">
        <input name="jobTitle" value={form.jobTitle} onChange={onChange}
          className={INPUT_CLS} placeholder="HR / L&D Manager" />
      </FieldRow>
    </>
  ),
  employer: ({ form, onChange }) => (
    <>
      <FieldRow label="Company Name">
        <input name="companyName" value={form.companyName} onChange={onChange}
          className={INPUT_CLS} placeholder="Company (Pty) Ltd" />
      </FieldRow>
      <FieldRow label="Job Title">
        <input name="jobTitle" value={form.jobTitle} onChange={onChange}
          className={INPUT_CLS} placeholder="HR Director" />
      </FieldRow>
    </>
  ),
  fundi: ({ form, onChange }) => (
    <FieldRow label="Organisation / Fund Name">
      <input name="companyName" value={form.companyName} onChange={onChange}
        className={INPUT_CLS} placeholder="e.g. Ubuntu Bursary Trust" />
    </FieldRow>
  ),
  provider: ({ form, onChange }) => (
    <>
      <FieldRow label="SDP / Institution Name">
        <input name="sdpName" value={form.sdpName} onChange={onChange}
          className={INPUT_CLS} placeholder="ABC Training Institute" />
      </FieldRow>
      <FieldRow label="SETA Accreditation Number">
        <input name="accreditationNumber" value={form.accreditationNumber} onChange={onChange}
          className={INPUT_CLS} placeholder="e.g. ETDP/ACC/0001/22" />
      </FieldRow>
    </>
  ),
  practitioner: ({ form, onChange }) => (
    <FieldRow label="ETDP / Assessor Registration">
      <input name="accreditationNumber" value={form.accreditationNumber} onChange={onChange}
        className={INPUT_CLS} placeholder="Registration or certificate number" />
    </FieldRow>
  ),
  support_provider: ({ form, onChange }) => (
    <FieldRow label="Service Category">
      <select name="serviceCategory" value={form.serviceCategory} onChange={onChange}
        className={INPUT_CLS}>
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
      <input name="companyName" value={form.companyName} onChange={onChange}
        className={INPUT_CLS} placeholder="e.g. DHET, DPSA, COGTA" />
    </FieldRow>
  ),
};

// ─── Shared style constants ─────────────────────────────────────────────────

const INPUT_CLS = "w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm";

// ─── Sub-components ─────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/60 block mb-1">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/40">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? "text-teal" : "text-white"}`}>{value}</span>
    </div>
  );
}

// ─── Document Upload Component ───────────────────────────────────────────────

interface UploadedFile {
  docId: string;
  file: File;
  preview?: string;
}

function DocumentUploader({
  docs,
  uploads,
  onAdd,
  onRemove,
}: {
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
          <div key={doc.id} className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${
            uploaded ? "border-teal/40 bg-teal/5" : "border-white/10 bg-white/3"
          }`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{doc.label}</span>
                {doc.required && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Required</span>
                )}
                {uploaded && (
                  <CheckCircle2 className="w-4 h-4 text-teal ml-auto flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-white/40 mt-0.5">{doc.description}</p>
              {uploaded && (
                <p className="text-xs text-teal/70 mt-1 truncate">{uploaded.file.name}</p>
              )}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {uploaded ? (
                <button
                  onClick={() => onRemove(doc.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive/70 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => inputRefs.current[doc.id]?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition-all"
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
              )}
              <input
                ref={(el) => { inputRefs.current[doc.id] = el; }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAdd(doc.id, file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        );
      })}

      <p className="text-xs text-white/30 text-center pt-1">
        Accepted formats: PDF, JPG, PNG · Max 10MB per file · Documents reviewed within 24h
      </p>
    </div>
  );
}

// ─── Form state type ────────────────────────────────────────────────────────

interface FormState {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  jobTitle: string;
  sdpName: string;
  accreditationNumber: string;
  serviceCategory: string;
}

const EMPTY_FORM: FormState = {
  username: "", email: "", password: "", firstName: "", lastName: "", phone: "",
  companyName: "", jobTitle: "", sdpName: "", accreditationNumber: "", serviceCategory: "",
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  initialRole?: Role;
}

// ─── Persona helpers ─────────────────────────────────────────────────────────

const PERSONA_LABELS: Record<string, string> = {
  talent:    "Talent",
  business:  "Business",
  funding:   "Funding",
  oversight: "Oversight",
};

const PERSONA_COLORS: Record<string, string> = {
  talent:    "text-primary border-primary/30 bg-primary/10",
  business:  "text-accent-foreground border-accent/30 bg-accent/10",
  funding:   "text-gold border-gold/30 bg-gold/10",
  oversight: "text-destructive border-destructive/30 bg-destructive/10",
};

// ─── Total steps (5) ─────────────────────────────────────────────────────────
// 1 → Role selection
// 2 → Profile form (+ practitioner sub-role picker)
// 3 → Document upload
// 4 → Plan selection
// 5 → Confirmation

export default function GetStartedModal({ open, onClose, initialRole = null }: Props) {
  const { toast } = useToast();

  const [step, setStep]                         = useState(1);
  const [selectedRole, setSelectedRole]         = useState<Role>(initialRole);
  const [additionalRoles, setAdditionalRoles]   = useState<AppRole[]>([]);
  const [practitionerRole, setPractitionerRole] = useState<PractitionerRole>(null);
  const [selectedPlan, setSelectedPlan]         = useState<PlanName>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLogin, setShowLogin]               = useState(false);
  const [submitting, setSubmitting]             = useState(false);
  const [form, setForm]                         = useState<FormState>(EMPTY_FORM);
  const [uploads, setUploads]                   = useState<UploadedFile[]>([]);
  const [userId, setUserId]                     = useState<string | null>(null);

  // Sync initial role when modal opens
  useEffect(() => {
    if (open) {
      if (initialRole) { setSelectedRole(initialRole); setStep(2); }
      else             { setStep(1); setSelectedRole(null); }
    }
  }, [open, initialRole]);

  // ESC to close
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
    setStep(1); setSelectedRole(null); setPractitionerRole(null);
    setAdditionalRoles([]); setSelectedPlan(null);
    setShowConfirmation(false); setShowLogin(false);
    setForm(EMPTY_FORM); setUploads([]); setUserId(null);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(resetModal, 300);
  }, [onClose, resetModal]);

  const handleRoleSelect = (role: AppRole) => { setSelectedRole(role); setStep(2); };

  const handleBack = () => {
    if (step === 2) { setStep(1); setSelectedRole(null); setPractitionerRole(null); }
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Toggle an additional role
  const toggleAdditionalRole = (role: AppRole) => {
    if (role === selectedRole) return;
    setAdditionalRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // ── Sign Up ──────────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;

      const uid = data.user?.id;
      if (uid) {
        setUserId(uid);
        await supabase.from("profiles").upsert({
          user_id: uid,
          first_name: form.firstName || null,
          last_name:  form.lastName  || null,
          username:   form.username  || null,
          phone:      form.phone     || null,
        });
        // Insert primary role
        if (selectedRole) {
          await supabase.from("user_roles").upsert({ user_id: uid, role: selectedRole });
        }
        // Insert additional roles
        for (const role of additionalRoles) {
          await supabase.from("user_roles").upsert({ user_id: uid, role });
        }
      }
      // Move to document upload step
      setStep(3);
    } catch (err: unknown) {
      toast({ title: "Sign-up failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Sign In ──────────────────────────────────────────────────────────────
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

  // ── Document file handlers ────────────────────────────────────────────────
  const handleAddFile = (docId: string, file: File) => {
    setUploads(prev => {
      const filtered = prev.filter(u => u.docId !== docId);
      return [...filtered, { docId, file }];
    });
  };

  const handleRemoveFile = (docId: string) => {
    setUploads(prev => prev.filter(u => u.docId !== docId));
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const allRoles       = PERSONA_GROUPS.flatMap((g) => g.roles);
  const roleData       = allRoles.find((r) => r.id === selectedRole);
  const persona        = selectedRole ? ROLE_PERSONA[selectedRole] : null;
  const totalSteps     = 5;
  const stepLabel      = showLogin ? "Sign In" : `Step ${step} of ${totalSteps - 1}`;
  const ExtraFields    = selectedRole ? ROLE_EXTRA_FIELDS[selectedRole] : null;
  const requiredDocs   = selectedRole ? ROLE_DOCUMENTS[selectedRole] ?? [] : [];
  const uploadedCount  = uploads.length;
  const requiredCount  = requiredDocs.filter(d => d.required).length;
  const canSkipDocs    = requiredDocs.length === 0;

  // Show practitioner sub-role picker before the form
  const showPractitionerPicker =
    !showLogin && step === 2 && selectedRole === "practitioner" && !practitionerRole;

  const showRegistrationForm =
    !showLogin && step === 2 && (selectedRole !== "practitioner" || !!practitionerRole);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative bg-navy border border-white/10 rounded-2xl shadow-2xl w-full max-w-[960px] max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">
              {/* ── Header ─────────────────────────────────────────────── */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal">{stepLabel}</p>
                  {persona && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PERSONA_COLORS[persona]}`}>
                      {PERSONA_LABELS[persona]} Hub
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Sora, sans-serif" }}>
                  {showLogin ? "Welcome back" :
                    step === 1 ? "Choose your path" :
                    showPractitionerPicker ? "Select your practitioner role" :
                    step === 3 ? "Prepare your documents" :
                    step === 4 ? "Choose your plan" :
                    `Set up your ${roleData?.title ?? ""} profile`}
                </h2>
                {!showLogin && step === 1 && (
                  <p className="text-white/50 text-sm mt-2">Select the role that best describes how you'll use SkillsMark</p>
                )}
                {!showLogin && step === 3 && (
                  <p className="text-white/50 text-sm mt-2">Upload your documents now or skip — you can complete verification later</p>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────── */}
              {/* STEP 1 — Persona-grouped role selection                    */}
              {/* ─────────────────────────────────────────────────────────── */}
              {!showLogin && step === 1 && (
                <div className="space-y-6">
                  {PERSONA_GROUPS.map((group) => (
                    <div key={group.key}>
                      {/* Group header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${PERSONA_COLORS[group.key]}`}>
                          {group.label} Hub
                        </span>
                        <p className="text-xs text-white/40">{group.description}</p>
                      </div>

                      {/* Role cards */}
                      <div className={`grid gap-3 ${group.roles.length === 1 ? "grid-cols-1 sm:grid-cols-3" : group.roles.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                        {group.roles.map((role) => (
                          <button
                            key={role.id}
                            onClick={() => handleRoleSelect(role.id)}
                            className={`group flex flex-col items-center text-center p-5 rounded-xl border bg-white/3 transition-all duration-200 hover:scale-[1.02] cursor-pointer ${role.borderClass} ${role.bgClass}`}
                          >
                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{role.emoji}</span>
                            <span className="font-bold text-sm text-white mb-0.5">{role.title}</span>
                            <span className="text-xs text-white/50 leading-snug">{role.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* STEP 2 — Practitioner sub-role picker                      */}
              {/* ─────────────────────────────────────────────────────────── */}
              {showPractitionerPicker && (
                <div className="space-y-2 max-w-lg mx-auto">
                  {PRACTITIONER_ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setPractitionerRole(r.id as PractitionerRole)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all text-left group"
                    >
                      <div>
                        <div className="font-semibold text-white text-sm">{r.label}</div>
                        <div className="text-xs text-teal mt-0.5">{r.sub}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-teal transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* STEP 2 — Registration form                                 */}
              {/* ─────────────────────────────────────────────────────────── */}
              {showRegistrationForm && (
                <div className="space-y-4 max-w-lg mx-auto">
                  {/* Progress bar */}
                  <div className="flex gap-1.5 mb-6">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-teal" : "bg-white/10"}`} />
                    ))}
                  </div>

                  {/* Role badge + multi-role toggle */}
                  {roleData && (
                    <div className="space-y-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{roleData.emoji}</span>
                        <span className="text-sm font-semibold text-white">{roleData.title}</span>
                        {persona && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-auto ${PERSONA_COLORS[persona]}`}>
                            {PERSONA_LABELS[persona]} Hub
                          </span>
                        )}
                      </div>

                      {/* Multi-role addition */}
                      <div className="p-3 rounded-xl border border-white/10 bg-white/3">
                        <div className="flex items-center gap-2 mb-2">
                          <Plus className="w-3 h-3 text-white/40" />
                          <span className="text-xs font-medium text-white/50">Add additional roles (optional)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {allRoles
                            .filter(r => r.id !== selectedRole)
                            .map(r => {
                              const isAdded = additionalRoles.includes(r.id);
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => toggleAdditionalRole(r.id)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                    isAdded
                                      ? "border-teal/50 bg-teal/15 text-teal"
                                      : "border-white/10 bg-white/5 text-white/40 hover:text-white/60 hover:border-white/20"
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  {r.title}
                                  {isAdded && <CheckCircle2 className="w-3 h-3" />}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FieldRow label="First Name">
                      <input name="firstName" value={form.firstName} onChange={handleFormChange}
                        className={INPUT_CLS} placeholder="Jane" />
                    </FieldRow>
                    <FieldRow label="Last Name">
                      <input name="lastName" value={form.lastName} onChange={handleFormChange}
                        className={INPUT_CLS} placeholder="Doe" />
                    </FieldRow>
                  </div>

                  <FieldRow label="Username">
                    <input name="username" value={form.username} onChange={handleFormChange}
                      className={INPUT_CLS} placeholder="@janedoe" />
                  </FieldRow>

                  <FieldRow label="Email Address">
                    <input name="email" type="email" value={form.email} onChange={handleFormChange}
                      className={INPUT_CLS} placeholder="jane@example.com" />
                  </FieldRow>

                  <FieldRow label="Phone Number">
                    <input name="phone" type="tel" value={form.phone} onChange={handleFormChange}
                      className={INPUT_CLS} placeholder="+27 xx xxx xxxx" />
                  </FieldRow>

                  {/* Role-specific extra fields */}
                  {ExtraFields && <ExtraFields form={form} onChange={handleFormChange} />}

                  <FieldRow label="Password">
                    <input name="password" type="password" value={form.password} onChange={handleFormChange}
                      className={INPUT_CLS} placeholder="Create a secure password" />
                  </FieldRow>

                  {/* Trial notice */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-teal/10 border border-teal/20">
                    <span className="text-teal text-sm mt-0.5">✦</span>
                    <p className="text-xs text-white/60">
                      SkillsMark is a <span className="text-teal font-semibold">subscription-based platform</span>.
                      Your free trial includes full access for 30 days. Choose a plan in the next step.
                    </p>
                  </div>

                  <button
                    onClick={handleSignUp}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* STEP 3 — Document upload                                   */}
              {/* ─────────────────────────────────────────────────────────── */}
              {!showLogin && step === 3 && (
                <div className="max-w-lg mx-auto space-y-5">
                  {/* Progress bar */}
                  <div className="flex gap-1.5 mb-2">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-teal" : "bg-white/10"}`} />
                    ))}
                  </div>

                  {requiredDocs.length > 0 ? (
                    <>
                      <DocumentUploader
                        docs={requiredDocs}
                        uploads={uploads}
                        onAdd={handleAddFile}
                        onRemove={handleRemoveFile}
                      />

                      {/* Upload summary */}
                      {uploadedCount > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-teal/10 border border-teal/20">
                          <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                          <span className="text-xs text-white/70">
                            {uploadedCount} document{uploadedCount !== 1 ? "s" : ""} ready to submit
                            {requiredCount > 0 && uploadedCount < requiredCount && ` (${requiredCount - uploadedCount} required remaining)`}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-teal/40 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">No documents required for your role right now.</p>
                      <p className="text-white/30 text-xs mt-1">You can upload supporting materials from your profile later.</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* STEP 4 — Plan selection                                    */}
              {/* ─────────────────────────────────────────────────────────── */}
              {!showLogin && step === 4 && !showConfirmation && (
                <div className="max-w-2xl mx-auto">
                  <div className="flex gap-1.5 mb-8">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-teal" : "bg-white/10"}`} />
                    ))}
                  </div>
                  <p className="text-center text-white/50 text-sm mb-6">Choose the plan that fits your needs</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(
                      [
                        {
                          name: "Starter" as PlanName,
                          price: "Free",
                          period: "30-day trial",
                          features: ["3 opportunity previews", "Basic profile", "Email support"],
                          highlight: false,
                          badge: null,
                          cta: "Start Free Trial",
                        },
                        {
                          name: "Professional" as PlanName,
                          price: "R499",
                          period: "per month",
                          features: ["Unlimited access", "Priority matching", "B-BBEE dashboard", "Dedicated support"],
                          highlight: true,
                          badge: "Most Popular",
                          cta: "Subscribe Now",
                        },
                        {
                          name: "Enterprise" as PlanName,
                          price: "Custom",
                          period: "pricing",
                          features: ["Custom contracts", "API access", "Dedicated account manager", "SLA guarantee"],
                          highlight: false,
                          badge: null,
                          cta: "Contact Sales",
                        },
                      ] as const
                    ).map((plan) => (
                      <button
                        key={plan.name}
                        onClick={() => { setSelectedPlan(plan.name); setShowConfirmation(true); }}
                        className={`group flex flex-col p-5 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                          plan.highlight
                            ? "border-teal bg-teal/10 shadow-teal"
                            : "border-white/10 bg-white/3 hover:border-white/20"
                        }`}
                      >
                        {plan.badge && (
                          <span className="text-xs font-bold uppercase tracking-wider text-teal mb-2">{plan.badge}</span>
                        )}
                        <div className="font-bold text-xl text-white">{plan.name}</div>
                        <div className="mt-1 mb-4">
                          <span className="text-2xl font-bold text-white">{plan.price}</span>
                          <span className="text-xs text-white/40 ml-1">{plan.period}</span>
                        </div>
                        <ul className="space-y-1.5 flex-1">
                          {plan.features.map((f) => (
                            <li key={f} className="text-xs text-white/60 flex items-center gap-2">
                              <span className="text-teal text-sm">✓</span> {f}
                            </li>
                          ))}
                        </ul>
                        <div className={`mt-4 py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${
                          plan.highlight
                            ? "gradient-teal text-white group-hover:opacity-90"
                            : "border border-white/20 text-white/70 group-hover:border-white/40 group-hover:text-white"
                        }`}>
                          {plan.cta}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* STEP 5 — Confirmation                                      */}
              {/* ─────────────────────────────────────────────────────────── */}
              {!showLogin && step === 4 && showConfirmation && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-md mx-auto text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl">
                      {selectedPlan === "Starter" ? "🚀" : selectedPlan === "Professional" ? "⭐" : "🏢"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">
                    {selectedPlan === "Enterprise" ? "Let's talk!" : `${selectedPlan} plan selected`}
                  </h3>
                  <p className="text-white/50 text-sm mb-6">
                    {selectedPlan === "Starter"       && "Your 30-day free trial gives you full access to explore the platform."}
                    {selectedPlan === "Professional"  && "You're subscribing to Professional at R499/month. Billed monthly — cancel anytime."}
                    {selectedPlan === "Enterprise"    && "Our team will reach out within 1 business day to build a custom package for you."}
                  </p>

                  {/* Summary */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-2">
                    <SummaryRow label="Primary Role"  value={roleData?.title ?? String(selectedRole)} />
                    {additionalRoles.length > 0 && (
                      <SummaryRow
                        label="Additional Roles"
                        value={additionalRoles.map(r => allRoles.find(x => x.id === r)?.title ?? r).join(", ")}
                      />
                    )}
                    {persona && (
                      <SummaryRow label="Hub" value={`${PERSONA_LABELS[persona]} Hub`} />
                    )}
                    <SummaryRow label="Plan"    value={String(selectedPlan)} />
                    <SummaryRow label="Billing" value={
                      selectedPlan === "Starter" ? "Free for 30 days" :
                      selectedPlan === "Professional" ? "R499 / month" : "Custom"
                    } />
                    {uploadedCount > 0 && (
                      <SummaryRow label="Documents" value={`${uploadedCount} uploaded`} highlight />
                    )}
                    {selectedPlan === "Professional" && (
                      <SummaryRow label="First charge" value="After 30-day trial" highlight />
                    )}
                  </div>

                  <button
                    onClick={() => { handleClose(); window.location.href = "/dashboard"; }}
                    className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all"
                  >
                    {selectedPlan === "Enterprise" ? "Request a Demo →" :
                     selectedPlan === "Starter"    ? "Activate Free Trial →" : "Confirm Subscription →"}
                  </button>

                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    ← Change plan
                  </button>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* SIGN IN                                                    */}
              {/* ─────────────────────────────────────────────────────────── */}
              {showLogin && (
                <div className="space-y-4 max-w-sm mx-auto">
                  <FieldRow label="Email Address">
                    <input name="email" type="email" value={form.email} onChange={handleFormChange}
                      className={INPUT_CLS} placeholder="you@example.com" />
                  </FieldRow>
                  <FieldRow label="Password">
                    <input name="password" type="password" value={form.password} onChange={handleFormChange}
                      className={INPUT_CLS} placeholder="Your password" />
                  </FieldRow>
                  <div className="text-right">
                    <button className="text-xs text-teal hover:underline">Forgot password?</button>
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In →"}
                  </button>
                  <button
                    onClick={() => setShowLogin(false)}
                    className="w-full text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Don't have an account? Get Started
                  </button>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* Footer nav                                                 */}
              {/* ─────────────────────────────────────────────────────────── */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                {/* Back button */}
                {!showLogin && step > 1 && !showConfirmation ? (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {/* Toggle sign-in / register */}
                {!showConfirmation && (
                  <button
                    onClick={() => setShowLogin((v) => !v)}
                    className="text-xs text-white/40 hover:text-teal transition-colors"
                  >
                    {showLogin ? "New here? Get Started" : "Already have an account? Sign In"}
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
