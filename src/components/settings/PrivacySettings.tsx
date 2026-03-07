import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Save, Download, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

export function PrivacySettings() {
  const [prefs, setPrefs] = useState({
    profile_public:        true,
    show_in_search:        true,
    share_analytics:       false,
    marketing_cookies:     false,
    functional_cookies:    true,
    data_processing_consent: true,
  });

  const toggle = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Privacy</h2>
          <p className="text-sm text-muted-foreground">POPIA, GDPR, consent management, and data rights</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => toast.success("Privacy settings saved")}>
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
      </div>

      {/* Compliance Badge */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">POPIA & GDPR Compliant</p>
              <p className="text-xs text-muted-foreground">All data is processed in accordance with South African and EU regulations</p>
            </div>
            <Badge className="bg-primary/15 text-primary border-primary/20">Compliant</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Profile Privacy */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Profile Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { key: "profile_public",  label: "Public Profile",      desc: "Anyone can view your profile" },
            { key: "show_in_search",  label: "Search Visibility",   desc: "Appear in employer talent searches" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={prefs[key as keyof typeof prefs] as boolean}
                onCheckedChange={() => toggle(key as keyof typeof prefs)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cookies & Consent */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cookies & Consent</CardTitle>
          <CardDescription>Control how your data is collected and used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { key: "functional_cookies",       label: "Functional Cookies",    desc: "Required for core features (cannot be disabled)", required: true },
            { key: "marketing_cookies",         label: "Marketing Cookies",     desc: "Personalised ads and retargeting" },
            { key: "share_analytics",           label: "Usage Analytics",       desc: "Help us improve by sharing anonymous usage data" },
            { key: "data_processing_consent",   label: "Data Processing",       desc: "Consent to process your personal data for service delivery" },
          ].map(({ key, label, desc, required }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{label}</p>
                  {required && <Badge variant="secondary" className="text-xs py-0">Required</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={prefs[key as keyof typeof prefs] as boolean}
                onCheckedChange={() => !required && toggle(key as keyof typeof prefs)}
                disabled={required}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Data Rights</CardTitle>
          <CardDescription>POPIA grants you the right to access, correct, or delete your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">Download My Data</p>
              <p className="text-xs text-muted-foreground">Export a copy of all your data</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div>
              <p className="text-sm font-medium text-destructive">Delete My Account</p>
              <p className="text-xs text-muted-foreground">Permanently remove all your data</p>
            </div>
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
