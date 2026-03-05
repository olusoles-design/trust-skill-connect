import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  plan: SubscriptionPlan | null;
  trialEndsAt: string | null;
  isTrialActive: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  role: null,
  plan: null,
  trialEndsAt: null,
  isTrialActive: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserData(userId: string) {
    const [rolesRes, subRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("subscriptions").select("plan, trial_ends_at").eq("user_id", userId).maybeSingle(),
    ]);
    setRole(rolesRes.data?.role ?? null);
    setPlan(subRes.data?.plan ?? "starter");
    setTrialEndsAt(subRes.data?.trial_ends_at ?? null);
  }

  useEffect(() => {
    // Set up listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadUserData(sess.user.id), 0);
      } else {
        setRole(null);
        setPlan(null);
        setTrialEndsAt(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadUserData(sess.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isTrialActive = plan === "starter" && !!trialEndsAt && new Date(trialEndsAt) > new Date();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, plan, trialEndsAt, isTrialActive, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
