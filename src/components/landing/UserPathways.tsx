import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Building2, BookOpen, Briefcase, Wrench, ArrowRight,
  CheckCircle2,
} from "lucide-react";

const users = [
  {
    icon: GraduationCap,
    label: "Learners",
    short: "Skills. Jobs. Income.",
    tagline: "Your pathway to verified skills & employment",
    benefits: ["Access learnerships & jobs", "Earn via micro-tasks now", "Build your digital CV"],
    gradient: "from-[hsl(178,72%,35%)] to-[hsl(195,80%,42%)]",
    accent: "hsl(178,72%,42%)",
    accentLight: "hsl(178,72%,42%,0.12)",
    cta: "Start Your Journey",
    number: "01",
  },
  {
    icon: Building2,
    label: "Sponsors & Employers",
    short: "BEE. Talent. ROI.",
    tagline: "Transform BEE spend into real outcomes",
    benefits: ["Real-time BEE scorecard", "Tax incentive calculator", "Verified candidate pipeline"],
    gradient: "from-[hsl(220,80%,50%)] to-[hsl(240,75%,60%)]",
    accent: "hsl(220,80%,55%)",
    accentLight: "hsl(220,80%,55%,0.12)",
    cta: "Access Talent",
    number: "02",
  },
  {
    icon: BookOpen,
    label: "Skills Providers",
    short: "Learners. Funds. Growth.",
    tagline: "Connect programmes to verified learners & funds",
    benefits: ["Attract qualified learners", "Hire verified practitioners", "Track & report outcomes"],
    gradient: "from-[hsl(260,65%,52%)] to-[hsl(280,70%,60%)]",
    accent: "hsl(260,65%,55%)",
    accentLight: "hsl(260,65%,55%,0.12)",
    cta: "Grow Your Programmes",
    number: "03",
  },
  {
    icon: Briefcase,
    label: "Practitioners",
    short: "Credentials. Gigs. Reputation.",
    tagline: "Your credentials. Your reputation. Your income.",
    benefits: ["Find facilitation gigs", "Secure contracts fast", "Showcase verified skills"],
    gradient: "from-[hsl(20,85%,52%)] to-[hsl(350,75%,58%)]",
    accent: "hsl(20,85%,55%)",
    accentLight: "hsl(20,85%,55%,0.12)",
    cta: "Find Contracts",
    number: "04",
  },
  {
    icon: Wrench,
    label: "Support Providers",
    short: "Clients. Tenders. Trust.",
    tagline: "Reach the clients that need your services",
    benefits: ["List products & services", "Respond to tenders", "Get verified & trusted"],
    gradient: "from-[hsl(38,92%,48%)] to-[hsl(25,90%,55%)]",
    accent: "hsl(38,92%,50%)",
    accentLight: "hsl(38,92%,50%,0.12)",
    cta: "List Your Services",
    number: "05",
  },
];

type RoleKey = "learner" | "sponsor" | "provider" | "practitioner" | "support_provider" | null;
const roleKeys: RoleKey[] = ["learner", "sponsor", "provider", "practitioner", "support_provider"];

interface Props {
  onRoleSelect?: (role: RoleKey) => void;
}

export default function UserPathways({ onRoleSelect }: Props) {
  const [active, setActive] = useState(0);
  const current = users[active];

  return (
    <section id="users" className="py-20 lg:py-32 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-xl"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold tracking-widest uppercase mb-5">
            Five Communities
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
            Find Your Place<br />
            <span style={{ color: "hsl(var(--teal, 178 72% 42%))" }}>In the Ecosystem</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Five interconnected portals, each purpose-built for your role in South Africa's skills economy.
          </p>
        </motion.div>

        {/* Main layout: tab rail left + detail right */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-6 lg:gap-10 items-start">

          {/* Left: vertical tab selector */}
          <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {users.map((u, i) => {
              const isActive = active === i;
              return (
                <motion.button
                  key={u.label}
                  onClick={() => setActive(i)}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-shrink-0 lg:flex-shrink text-left rounded-2xl px-5 py-4 transition-all border group relative overflow-hidden ${
                    isActive
                      ? "border-transparent shadow-lg"
                      : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
                  }`}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${u.accentLight}, transparent)`,
                    borderColor: u.accent,
                    boxShadow: `0 4px 24px -4px ${u.accentLight}`,
                  } : {}}
                >
                  {/* number watermark */}
                  <span className="absolute right-3 top-2 text-[10px] font-bold text-muted-foreground/30 select-none">
                    {u.number}
                  </span>

                  <div className="flex items-center gap-3 lg:gap-3">
                    {/* icon pip */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${u.gradient} transition-all`}
                    >
                      <u.icon className="w-4 h-4 text-white" />
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-tight truncate ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {u.label}
                      </p>
                      <p className={`text-xs mt-0.5 truncate ${isActive ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                        {u.short}
                      </p>
                    </div>
                  </div>

                  {/* active left bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                      style={{ background: current.accent }}
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right: animated detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative rounded-3xl overflow-hidden border border-border bg-card"
            >
              {/* Top gradient band */}
              <div
                className={`h-2 w-full bg-gradient-to-r ${current.gradient}`}
              />

              <div className="p-8 lg:p-10">
                {/* Role header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <current.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">
                        {current.number} / 05
                      </p>
                      <h3 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight" style={{ fontFamily: "Sora, sans-serif" }}>
                        {current.label}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">{current.tagline}</p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {current.benefits.map((b, bi) => (
                    <motion.div
                      key={b}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: bi * 0.08 }}
                      className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background"
                    >
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: current.accent }} />
                      <span className="text-sm text-foreground font-medium leading-snug">{b}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA row */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Dot navigation */}
                  <div className="flex items-center gap-2">
                    {users.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: active === i ? 20 : 6,
                          height: 6,
                          background: active === i ? current.accent : "hsl(var(--muted-foreground) / 0.3)",
                        }}
                      />
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onRoleSelect?.(roleKeys[active])}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold bg-gradient-to-r ${current.gradient} shadow-md hover:shadow-lg transition-shadow`}
                  >
                    {current.cta}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Decorative corner glow */}
              <div
                className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-30"
                style={{ background: `radial-gradient(circle, ${current.accent}, transparent 70%)` }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
