import { motion } from "framer-motion";
import {
  Cpu,
  BarChart3,
  ShoppingBag,
  Zap,
  CreditCard,
  FileText,
  MapPin,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "AI Matching Engine",
    description: "Intelligent algorithms match learners with opportunities based on BEE requirements, qualifications, location, and availability.",
    tag: "Smart",
  },
  {
    icon: BarChart3,
    title: "BEE Scorecard Dashboard",
    description: "Real-time BEE scorecard projections, ETI calculations, and S12H learnership allowance tracking with SARS-ready reports.",
    tag: "Compliance",
  },
  {
    icon: ShoppingBag,
    title: "Support Service Marketplace",
    description: "Dedicated marketplace connecting SDPs with material developers, furniture suppliers, reprographic services, and equipment providers.",
    tag: "Marketplace",
  },
  {
    icon: Zap,
    title: "Micro-Task Board",
    description: "Learners earn immediately through verified remote tasks — data entry, transcription, surveys — while awaiting formal placements.",
    tag: "Income",
  },
  {
    icon: CreditCard,
    title: "Escrow & Payments",
    description: "Milestone-based payment releases, mobile money integration, and invoice financing for practitioners and service providers.",
    tag: "Fintech",
  },
  {
    icon: FileText,
    title: "Digital Credentials",
    description: "Verifiable digital badges for qualifications, completions, and service deliveries — shareable and blockchain-anchored.",
    tag: "Credentials",
  },
  {
    icon: MapPin,
    title: "Location Services",
    description: "Discover opportunities nearby, calculate commute times, and enable location-based matching — optimized for South African cities.",
    tag: "PWA",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Real-time alerts for new matches, application updates, and tender opportunities — works even when the app is closed.",
    tag: "PWA",
  },
];

export default function PlatformFeatures() {
  return (
    <section id="platform" className="py-20 lg:py-32 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-navy/10 text-navy text-sm font-semibold mb-4 border border-navy/15">
            Full-Stack Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Everything You Need.{" "}
            <span className="text-teal">Nothing You Don't.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From AI-powered matching to SETA-compliant reporting — the complete operating system for South Africa's skills development sector.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="bg-card rounded-xl p-5 border border-border hover:border-teal/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                  <f.icon className="w-5 h-5 text-teal" />
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {f.tag}
                </span>
              </div>
              <h3 className="font-bold text-navy text-sm mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                {f.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
