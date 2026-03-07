import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, KeyRound, Smartphone, Mail, Chrome } from "lucide-react";
import { toast } from "sonner";

export function AuthenticationSettings() {
  const [settings, setSettings] = useState({
    email_auth: true,
    google_sso: false,
    microsoft_sso: false,
    magic_link: true,
    mfa_required: false,
    session_timeout: "8",
    max_sessions: "5",
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Authentication</h2>
          <p className="text-sm text-muted-foreground">Login methods, SSO providers, and session management</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => toast.success("Auth settings saved")}>
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
      </div>

      {/* Login Methods */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Login Methods</CardTitle>
          <CardDescription>Enable or disable authentication providers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "email_auth",     label: "Email & Password",   icon: Mail,        desc: "Standard email/password login", required: true },
            { key: "magic_link",     label: "Magic Link",         icon: KeyRound,    desc: "Passwordless one-click login via email" },
            { key: "google_sso",     label: "Google SSO",         icon: Chrome,      desc: "Sign in with Google account" },
            { key: "microsoft_sso",  label: "Microsoft SSO",      icon: Smartphone,  desc: "Sign in with Microsoft / Azure AD" },
          ].map(({ key, label, icon: Icon, desc, required }) => (
            <div key={key} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{label}</p>
                  {required && <Badge variant="secondary" className="text-xs py-0">Required</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={settings[key as keyof typeof settings] as boolean}
                onCheckedChange={() => !required && toggle(key as keyof typeof settings)}
                disabled={required}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* MFA */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Multi-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium">Require MFA for all users</p>
              <p className="text-xs text-muted-foreground">All users must set up 2FA on next login</p>
            </div>
            <Switch
              checked={settings.mfa_required}
              onCheckedChange={() => toggle("mfa_required")}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Session Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Session Timeout (hours)</Label>
              <Select value={settings.session_timeout} onValueChange={(v) => setSettings({ ...settings, session_timeout: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "4", "8", "24", "72", "168"].map((v) => (
                    <SelectItem key={v} value={v}>{v} hour{Number(v) !== 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max Concurrent Sessions</Label>
              <Select value={settings.max_sessions} onValueChange={(v) => setSettings({ ...settings, max_sessions: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "5", "10", "Unlimited"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
