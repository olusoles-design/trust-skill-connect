import { useState } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("pwa_banner_dismissed") === "true";
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa_banner_dismissed", "true");
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setDismissed(true);
  };

  if (isInstalled || dismissed || (!isInstallable && !isIOS)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-primary/20 bg-card shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install SkillsMark</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "Tap Share → Add to Home Screen for the full experience"
                : "Add to your home screen for faster access and offline use"}
            </p>
            {isIOS ? (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
                <Share className="w-3.5 h-3.5" /> Tap Share → Add to Home Screen
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Install App
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
