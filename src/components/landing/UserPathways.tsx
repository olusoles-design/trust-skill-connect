import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Building2, BookOpen, Briefcase, Wrench, ArrowRight, CheckCircle2,
} from "lucide-react";

const roles = [
  {
    icon: GraduationCap,
    label: "Learners",
    tagline: "Your pathway to verified skills & employment",
    benefits: ["Access learnerships & jobs", "Earn via micro-tasks now", "Build your digital CV"],
    cta: "Start Your Journey",
    key: "learner" as const,
    color: "hsl(var(--teal))",
    bg: "hsl(178 72% 42% / 0.08)",
    border: "hsl(178 72% 42% / 0.2)",
  },
  {
    icon: Building2,
    label: "Sponsors & Employers",
    tagline: "Transform BEE spend into measurable outcomes",
    benefits: ["Real-time BEE scorecard", "Tax incentive calculator", "Verified candidate pipeline"],
    cta: "Access Talent",
    key: "sponsor" as const,
    color: "hsl(220 80% 60%)",
    bg: "hsl(220 80% 55% / 0.08)",
    border: "hsl(220 80% 55% / 0.2)",
  },
  {
    icon: BookOpen,
    label: "Skills Providers",
    tagline: "Connect programmes to verified learners & funds",
    benefits: ["Attract qualified learners", "Hire verified practitioners", "Track & report outcomes"],
    cta: "Grow Your Programmes",
    key: "provider" as const,
    color: "hsl(260 65% 62%)",
    bg: "hsl(260 65% 55% / 0.08)",
    border: "hsl(260 65% 55% / 0.2)",
  },
  {
    icon: Briefcase,
    label: "Practitioners",
    tagline: "Your credentials. Your reputation. Your income.",
    benefits: ["Find facilitation gigs", "Secure contracts fast", "Showcase verified skills"],
    cta: "Find Contracts",
    key: "practitioner" as const,
    color: "hsl(var(--gold))",
    bg: "hsl(42 95% 55% / 0.08)",
    border: "hsl(42 95% 55% / 0.2)",
  },
  {
    icon: Wrench,
    label: "Support Providers",
    tagline: "Reach the clients that need your services",
    benefits: ["List products & services", "Respond to tenders", "Get verified & trusted"],
    cta: "List Your Services",
    key: "support_provider" as const,
    color: "hsl(20 85% 58%)",
    bg: "hsl(20 85% 55% / 0.08)",
    border: "hsl(20 85% 55% / 0.2)",
  },
];

type RoleKey = "learner" | "sponsor" | "provider" | "practitioner" | "support_provider" | null;

interface Props {
  onRoleSelect?: (role: RoleKey) => void;
}

export default function UserPathways({ onRoleSelect }: Props) {
  const [active, setActive] = useState(0);
  const r = roles[active];

  return (
    <section id="users" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
            Five Communities
          </span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-black text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
            Find your place
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 items-start">

          {/* LEFT — Tab list */}
          <div className="flex flex-col gap-2">
            {roles.map((role, i) => {
              const isActive = i === active;
              return (
                <motion.button
                  key={role.key}
                  onClick={() => setActive(i)}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-200"
                  style={{
                    background: isActive ? role.bg : "transparent",
                    border: `1px solid ${isActive ? role.border : "hsl(var(--border))"}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: isActive ? role.bg : "hsl(var(--muted))",
                      border: `1px solid ${isActive ? role.border : "transparent"}`,
                    }}
                  >
                    <role.icon
                      className="w-4 h-4 transition-colors"
                      style={{ color: isActive ? role.color : "hsl(var(--muted-foreground))" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold transition-colors"
                      style={{ color: isActive ? role.color : "hsl(var(--foreground))" }}
                    >
                      {role.label}
                    </p>
                  </div>
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-all"
                    style={{
                      color: isActive ? role.color : "hsl(var(--muted-foreground))",
                      opacity: isActive ? 1 : 0.4,
                      transform: isActive ? "translateX(0)" : "translateX(-4px)",
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* RIGHT — Content panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-3xl p-8 lg:p-10"
              style={{
                background: r.bg,
                border: `1px solid ${r.border}`,
              }}
            >
              {/* Icon + label */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: "hsl(var(--background))", border: `1px solid ${r.border}` }}
                >
                  <r.icon className="w-5 h-5" style={{ color: r.color }} />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: r.color }}>
                  {r.label}
                </span>
              </div>

              {/* Tagline */}
              <p className="text-xl font-semibold text-foreground leading-snug mb-8" style={{ fontFamily: "Sora, sans-serif" }}>
                {r.tagline}
              </p>

              {/* Benefits */}
              <div className="flex flex-col gap-3 mb-8">
                {r.benefits.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: r.color }} />
                    <span className="text-sm text-foreground">{b}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRoleSelect?.(r.key)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: r.color,
                  color: "hsl(var(--background))",
                }}
              >
                {r.cta}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
}
