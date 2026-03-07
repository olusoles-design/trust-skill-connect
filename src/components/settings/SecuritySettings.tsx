import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Shield, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function SecuritySettings() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [settings, setSettings] = useState({
    min_password_length: "10",
    require_uppercase: true,
    require_numbers: true,
    require_symbols: true,
    brute_force_protection: true,
    rate_limit_requests: true,
    suspicious_activity_alerts: true,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Security</h2>
          <p className="text-sm text-muted-foreground">MFA, password rules, rate limiting, and threat protection</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => toast.success("Security settings saved")}>
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
      </div>

      {/* Security Score */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Security Score</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">82</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
                <Badge className="bg-primary/15 text-primary border-primary/30">Good</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Enable MFA and symbols to reach Excellent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Policy */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Password Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5 max-w-xs">
            <Label className="text-xs text-muted-foreground">Minimum Password Length</Label>
            <Select value={settings.min_password_length} onValueChange={(v) => setSettings({ ...settings, min_password_length: v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["8", "10", "12", "14", "16"].map((v) => (
                  <SelectItem key={v} value={v}>{v} characters</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {[
              { key: "require_uppercase", label: "Require uppercase letters" },
              { key: "require_numbers",   label: "Require numbers" },
              { key: "require_symbols",   label: "Require special characters" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <p className="text-sm text-foreground">{label}</p>
                <Switch
                  checked={settings[key as keyof typeof settings] as boolean}
                  onCheckedChange={() => toggle(key as keyof typeof settings)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat Protection */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gold" />
            Threat Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { key: "brute_force_protection",      label: "Brute Force Protection",        desc: "Lock accounts after 5 failed login attempts" },
            { key: "rate_limit_requests",          label: "API Rate Limiting",             desc: "Limit to 100 requests per minute per user" },
            { key: "suspicious_activity_alerts",   label: "Suspicious Activity Alerts",   desc: "Email admins on unusual access patterns" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={settings[key as keyof typeof settings] as boolean}
                onCheckedChange={() => toggle(key as keyof typeof settings)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Current Password</Label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} className="h-9 pr-9" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">New Password</Label>
            <Input type="password" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
            <Input type="password" className="h-9" />
          </div>
          <Button size="sm" className="gap-2 mt-2" onClick={() => toast.success("Password updated")}>
            <Lock className="w-3.5 h-3.5" /> Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
