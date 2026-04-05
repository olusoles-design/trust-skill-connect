import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BookOpen, Calendar, Loader2, Plus, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Programme {
  id: string;
  title: string;
  provider: string;
  nqf_level: number;
  progress_pct: number;
  modules_completed: number;
  total_modules: number;
  due_date: string | null;
  status: "active" | "completed" | "paused";
}

const statusColor: Record<Programme["status"], string> = {
  active:    "bg-primary/15 text-primary",
  completed: "bg-green-500/15 text-green-600",
  paused:    "bg-muted text-muted-foreground",
};

const EMPTY_FORM = {
  title: "",
  provider: "",
  nqf_level: "3",
  total_modules: "10",
  due_date: "",
};

export function LearningProgressWidget() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchProgrammes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("learner_programmes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setProgrammes(data.map((r: any) => ({
        id: r.id,
        title: r.title,
        provider: r.provider,
        nqf_level: r.nqf_level,
        progress_pct: r.progress_pct,
        modules_completed: r.modules_completed,
        total_modules: r.total_modules,
        due_date: r.due_date,
        status: r.status as Programme["status"],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchProgrammes(); }, []);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.provider.trim()) {
      toast.error("Title and provider are required");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in first"); setSaving(false); return; }

    const { error } = await supabase.from("learner_programmes").insert({
      user_id: user.id,
      title: form.title.trim(),
      provider: form.provider.trim(),
      nqf_level: parseInt(form.nqf_level),
      total_modules: parseInt(form.total_modules) || 1,
      due_date: form.due_date || null,
    });

    if (error) {
      toast.error("Failed to add programme");
    } else {
      toast.success("Programme added");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchProgrammes();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("learner_programmes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove programme");
    } else {
      setProgrammes(prev => prev.filter(p => p.id !== id));
      toast.success("Programme removed");
    }
  };

  const activeProgrammes = programmes.filter(p => p.status !== "completed");
  const completed = programmes.filter(p => p.status === "completed").length;
  const avgProgress = programmes.length
    ? Math.round(programmes.reduce((s, p) => s + p.progress_pct, 0) / programmes.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{activeProgrammes.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{completed}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg. Progress</p>
        </div>
      </div>

      {/* Add programme button / form */}
      {!showForm ? (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Programme
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Add Programme</p>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">Programme Title *</Label>
              <Input
                placeholder="e.g. National Certificate: IT Support"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Training Provider *</Label>
              <Input
                placeholder="e.g. Bytes Academy"
                value={form.provider}
                onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">NQF Level</Label>
              <Select value={form.nqf_level} onValueChange={v => setForm(f => ({ ...f, nqf_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <SelectItem key={n} value={String(n)}>NQF {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Total Modules</Label>
              <Input
                type="number"
                min={1}
                value={form.total_modules}
                onChange={e => setForm(f => ({ ...f, total_modules: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Expected Completion</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Programme
            </Button>
          </div>
        </div>
      )}

      {/* Programme list */}
      {programmes.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No programmes yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Programme" to enrol in your first course.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programmes.map((prog) => (
            <div key={prog.id} className="group p-4 rounded-xl border border-border bg-card space-y-3 hover:bg-muted/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{prog.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{prog.provider} · NQF {prog.nqf_level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${statusColor[prog.status]}`}>
                    {prog.status}
                  </span>
                  <button
                    onClick={() => handleDelete(prog.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                    title="Remove programme"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {prog.modules_completed} / {prog.total_modules} modules
                  </span>
                  <span className="font-semibold text-foreground">{prog.progress_pct}%</span>
                </div>
                <Progress value={prog.progress_pct} className="h-2" />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {prog.status === "completed"
                  ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Certificate earned</>
                  : prog.due_date
                    ? <><Calendar className="w-3.5 h-3.5" /> Due: {new Date(prog.due_date).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}</>
                    : null
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
