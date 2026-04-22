import { motion } from "framer-motion";
import { UserPlus, ShieldCheck, Sparkles, Handshake } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Register & Build Your Profile",
    description:
      "Select your role and complete your profile with guided multi-step forms. Save progress across sessions, with no need to finish in one sitting.",
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Join the Directory",
    description:
      "Add your details, documents, services, programmes, or opportunities so the right people can find and understand your profile.",
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Receive Smart Matches",
    description:
      "Our AI engine surfaces the best opportunities for you, matching on BEE requirements, qualifications, location, and availability.",
  },
  {
    num: "04",
    icon: Handshake,
    title: "Transact with Confidence",
    description:
      "Apply, contract, procure, or hire with escrow payments, digital contracts, and outcome tracking built right in.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold border border-gold/20 text-sm font-semibold mb-4">
            Simple by Design
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Up and Running in{" "}
            <span className="text-gold">Four Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Joining SkillsMark takes minutes. The value lasts a lifetime.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line desktop */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                {/* Number + icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-teal flex items-center justify-center shadow-teal mb-2 mx-auto">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gold flex items-center justify-center">
                    <span className="text-xs font-bold text-navy">{step.num}</span>
                  </div>
                </div>

                <h3 className="font-bold text-navy text-lg mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
