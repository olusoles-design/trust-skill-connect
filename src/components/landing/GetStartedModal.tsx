import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, GraduationCap, Briefcase, School, Users, ShoppingBag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Role = "learner" | "sponsor" | "provider" | "practitioner" | "support_provider" | null;
type PractitionerRole = "facilitator" | "assessor" | "moderator" | "sdf" | "mentor" | null;
type PlanName = "Starter" | "Professional" | "Enterprise" | null;

interface RoleCard {
  id: Role;
  emoji: string;
  title: string;
  description: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
}

const ROLES: RoleCard[] = [
  {
    id: "learner",
    emoji: "🎓",
    title: "Learner",
    description: "Seeking skills & jobs",
    colorClass: "blue",
    borderClass: "border-blue-500/40 hover:border-blue-500",
    bgClass: "hover:bg-blue-500/5",
    textClass: "text-blue-400",
  },
  {
    id: "sponsor",
    emoji: "💼",
    title: "Sponsor",
    description: "Funding & hiring",
    colorClass: "green",
    borderClass: "border-green-500/40 hover:border-green-500",
    bgClass: "hover:bg-green-500/5",
    textClass: "text-green-400",
  },
  {
    id: "provider",
    emoji: "🏫",
    title: "Provider",
    description: "Training & skills",
    colorClass: "orange",
    borderClass: "border-orange-500/40 hover:border-orange-500",
    bgClass: "hover:bg-orange-500/5",
    textClass: "text-orange-400",
  },
  {
    id: "practitioner",
    emoji: "👨‍🏫",
    title: "Practitioner",
    description: "Facilitating, assessing & mentoring",
    colorClass: "purple",
    borderClass: "border-purple-500/40 hover:border-purple-500",
    bgClass: "hover:bg-purple-500/5",
    textClass: "text-purple-400",
  },
  {
    id: "support_provider",
    emoji: "🛠️",
    title: "Support Provider",
    description: "Materials, equipment & services",
    colorClass: "teal",
    borderClass: "border-teal/40 hover:border-teal",
    bgClass: "hover:bg-teal/5",
    textClass: "text-teal",
  },
];

const PRACTITIONER_ROLES = [
  { id: "facilitator", label: "Facilitator", sub: "Accredited SME" },
  { id: "assessor", label: "Assessor", sub: "Accredited SME" },
  { id: "moderator", label: "Moderator", sub: "Accredited SME" },
  { id: "sdf", label: "Skills Development Facilitator", sub: null },
  { id: "mentor", label: "Mentor", sub: null },
];

interface Props {
  open: boolean;
  onClose: () => void;
  initialRole?: Role;
}

export default function GetStartedModal({ open, onClose, initialRole = null }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [practitionerRole, setPractitionerRole] = useState<PractitionerRole>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    // role-specific
    companyName: "",
    jobTitle: "",
    sdpName: "",
    accreditationNumber: "",
    serviceCategory: "",
  });
  // Sync initialRole and auto-advance when modal opens
  useEffect(() => {
    if (open) {
      if (initialRole) {
        setSelectedRole(initialRole);
        setStep(2);
      } else {
        setStep(1);
        setSelectedRole(null);
      }
    }
  }, [open, initialRole]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const resetModal = useCallback(() => {
    setStep(1);
    setSelectedRole(null);
    setPractitionerRole(null);
    setSelectedPlan(null);
    setShowConfirmation(false);
    setShowLogin(false);
    setForm({
      username: "", email: "", password: "", firstName: "", lastName: "", phone: "",
      companyName: "", jobTitle: "", sdpName: "", accreditationNumber: "", serviceCategory: "",
    });
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(resetModal, 300);
  }, [onClose, resetModal]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) { setStep(1); setSelectedRole(null); setPractitionerRole(null); }
    else if (step === 3) setStep(2);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Real Supabase sign-up
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
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (userId) {
        // Save profile
        await supabase.from("profiles").upsert({
          user_id: userId,
          first_name: form.firstName || null,
          last_name: form.lastName || null,
          username: form.username || null,
          phone: form.phone || null,
        });
        // Save role
        if (selectedRole) {
          await supabase.from("user_roles").upsert({ user_id: userId, role: selectedRole });
        }
      }
      setStep(3);
    } catch (err: unknown) {
      toast({ title: "Sign-up failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Real Supabase sign-in
  const handleSignIn = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "You have signed in successfully." });
      handleClose();
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      toast({ title: "Sign-in failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const roleData = ROLES.find(r => r.id === selectedRole);
  const stepLabel = showLogin ? "Sign In" : `Step ${step} of 3`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            className="relative bg-navy border border-white/10 rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-2">{stepLabel}</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {showLogin ? "Welcome back" : step === 1 ? "Choose your path" : `Set up your ${roleData?.title} profile`}
                </h2>
                {!showLogin && step === 1 && (
                  <p className="text-white/50 text-sm mt-2">Select how you'll use the platform to continue</p>
                )}
                {!showLogin && step === 2 && selectedRole === "practitioner" && !practitionerRole && (
                  <p className="text-white/50 text-sm mt-2">Select your specific practitioner role</p>
                )}
              </div>

              {/* STEP 1 - Role Selection */}
              {!showLogin && step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={`group flex flex-col items-center text-center p-6 rounded-xl border bg-white/3 transition-all duration-200 hover:scale-[1.02] cursor-pointer ${role.borderClass} ${role.bgClass}`}
                    >
                      <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">{role.emoji}</span>
                      <span className={`font-bold text-base text-white mb-1`}>{role.title}</span>
                      <span className="text-xs text-white/50">{role.description}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 2 - Practitioner sub-role selection */}
              {!showLogin && step === 2 && selectedRole === "practitioner" && !practitionerRole && (
                <div className="space-y-3">
                  {PRACTITIONER_ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setPractitionerRole(r.id as PractitionerRole); }}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all text-left group"
                    >
                      <div>
                        <div className="font-semibold text-white">{r.label}</div>
                        {r.sub && <div className="text-xs text-teal mt-0.5">{r.sub}</div>}
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-teal transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 2 - Registration Form */}
              {!showLogin && step === 2 && (selectedRole !== "practitioner" || practitionerRole) && (
                <div className="space-y-4 max-w-lg mx-auto">
                  {/* Progress */}
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-teal" : "bg-white/10"}`} />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-white/60 block mb-1">First Name</label>
                      <input name="firstName" value={form.firstName} onChange={handleFormChange}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                        placeholder="Jane" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/60 block mb-1">Last Name</label>
                      <input name="lastName" value={form.lastName} onChange={handleFormChange}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                        placeholder="Doe" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-white/60 block mb-1">Username</label>
                    <input name="username" value={form.username} onChange={handleFormChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                      placeholder="@janedoe" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-white/60 block mb-1">Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={handleFormChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                      placeholder="jane@example.com" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-white/60 block mb-1">Phone Number</label>
                    <input name="phone" type="tel" value={form.phone} onChange={handleFormChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                      placeholder="+27 xx xxx xxxx" />
                  </div>

                  {/* Role-specific fields */}
                  {(selectedRole === "sponsor") && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-white/60 block mb-1">Company Name</label>
                        <input name="companyName" value={form.companyName} onChange={handleFormChange}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                          placeholder="Acme Corp (Pty) Ltd" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/60 block mb-1">Job Title</label>
                        <input name="jobTitle" value={form.jobTitle} onChange={handleFormChange}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                          placeholder="HR Manager" />
                      </div>
                    </>
                  )}

                  {selectedRole === "provider" && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-white/60 block mb-1">SDP / Institution Name</label>
                        <input name="sdpName" value={form.sdpName} onChange={handleFormChange}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                          placeholder="ABC Training Institute" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/60 block mb-1">SETA Accreditation Number</label>
                        <input name="accreditationNumber" value={form.accreditationNumber} onChange={handleFormChange}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                          placeholder="e.g. ETDP/ACC/0001/22" />
                      </div>
                    </>
                  )}

                  {selectedRole === "practitioner" && practitionerRole && (
                    <div>
                      <label className="text-xs font-medium text-white/60 block mb-1">ETDP / Assessor Registration</label>
                      <input name="accreditationNumber" value={form.accreditationNumber} onChange={handleFormChange}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                        placeholder="Registration or certificate number" />
                    </div>
                  )}

                  {selectedRole === "support_provider" && (
                    <div>
                      <label className="text-xs font-medium text-white/60 block mb-1">Service Category</label>
                      <select name="serviceCategory" value={form.serviceCategory} onChange={handleFormChange}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-teal/60 text-sm">
                        <option value="" className="bg-navy">Select a category</option>
                        <option value="materials" className="bg-navy">Learning Material Development</option>
                        <option value="furniture" className="bg-navy">Furniture & Classroom Equipment</option>
                        <option value="reprographic" className="bg-navy">Reprographic & Printing Services</option>
                        <option value="equipment" className="bg-navy">Training Equipment & Simulators</option>
                        <option value="venue" className="bg-navy">Venue & Facility Rentals</option>
                        <option value="technology" className="bg-navy">Technology & Software Solutions</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-white/60 block mb-1">Password</label>
                    <input name="password" type="password" value={form.password} onChange={handleFormChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                      placeholder="Create a secure password" />
                  </div>

                  {/* Subscription notice */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-teal/10 border border-teal/20">
                    <span className="text-teal text-sm mt-0.5">✦</span>
                    <p className="text-xs text-white/60">
                      SkillsMark is a <span className="text-teal font-semibold">subscription-based platform</span>. 
                      Your free trial includes full access for 30 days. Choose a plan in Step 3.
                    </p>
                  </div>

                  <button
                    onClick={handleSignUp}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue to Step 3 <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}

              {/* STEP 3 - Plan Selection */}
              {!showLogin && step === 3 && !showConfirmation && (
                <div className="max-w-2xl mx-auto">
                  <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-teal" : "bg-white/10"}`} />
                    ))}
                  </div>
                  <p className="text-center text-white/50 text-sm mb-6">Choose the plan that fits your needs</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {([
                      {
                        name: "Starter" as PlanName,
                        price: "Free",
                        period: "30-day trial",
                        features: ["3 opportunity posts", "Basic profile", "Email support"],
                        highlight: false,
                        badge: null,
                        cta: "Start Free Trial",
                      },
                      {
                        name: "Professional" as PlanName,
                        price: "R499",
                        period: "per month",
                        features: ["Unlimited posts", "Priority matching", "BEE dashboard", "Dedicated support"],
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
                    ] as const).map(plan => (
                      <button
                        key={plan.name}
                        onClick={() => {
                          setSelectedPlan(plan.name);
                          setShowConfirmation(true);
                        }}
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
                          {plan.features.map(f => (
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

              {/* STEP 3 - Confirmation Screen */}
              {!showLogin && step === 3 && showConfirmation && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-md mx-auto text-center"
                >
                  {/* Success icon */}
                  <div className="w-16 h-16 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl">
                      {selectedPlan === "Starter" ? "🚀" : selectedPlan === "Professional" ? "⭐" : "🏢"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">
                    {selectedPlan === "Enterprise" ? "Let's talk!" : `${selectedPlan} plan selected`}
                  </h3>
                  <p className="text-white/50 text-sm mb-6">
                    {selectedPlan === "Starter" && "Your 30-day free trial gives you full access to explore the platform."}
                    {selectedPlan === "Professional" && "You're subscribing to Professional at R499/month. Billed monthly — cancel anytime."}
                    {selectedPlan === "Enterprise" && "Our team will reach out within 1 business day to build a custom package for you."}
                  </p>

                  {/* Summary card */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Role</span>
                      <span className="text-white font-medium capitalize">{roleData?.title ?? selectedRole}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Plan</span>
                      <span className="text-white font-medium">{selectedPlan}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Billing</span>
                      <span className="text-white font-medium">
                        {selectedPlan === "Starter" ? "Free for 30 days" : selectedPlan === "Professional" ? "R499 / month" : "Custom"}
                      </span>
                    </div>
                    {selectedPlan === "Professional" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">First charge</span>
                        <span className="text-teal font-medium">After 30-day trial</span>
                      </div>
                    )}
                  </div>

                  {selectedPlan === "Enterprise" ? (
                    <button
                      onClick={handleClose}
                      className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all"
                    >
                      Request a Demo →
                    </button>
                  ) : (
                    <button
                      onClick={handleClose}
                      className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all"
                    >
                      {selectedPlan === "Starter" ? "Activate Free Trial →" : "Confirm Subscription →"}
                    </button>
                  )}

                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    ← Change plan
                  </button>
                </motion.div>
              )}

              {/* SIGN IN */}
              {showLogin && (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <label className="text-xs font-medium text-white/60 block mb-1">Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={handleFormChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                      placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 block mb-1">Password</label>
                    <input name="password" type="password" value={form.password} onChange={handleFormChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-teal/60 text-sm"
                      placeholder="Your password" />
                  </div>
                  <div className="text-right">
                    <button className="text-xs text-teal hover:underline">Forgot password?</button>
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl gradient-teal text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Back button */}
                {(step > 1 || (step === 2 && selectedRole === "practitioner" && !practitionerRole)) && !showLogin ? (
                  <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}

                {/* Sign in / Sign up toggle */}
                <p className="text-sm text-white/50">
                  {showLogin ? (
                    <>Don't have an account?{" "}
                      <button className="text-teal font-semibold hover:underline" onClick={() => { setShowLogin(false); setStep(1); }}>
                        Get Started Free
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{" "}
                      <button className="text-teal font-semibold hover:underline" onClick={() => setShowLogin(true)}>
                        Sign In
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
