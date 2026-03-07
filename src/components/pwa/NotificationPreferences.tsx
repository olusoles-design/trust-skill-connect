import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications, useNotificationTopics, type NotificationTopic } from "@/hooks/usePushNotifications";

// VAPID public key — will be set via edge function / env if configured
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

export function NotificationPreferences() {
  const {
    supported,
    permission,
    subscribed,
    loading,
    error,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = usePushNotifications();

  const topics = useNotificationTopics();

  if (!supported) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {subscribed ? (
            <Bell className="w-4 h-4 text-primary" />
          ) : (
            <BellOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {subscribed ? "Notifications enabled" : "Notifications disabled"}
          </span>
        </div>
        <button
          onClick={subscribed ? unsubscribe : () => subscribe(VAPID_PUBLIC_KEY)}
          disabled={loading || !VAPID_PUBLIC_KEY}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
            subscribed
              ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          {subscribed ? "Turn off" : "Turn on"}
        </button>
      </div>

      {!VAPID_PUBLIC_KEY && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          Push notifications require VAPID key configuration.
        </p>
      )}

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Per-topic toggles */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Notification types
        </p>
        {(Object.keys(topics) as NotificationTopic[]).map((topic) => (
          <label
            key={topic}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm text-foreground">{topics[topic]}</span>
            <button
              type="button"
              role="switch"
              aria-checked={preferences[topic]}
              onClick={() => updatePreferences({ [topic]: !preferences[topic] })}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
                preferences[topic] ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-card shadow transition-transform mt-0.5 ${
                  preferences[topic] ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        ))}
      </div>

      {permission === "denied" && (
        <p className="text-xs text-destructive/80">
          Notifications are blocked in your browser settings. To enable them, click the lock icon in
          your browser address bar and allow notifications for this site.
        </p>
      )}
    </div>
  );
}
