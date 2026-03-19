/**
 * PractitionerPortalWidget
 * Enhanced Practitioner Portal — Profile, Accreditations, Credentials, Sharing, Notifications
 */
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  User, GraduationCap, Award, Share2, Bell, Plus, Pencil, Trash2,
  FileText, ExternalLink, CheckCircle2, XCircle, Clock, Eye,
  Download, ShieldCheck, Upload, Settings, Loader2, RefreshCw,
  Calendar, Building2, Hash, Globe, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AcademicCredential {
  id: string;
  user_id: string;
  qualification_type: string;
  field_of_study: string | null;
  institution: string;
  completion_year: number | null;
  status: string;
  document_url: string | null;
  shareable: boolean;
  created_at: string;
}

interface VendorCredential {
  id: string;
  user_id: string;
  certification_name: string;
  vendor: string;
  credential_id: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  shareable: boolean;
  created_at: string;
}

interface SharingRequest {
  id: string;
  requester_id: string;
  practitioner_id: string;
  message: string;
  requested_types: string[];
  status: string;
  approved_at: string | null;
  access_expiry: string | null;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-500/15 text-amber-700 border-amber-200",
  approved: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  denied:   "bg-red-500/15 text-red-700 border-red-200",
  expired:  "bg-muted text-muted-foreground border-border",
};

function isExpired(date?: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

// ─── Academic Form ────────────────────────────────────────────────────────────

function AcademicForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<AcademicCredential>;
  onSave: (data: Omit<AcademicCredential, "id" | "user_id" | "created_at">) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    qualification_type: initial?.qualification_type ?? "",
    field_of_study: initial?.field_of_study ?? "",
    institution: initial?.institution ?? "",
    completion_year: initial?.completion_year?.toString() ?? "",
    status: initial?.status ?? "completed",
    document_url: initial?.document_url ?? "",
    shareable: initial?.shareable ?? true,
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/academic/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      setForm(f => ({ ...f, document_url: data.publicUrl }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.qualification_type || !form.institution) return;
    setSaving(true);
    await onSave({
      qualification_type: form.qualification_type,
      field_of_study: form.field_of_study || null,
      institution: form.institution,
      completion_year: form.completion_year ? parseInt(form.completion_year) : null,
      status: form.status,
      document_url: form.document_url || null,
      shareable: form.shareable,
    } as any);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Qualification Type *</Label>
          <Select value={form.qualification_type} onValueChange={v => setForm(f => ({ ...f, qualification_type: v }))}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              {["National Certificate", "National Diploma", "Bachelor's Degree", "Honours Degree",
                "Master's Degree", "PhD/Doctorate", "Higher Certificate", "Postgraduate Diploma", "Other"].map(t => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Field of Study</Label>
          <Input className="h-8 text-xs" value={form.field_of_study}
            onChange={e => setForm(f => ({ ...f, field_of_study: e.target.value }))}
            placeholder="e.g. Information Technology" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Institution *</Label>
          <Input className="h-8 text-xs" value={form.institution}
            onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
            placeholder="e.g. University of Johannesburg" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Completion Year</Label>
          <Input className="h-8 text-xs" type="number" min="1970" max="2030"
            value={form.completion_year}
            onChange={e => setForm(f => ({ ...f, completion_year: e.target.value }))}
            placeholder="e.g. 2020" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
              <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Certificate (optional)</Label>
          <div className="flex gap-1.5">
            <Input className="h-8 text-xs flex-1" value={form.document_url}
              onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))}
              placeholder="URL or upload →" />
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0"
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.shareable} onCheckedChange={v => setForm(f => ({ ...f, shareable: v }))} />
        <Label className="text-xs text-muted-foreground">Available for credential requests</Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="flex-1 gap-1" onClick={handleSubmit} disabled={saving || !form.qualification_type || !form.institution}>
          {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
        </Button>
      </div>
    </div>
  );
}

// ─── Vendor Form ──────────────────────────────────────────────────────────────

function VendorForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<VendorCredential>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    certification_name: initial?.certification_name ?? "",
    vendor: initial?.vendor ?? "",
    credential_id: initial?.credential_id ?? "",
    issue_date: initial?.issue_date ?? "",
    expiry_date: initial?.expiry_date ?? "",
    document_url: initial?.document_url ?? "",
    shareable: initial?.shareable ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/vendor/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      setForm(f => ({ ...f, document_url: data.publicUrl }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.certification_name || !form.vendor) return;
    setSaving(true);
    await onSave({
      certification_name: form.certification_name,
      vendor: form.vendor,
      credential_id: form.credential_id || null,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      document_url: form.document_url || null,
      shareable: form.shareable,
    });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Certification Name *</Label>
          <Input className="h-8 text-xs" value={form.certification_name}
            onChange={e => setForm(f => ({ ...f, certification_name: e.target.value }))}
            placeholder="e.g. AWS Solutions Architect" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Vendor / Body *</Label>
          <Input className="h-8 text-xs" value={form.vendor}
            onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
            placeholder="e.g. Amazon Web Services" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Credential ID / Licence No.</Label>
          <Input className="h-8 text-xs" value={form.credential_id}
            onChange={e => setForm(f => ({ ...f, credential_id: e.target.value }))}
            placeholder="e.g. AWS-123456" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Issue Date</Label>
          <Input className="h-8 text-xs" type="date" value={form.issue_date}
            onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Expiry Date</Label>
          <Input className="h-8 text-xs" type="date" value={form.expiry_date}
            onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Certificate</Label>
          <div className="flex gap-1.5">
            <Input className="h-8 text-xs flex-1" value={form.document_url}
              onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))}
              placeholder="URL or upload →" />
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0"
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.shareable} onCheckedChange={v => setForm(f => ({ ...f, shareable: v }))} />
        <Label className="text-xs text-muted-foreground">Available for credential requests</Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="flex-1 gap-1" onClick={handleSubmit} disabled={saving || !form.certification_name || !form.vendor}>
          {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
        </Button>
      </div>
    </div>
  );
}

// ─── Sharing Request Modal ─────────────────────────────────────────────────────

function RequestModal({
  practitionerId, onClose,
}: {
  practitionerId: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const TYPE_OPTIONS = ["accreditations", "academic", "vendor"];

  function toggle(t: string) {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSend() {
    if (!user || !message.trim() || types.length === 0) return;
    setSaving(true);
    const { error } = await (supabase.from("sharing_requests" as any) as any).insert({
      requester_id: user.id,
      practitioner_id: practitionerId,
      message: message.trim(),
      requested_types: types,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to send request", variant: "destructive" });
    } else {
      toast({ title: "Request sent", description: "The practitioner will be notified." });
      // Insert notification for practitioner
      await (supabase.from("notifications" as any) as any).insert({
        user_id: practitionerId,
        type: "sharing_request",
        title: "New Credential Request",
        body: `Someone requested access to your credentials.`,
        data: { requester_id: user.id, types },
      });
      onClose();
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Request Credentials</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Select credential types *</Label>
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => toggle(t)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    types.includes(t)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Message *</Label>
            <Textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Explain why you need access to these credentials…"
              className="text-xs resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSend} disabled={saving || !message.trim() || types.length === 0} className="gap-1">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Approve/Deny Request ─────────────────────────────────────────────────────

function ApproveModal({
  request, onClose, onRefresh,
}: {
  request: SharingRequest;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [days, setDays] = useState("30");
  const [watermark, setWatermark] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleApprove() {
    setSaving(true);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + parseInt(days));
    const { error } = await (supabase.from("sharing_requests" as any) as any)
      .update({ status: "approved", approved_at: new Date().toISOString(), access_expiry: expiry.toISOString() })
      .eq("id", request.id);
    if (!error) {
      // Create shared_access token
      await (supabase.from("shared_access" as any) as any).insert({
        request_id: request.id,
        expiry: expiry.toISOString(),
        watermark,
        document_urls: [],
      });
      // Notify requester
      await (supabase.from("notifications" as any) as any).insert({
        user_id: request.requester_id,
        type: "request_approved",
        title: "Credential Request Approved",
        body: `Your credential request has been approved. Access expires on ${expiry.toLocaleDateString()}.`,
        data: { request_id: request.id },
      });
      toast({ title: "Request approved", description: "Requester has been notified." });
      onRefresh();
    }
    setSaving(false);
    onClose();
  }

  async function handleDeny() {
    setSaving(true);
    await (supabase.from("sharing_requests" as any) as any)
      .update({ status: "denied" })
      .eq("id", request.id);
    await (supabase.from("notifications" as any) as any).insert({
      user_id: request.requester_id,
      type: "request_denied",
      title: "Credential Request Declined",
      body: "Your credential request was not approved.",
      data: { request_id: request.id },
    });
    toast({ title: "Request denied" });
    setSaving(false);
    onRefresh();
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Respond to Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1 text-xs text-muted-foreground">
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <p className="font-semibold text-foreground">Types requested:</p>
            <p>{(request.requested_types || []).join(", ")}</p>
            <p className="font-semibold text-foreground mt-2">Message:</p>
            <p className="italic">"{request.message}"</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Access Duration (days)</Label>
            <Input className="h-8 text-xs" type="number" min="1" max="365"
              value={days} onChange={e => setDays(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watermark} onCheckedChange={setWatermark} />
            <Label className="text-xs">Apply watermark to documents</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="destructive" size="sm" onClick={handleDeny} disabled={saving} className="gap-1">
            <XCircle className="w-3.5 h-3.5" /> Deny
          </Button>
          <Button size="sm" onClick={handleApprove} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function PractitionerPortalWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", bio: "", job_title: "", location: "", phone: "", linkedin_url: "", website_url: "", years_experience: "" });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Credential form state
  const [showAcadForm, setShowAcadForm] = useState(false);
  const [editAcad, setEditAcad] = useState<AcademicCredential | null>(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorCredential | null>(null);

  // Sharing state
  const [approveReq, setApproveReq] = useState<SharingRequest | null>(null);

  if (!user) return null;

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: accreditations = [] } = useQuery({
    queryKey: ["practitioner_accreditations", user.id],
    queryFn: async () => {
      const { data } = await (supabase.from("practitioner_accreditations" as any) as any)
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: academic = [], refetch: refetchAcademic } = useQuery({
    queryKey: ["academic_credentials", user.id],
    queryFn: async () => {
      const { data } = await (supabase.from("academic_credentials" as any) as any)
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return (data ?? []) as AcademicCredential[];
    },
  });

  const { data: vendor = [], refetch: refetchVendor } = useQuery({
    queryKey: ["vendor_credentials", user.id],
    queryFn: async () => {
      const { data } = await (supabase.from("vendor_credentials" as any) as any)
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return (data ?? []) as VendorCredential[];
    },
  });

  const { data: inboxRequests = [], refetch: refetchInbox } = useQuery({
    queryKey: ["sharing_requests_inbox", user.id],
    queryFn: async () => {
      const { data } = await (supabase.from("sharing_requests" as any) as any)
        .select("*").eq("practitioner_id", user.id).order("created_at", { ascending: false });
      return (data ?? []) as SharingRequest[];
    },
  });

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sharing_requests_sent", user.id],
    queryFn: async () => {
      const { data } = await (supabase.from("sharing_requests" as any) as any)
        .select("*").eq("requester_id", user.id).order("created_at", { ascending: false });
      return (data ?? []) as SharingRequest[];
    },
  });

  const { data: notifications = [], refetch: refetchNotifs } = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: async () => {
      const { data } = await (supabase.from("notifications" as any) as any)
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      return (data ?? []) as Notification[];
    },
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("notifications_" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refetchNotifs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user.id, refetchNotifs]);

  // ─── Profile init ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (profile && !editingProfile) {
      setProfileForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        bio: profile.bio ?? "",
        job_title: profile.job_title ?? "",
        location: profile.location ?? "",
        phone: profile.phone ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        website_url: profile.website_url ?? "",
        years_experience: "",
      });
    }
  }, [profile]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async function saveProfile() {
    const { error } = await supabase.from("profiles").update({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      bio: profileForm.bio,
      job_title: profileForm.job_title,
      location: profileForm.location,
      phone: profileForm.phone,
      linkedin_url: profileForm.linkedin_url,
      website_url: profileForm.website_url,
    }).eq("user_id", user.id);
    if (error) toast({ title: "Save failed", variant: "destructive" });
    else {
      toast({ title: "Profile updated" });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      setEditingProfile(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    const path = `${user.id}/avatar_${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Avatar updated" });
    }
    setAvatarUploading(false);
  }

  async function saveAcademic(data: any) {
    if (editAcad) {
      await (supabase.from("academic_credentials" as any) as any)
        .update(data).eq("id", editAcad.id);
    } else {
      await (supabase.from("academic_credentials" as any) as any)
        .insert({ ...data, user_id: user.id });
    }
    setShowAcadForm(false);
    setEditAcad(null);
    refetchAcademic();
    toast({ title: editAcad ? "Qualification updated" : "Qualification added" });
  }

  async function deleteAcademic(id: string) {
    await (supabase.from("academic_credentials" as any) as any).delete().eq("id", id);
    refetchAcademic();
    toast({ title: "Qualification removed" });
  }

  async function saveVendor(data: any) {
    if (editVendor) {
      await (supabase.from("vendor_credentials" as any) as any)
        .update(data).eq("id", editVendor.id);
    } else {
      await (supabase.from("vendor_credentials" as any) as any)
        .insert({ ...data, user_id: user.id });
    }
    setShowVendorForm(false);
    setEditVendor(null);
    refetchVendor();
    toast({ title: editVendor ? "Certification updated" : "Certification added" });
  }

  async function deleteVendor(id: string) {
    await (supabase.from("vendor_credentials" as any) as any).delete().eq("id", id);
    refetchVendor();
    toast({ title: "Certification removed" });
  }

  async function markAllRead() {
    await (supabase.from("notifications" as any) as any)
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    refetchNotifs();
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Practitioner Portal</h2>
          <p className="text-xs text-muted-foreground">Manage your professional credentials and sharing settings</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Bell className="w-3 h-3" />
            {unreadCount} new
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 h-9 w-full">
          <TabsTrigger value="profile" className="text-xs gap-1">
            <User className="w-3 h-3" /> Profile
          </TabsTrigger>
          <TabsTrigger value="accreditations" className="text-xs gap-1">
            <Award className="w-3 h-3" /> Accreditations
          </TabsTrigger>
          <TabsTrigger value="credentials" className="text-xs gap-1">
            <GraduationCap className="w-3 h-3" /> Credentials
          </TabsTrigger>
          <TabsTrigger value="sharing" className="text-xs gap-1 relative">
            <Share2 className="w-3 h-3" /> Sharing
            {inboxRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs gap-1 relative">
            <Bell className="w-3 h-3" /> Alerts
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          {/* Profile Card */}
          <div className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-sm">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-xl border-2 border-border bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => avatarRef.current?.click()}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center cursor-pointer"
                onClick={() => avatarRef.current?.click()}>
                <Upload className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editingProfile ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input className="h-7 text-xs" placeholder="First name" value={profileForm.first_name}
                    onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} />
                  <Input className="h-7 text-xs" placeholder="Last name" value={profileForm.last_name}
                    onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} />
                  <Input className="h-7 text-xs col-span-2" placeholder="Job title / speciality" value={profileForm.job_title}
                    onChange={e => setProfileForm(f => ({ ...f, job_title: e.target.value }))} />
                  <Input className="h-7 text-xs" placeholder="Location" value={profileForm.location}
                    onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))} />
                  <Input className="h-7 text-xs" placeholder="Phone" value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                  <Input className="h-7 text-xs" placeholder="LinkedIn URL" value={profileForm.linkedin_url}
                    onChange={e => setProfileForm(f => ({ ...f, linkedin_url: e.target.value }))} />
                  <Input className="h-7 text-xs" placeholder="Website URL" value={profileForm.website_url}
                    onChange={e => setProfileForm(f => ({ ...f, website_url: e.target.value }))} />
                  <Textarea className="col-span-2 text-xs resize-none" rows={2} placeholder="Short bio…"
                    value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
                  <div className="col-span-2 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setEditingProfile(false)}>Cancel</Button>
                    <Button size="sm" className="flex-1 h-7 text-xs" onClick={saveProfile}>Save</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground text-sm">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{profile?.job_title || "Practitioner"}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingProfile(true)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {profile?.bio && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{profile.bio}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile?.location && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{profile.location}</span>}
                    {profile?.phone && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{profile.phone}</span>}
                    {profile?.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        LinkedIn ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-border bg-card text-center">
              <p className="text-xl font-bold text-primary">{accreditations.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Accreditations</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card text-center">
              <p className="text-xl font-bold text-primary">{academic.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Qualifications</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card text-center">
              <p className="text-xl font-bold text-primary">{vendor.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Certifications</p>
            </div>
          </div>

          {/* Accreditation type tags */}
          {accreditations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Roles Held</p>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(accreditations.map((a: any) => a.role_type))].map((rt: any) => (
                  <span key={rt} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                    {rt.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── ACCREDITATIONS TAB ────────────────────────────────────────────── */}
        <TabsContent value="accreditations" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              SETA Accreditation Letters ({accreditations.length})
            </p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
              onClick={() => qc.invalidateQueries({ queryKey: ["practitioner_accreditations", user.id] })}>
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>

          {accreditations.length === 0 ? (
            <div className="p-6 text-center rounded-xl border-2 border-dashed border-border">
              <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No accreditations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use the Accreditation Uploader to extract data from your SETA letters</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[10px] h-8">Role</TableHead>
                    <TableHead className="text-[10px] h-8">SETA Body</TableHead>
                    <TableHead className="text-[10px] h-8">Reg. Number</TableHead>
                    <TableHead className="text-[10px] h-8">Valid To</TableHead>
                    <TableHead className="text-[10px] h-8">Shareable</TableHead>
                    <TableHead className="text-[10px] h-8 text-right">Doc</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accreditations.map((a: any) => (
                    <TableRow key={a.id} className="text-xs">
                      <TableCell className="font-medium capitalize">{a.role_type?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-muted-foreground">{a.seta_body}</TableCell>
                      <TableCell className="font-mono text-primary text-[10px]">{a.registration_number || "—"}</TableCell>
                      <TableCell>
                        {a.valid_to ? (
                          <span className={isExpired(a.valid_to) ? "text-destructive" : "text-foreground"}>
                            {new Date(a.valid_to).toLocaleDateString("en-ZA")}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-[10px] ${a.shareable ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {a.shareable ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {a.shareable ? "Yes" : "No"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {a.document_url ? (
                          <a href={a.document_url} target="_blank" rel="noreferrer">
                            <FileText className="w-3.5 h-3.5 text-primary hover:text-primary/70 transition-colors" />
                          </a>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── CREDENTIALS TAB ───────────────────────────────────────────────── */}
        <TabsContent value="credentials" className="mt-4 space-y-6">
          {/* Academic Qualifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Academic Qualifications</p>
                <Badge variant="secondary" className="text-[10px]">{academic.length}</Badge>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                onClick={() => { setShowAcadForm(true); setEditAcad(null); }}>
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>

            {(showAcadForm || editAcad) && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                <p className="text-xs font-semibold mb-3 text-primary">{editAcad ? "Edit Qualification" : "Add Qualification"}</p>
                <AcademicForm
                  initial={editAcad ?? undefined}
                  onSave={saveAcademic}
                  onCancel={() => { setShowAcadForm(false); setEditAcad(null); }}
                />
              </div>
            )}

            {academic.length === 0 && !showAcadForm ? (
              <div className="p-4 text-center rounded-xl border-2 border-dashed border-border">
                <p className="text-xs text-muted-foreground">No academic qualifications added yet</p>
              </div>
            ) : (
              academic.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-[10px] h-8">Qualification</TableHead>
                        <TableHead className="text-[10px] h-8">Field</TableHead>
                        <TableHead className="text-[10px] h-8">Institution</TableHead>
                        <TableHead className="text-[10px] h-8">Year</TableHead>
                        <TableHead className="text-[10px] h-8">Status</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academic.map(a => (
                        <TableRow key={a.id} className="text-xs">
                          <TableCell className="font-medium">{a.qualification_type}</TableCell>
                          <TableCell className="text-muted-foreground">{a.field_of_study || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{a.institution}</TableCell>
                          <TableCell>{a.completion_year || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={a.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                              {a.status === "completed" ? "Completed" : "In Progress"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {a.document_url && (
                                <a href={a.document_url} target="_blank" rel="noreferrer">
                                  <FileText className="w-3 h-3 text-primary" />
                                </a>
                              )}
                              <button onClick={() => { setEditAcad(a); setShowAcadForm(false); }}>
                                <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                              </button>
                              <button onClick={() => deleteAcademic(a.id)}>
                                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}
          </div>

          {/* Vendor Certifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Vendor / International Certifications</p>
                <Badge variant="secondary" className="text-[10px]">{vendor.length}</Badge>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                onClick={() => { setShowVendorForm(true); setEditVendor(null); }}>
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>

            {(showVendorForm || editVendor) && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                <p className="text-xs font-semibold mb-3 text-primary">{editVendor ? "Edit Certification" : "Add Certification"}</p>
                <VendorForm
                  initial={editVendor ?? undefined}
                  onSave={saveVendor}
                  onCancel={() => { setShowVendorForm(false); setEditVendor(null); }}
                />
              </div>
            )}

            {vendor.length === 0 && !showVendorForm ? (
              <div className="p-4 text-center rounded-xl border-2 border-dashed border-border">
                <p className="text-xs text-muted-foreground">No vendor certifications added yet</p>
              </div>
            ) : (
              vendor.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-[10px] h-8">Certification</TableHead>
                        <TableHead className="text-[10px] h-8">Vendor</TableHead>
                        <TableHead className="text-[10px] h-8">Credential ID</TableHead>
                        <TableHead className="text-[10px] h-8">Expiry</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.map(v => (
                        <TableRow key={v.id} className="text-xs">
                          <TableCell className="font-medium">{v.certification_name}</TableCell>
                          <TableCell className="text-muted-foreground">{v.vendor}</TableCell>
                          <TableCell className="font-mono text-[10px] text-primary">{v.credential_id || "—"}</TableCell>
                          <TableCell>
                            {v.expiry_date ? (
                              <span className={isExpired(v.expiry_date) ? "text-destructive" : "text-foreground"}>
                                {new Date(v.expiry_date).toLocaleDateString("en-ZA")}
                                {isExpired(v.expiry_date) && " (expired)"}
                              </span>
                            ) : "No expiry"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {v.document_url && (
                                <a href={v.document_url} target="_blank" rel="noreferrer">
                                  <FileText className="w-3 h-3 text-primary" />
                                </a>
                              )}
                              <button onClick={() => { setEditVendor(v); setShowVendorForm(false); }}>
                                <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                              </button>
                              <button onClick={() => deleteVendor(v.id)}>
                                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}
          </div>
        </TabsContent>

        {/* ── SHARING TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="sharing" className="mt-4 space-y-4">
          <Tabs defaultValue="inbox">
            <TabsList className="h-8">
              <TabsTrigger value="inbox" className="text-xs h-7 relative">
                Inbox
                {inboxRequests.filter(r => r.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">
                    {inboxRequests.filter(r => r.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs h-7">Sent</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="mt-3 space-y-2">
              {inboxRequests.length === 0 ? (
                <div className="p-6 text-center rounded-xl border-2 border-dashed border-border">
                  <Share2 className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No requests received yet</p>
                </div>
              ) : inboxRequests.map(req => (
                <div key={req.id} className={`p-3 rounded-xl border ${req.status === "pending" ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20" : "border-border bg-card"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[req.status] ?? ""}`}>
                          {req.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString("en-ZA")}
                        </span>
                      </div>
                      <p className="text-xs mt-1.5 font-medium">
                        Types: {(req.requested_types || []).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-2">"{req.message}"</p>
                    </div>
                    {req.status === "pending" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
                        onClick={() => setApproveReq(req)}>
                        Respond
                      </Button>
                    )}
                  </div>
                  {req.status === "approved" && req.access_expiry && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Access expires: {new Date(req.access_expiry).toLocaleDateString("en-ZA")}
                    </p>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="sent" className="mt-3 space-y-2">
              {sentRequests.length === 0 ? (
                <div className="p-6 text-center rounded-xl border-2 border-dashed border-border">
                  <p className="text-xs text-muted-foreground">You haven't sent any requests yet</p>
                </div>
              ) : sentRequests.map(req => (
                <div key={req.id} className="p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[req.status] ?? ""}`}>
                          {req.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString("en-ZA")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Types: {(req.requested_types || []).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ─────────────────────────────────────────────── */}
        <TabsContent value="notifications" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{notifications.length} notifications</p>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center rounded-xl border-2 border-dashed border-border">
              <Bell className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition-all ${
                    n.read_at ? "border-border bg-card opacity-70" : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${n.read_at ? "bg-muted-foreground/30" : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      {n.body && <p className="text-[10px] text-muted-foreground mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.created_at).toLocaleString("en-ZA")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Modal */}
      {approveReq && (
        <ApproveModal
          request={approveReq}
          onClose={() => setApproveReq(null)}
          onRefresh={refetchInbox}
        />
      )}
    </div>
  );
}
