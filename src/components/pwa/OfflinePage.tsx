import { WifiOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-secondary text-secondary-foreground px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium shadow-md">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>You're offline — some features may be limited</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1 text-xs underline underline-offset-2 hover:no-underline flex-shrink-0"
      >
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground font-display">You're offline</h1>
          <p className="text-muted-foreground">
            No internet connection. Any actions you take will sync automatically when you reconnect.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    </div>
  );
}
