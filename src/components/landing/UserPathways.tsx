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
    short: "Skills. Jobs. Income.",
    benefits: ["Access learnerships & jobs", "Earn via micro-tasks now", "Build your digital CV"],
    cta: "Start Your Journey",
    number: "01",
    key: "learner" as const,
    hue: "178",
    sat: "72%",
    lit: "42%",
    gradFrom: "hsl(178,72%,20%)",
    gradTo: "hsl(195,80%,14%)",
    accent: "hsl(178,72%,52%)",
    dim: "hsl(178,72%,42%,0.15)",
  },
  {
    icon: Building2,
    label: "Sponsors & Employers",
    tagline: "Transform BEE spend into measurable outcomes",
    short: "BEE. Talent. ROI.",
    benefits: ["Real-time BEE scorecard", "Tax incentive calculator", "Verified candidate pipeline"],
    cta: "Access Talent",
    number: "02",
    key: "sponsor" as const,
    hue: "220",
    sat: "80%",
    lit: "50%",
    gradFrom: "hsl(220,80%,18%)",
    gradTo: "hsl(240,75%,12%)",
    accent: "hsl(220,80%,65%)",
    dim: "hsl(220,80%,55%,0.15)",
  },
  {
    icon: BookOpen,
    label: "Skills Providers",
    tagline: "Connect programmes to verified learners & funds",
    short: "Learners. Funds. Growth.",
    benefits: ["Attract qualified learners", "Hire verified practitioners", "Track & report outcomes"],
    cta: "Grow Your Programmes",
    number: "03",
    key: "provider" as const,
    hue: "260",
    sat: "65%",
    lit: "52%",
    gradFrom: "hsl(260,65%,18%)",
    gradTo: "hsl(280,70%,12%)",
    accent: "hsl(260,65%,72%)",
    dim: "hsl(260,65%,55%,0.15)",
  },
  {
    icon: Briefcase,
    label: "Practitioners",
    tagline: "Your credentials. Your reputation. Your income.",
    short: "Credentials. Gigs. Reputation.",
    benefits: ["Find facilitation gigs", "Secure contracts fast", "Showcase verified skills"],
    cta: "Find Contracts",
    number: "04",
    key: "practitioner" as const,
    hue: "20",
    sat: "85%",
    lit: "52%",
    gradFrom: "hsl(20,85%,18%)",
    gradTo: "hsl(350,75%,12%)",
    accent: "hsl(20,85%,65%)",
    dim: "hsl(20,85%,55%,0.15)",
  },
  {
    icon: Wrench,
    label: "Support Providers",
    tagline: "Reach the clients that need your services",
    short: "Clients. Tenders. Trust.",
    benefits: ["List products & services", "Respond to tenders", "Get verified & trusted"],
    cta: "List Your Services",
    number: "05",
    key: "support_provider" as const,
    hue: "38",
    sat: "92%",
    lit: "48%",
    gradFrom: "hsl(38,92%,18%)",
    gradTo: "hsl(25,90%,12%)",
    accent: "hsl(38,92%,62%)",
    dim: "hsl(38,92%,50%,0.15)",
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
    <section
      id="users"
      className="relative overflow-hidden"
      style={{ minHeight: "100vh" }}
    >
      {/* Full-bleed animated background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${r.gradFrom} 0%, ${r.gradTo} 60%, hsl(218,60%,6%) 100%)`,
          }}
        />
      </AnimatePresence>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      {/* Giant watermark number */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`num-${active}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute right-0 bottom-0 z-0 select-none pointer-events-none leading-none"
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "clamp(180px, 30vw, 420px)",
            fontWeight: 900,
            color: "transparent",
            WebkitTextStroke: `1px ${r.accent}`,
            opacity: 0.06,
            lineHeight: 0.85,
            transform: "translate(8%, 10%)",
          }}
        >
          {r.number}
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32 flex flex-col min-h-screen justify-center">

        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border"
            style={{ color: r.accent, borderColor: `${r.accent}40`, background: r.dim }}
          >
            Five Communities · Find Your Place
          </span>
        </motion.div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* LEFT — role identity */}
          <div>
            {/* Animated role number + icon */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`left-${active}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                {/* Icon ring */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: r.dim, border: `1px solid ${r.accent}40` }}
                  >
                    <r.icon className="w-7 h-7" style={{ color: r.accent }} />
                  </div>
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: `${r.accent}80` }}
                  >
                    {r.number} / 05
                  </span>
                </div>

                {/* Giant role name */}
                <h2
                  className="font-black leading-[0.92] mb-6"
                  style={{
                    fontFamily: "Sora, sans-serif",
                    fontSize: "clamp(42px, 7vw, 96px)",
                    color: "hsl(0,0%,98%)",
                  }}
                >
                  {r.label.split(" ").map((word, i) => (
                    <span key={i} style={{ display: "block" }}>{word}</span>
                  ))}
                </h2>

                {/* Tagline */}
                <p className="text-lg leading-relaxed mb-10" style={{ color: "hsl(0,0%,75%)" }}>
                  {r.tagline}
                </p>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onRoleSelect?.(r.key)}
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all"
                  style={{
                    background: r.accent,
                    color: "hsl(218,60%,8%)",
                    boxShadow: `0 8px 32px -4px ${r.accent}50`,
                  }}
                >
                  {r.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT — benefits + role switcher */}
          <div className="flex flex-col gap-8">

            {/* Benefit tiles */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`benefits-${active}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-3"
              >
                {r.benefits.map((b, i) => (
                  <motion.div
                    key={b}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-4 px-6 py-5 rounded-2xl"
                    style={{
                      background: "hsl(0,0%,100%,0.04)",
                      border: "1px solid hsl(0,0%,100%,0.08)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: r.dim }}
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: r.accent }} />
                    </div>
                    <span className="text-base font-medium" style={{ color: "hsl(0,0%,90%)" }}>
                      {b}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Role selector pills */}
            <div className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: "hsl(0,0%,100%,0.08)" }}>
              {roles.map((role, i) => {
                const isActive = i === active;
                return (
                  <motion.button
                    key={role.key}
                    onClick={() => setActive(i)}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-xl text-left transition-all"
                    style={{
                      background: isActive ? `${role.accent}18` : "transparent",
                      border: `1px solid ${isActive ? `${role.accent}50` : "transparent"}`,
                    }}
                  >
                    {/* Colour dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                      style={{
                        background: isActive ? role.accent : "hsl(0,0%,100%,0.2)",
                        boxShadow: isActive ? `0 0 8px ${role.accent}` : "none",
                      }}
                    />
                    <span
                      className="text-sm font-semibold flex-1 transition-colors"
                      style={{ color: isActive ? role.accent : "hsl(0,0%,55%)" }}
                    >
                      {role.label}
                    </span>
                    <span
                      className="text-xs font-medium hidden sm:block transition-colors"
                      style={{ color: isActive ? `${role.accent}80` : "hsl(0,0%,35%)" }}
                    >
                      {role.short}
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: "hsl(0,0%,30%)" }}
                    >
                      {role.number}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
