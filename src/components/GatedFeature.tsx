import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useAccess } from "@/hooks/useAccess";

interface GatedFeatureProps {
  feature: string;
  children: ReactNode;
  /** Optional label shown in the upgrade overlay */
  label?: string;
  onUpgrade?: () => void;
}

export default function GatedFeature({ feature, children, label, onUpgrade }: GatedFeatureProps) {
  const { allowed, reason, upgradeRequired } = useAccess(feature);

  if (allowed) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Blurred content underneath */}
      <div className="pointer-events-none select-none blur-sm opacity-60">
        {children}
      </div>

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-navy/80 backdrop-blur-[2px] rounded-xl p-4 text-center"
      >
        <div className="w-10 h-10 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center mb-3">
          <Lock className="w-4 h-4 text-teal" />
        </div>

        {label && (
          <p className="text-white font-semibold text-sm mb-1">{label}</p>
        )}

        <p className="text-white/60 text-xs max-w-[220px] mb-4">{reason}</p>

        {upgradeRequired && (
          <button
            onClick={onUpgrade}
            className="px-4 py-2 rounded-lg gradient-teal text-white text-xs font-semibold hover:opacity-90 transition-all hover:scale-[1.02]"
          >
            Upgrade Plan →
          </button>
        )}
      </motion.div>
    </div>
  );
}
