import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save, Palette, Upload, Eye } from "lucide-react";
import { toast } from "sonner";

export function BrandingSettings() {
  const [form, setForm] = useState({
    platform_name:   "SkillsMark",
    tagline:         "Verified Skills. Real Opportunities.",
    primary_color:   "#16b3a8",
    secondary_color: "#0d1b3e",
    accent_color:    "#f5a623",
    footer_text:     "© 2026 SkillsMark. All rights reserved.",
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Branding</h2>
          <p className="text-sm text-muted-foreground">Customise the platform's visual identity</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => toast.success("Branding settings saved")}>
          <Save className="w-3.5 h-3.5" /> Save Changes
        </Button>
      </div>

      {/* Logo & Name */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identity</CardTitle>
          <CardDescription>Platform name, tagline, and logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Platform Name</Label>
              <Input {...field("platform_name")} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tagline</Label>
              <Input {...field("tagline")} className="h-9" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Logo upload */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Logo (Light)</Label>
              <div className="h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload PNG/SVG</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Logo (Dark)</Label>
              <div className="h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors bg-secondary/5">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload PNG/SVG</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colours */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Brand Colours
          </CardTitle>
          <CardDescription>Define the primary colour palette</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "primary_color",   label: "Primary (Teal)" },
              { key: "secondary_color", label: "Secondary (Navy)" },
              { key: "accent_color",    label: "Accent (Gold)" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-lg border border-border flex-shrink-0 cursor-pointer"
                    style={{ backgroundColor: form[key as keyof typeof form] }}
                  />
                  <Input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="h-9 font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Colour preview */}
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Preview</p>
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-md" style={{ backgroundColor: form.primary_color }} />
              <div className="h-8 flex-1 rounded-md" style={{ backgroundColor: form.secondary_color }} />
              <div className="h-8 flex-1 rounded-md" style={{ backgroundColor: form.accent_color }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Footer & Legal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Footer Text</Label>
            <Input {...field("footer_text")} className="h-9" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
