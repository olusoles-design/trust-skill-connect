import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Globe } from "lucide-react";
import { toast } from "sonner";

export function GeneralSettings() {
  const [form, setForm] = useState({
    timezone: "Africa/Johannesburg",
    locale:   "en-ZA",
    currency: "ZAR",
    dateFormat: "DD/MM/YYYY",
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">General</h2>
          <p className="text-sm text-muted-foreground">Platform name, timezone, locale, and regional settings</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => toast.success("General settings saved")}>
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Regional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (UTC+2)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Locale</Label>
              <Select value={form.locale} onValueChange={(v) => setForm({ ...form, locale: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-ZA">English (South Africa)</SelectItem>
                  <SelectItem value="af-ZA">Afrikaans</SelectItem>
                  <SelectItem value="zu-ZA">isiZulu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date Format</Label>
              <Select value={form.dateFormat} onValueChange={(v) => setForm({ ...form, dateFormat: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Platform Controls</CardTitle>
          <CardDescription>Toggle platform-wide operational modes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Open Registration",    desc: "Allow new users to sign up",                  state: registrationOpen, set: setRegistrationOpen },
            { label: "Maintenance Mode",     desc: "Show maintenance page to non-admin users",    state: maintenanceMode,  set: setMaintenanceMode },
          ].map(({ label, desc, state, set }) => (
            <div key={label} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={state} onCheckedChange={set} className="data-[state=checked]:bg-primary" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
