/**
 * AuditLogWidget — Platform Admin / Oversight view of the immutable audit trail.
 * Fetches live data from the audit_logs table with real-time subscription.
 * Filters: entity_type, action, actor_id (user search), date range.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, Filter, RefreshCw, ChevronDown, Clock,
  User, Eye, AlertCircle, CheckCircle2, XCircle, FileText,
  Upload, Download, Edit3, Trash2, LogIn, ArrowRight,
  Activity, Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id:           string;
  actor_id:     string;
  actor_role:   string;
  action:       string;
  entity_type:  string;
  entity_id:    string;
  entity_label: string | null;
  before_data:  Record<string, unknown> | null;
  after_data:   Record<string, unknown> | null;
  metadata:     Record<string, unknown>;
  created_at:   string;
}

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CREATE:   { label: "Created",    color: "text-green-600 bg-green-500/10",   icon: CheckCircle2 },
  UPDATE:   { label: "Updated",    color: "text-blue-600 bg-blue-500/10",     icon: Edit3        },
  DELETE:   { label: "Deleted",    color: "text-red-600 bg-red-500/10",       icon: Trash2       },
  READ:     { label: "Viewed",     color: "text-muted-foreground bg-muted/40",icon: Eye          },
  VIEW:     { label: "Viewed",     color: "text-muted-foreground bg-muted/40",icon: Eye          },
  APPROVE:  { label: "Approved",   color: "text-green-600 bg-green-500/10",   icon: CheckCircle2 },
  REJECT:   { label: "Rejected",   color: "text-red-600 bg-red-500/10",       icon: XCircle      },
  SUBMIT:   { label: "Submitted",  color: "text-primary bg-primary/10",       icon: ArrowRight   },
  ASSIGN:   { label: "Assigned",   color: "text-purple-600 bg-purple-500/10", icon: User         },
  UPLOAD:   { label: "Uploaded",   color: "text-blue-600 bg-blue-500/10",     icon: Upload       },
  DOWNLOAD: { label: "Downloaded", color: "text-muted-foreground bg-muted/40",icon: Download     },
  SIGN:     { label: "Signed",     color: "text-green-600 bg-green-500/10",   icon: FileText     },
  VERIFY:   { label: "Verified",   color: "text-green-600 bg-green-500/10",   icon: Shield       },
  DISBURSE: { label: "Disbursed",  color: "text-yellow-600 bg-yellow-500/10", icon: ArrowRight   },
  ENROLL:   { label: "Enrolled",   color: "text-primary bg-primary/10",       icon: LogIn        },
};

function getActionCfg(action: string) {
  return ACTION_CONFIG[action] ?? { label: action, color: "text-muted-foreground bg-muted/40", icon: Activity };
}

const ENTITY_LABELS: Record<string, string> = {
  profile:              "Profile",
  application:          "Application",
  document_vault:       "Document",
  opportunity:          "Opportunity",
  micro_task:           "Micro Task",
  task_submission:      "Task Submission",
  funding_opportunity:  "Funding Opportunity",
  eoi_submission:       "EOI Submission",
  payment:              "Payment",
  accreditation:        "Accreditation",
  report:               "Report",
  user_role:            "User Role",
  subscription:         "Subscription",
};

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA");
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function LogDetailPanel({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const actionCfg = getActionCfg(log.action);
  const Icon = actionCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${actionCfg.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{actionCfg.label}: {ENTITY_LABELS[log.entity_type] ?? log.entity_type}</p>
              <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("en-ZA")}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Core fields */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "Log ID",      value: log.id.split("-")[0] + "…" },
              { label: "Action",      value: log.action },
              { label: "Actor Role",  value: log.actor_role },
              { label: "Actor ID",    value: log.actor_id.split("-")[0] + "…" },
              { label: "Entity Type", value: ENTITY_LABELS[log.entity_type] ?? log.entity_type },
              { label: "Entity ID",   value: log.entity_id.split("-")[0] + "…" },
            ].map(field => (
              <div key={field.label} className="bg-muted/30 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-0.5">{field.label}</p>
                <p className="font-mono font-medium text-foreground truncate">{field.value}</p>
              </div>
            ))}
          </div>

          {log.entity_label && (
            <div className="bg-muted/30 rounded-lg p-2.5 text-xs">
              <p className="text-[10px] text-muted-foreground mb-0.5">Entity Label</p>
              <p className="font-medium text-foreground">{log.entity_label}</p>
            </div>
          )}

          {/* Diff viewer */}
          {(log.before_data || log.after_data) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Data Snapshot</p>
              <div className="grid grid-cols-1 gap-2">
                {log.before_data && (
                  <div>
                    <p className="text-[10px] font-semibold text-red-500 mb-1">Before</p>
                    <pre className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-[10px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                      {JSON.stringify(log.before_data, null, 2)}
                    </pre>
                  </div>
                )}
                {log.after_data && (
                  <div>
                    <p className="text-[10px] font-semibold text-green-500 mb-1">After</p>
                    <pre className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-[10px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                      {JSON.stringify(log.after_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Context</p>
              <div className="space-y-1">
                {Object.entries(log.metadata).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs bg-muted/20 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                    <span className="font-mono text-foreground text-[10px] truncate max-w-[60%]">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export function AuditLogWidget() {
  const { role } = useAuth();

  const [logs,        setLogs]        = useState<AuditLog[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(0);
  const [search,      setSearch]      = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [liveMode,    setLiveMode]    = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (filterAction !== "all") query = query.eq("action", filterAction);
    if (filterEntity !== "all") query = query.eq("entity_type", filterEntity);
    if (search.trim()) {
      query = query.or(
        `entity_label.ilike.%${search}%,entity_type.ilike.%${search}%,actor_role.ilike.%${search}%,entity_id.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query;
    if (!error) {
      setLogs((data as AuditLog[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [page, filterAction, filterEntity, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time subscription
  useEffect(() => {
    if (!liveMode) return;
    const channel = supabase
      .channel("audit_logs_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => {
        if (page === 0) fetchLogs();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [liveMode, page, fetchLogs]);

  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))];

  return (
    <>
      <div className="space-y-4">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Events",  value: total.toLocaleString(),    icon: Database,    color: "text-primary bg-primary/10"         },
            { label: "Actions Today", value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length.toString(), icon: Activity, color: "text-blue-600 bg-blue-500/10" },
            { label: "Unique Actors", value: [...new Set(logs.map(l => l.actor_id))].length.toString(), icon: User, color: "text-purple-600 bg-purple-500/10" },
            { label: "Live Stream",   value: liveMode ? "ON" : "OFF",   icon: RefreshCw,   color: liveMode ? "text-green-600 bg-green-500/10" : "text-muted-foreground bg-muted/40" },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => s.label === "Live Stream" && setLiveMode(!liveMode)}
              className="rounded-xl border border-border bg-card p-3 text-left space-y-1.5 hover:bg-muted/10 transition-colors"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </button>
          ))}
        </div>

        {/* POPIA notice */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5 text-xs">
          <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-foreground">
            This log is <strong>immutable</strong> and POPIA-compliant. Entries cannot be edited or deleted.
            Visible only to Platform Admins, SETA Officials, Government Officials, and data subjects viewing their own trail.
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search entity, label, role…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <select
            value={filterAction}
            onChange={e => { setFilterAction(e.target.value); setPage(0); }}
            className="text-xs rounded-xl border border-border bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">All actions</option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={filterEntity}
            onChange={e => { setFilterEntity(e.target.value); setPage(0); }}
            className="text-xs rounded-xl border border-border bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">All entities</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="text-xs h-auto py-2">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {loading ? "Loading…" : `${total.toLocaleString()} total event${total !== 1 ? "s" : ""}${search || filterAction !== "all" || filterEntity !== "all" ? " (filtered)" : ""}`}
        </p>

        {/* Log list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-muted/40 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted/40 rounded w-3/4" />
                  <div className="h-2.5 bg-muted/30 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No audit events found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map(log => {
              const cfg  = getActionCfg(log.action);
              const Icon = cfg.icon;
              return (
                <motion.button
                  key={log.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedLog(log)}
                  className="w-full text-left rounded-xl border border-border bg-card p-3 flex items-start gap-3 hover:bg-muted/20 transition-colors group"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.color} border-0`}>
                        {cfg.label}
                      </Badge>
                      <span className="text-xs font-medium text-foreground truncate">
                        {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                        {log.entity_label ? ` — ${log.entity_label}` : ""}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">{relativeTime(log.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      <span className="font-medium capitalize">{log.actor_role.replace(/_/g, " ")}</span>
                      {" · "}
                      <span className="font-mono">{log.actor_id.split("-")[0]}…</span>
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline" size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="text-xs"
            >
              ← Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
            </span>
            <Button
              variant="outline" size="sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}
              className="text-xs"
            >
              Next →
            </Button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedLog && <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />}
      </AnimatePresence>
    </>
  );
}
