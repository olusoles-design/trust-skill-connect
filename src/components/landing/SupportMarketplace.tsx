import { motion } from "framer-motion";
import { Package, Printer, Monitor, Home, PenTool, Wrench } from "lucide-react";

const categories = [
  { icon: PenTool, label: "Learning Material\nDevelopers", count: "240+" },
  { icon: Package, label: "Training Equipment\nSuppliers", count: "180+" },
  { icon: Printer, label: "Reprographic &\nPrinting Services", count: "95+" },
  { icon: Home, label: "Venue & Facility\nRentals", count: "320+" },
  { icon: Monitor, label: "Technology &\nSoftware Solutions", count: "150+" },
  { icon: Wrench, label: "Classroom Furniture\nSuppliers", count: "210+" },
];

export default function SupportMarketplace() {
  return (
    <section id="marketplace" className="py-20 lg:py-32 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold border border-gold/20 text-sm font-semibold mb-6">
              The 5th Pillar
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-6 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              The Support Service{" "}
              <span className="text-teal">Marketplace</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              The unsung backbone of skills delivery, including material developers, furniture suppliers, 
              reprographic services, and equipment providers, finally has a dedicated, 
              verified marketplace.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Post verified business profiles with certifications",
                "Receive automatic tender & procurement alerts",
                "Manage quotes, orders, and delivery tracking",
                "Build reputation through verified reviews",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="w-5 h-5 rounded-full bg-teal/15 border border-teal/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-teal text-white font-semibold shadow-teal hover:opacity-90 transition-opacity">
              List Your Services Today
            </button>
          </motion.div>

          {/* Right category grid */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-4 border border-border hover:border-teal/30 hover:shadow-md transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-teal/20 transition-colors">
                  <cat.icon className="w-5 h-5 text-teal" />
                </div>
                <p className="text-xs font-semibold text-navy whitespace-pre-line leading-tight mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {cat.label}
                </p>
                <p className="text-xs font-bold text-teal">{cat.count}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
