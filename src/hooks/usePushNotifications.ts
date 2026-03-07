import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NotificationTopic =
  | "match_alerts"
  | "verification_updates"
  | "application_deadlines"
  | "microtask_availability"
  | "payment_confirmations";

const TOPIC_LABELS: Record<NotificationTopic, string> = {
  match_alerts: "New opportunity matches",
  verification_updates: "Verification status updates",
  application_deadlines: "Application deadline reminders",
  microtask_availability: "New micro-tasks available",
  payment_confirmations: "Payment confirmations",
};

export function useNotificationTopics() {
  return TOPIC_LABELS;
}

export interface PushState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

/** Convert base64 VAPID public key → Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    supported: "serviceWorker" in navigator && "PushManager" in window,
    permission: "default",
    subscribed: false,
    loading: false,
    error: null,
  });
  const [preferences, setPreferences] = useState<Record<NotificationTopic, boolean>>(
    Object.fromEntries(
      Object.keys(TOPIC_LABELS).map((k) => [k, true])
    ) as Record<NotificationTopic, boolean>
  );

  useEffect(() => {
    setState((s) => ({ ...s, permission: Notification.permission }));
    // Check existing subscription
    if (!state.supported) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        setState((s) => ({ ...s, subscribed: !!sub }));
      })
    );
    // Load saved preferences from localStorage
    try {
      const saved = localStorage.getItem("push_preferences");
      if (saved) setPreferences(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [state.supported]);

  const subscribe = useCallback(async (vapidPublicKey: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const permission = await Notification.requestPermission();
      setState((s) => ({ ...s, permission }));
      if (permission !== "granted") {
        setState((s) => ({ ...s, loading: false, error: "Notification permission denied." }));
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      // Persist subscription to backend
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("push_subscriptions" as never).upsert({
          user_id: user.id,
          subscription: JSON.stringify(sub),
          topics: Object.keys(preferences).filter((k) => preferences[k as NotificationTopic]),
          updated_at: new Date().toISOString(),
        });
      }
      setState((s) => ({ ...s, subscribed: true, loading: false }));
      return true;
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: String(err) }));
      return false;
    }
  }, [preferences]);

  const unsubscribe = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("push_subscriptions" as never).delete().eq("user_id", user.id);
      }
      setState((s) => ({ ...s, subscribed: false, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: String(err) }));
    }
  }, []);

  const updatePreferences = useCallback((updated: Partial<Record<NotificationTopic, boolean>>) => {
    const next = { ...preferences, ...updated };
    setPreferences(next);
    localStorage.setItem("push_preferences", JSON.stringify(next));
  }, [preferences]);

  return { ...state, preferences, subscribe, unsubscribe, updatePreferences };
}
