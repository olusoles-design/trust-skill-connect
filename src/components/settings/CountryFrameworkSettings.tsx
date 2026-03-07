import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Map, Globe, Building2, GraduationCap, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SETA_BODIES = [
  { id: "merseta",   name: "merSETA",     sector: "Manufacturing, Engineering & Related Services" },
  { id: "inseta",    name: "INSETA",      sector: "Insurance" },
  { id: "fasset",    name: "FASSET",      sector: "Finance, Accounting, Management Consulting" },
  { id: "mict",      name: "MICT SETA",  sector: "Media, Information & Communication Technology" },
  { id: "etdp",      name: "ETDP SETA",  sector: "Education, Training & Development Practices" },
  { id: "chieta",    name: "CHIETA",      sector: "Chemical Industries" },
];

const NQF_LEVELS = [
  { level: 1, label: "NQF 1", desc: "Grade 9 equivalent" },
  { level: 2, label: "NQF 2", desc: "Grade 10 equivalent" },
  { level: 3, label: "NQF 3", desc: "Grade 11 equivalent" },
  { level: 4, label: "NQF 4", desc: "Grade 12 / Matric" },
  { level: 5, label: "NQF 5", desc: "Higher Certificate" },
  { level: 6, label: "NQF 6", desc: "Diploma / Advanced Certificate" },
  { level: 7, label: "NQF 7", desc: "Bachelor's Degree" },
  { level: 8, label: "NQF 8", desc: "Honours / Postgrad Diploma" },
  { level: 9, label: "NQF 9", desc: "Master's Degree" },
  { level: 10, label: "NQF 10", desc: "Doctoral Degree" },
];

export function CountryFrameworkSettings() {
  const [activeSETAs, setActiveSETAs] = useState<string[]>(["merseta", "mict", "etdp"]);
  const [enabledNQF, setEnabledNQF] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  const toggleSETA = (id: string) =>
    setActiveSETAs((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleNQF = (level: number) =>
    setEnabledNQF((prev) => prev.includes(level) ? prev.filter((n) => n !== level) : [...prev, level]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Country Framework</h2>
          <p className="text-sm text-muted-foreground">SETA bodies, NQF levels, and regional regulatory configuration</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => toast.success("Framework settings saved")}>
          <Map className="w-3.5 h-3.5" /> Save
        </Button>
      </div>

      {/* Country */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Primary Country
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
            <div className="text-3xl">🇿🇦</div>
            <div>
              <p className="text-sm font-semibold">South Africa</p>
              <p className="text-xs text-muted-foreground">NQF, SETA, B-BBEE, POPIA active</p>
            </div>
            <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* SETA Bodies */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            SETA Bodies
          </CardTitle>
          <CardDescription>Toggle which SETAs are active on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {SETA_BODIES.map((seta) => {
            const active = activeSETAs.includes(seta.id);
            return (
              <div key={seta.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors border border-border">
                <div className="flex items-center gap-3">
                  {active ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-border" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{seta.name}</p>
                    <p className="text-xs text-muted-foreground">{seta.sector}</p>
                  </div>
                </div>
                <Switch
                  checked={active}
                  onCheckedChange={() => toggleSETA(seta.id)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* NQF Levels */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            NQF Levels
          </CardTitle>
          <CardDescription>Select which qualification levels apply to this platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {NQF_LEVELS.map(({ level, label, desc }) => {
              const active = enabledNQF.includes(level);
              return (
                <div
                  key={level}
                  onClick={() => toggleNQF(level)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${active ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20 opacity-60"}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {level}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
