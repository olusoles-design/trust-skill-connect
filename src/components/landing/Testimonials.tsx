import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "SkillsMark matched me with a learnership at a Johannesburg engineering firm within 3 weeks of registering. My Trust Score made the difference.",
    name: "Thabo Nkosi",
    role: "Learner → Apprentice Engineer",
    initials: "TN",
    color: "from-teal to-cyan-500",
  },
  {
    quote: "Our BEE scorecard improved from Level 6 to Level 3 in one year. The real-time dashboard made our ETI claims effortless.",
    name: "Sarah van der Berg",
    role: "HR Director, TechCo SA",
    initials: "SB",
    color: "from-blue-500 to-indigo-600",
  },
  {
    quote: "We filled all 12 facilitation spots for our SETA programme within 48 hours. Every practitioner was pre-verified.",
    name: "Dr. Lungelo Dlamini",
    role: "Programme Manager, AccelSDP",
    initials: "LD",
    color: "from-violet-500 to-purple-600",
  },
  {
    quote: "I've secured 8 facilitation contracts this year alone. The platform handles contracts, invoicing, and payment release automatically.",
    name: "Fatima Hendricks",
    role: "Registered Assessor & Facilitator",
    initials: "FH",
    color: "from-orange-400 to-rose-500",
  },
  {
    quote: "Our materials company went from zero SDP clients to 40 in six months. The tender matching is incredibly accurate.",
    name: "Pieter Botha",
    role: "Director, EduMaterials ZA",
    initials: "PB",
    color: "from-gold to-amber-500",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-32 gradient-hero relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(42 95% 55%) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-sm font-semibold mb-4">
            Real Results
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Voices from the{" "}
            <span className="text-teal">Ecosystem</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`glass-card rounded-2xl p-6 ${i === 4 ? "md:col-span-2 lg:col-span-1" : ""}`}
            >
              <Quote className="w-8 h-8 text-teal/40 mb-4" />
              <p className="text-white/80 text-sm leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{t.initials}</span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{t.name}</div>
                  <div className="text-white/40 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
