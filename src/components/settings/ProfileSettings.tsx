import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, Phone, MapPin, Briefcase, Link, Edit3, Save, X,
  GraduationCap, Shield, Activity, Camera, Award,
} from "lucide-react";
import { AccreditationsProfileWidget } from "@/components/dashboard/widgets/talent/AccreditationsProfileWidget";
import { toast } from "sonner";
import { format } from "date-fns";

export function ProfileSettings() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: user!.id, ...updates }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      setEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const startEdit = () => {
    setForm({
      first_name:   profile?.first_name ?? "",
      last_name:    profile?.last_name ?? "",
      username:     profile?.username ?? "",
      bio:          profile?.bio ?? "",
      job_title:    profile?.job_title ?? "",
      location:     profile?.location ?? "",
      phone:        profile?.phone ?? "",
      linkedin_url: profile?.linkedin_url ?? "",
      website_url:  profile?.website_url ?? "",
    });
    setEditing(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").upsert({ user_id: user.id, avatar_url: data.publicUrl }, { onConflict: "user_id" });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Avatar updated");
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "?"}`;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Not specified";

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your personal information and public presence</p>
        </div>
        {!editing ? (
          <Button onClick={startEdit} variant="outline" size="sm" className="gap-2">
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => mutation.mutate(form)} size="sm" className="gap-2" disabled={mutation.isPending}>
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
            <Button onClick={() => setEditing(false)} variant="ghost" size="sm" className="gap-2">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="border-b border-border rounded-none bg-transparent h-auto p-0 space-x-6 w-full justify-start">
          {[
            { value: "personal",  label: "Personal",  icon: User },
            { value: "learning",  label: "Learning",  icon: GraduationCap },
            { value: "security",  label: "Security",  icon: Shield },
            { value: "audit",     label: "Audit",     icon: Activity },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground font-medium text-sm"
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="personal" className="mt-6 space-y-4">
          {/* Personal Details Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Personal Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 mb-6">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar className="w-20 h-20 border-2 border-border">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-background" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                  {role && (
                    <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs px-2 py-0 capitalize bg-accent text-accent-foreground border-0 whitespace-nowrap">
                      {role.replace("_", " ")}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  {editing ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">First Name</Label>
                        <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Last Name</Label>
                        <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Username</Label>
                        <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="h-9" placeholder="@username" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Job Title</Label>
                        <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className="h-9" />
                      </div>
                    </>
                  ) : (
                    <>
                      <ProfileField icon={User} label="Full Name" value={fullName} />
                      <ProfileField icon={User} label="Username" value={profile?.username ? `@${profile.username}` : undefined} />
                      <ProfileField icon={Briefcase} label="Job Title" value={profile?.job_title} />
                      <ProfileField icon={MapPin} label="Location" value={profile?.location} />
                    </>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Location</Label>
                      <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Bio</Label>
                      <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="min-h-20 resize-none" />
                    </div>
                  </>
                ) : (
                  <>
                    <ProfileField icon={Mail} label="Email" value={user?.email} />
                    <ProfileField icon={Phone} label="Phone" value={profile?.phone} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <ProfileField icon={User} label="Username" value={profile?.username ? `@${profile.username}` : undefined} />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Access Level</p>
                  <Badge className="capitalize bg-accent text-accent-foreground border-0">
                    {role?.replace("_", " ") ?? "Member"}
                  </Badge>
                </div>
                <ProfileField icon={Activity} label="Registered" value={user?.created_at ? format(new Date(user.created_at), "dd MMM yyyy") : undefined} />
                <ProfileField icon={Mail} label="Email Verified" value={user?.email_confirmed_at ? "Verified" : "Pending"} />
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Links & Social</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">LinkedIn URL</Label>
                    <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} className="h-9" placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Website URL</Label>
                    <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="h-9" placeholder="https://..." />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <ProfileField icon={Link} label="LinkedIn" value={profile?.linkedin_url} href={profile?.linkedin_url ?? undefined} />
                  <ProfileField icon={Link} label="Website" value={profile?.website_url} href={profile?.website_url ?? undefined} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Learning Profile</CardTitle>
              <CardDescription>Your qualifications and skill credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ProfileField icon={GraduationCap} label="NQF Level" value={profile?.nqf_level} />
                <ProfileField icon={MapPin} label="Languages" value={profile?.languages?.join(", ")} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Skills</p>
                {profile?.skills?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No skills listed</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Account Security</CardTitle>
              <CardDescription>Manage your password and sign-in sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">Last changed: unknown</p>
                </div>
                <Button variant="outline" size="sm">Change Password</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">Enable MFA</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Active Sessions</p>
                  <p className="text-xs text-muted-foreground">Manage where you're signed in</p>
                </div>
                <Button variant="outline" size="sm">View Sessions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Activity Audit Log</CardTitle>
              <CardDescription>A record of recent actions on your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "Profile viewed",      time: "Just now",   type: "info" },
                  { action: "Signed in",           time: "Today",      type: "success" },
                  { action: "Settings accessed",   time: "Today",      type: "info" },
                  { action: "Password unchanged",  time: "—",          type: "warning" },
                ].map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.type === "success" ? "bg-primary" : entry.type === "warning" ? "bg-gold" : "bg-muted-foreground"}`} />
                    <p className="text-sm flex-1 text-foreground">{entry.action}</p>
                    <span className="text-xs text-muted-foreground">{entry.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  href?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate block">
          {value}
        </a>
      ) : (
        <p className={`text-sm truncate ${value ? "text-foreground font-medium" : "text-muted-foreground italic"}`}>
          {value ?? "Not specified"}
        </p>
      )}
    </div>
  );
}
