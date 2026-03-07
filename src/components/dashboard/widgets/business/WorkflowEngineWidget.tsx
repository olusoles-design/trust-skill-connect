import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, FileCheck, Upload, CheckCircle2, Clock, AlertCircle,
  ChevronRight, Plus, Users, Building2, Briefcase, ArrowRight,
  FileText, Send, PackageCheck, Loader2, Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type DealStage = "rfp_open" | "responses" | "awarded" | "registration" | "approved" | "seta_ready";
type LearnerStatus = "pending" | "employer_approved" | "seta_registered" | "contract_signed";

interface RFP {
  id: string;
  employer: string;
  title: string;
  nqf: string;
  learners: number;
  location: string;
  seta: string;
  deadline: string;
  stage: DealStage;
  responses: number;
}

interface LearnerReg {
  id: string;
  name: string;
  idNumber: string;
  nqf: string;
  status: LearnerStatus;
  programme: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RFPS: RFP[] = [
  { id: "rfp1", employer: "Sasol Ltd", title: "NQF4 Process Operations Learnership", nqf: "NQF 4", learners: 25, location: "Secunda, Mpumalanga", seta: "MQA", deadline: "2026-03-28", stage: "rfp_open", responses: 3 },
  { id: "rfp2", employer: "Shoprite Group", title: "NQF3 Business Administration Programme", nqf: "NQF 3", learners: 40, location: "Cape Town, WC", seta: "W&RSETA", deadline: "2026-04-05", stage: "responses", responses: 7 },
  { id: "rfp3", employer: "Transnet SOC", title: "NQF5 Management Development", nqf: "NQF 5", learners: 15, location: "Durban, KZN", seta: "TETA", deadline: "2026-04-15", stage: "awarded", responses: 4 },
  { id: "rfp4", employer: "Absa Group", title: "NQF6 Financial Services Learnership", nqf: "NQF 6", learners: 20, location: "Johannesburg, GP", seta: "BANKSETA", deadline: "2026-02-20", stage: "seta_ready", responses: 5 },
];

const MOCK_LEARNERS: LearnerReg[] = [
  { id: "l1", name: "Thabo Nkosi", idNumber: "9401***5082", nqf: "NQF 4", status: "seta_registered", programme: "NQF4 Process Operations" },
  { id: "l2", name: "Zanele Dube", idNumber: "9602***1234", nqf: "NQF 4", status: "employer_approved", programme: "NQF4 Process Operations" },
  { id: "l3", name: "Priya Pillay", idNumber: "9803***5678", nqf: "NQF 4", status: "pending", programme: "NQF4 Process Operations" },
  { id: "l4", name: "Michael van Wyk", idNumber: "9705***9012", nqf: "NQF 4", status: "contract_signed", programme: "NQF4 Process Operations" },
  { id: "l5", name: "Nomvula Khumalo", idNumber: "9901***3456", nqf: "NQF 4", status: "employer_approved", programme: "NQF4 Process Operations" },
];

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<DealStage, { label: string; color: string; icon: React.ElementType; step: number }> = {
  rfp_open:       { label: "Open for Bids", color: "text-blue-500 bg-blue-500/10",     icon: GitBranch,   step: 1 },
  responses:      { label: "Reviewing Bids", color: "text-yellow-500 bg-yellow-500/10", icon: Clock,       step: 2 },
  awarded:        { label: "Awarded",        color: "text-primary bg-primary/10",       icon: CheckCircle2,step: 3 },
  registration:   { label: "Registration",   color: "text-orange-500 bg-orange-500/10", icon: Users,       step: 4 },
  approved:       { label: "Approved",       color: "text-green-500 bg-green-500/10",   icon: FileCheck,   step: 5 },
  seta_ready:     { label: "SETA Ready",     color: "text-purple-500 bg-purple-500/10", icon: PackageCheck,step: 6 },
};

const LEARNER_STATUS_CONFIG: Record<LearnerStatus, { label: string; color: string }> = {
  pending:          { label: "Pending SDP",         color: "text-muted-foreground bg-muted" },
  employer_approved:{ label: "Employer Approved",   color: "text-yellow-600 bg-yellow-500/10" },
  seta_registered:  { label: "SETA Registered",     color: "text-blue-600 bg-blue-500/10" },
  contract_signed:  { label: "Contract Signed",     color: "text-green-600 bg-green-500/10" },
};

// ─── Pipeline stepper ─────────────────────────────────────────────────────────

function PipelineStepper({ current }: { current: DealStage }) {
  const steps: DealStage[] = ["rfp_open","responses","awarded","registration","approved","seta_ready"];
  const currentStep = STAGE_CONFIG[current].step;
  return (
    <div className="flex items-center gap-0.5">
      {steps.map((s, i) => {
        const cfg = STAGE_CONFIG[s];
        const done = cfg.step < currentStep;
        const active = cfg.step === currentStep;
        return (
          <div key={s} className="flex items-center gap-0.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
              done   ? "bg-primary text-primary-foreground" :
              active ? "bg-primary/20 text-primary ring-2 ring-primary/40" :
                       "bg-muted text-muted-foreground"
            }`}>
              {done ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-3 h-0.5 ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

const TABS = ["Deal Flow", "Registration", "SETA Packet"] as const;
type Tab = (typeof TABS)[number];

export function WorkflowEngineWidget() {
  const [tab, setTab] = useState<Tab>("Deal Flow");
  const [selectedRFP, setSelectedRFP] = useState<RFP | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  function handleBid(rfp: RFP) {
    setSelectedRFP(rfp);
    setShowBidForm(true);
  }

  function handleSubmitBid() {
    setShowBidForm(false);
    toast({ title: "Bid submitted!", description: `Your proposal for "${selectedRFP?.title}" has been sent.` });
  }

  async function handleGenerateSETAPacket() {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setGenerating(false);
    toast({ title: "SETA Packet Generated", description: "Digital submission packet is ready for download." });
  }

  async function handleApprove(learner: LearnerReg) {
    toast({ title: "Learner approved", description: `${learner.name} has been approved. Learnership agreement auto-generated.` });
  }

  const setar_ready = MOCK_RFPS.filter(r => r.stage === "seta_ready");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Deal Flow ── */}
      {tab === "Deal Flow" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{MOCK_RFPS.length} active RFPs in pipeline</p>
            <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <Plus className="w-3 h-3" /> Post RFP
            </button>
          </div>

          {MOCK_RFPS.map(rfp => {
            const cfg = STAGE_CONFIG[rfp.stage];
            const Icon = cfg.icon;
            return (
              <div key={rfp.id} className="rounded-xl border border-border bg-card p-4 space-y-3 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{rfp.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" /> {rfp.employer}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cfg.color}`}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{rfp.learners} learners</span>
                  <span>{rfp.nqf}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{rfp.seta}</span>
                  <span>📍 {rfp.location}</span>
                  <span>🗓 Deadline: {rfp.deadline}</span>
                  {rfp.responses > 0 && <span>{rfp.responses} response{rfp.responses !== 1 ? "s" : ""}</span>}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <PipelineStepper current={rfp.stage} />
                  {rfp.stage === "rfp_open" && (
                    <button
                      onClick={() => handleBid(rfp)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all"
                    >
                      <Send className="w-3 h-3" /> Bid / Pitch
                    </button>
                  )}
                  {rfp.stage === "awarded" && (
                    <button
                      onClick={() => setTab("Registration")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      Register Learners <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {rfp.stage === "seta_ready" && (
                    <button
                      onClick={() => setTab("SETA Packet")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 text-xs font-semibold hover:bg-purple-500 hover:text-white transition-all"
                    >
                      <PackageCheck className="w-3 h-3" /> View Packet
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Bid Form Modal */}
          <AnimatePresence>
            {showBidForm && selectedRFP && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">Submit Bid — {selectedRFP.title}</p>
                  <button onClick={() => setShowBidForm(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Proposed Fee (ZAR)</label>
                    <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="e.g. 85000" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Programme Start Date</label>
                    <input type="date" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Pitch / Capability Statement</label>
                  <textarea rows={3} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none" placeholder="Describe your SDP's experience, accreditation and delivery methodology…" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSubmitBid} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all">
                    Submit Bid
                  </button>
                  <button onClick={() => setShowBidForm(false)} className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-all">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Learner Registration ── */}
      {tab === "Registration" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>Employers receive instant email notifications when learners are registered. Approving a learner auto-generates a signed Learnership Agreement PDF.</span>
          </div>

          {/* Learner list */}
          {MOCK_LEARNERS.map(learner => {
            const cfg = LEARNER_STATUS_CONFIG[learner.status];
            return (
              <div key={learner.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {learner.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{learner.name}</p>
                  <p className="text-[10px] text-muted-foreground">{learner.idNumber} · {learner.nqf}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                {learner.status === "pending" && (
                  <button
                    onClick={() => handleApprove(learner)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all flex-shrink-0"
                  >
                    Approve
                  </button>
                )}
                {learner.status === "employer_approved" && (
                  <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500 hover:text-white transition-all flex-shrink-0">
                    Register SETA
                  </button>
                )}
                {learner.status === "seta_registered" && (
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500 hover:text-white transition-all flex-shrink-0">
                    <Download className="w-3 h-3" /> Agreement
                  </button>
                )}
                {learner.status === "contract_signed" && (
                  <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                  </span>
                )}
              </div>
            );
          })}

          <button className="w-full py-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Add Learner to Programme
          </button>
        </div>
      )}

      {/* ── SETA Packet ── */}
      {tab === "SETA Packet" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-bold text-foreground">Digital SETA Submission Packet</p>
                <p className="text-xs text-muted-foreground">Auto-compiled from approved registrations, agreements and compliance documents.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Learner Agreements", count: 4, icon: FileText, done: true },
                { label: "SETA Registration Forms", count: 3, icon: Upload, done: true },
                { label: "Employer Proof of Payment", count: 1, icon: FileCheck, done: false },
              ].map(item => (
                <div key={item.label} className={`rounded-lg border p-3 space-y-1.5 text-center ${item.done ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5"}`}>
                  <item.icon className={`w-5 h-5 mx-auto ${item.done ? "text-green-600" : "text-orange-500"}`} />
                  <p className="text-[10px] font-semibold text-foreground">{item.count} docs</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  {!item.done && <span className="text-[9px] font-bold text-orange-500">Pending</span>}
                  {item.done  && <span className="text-[9px] font-bold text-green-600">✓ Ready</span>}
                </div>
              ))}
            </div>
          </div>

          {setar_ready.map(rfp => (
            <div key={rfp.id} className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{rfp.title}</p>
                  <p className="text-xs text-muted-foreground">{rfp.employer} · {rfp.seta}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">SETA Ready</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleGenerateSETAPacket}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all disabled:opacity-60"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                  {generating ? "Generating…" : "Generate & Download Packet"}
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">Submission Checklist</p>
            {[
              { item: "All learners SETA registered", done: true },
              { item: "Learnership agreements signed (all parties)", done: true },
              { item: "Employer SDL contributions confirmed", done: true },
              { item: "SDP accreditation certificate attached", done: true },
              { item: "Employer proof of payment uploaded", done: false },
              { item: "SETA portal login credentials verified", done: false },
            ].map(c => (
              <div key={c.item} className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${c.done ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}>
                  {c.done ? "✓" : "○"}
                </div>
                <span className={c.done ? "text-foreground line-through opacity-60" : "text-foreground"}>{c.item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
