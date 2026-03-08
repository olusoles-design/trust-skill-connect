import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Save, Loader2, AlertCircle, Globe, Mail, Phone,
  Linkedin, Eye, EyeOff, BadgeCheck, Plus, X,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface SponsorProfile {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  tagline: string | null;
  description: string | null;
  website_url: string | null;
  sectors: string[] | null;
  provinces: string[] | null;
  programme_types: string[] | null;
  annual_budget: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  linkedin_url: string | null;
  is_public: boolean;
  verified: boolean;
}

const SECTOR_OPTIONS = [
  "ICT", "Construction", "Finance", "Health", "Education",
  "Engineering", "Agriculture", "Hospitality", "Manufacturing",
  "Mining", "Retail", "Transport", "Energy",
];

const PROVINCE_OPTIONS = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape",
  "National (All Provinces)",
];

const PROG_TYPE_OPTIONS = [
  "Learnership", "Internship", "Bursary", "Apprenticeship",
  "Skills Programme", "Graduate Programme",
];

const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

function TagPicker({
  label, options, selected, onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
              selected.includes(opt)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export function SponsorProfileWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  /* fetch own profile */
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["sponsor-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_profiles" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as SponsorProfile | null;
    },
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<SponsorProfile>>({});

  const startEdit = () => {
    setForm(profile ?? {
      company_name: "", tagline: "", description: "", website_url: "",
      contact_email: "", contact_phone: "", linkedin_url: "", annual_budget: "",
      sectors: [], provinces: [], programme_types: [], is_public: true,
    });
    setEditing(true);
  };

  const field = (key: keyof typeof form) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        company_name: form.company_name ?? "",
        tagline: form.tagline ?? null,
        description: form.description ?? null,
        website_url: form.website_url ?? null,
        contact_email: form.contact_email ?? null,
        contact_phone: form.contact_phone ?? null,
        linkedin_url: form.linkedin_url ?? null,
        annual_budget: form.annual_budget ?? null,
        sectors: form.sectors ?? [],
        provinces: form.provinces ?? [],
        programme_types: form.programme_types ?? [],
        is_public: form.is_public ?? true,
      };
      if (profile?.id) {
        const { error } = await supabase
          .from("sponsor_profiles" as any)
          .update(payload)
          .eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sponsor_profiles" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsor-profile"] });
      qc.invalidateQueries({ queryKey: ["sponsor-directory"] });
      setEditing(false);
      toast({ title: "Sponsor profile saved!", description: "Your listing is now visible in the directory." });
    },
    onError: (e) => toast({ title: "Save failed", description: String(e), variant: "destructive" }),
  });

  const toggleVisibility = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      const { error } = await supabase
        .from("sponsor_profiles" as any)
        .update({ is_public: !profile.is_public })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsor-profile"] });
      qc.invalidateQueries({ queryKey: ["sponsor-directory"] });
      toast({ title: profile?.is_public ? "Profile hidden from directory" : "Profile now visible in directory" });
    },
  });

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
  );
  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load profile
    </div>
  );

  /* ── No profile yet ── */
  if (!profile && !editing) {
    return (
      <div className="text-center py-12 space-y-3">
        <Building2 className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
        <div>
          <p className="text-sm font-semibold text-foreground">Create your Sponsor Profile</p>
          <p className="text-xs text-muted-foreground mt-1">
            A public listing lets learners and training providers discover your organisation and the programmes you fund.
          </p>
        </div>
        <button
          onClick={startEdit}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Listing
        </button>
      </div>
    );
  }

  /* ── Edit form ── */
  if (editing) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            {profile ? "Edit Sponsor Profile" : "New Sponsor Profile"}
          </p>
          <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input {...field("company_name")} placeholder="Company / Organisation name *" className={INPUT} />
          <input {...field("tagline")} placeholder="Short tagline (e.g. Investing in South Africa's future)" className={INPUT} />
          <input {...field("website_url")} placeholder="Website URL" className={INPUT} />
          <input {...field("linkedin_url")} placeholder="LinkedIn URL" className={INPUT} />
          <input {...field("contact_email")} placeholder="Public contact email" className={INPUT} />
          <input {...field("contact_phone")} placeholder="Contact phone (optional)" className={INPUT} />
          <input {...field("annual_budget")} placeholder="Annual skills spend (e.g. R5M – R10M)" className={INPUT} />
        </div>

        <textarea
          {...field("description")}
          placeholder="Tell learners and training providers about your organisation, your CSI focus, B-BBEE commitments and the types of programmes you fund…"
          rows={4}
          className={`${INPUT} resize-none`}
        />

        <TagPicker
          label="Focus Sectors"
          options={SECTOR_OPTIONS}
          selected={form.sectors ?? []}
          onChange={v => setForm(p => ({ ...p, sectors: v }))}
        />
        <TagPicker
          label="Provinces Covered"
          options={PROVINCE_OPTIONS}
          selected={form.provinces ?? []}
          onChange={v => setForm(p => ({ ...p, provinces: v }))}
        />
        <TagPicker
          label="Programme Types Funded"
          options={PROG_TYPE_OPTIONS}
          selected={form.programme_types ?? []}
          onChange={v => setForm(p => ({ ...p, programme_types: v }))}
        />

        {/* Visibility toggle */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, is_public: !p.is_public }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.is_public ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_public ? "translate-x-5" : ""}`} />
          </button>
          <div>
            <p className="text-xs font-semibold text-foreground">{form.is_public ? "Public listing" : "Private (hidden from directory)"}</p>
            <p className="text-[10px] text-muted-foreground">
              {form.is_public
                ? "Visible to all learners and training providers on the platform"
                : "Only you can see this profile — it won't appear in the Sponsor Directory"}
            </p>
          </div>
        </div>

        <button
          onClick={() => save.mutate()}
          disabled={!form.company_name || save.isPending}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Profile
        </button>
      </div>
    );
  }

  /* ── View mode ── */
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-foreground">{profile!.company_name}</p>
                {profile!.verified && (
                  <BadgeCheck className="w-4 h-4 text-primary" title="Verified Sponsor" />
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  profile!.is_public ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                }`}>
                  {profile!.is_public ? "Public" : "Private"}
                </span>
              </div>
              {profile!.tagline && (
                <p className="text-xs text-muted-foreground mt-0.5">{profile!.tagline}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => toggleVisibility.mutate()}
              disabled={toggleVisibility.isPending}
              title={profile!.is_public ? "Hide from directory" : "Show in directory"}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              {profile!.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={startEdit}
              className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-all"
            >
              Edit
            </button>
          </div>
        </div>

        {profile!.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{profile!.description}</p>
        )}

        {/* Contact links */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {profile!.website_url && (
            <a href={profile!.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Globe className="w-3.5 h-3.5" /> Website
            </a>
          )}
          {profile!.linkedin_url && (
            <a href={profile!.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {profile!.contact_email && (
            <a href={`mailto:${profile!.contact_email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Mail className="w-3.5 h-3.5" /> {profile!.contact_email}
            </a>
          )}
          {profile!.contact_phone && (
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{profile!.contact_phone}</span>
          )}
        </div>
      </div>

      {/* Tags */}
      {(profile!.sectors?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Focus Sectors</p>
          <div className="flex flex-wrap gap-1.5">
            {profile!.sectors!.map(s => (
              <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}
      {(profile!.provinces?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Provinces</p>
          <div className="flex flex-wrap gap-1.5">
            {profile!.provinces!.map(p => (
              <span key={p} className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{p}</span>
            ))}
          </div>
        </div>
      )}
      {(profile!.programme_types?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Programme Types Funded</p>
          <div className="flex flex-wrap gap-1.5">
            {profile!.programme_types!.map(t => (
              <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium">{t}</span>
            ))}
          </div>
        </div>
      )}

      {profile!.annual_budget && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border text-xs text-foreground">
          <span className="font-semibold text-muted-foreground">Annual Skills Spend:</span>
          <span className="font-bold">{profile!.annual_budget}</span>
        </div>
      )}
    </div>
  );
}
