import { motion } from "framer-motion";
import {
  GraduationCap,
  Building2,
  BookOpen,
  Briefcase,
  Wrench,
  ArrowRight,
} from "lucide-react";

const users = [
  {
    icon: GraduationCap,
    label: "Learners",
    tagline: "Your pathway to verified skills & employment",
    benefits: ["Access learnerships & jobs", "Earn via micro-tasks now", "Build your digital CV"],
    color: "from-teal to-cyan-500",
    glow: "hsl(178 72% 42% / 0.25)",
    cta: "Start Your Journey",
  },
  {
    icon: Building2,
    label: "Sponsors & Employers",
    tagline: "Transform BEE spend into real outcomes",
    benefits: ["Real-time BEE scorecard", "Tax incentive calculator", "Verified candidate pipeline"],
    color: "from-blue-500 to-indigo-600",
    glow: "hsl(220 80% 55% / 0.25)",
    cta: "Access Talent",
  },
  {
    icon: BookOpen,
    label: "Skills Providers",
    tagline: "Connect programs to verified learners & funds",
    benefits: ["Attract qualified learners", "Hire verified practitioners", "Track & report outcomes"],
    color: "from-violet-500 to-purple-600",
    glow: "hsl(260 70% 55% / 0.25)",
    cta: "Grow Your Programmes",
  },
  {
    icon: Briefcase,
    label: "Practitioners",
    tagline: "Your credentials. Your reputation. Your income.",
    benefits: ["Find facilitation gigs", "Secure contracts fast", "Showcase verified skills"],
    color: "from-orange-400 to-rose-500",
    glow: "hsl(20 85% 55% / 0.25)",
    cta: "Find Contracts",
  },
  {
    icon: Wrench,
    label: "Support Providers",
    tagline: "Reach the clients that need your services",
    benefits: ["List products & services", "Respond to tenders", "Get verified & trusted"],
    color: "from-gold to-amber-500",
    glow: "hsl(42 95% 55% / 0.25)",
    cta: "List Your Services",
  },
];

export default function UserPathways() {
  return (
    <section id="users" className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-teal/10 text-teal text-sm font-semibold mb-4 border border-teal/20">
            Five Interconnected Communities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Who Are You In{" "}
            <span className="text-teal">The Ecosystem?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every role has a dedicated portal, purpose-built for your specific needs and opportunities.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, i) => (
            <motion.div
              key={user.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`group relative bg-card rounded-2xl p-6 border border-border hover:border-teal/30 shadow-sm hover:shadow-lg transition-all cursor-pointer ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              style={{ boxShadow: `0 0 0 0 ${user.glow}` }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center mb-4 shadow-md`}>
                <user.icon className="w-6 h-6 text-white" />
              </div>

              {/* Label + tagline */}
              <h3 className="text-xl font-bold text-navy mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                {user.label}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{user.tagline}</p>

              {/* Benefits */}
              <ul className="space-y-2 mb-6">
                {user.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r ${user.color} text-white text-sm font-semibold group-hover:opacity-90 transition-opacity`}>
                {user.cta} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
