import { motion } from "framer-motion";
import { Fingerprint, Award, BarChart3, ShieldCheck, CheckCircle2 } from "lucide-react";

const verifications = [
  {
    icon: Fingerprint,
    badge: "PEOPLE",
    title: "People Directory",
    color: "from-teal to-cyan-500",
    glow: "shadow-teal",
    items: [
      "Learners ready for placement",
      "Practitioners and facilitators",
      "Employers and sponsors",
      "Support service providers",
    ],
    description:
      "Find the right people across South Africa's skills ecosystem with structured profiles, role context, availability, and contact pathways in one place.",
  },
  {
    icon: Award,
    badge: "PROGRAMMES",
    title: "Programme Directory",
    color: "from-gold to-amber-500",
    glow: "shadow-gold",
    items: [
      "Learnerships and internships",
      "Accredited training options",
      "Funding opportunities",
      "Workplace placement pathways",
    ],
    description:
      "Browse programmes, funding routes, and development pathways with the context teams need to shortlist, compare, and move faster.",
  },
  {
    icon: BarChart3,
    badge: "OPPORTUNITIES",
    title: "Opportunity Directory",
    color: "from-violet-500 to-purple-600",
    glow: "",
    items: [
      "Open roles and placements",
      "Procurement and RFQ listings",
      "Micro-tasks and contracts",
      "Marketplace supplier listings",
    ],
    description:
      "Bring opportunities into one searchable environment so learners, providers, sponsors, and suppliers can connect around real demand.",
  },
];

export default function TripleVerification() {
  return (
    <section id="verification" className="py-20 lg:py-32 gradient-hero relative overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(178 72% 42%) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 border border-gold/30 text-gold text-sm font-semibold mb-6">
            <ShieldCheck className="w-4 h-4" />
            Skills Ecosystem Directory
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            One{" "}
            <span className="text-gold">Connected Directory</span>{" "}
            for Skills Development
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            A structured place to discover people, programmes, suppliers, and opportunities across the skills development landscape.
            Search smarter. Compare faster. Connect with purpose.
          </p>
        </motion.div>

        {/* Trust score visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-16"
        >
          <div className="glass-card rounded-2xl px-8 py-6 flex items-center gap-6 flex-wrap justify-center">
            {["People", "Programmes", "Opportunities"].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                {i > 0 && <div className="w-8 h-px bg-white/20 hidden sm:block" />}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal" />
                  <span className="text-white font-medium text-sm">{label} Indexed</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal/20 border border-teal/30 ml-4">
              <ShieldCheck className="w-4 h-4 text-teal" />
              <span className="text-teal font-bold text-sm">Directory Fit: 98</span>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {verifications.map((v, i) => (
            <motion.div
              key={v.badge}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${v.color} text-white text-xs font-bold tracking-wider mb-4`}>
                <v.icon className="w-3.5 h-3.5" />
                {v.badge}
              </div>

              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
                {v.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                {v.description}
              </p>

              <ul className="space-y-2">
                {v.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
