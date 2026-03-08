import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, Building } from "lucide-react";

const compliance = [
  { icon: Shield, label: "POPIA Compliant", sub: "Full data protection" },
  { icon: Lock, label: "256-bit Encryption", sub: "Data at rest & transit" },
  { icon: FileCheck, label: "Statutory Reporting", sub: "SETA · QCTO · SAQA formats" },
  { icon: Building, label: "B-BBEE Verified", sub: "Scorecard ready" },
];

export default function ComplianceBanner() {
  return (
    <section className="py-12 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {compliance.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                <c.icon className="w-5 h-5 text-teal" />
              </div>
              <div>
                <div className="font-semibold text-navy text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
