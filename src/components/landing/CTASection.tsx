import { motion } from "framer-motion";
import { ArrowRight, Smartphone, Globe } from "lucide-react";

interface CTASectionProps {
  onGetStarted?: () => void;
}

export default function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl gradient-hero overflow-hidden p-8 sm:p-12 lg:p-16 text-center"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(178 72% 42%), transparent 70%)" }} />

          <div className="relative">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-sm font-semibold mb-6">
              Join the Movement
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              The Skills Development Sector{" "}
              <span className="text-teal">Deserves Better.</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
              Join thousands of learners, sponsors, providers, practitioners, and support service providers 
              already transforming South Africa's skills landscape.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button onClick={onGetStarted} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-teal text-white font-semibold text-lg shadow-teal hover:opacity-90 transition-all hover:scale-105">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all">
                Book a Demo
              </button>
            </div>

            {/* Platform availability */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Globe className="w-4 h-4" />
                Responsive Web App
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Smartphone className="w-4 h-4" />
                Progressive Web App (PWA)
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="text-white/50 text-sm">Works Offline</div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="text-white/50 text-sm">Free to Join</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
