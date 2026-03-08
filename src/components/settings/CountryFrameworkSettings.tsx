import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Globe, Building2, GraduationCap, CheckCircle2, Layers, FlaskConical, Award } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRegulatoryBodies, type BodyType } from "@/hooks/useRegulatoryBodies";

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

const BODY_TYPE_META: Record<BodyType | "other", { label: string; icon: React.ElementType; color: string }> = {
  seta:             { label: "SETA",              icon: Building2,    color: "text-primary" },
  qcto:             { label: "QCTO",              icon: Layers,       color: "text-blue-600" },
  saqa:             { label: "SAQA",              icon: FlaskConical, color: "text-purple-600" },
  professional_body:{ label: "Professional Body", icon: Award,        color: "text-orange-600" },
  other:            { label: "Other",             icon: Globe,        color: "text-muted-foreground" },
};

export function CountryFrameworkSettings() {
  const { data: bodies, isLoading } = useRegulatoryBodies();
  const [activeIds,  setActiveIds]  = useState<Set<string>>(new Set());
  const [enabledNQF, setEnabledNQF] = useState<number[]>([1,2,3,4,5,6,7,8,9,10]);

  // Derive active set — all loaded bodies are active by default
  const effectiveActive = activeIds.size > 0
    ? activeIds
    : new Set((bodies ?? []).map(b => b.id));

  const toggle = (id: string) =>
    setActiveIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleNQF = (level: number) =>
    setEnabledNQF(prev => prev.includes(level) ? prev.filter(n => n !== level) : [...prev, level]);

  // Group bodies by type
  const grouped = (bodies ?? []).reduce<Record<string, typeof bodies>>((acc, b) => {
    if (!acc[b.body_type]) acc[b.body_type] = [];
    acc[b.body_type]!.push(b);
    return acc;
  }, {});

  const typeOrder: BodyType[] = ["seta", "qcto", "saqa", "professional_body", "other"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Regulatory Framework</h2>
          <p className="text-sm text-muted-foreground">
            Manage statutory and voluntary bodies — SETA, QCTO, SAQA, professional bodies and NQF levels
          </p>
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
              <p className="text-xs text-muted-foreground">NQF · SETA · QCTO · B-BBEE · POPIA · SARS active</p>
            </div>
            <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Bodies — grouped */}
      {isLoading ? (
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      ) : (
        typeOrder.map(type => {
          const group = grouped[type];
          if (!group || group.length === 0) return null;
          const meta = BODY_TYPE_META[type];
          const Icon = meta.icon;
          return (
            <Card key={type} className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                  {meta.label} Bodies
                  <Badge variant="outline" className="ml-auto text-[10px]">{group.filter(b => activeIds.has(b.id)).length}/{group.length} active</Badge>
                </CardTitle>
                <CardDescription>
                  {type === "seta" && "Levy-funded sector bodies — govern WSP/ATR reporting and discretionary grants"}
                  {type === "qcto" && "Quality Council for Trades & Occupations — OFO-based occupational qualifications"}
                  {type === "saqa" && "South African Qualifications Authority — NQF oversight and NLRD"}
                  {type === "professional_body" && "Self-regulating professional bodies — CPD requirements and membership recognition"}
                  {type === "other" && "Other quality councils and statutory bodies"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.map(body => {
                  const active = activeIds.has(body.id);
                  const formats = (body.reporting_formats as string[]).slice(0, 3);
                  return (
                    <div key={body.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors border border-border">
                      <div className="flex items-center gap-3">
                        {active ? (
                          <CheckCircle2 className={`w-4 h-4 ${meta.color}`} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-border" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{body.acronym}</p>
                            {body.is_levy_funded && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">LEVY</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{body.sector ?? body.full_name}</p>
                          {formats.length > 0 && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              Reports: {formats.join(" · ")}
                              {(body.reporting_formats as string[]).length > 3 && ` +${(body.reporting_formats as string[]).length - 3}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={active}
                        onCheckedChange={() => toggle(body.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}

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
