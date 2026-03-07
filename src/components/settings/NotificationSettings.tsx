import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Smartphone, Megaphone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NotifPref {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

const DEFAULTS: NotifPref[] = [
  { id: "new_opportunities",   label: "New Opportunities",      description: "When matching opportunities are posted",       email: true,  push: true,  inApp: true },
  { id: "application_updates", label: "Application Updates",    description: "Status changes on your applications",          email: true,  push: true,  inApp: true },
  { id: "task_assignments",    label: "Task Assignments",       description: "When a micro-task is assigned to you",          email: false, push: true,  inApp: true },
  { id: "payment_received",    label: "Payment Received",       description: "Wallet credits and disbursements",              email: true,  push: true,  inApp: true },
  { id: "document_verified",   label: "Document Verified",      description: "Credential and document verification results",  email: true,  push: false, inApp: true },
  { id: "system_alerts",       label: "System Alerts",          description: "Platform maintenance and downtime notices",     email: true,  push: false, inApp: true },
  { id: "marketing",           label: "Product Updates",        description: "New features and platform announcements",       email: false, push: false, inApp: false },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotifPref[]>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string, channel: "email" | "push" | "inApp") => {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p))
    );
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    toast.success("Notification preferences saved");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">Choose how and when you receive alerts</p>
        </div>
        <Button onClick={handleSave} size="sm" className="gap-2">
          {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          {saved ? "Saved" : "Save Preferences"}
        </Button>
      </div>

      {/* Channel legend */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Mail,       label: "Email",    desc: "Delivered to your inbox" },
              { icon: Smartphone, label: "Push",     desc: "Browser & mobile alerts" },
              { icon: Bell,       label: "In-App",   desc: "Notification bell" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alert Preferences</CardTitle>
          <CardDescription>Toggle individual notification types per channel</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_80px_80px] items-center px-6 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notification</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Email</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Push</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">In-App</p>
          </div>
          {prefs.map((pref, i) => (
            <div
              key={pref.id}
              className="grid grid-cols-[1fr_80px_80px_80px] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              {(["email", "push", "inApp"] as const).map((ch) => (
                <div key={ch} className="flex justify-center">
                  <Switch
                    checked={pref[ch]}
                    onCheckedChange={() => toggle(pref.id, ch)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet hours */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quiet Hours</CardTitle>
          <CardDescription>Pause push notifications during specific times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Quiet Hours</p>
              <p className="text-xs text-muted-foreground">No push notifications between 22:00 – 07:00</p>
            </div>
            <Switch className="data-[state=checked]:bg-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
