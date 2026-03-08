import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, SubscriptionPlan, Capability, Persona } from "@/lib/permissions";
import { ROLE_CAPABILITIES, ROLE_PERSONA, roleHasCapability } from "@/lib/permissions";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  allRoles: AppRole[];
  switchRole: (role: AppRole) => void;
  previewRole: (role: AppRole | null) => void;
  previewingAs: AppRole | null;
  plan: SubscriptionPlan | null;
  persona: Persona | null;
  capabilities: Capability[];
  trialEndsAt: string | null;
  isTrialActive: boolean;
  loading: boolean;
  hasCapability: (cap: Capability) => boolean;
  signOut: () => Promise<void>;
  /** Re-fetch roles & subscription for the current user (call after role assignment) */
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  role: null,
  allRoles: [],
  switchRole: () => {},
  previewRole: () => {},
  previewingAs: null,
  plan: null,
  persona: null,
  capabilities: [],
  trialEndsAt: null,
  isTrialActive: false,
  loading: true,
  hasCapability: () => false,
  signOut: async () => {},
  refreshUserData: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [previewingAs, setPreviewingAs] = useState<AppRole | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    const [rolesRes, subRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("subscriptions").select("plan, trial_ends_at").eq("user_id", userId).maybeSingle(),
    ]);

    const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
    setAllRoles(roles);

    // Restore previously chosen role from localStorage, else default to first role
    const stored = localStorage.getItem(`skillsmark_active_role_${userId}`) as AppRole | null;
    const chosen = stored && roles.includes(stored) ? stored : (roles[0] ?? null);
    setActiveRole(chosen);

    setPlan(subRes.data?.plan ?? "starter");
    setTrialEndsAt(subRes.data?.trial_ends_at ?? null);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadUserData(sess.user.id), 0);
      } else {
        setAllRoles([]);
        setActiveRole(null);
        setPreviewingAs(null);
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
  }, [loadUserData]);

  const switchRole = (newRole: AppRole) => {
    if (!allRoles.includes(newRole)) return;
    setPreviewingAs(null);
    setActiveRole(newRole);
    if (user) localStorage.setItem(`skillsmark_active_role_${user.id}`, newRole);
  };

  const previewRole = (role: AppRole | null) => {
    if (!allRoles.includes("admin")) return;
    setPreviewingAs(role);
  };

  const refreshUserData = useCallback(async () => {
    const { data: { session: sess } } = await supabase.auth.getSession();
    if (sess?.user) await loadUserData(sess.user.id);
  }, [loadUserData]);

  const role = previewingAs ?? activeRole;
  const isTrialActive = plan === "starter" && !!trialEndsAt && new Date(trialEndsAt) > new Date();
  const capabilities: Capability[] = role ? ROLE_CAPABILITIES[role] ?? [] : [];
  const persona: Persona | null = role ? ROLE_PERSONA[role] ?? null : null;
  const hasCapability = (cap: Capability): boolean => roleHasCapability(role, cap);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        allRoles,
        switchRole,
        previewRole,
        previewingAs,
        plan,
        persona,
        capabilities,
        trialEndsAt,
        isTrialActive,
        loading,
        hasCapability,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
