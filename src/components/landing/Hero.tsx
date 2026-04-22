import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Star, Users, TrendingUp } from "lucide-react";

const stats = [
  { value: "47K+", label: "Verified Users", icon: Users },
  { value: "R2.1B", label: "Skills Value Facilitated", icon: TrendingUp },
  { value: "98%", label: "Trust Score Accuracy", icon: ShieldCheck },
  { value: "4.9★", label: "Platform Rating", icon: Star },
];

interface HeroProps {
  onGetStarted?: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative min-h-screen gradient-hero flex flex-col justify-center overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(178 72% 42%) 1px, transparent 1px), linear-gradient(90deg, hsl(178 72% 42%) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, hsl(178 72% 42%), transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, hsl(42 95% 55%), transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal/30 bg-teal/10 text-teal mb-8 text-sm font-medium"
          >
            <ShieldCheck className="w-4 h-4" />
            South Africa's Triple-Verified Skills Ecosystem
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            One Platform.{" "}
            <span className="text-teal">Five Communities.</span>{" "}
            <span className="text-gold">Infinite Opportunity.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            SkillsMark is a unified skills directory connecting learners, sponsors, providers, practitioners, and support services 
            in one searchable ecosystem — making it easier to discover people, programmes, suppliers, and opportunities.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-teal text-white font-semibold text-lg shadow-teal hover:opacity-90 transition-all hover:scale-105"
            >
              Join the Ecosystem <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#verification"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Explore the Directory
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass-card rounded-xl p-4 text-center"
              >
                <s.icon className="w-5 h-5 text-teal mx-auto mb-1" />
                <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{s.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
