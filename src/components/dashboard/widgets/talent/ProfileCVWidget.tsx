import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  User, Camera, Save, Loader2, X, Plus,
  Linkedin, Globe, MapPin, Phone, Briefcase, FileText,
  GraduationCap, Cpu,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Practitioner sub-types ───────────────────────────────────────────────────

const PRACTITIONER_TYPES = [
  { key: "facilitator", label: "Facilitator",                  icon: GraduationCap, desc: "Delivers training programmes" },
  { key: "assessor",    label: "Assessor",                     icon: FileText,      desc: "Assesses learner competence"  },
  { key: "moderator",   label: "Moderator",                    icon: Briefcase,     desc: "Moderates assessment quality" },
  { key: "sdf",         label: "Skills Development Facilitator (SDF)", icon: Cpu,   desc: "WSP/ATR & SETA liaison"       },
] as const;

type PractitionerTypeKey = (typeof PRACTITIONER_TYPES)[number]["key"];

interface ProfileRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  bio: string | null;
  skills: string[] | null;
  location: string | null;
  job_title: string | null;
  company_name: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  demographics: Record<string, unknown> | null;
}

const BLANK_PROFILE: Partial<ProfileRow> = {
  first_name: "", last_name: "", phone: "", bio: "",
  skills: [], location: "", job_title: "", company_name: "",
  linkedin_url: "", website_url: "",
};

const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export function ProfileCVWidget() {
  const { user, role } = useAuth();
  const [tab, setTab] = useState<"edit" | "cv">("edit");
  const [form, setForm] = useState(BLANK_PROFILE);
  const [newSkill, setNewSkill] = useState("");
  const [uploading, setUploading] = useState(false);
  const [practitionerTypes, setPractitionerTypes] = useState<PractitionerTypeKey[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const isPractitioner = role === "practitioner";

  const togglePractType = (key: PractitionerTypeKey) =>
    setPractitionerTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );


  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileRow | null;
    },
  });

  // Sync form when profile loads — also restore saved practitioner types from demographics
  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        skills: profile.skills ?? [],
        location: profile.location ?? "",
        job_title: profile.job_title ?? "",
        company_name: profile.company_name ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        website_url: profile.website_url ?? "",
      });
      // Restore practitioner_types stored in demographics JSONB
      const demo = profile.demographics as Record<string, unknown> | null;
      if (demo?.practitioner_types && Array.isArray(demo.practitioner_types)) {
        setPractitionerTypes(demo.practitioner_types as PractitionerTypeKey[]);
      }
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update(form)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile saved!" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Avatar updated!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm(p => ({ ...p, skills: [...(p.skills ?? []), newSkill.trim()] }));
    setNewSkill("");
  };
  const removeSkill = (skill: string) =>
    setForm(p => ({ ...p, skills: (p.skills ?? []).filter(s => s !== skill) }));

  const fullName = (`${form.first_name ?? ""} ${form.last_name ?? ""}`.trim()) || (user?.email ?? "Your Name");
  const avatarUrl = profile?.avatar_url;

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />)}</div>
  );

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {(["edit","cv"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t === "cv" ? "CV Preview" : "Edit Profile"}
          </button>
        ))}
      </div>

      {/* ── Edit tab ── */}
      {tab === "edit" && (
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-7 h-7 text-muted-foreground" />
                }
                {uploading && (
                  <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center rounded-full">
                    <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow"
              >
                <Camera className="w-3 h-3 text-primary-foreground" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input {...field("first_name")} placeholder="First name" className={INPUT} />
            <input {...field("last_name")} placeholder="Last name" className={INPUT} />
            <input {...field("job_title")} placeholder="Job title / Role" className={INPUT} />
            <input {...field("company_name")} placeholder="Company / Organisation" className={INPUT} />
            <input {...field("location")} placeholder="Location (e.g. Cape Town, WC)" className={INPUT} />
            <input {...field("phone")} placeholder="Phone number" className={INPUT} />
            <input {...field("linkedin_url")} placeholder="LinkedIn URL" className={INPUT} />
            <input {...field("website_url")} placeholder="Website / Portfolio URL" className={INPUT} />
          </div>
          <textarea {...field("bio")} placeholder="Short bio (2–3 sentences about yourself)" rows={3} className={`${INPUT} resize-none`} />

          {/* Practitioner roles — only shown for practitioner role */}
          {isPractitioner && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Practitioner Roles</p>
              <div className="grid grid-cols-2 gap-2">
                {PRACTITIONER_TYPES.map(pt => {
                  const Icon = pt.icon;
                  const active = practitionerTypes.includes(pt.key);
                  return (
                    <button
                      key={pt.key}
                      type="button"
                      onClick={() => togglePractType(pt.key)}
                      className={`text-left p-2.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
                        active ? "border-primary/40 bg-primary/5" : "border-border opacity-60 hover:opacity-80"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-foreground">{pt.label}</p>
                        <p className="text-[9px] text-muted-foreground">{pt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}



          {/* Skills */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skills</p>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
                className={`${INPUT} flex-1`}
              />
              <button onClick={addSkill} className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 text-muted-foreground transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(form.skills ?? []).map(skill => (
                <span key={skill} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(form.skills ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No skills added yet</p>
              )}
            </div>
          </div>

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      )}

      {/* ── CV Preview tab ── */}
      {tab === "cv" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* CV header */}
          <div className="gradient-hero p-6 flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center flex-shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-primary-foreground/60" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-primary-foreground">{fullName}</h2>
              {form.job_title && <p className="text-sm text-primary-foreground/80 font-medium">{form.job_title}</p>}
              {form.company_name && <p className="text-xs text-primary-foreground/60">{form.company_name}</p>}
              <div className="flex flex-wrap gap-3 mt-2">
                {form.location && (
                  <span className="flex items-center gap-1 text-xs text-primary-foreground/70">
                    <MapPin className="w-3 h-3" />{form.location}
                  </span>
                )}
                {form.phone && (
                  <span className="flex items-center gap-1 text-xs text-primary-foreground/70">
                    <Phone className="w-3 h-3" />{form.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary-foreground capitalize">
                {role?.replace("_", " ") ?? "Candidate"}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {form.bio && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" /> About
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{form.bio}</p>
              </div>
            )}
            {/* Practitioner roles on CV */}
            {isPractitioner && practitionerTypes.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" /> Practitioner Roles
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {practitionerTypes.map(key => {
                    const pt = PRACTITIONER_TYPES.find(p => p.key === key)!;
                    const Icon = pt.icon;
                    return (
                      <span key={key} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        <Icon className="w-3 h-3" />{pt.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {(form.skills ?? []).length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(form.skills ?? []).map(skill => (
                    <span key={skill} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4 pt-2 border-t border-border">
              {form.linkedin_url && (
                <a href={form.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}
              {form.website_url && (
                <a href={form.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Globe className="w-3.5 h-3.5" /> Portfolio
                </a>
              )}
              {!form.linkedin_url && !form.website_url && (
                <p className="text-xs text-muted-foreground">Add LinkedIn / website URL to display links here.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
