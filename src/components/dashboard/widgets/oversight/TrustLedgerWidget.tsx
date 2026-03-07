import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Link2, Clock, CheckCircle2, QrCode, Download, Hash,
  Users, FileText, AlertCircle, Eye, Search, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LedgerEventType =
  | "learner_registered"
  | "contract_signed"
  | "seta_approved"
  | "document_verified"
  | "payment_disbursed"
  | "outcome_recorded";

interface LedgerEntry {
  id: string;
  blockHash: string;
  timestamp: string;
  eventType: LedgerEventType;
  actor: string;
  subject: string;
  details: string;
  txHash: string;
  blockNumber: number;
  verified: boolean;
}

// ─── Mock immutable ledger entries ───────────────────────────────────────────

const LEDGER: LedgerEntry[] = [
  {
    id: "le1",
    blockHash: "0x7f3a…c91b",
    timestamp: "2026-03-07T08:14:22Z",
    eventType: "learner_registered",
    actor: "Amandla Skills Academy",
    subject: "Thabo Nkosi (ID: 940115****)",
    details: "NQF4 Process Operations Learnership — MQA Registered. Programme: Sasol x Amandla 2026-Q1.",
    txHash: "0xf82b3d7a9e41c5b0d3f7a2e8c1d9b4f6e3a0c8d5e7f2b4a1c9e6d3b0a7f4e1",
    blockNumber: 4812291,
    verified: true,
  },
  {
    id: "le2",
    blockHash: "0xa1c9…f43e",
    timestamp: "2026-03-07T08:15:45Z",
    eventType: "contract_signed",
    actor: "Sasol Ltd + Amandla Skills Academy",
    subject: "Thabo Nkosi — Learnership Agreement",
    details: "Tripartite Learnership Agreement signed digitally by all parties. SLA v2.3 applied.",
    txHash: "0xb93c4e8d2f7a5e1c9b3d6f0e4a8c2b7d5f1e9a3c7b4d8f2e6a0c5b9d3e7a1",
    blockNumber: 4812292,
    verified: true,
  },
  {
    id: "le3",
    blockHash: "0x2d8f…7b52",
    timestamp: "2026-03-07T09:02:10Z",
    eventType: "document_verified",
    actor: "SETA Verification Engine",
    subject: "Amandla Skills Academy — ETQA Accreditation",
    details: "Accreditation certificate (ETQA-2024-MQA-4871) verified and recorded. Valid until 2028-12-31.",
    txHash: "0xd4e8f2a6b0c3e7f1a5d9b2c6e0f4a8d2b6c0e4f8a2d6b0c4e8f2a6b0c3e7f1",
    blockNumber: 4812315,
    verified: true,
  },
  {
    id: "le4",
    blockHash: "0x9e4b…2c87",
    timestamp: "2026-03-07T10:30:00Z",
    eventType: "seta_approved",
    actor: "MQA — Digital Submission Portal",
    subject: "Learnership Batch 2026-Q1 (25 learners)",
    details: "SETA registration batch approved. Approval ref: MQA-2026-0307-0041. Stipend schedule activated.",
    txHash: "0xe5f9a3b7c1d5e9f3a7b1c5d9e3f7a1b5c9d3e7f1a5b9c3d7e1f5a9b3c7d1e5",
    blockNumber: 4812412,
    verified: true,
  },
  {
    id: "le5",
    blockHash: "0x5c3a…9d14",
    timestamp: "2026-03-07T11:00:00Z",
    eventType: "payment_disbursed",
    actor: "SkillsMark Escrow Engine",
    subject: "Monthly Stipend — Batch 2026-Q1",
    details: "ZAR 87,500 disbursed to 25 learners (ZAR 3,500/learner). Transaction confirmed on payment gateway.",
    txHash: "0xf6a0b4c8d2e6f0a4b8c2d6e0f4a8b2c6d0e4f8a2b6c0d4e8f2a6b0c4d8e2f6",
    blockNumber: 4812488,
    verified: true,
  },
  {
    id: "le6",
    blockHash: "0x1b7d…e63c",
    timestamp: "2026-03-07T14:22:55Z",
    eventType: "outcome_recorded",
    actor: "Amandla Skills Academy",
    subject: "Zanele Dube — Module 1 Assessment",
    details: "Module 1 assessment result recorded: 87% (Pass). Facilitator: D. Mthembu (ETDP NQF5).",
    txHash: "0xa7b1c5d9e3f7a1b5c9d3e7f1a5b9c3d7e1f5a9b3c7d1e5f9a3b7c1d5e9f3a7",
    blockNumber: 4812621,
    verified: true,
  },
];

// ─── Event config ─────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<LedgerEventType, { label: string; color: string; icon: React.ElementType }> = {
  learner_registered: { label: "Learner Registered",   color: "text-blue-600 bg-blue-500/10",   icon: Users      },
  contract_signed:    { label: "Contract Signed",       color: "text-primary bg-primary/10",     icon: FileText   },
  seta_approved:      { label: "SETA Approved",         color: "text-green-600 bg-green-500/10", icon: CheckCircle2},
  document_verified:  { label: "Document Verified",     color: "text-purple-600 bg-purple-500/10",icon: Shield    },
  payment_disbursed:  { label: "Payment Disbursed",     color: "text-yellow-600 bg-yellow-500/10",icon: Hash      },
  outcome_recorded:   { label: "Outcome Recorded",      color: "text-orange-600 bg-orange-500/10",icon: CheckCircle2},
};

// ─── QR Modal ─────────────────────────────────────────────────────────────────

function QRModal({ entry, onClose }: { entry: LedgerEntry; onClose: () => void }) {
  const verifyUrl = `https://ledger.skillsmark.co.za/verify/${entry.txHash}`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border shadow-xl p-6 max-w-sm w-full space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <p className="font-bold text-foreground">Audit QR Code</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>

        {/* QR code placeholder — rendered as grid of squares */}
        <div className="mx-auto w-44 h-44 bg-foreground rounded-xl p-3 flex items-center justify-center">
          <div className="w-full h-full bg-background rounded-lg grid grid-cols-8 gap-0.5 p-2">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${
                  [0,1,7,8,14,16,17,18,23,24,25,32,33,40,41,42,43,44,45,46,47,48,49,56,57,63,62,55,54,61].includes(i)
                    ? "bg-foreground"
                    : "bg-background"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-foreground">Scan to verify on immutable ledger</p>
          <p className="text-[10px] text-muted-foreground font-mono break-all">{entry.txHash}</p>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Event</span>
            <span className="font-medium text-foreground">{EVENT_CONFIG[entry.eventType].label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Block</span>
            <span className="font-mono text-foreground">#{entry.blockNumber.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timestamp</span>
            <span className="font-mono text-foreground">{new Date(entry.timestamp).toLocaleString("en-ZA")}</span>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all">
          <Download className="w-3.5 h-3.5" /> Download for B-BBEE Audit
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function TrustLedgerWidget() {
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState<LedgerEventType | "all">("all");
  const [qrEntry, setQrEntry]       = useState<LedgerEntry | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = LEDGER.filter(e => {
    if (filterType !== "all" && e.eventType !== filterType) return false;
    if (search && !e.subject.toLowerCase().includes(search.toLowerCase()) &&
        !e.actor.toLowerCase().includes(search.toLowerCase()) &&
        !e.details.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="space-y-4">
        {/* Header stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Blocks Recorded", value: LEDGER.length.toString(), icon: Link2, color: "text-primary bg-primary/10" },
            { label: "Verified Events", value: LEDGER.filter(e => e.verified).length.toString(), icon: CheckCircle2, color: "text-green-600 bg-green-500/10" },
            { label: "Latest Block", value: `#${Math.max(...LEDGER.map(e => e.blockNumber)).toLocaleString()}`, icon: Hash, color: "text-purple-600 bg-purple-500/10" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3 text-center space-y-1.5">
              <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-base font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5 text-xs">
          <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-foreground">Every event on this ledger is <strong>cryptographically signed</strong> and immutable. During a B-BBEE verification audit, auditors can scan the QR code on any record to verify its authenticity independently.</span>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by learner, actor, or details…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as LedgerEventType | "all")}
            className="text-xs rounded-xl border border-border bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">All events</option>
            {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} ledger entr{filtered.length !== 1 ? "ies" : "y"}</p>

        {/* Ledger entries */}
        <div className="space-y-2">
          {filtered.map(entry => {
            const cfg = EVENT_CONFIG[entry.eventType];
            const Icon = cfg.icon;
            const isExpanded = expandedId === entry.id;

            return (
              <div key={entry.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {entry.verified && (
                        <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />Verified</span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{new Date(entry.timestamp).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">{entry.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.actor}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform mt-0.5 ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border bg-muted/10">
                        <p className="text-xs text-foreground pt-3">{entry.details}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-muted-foreground">Block #</span>
                            <span className="font-mono text-foreground ml-1">{entry.blockNumber.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Block Hash</span>
                            <span className="font-mono text-foreground ml-1">{entry.blockHash}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">Tx Hash</span>
                          <p className="font-mono text-[10px] text-foreground break-all mt-0.5 bg-muted/50 rounded p-2">{entry.txHash}</p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setQrEntry(entry)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Generate Audit QR
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-all">
                            <Eye className="w-3.5 h-3.5" /> View on Chain
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No ledger entries match your search.</p>
          </div>
        )}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {qrEntry && <QRModal entry={qrEntry} onClose={() => setQrEntry(null)} />}
      </AnimatePresence>
    </>
  );
}
