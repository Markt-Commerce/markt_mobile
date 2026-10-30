/**
 * BusinessContext — Markt Business state for the whole app.
 *
 * - `config`: the backend's business feature flags and lookup lists, the only
 *   thing that decides whether business (and subscription) UI shows at all.
 *   Falls back to the backend's defaults (business on, subscriptions off) when
 *   the endpoint can't be reached.
 * - `mode`: which experience the user last chose, remembered across launches.
 *   A preference, not a permission.
 * - `myBusiness`: the signed-in user's business tag and profile.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useUser } from "./userContextProvider";
import { getBusinessConfig, getMyBusiness } from "../services/sections/business";
import { FALLBACK_BUSINESS_CONFIG, type BusinessConfig, type MyBusiness } from "../models/business";

export type AppMode = "consumer" | "business";

const MODE_KEY = "markt_mode";

interface BusinessContextType {
  config: BusinessConfig;
  mode: AppMode;
  /** Persisted; resolves once stored. */
  setMode: (mode: AppMode) => Promise<void>;
  /** True once the stored mode has been read — so nothing redirects on a guess. */
  modeRestored: boolean;
  myBusiness: MyBusiness | null;
  refreshMyBusiness: () => Promise<MyBusiness | null>;
  refreshConfig: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [config, setConfig] = useState<BusinessConfig>(FALLBACK_BUSINESS_CONFIG);
  const [mode, setModeState] = useState<AppMode>("consumer");
  const [modeRestored, setModeRestored] = useState(false);
  const [myBusiness, setMyBusiness] = useState<MyBusiness | null>(null);

  const refreshConfig = useCallback(async () => {
    try {
      setConfig(await getBusinessConfig());
    } catch {
      // Keep whatever we had; the fallback is the backend's own defaults.
    }
  }, []);

  const refreshMyBusiness = useCallback(async () => {
    try {
      const mine = await getMyBusiness();
      setMyBusiness(mine);
      return mine;
    } catch {
      return null;
    }
  }, []);

  const setMode = useCallback(async (next: AppMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(MODE_KEY, next);
    } catch {
      // In-memory still works for this session.
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((stored) => setModeState(stored === "business" ? "business" : "consumer"))
      .catch(() => {})
      .finally(() => setModeRestored(true));
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  // Per account: a different sign-in must not inherit the last one's
  // business, and a sign-out returns to everyday Markt next time.
  useEffect(() => {
    if (user) {
      void refreshMyBusiness();
    } else {
      setMyBusiness(null);
    }
  }, [user?.user_id, user?.email, refreshMyBusiness]);

  const value = useMemo(
    () => ({ config, mode, setMode, modeRestored, myBusiness, refreshMyBusiness, refreshConfig }),
    [config, mode, setMode, modeRestored, myBusiness, refreshMyBusiness, refreshConfig]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness(): BusinessContextType {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within a BusinessProvider");
  return ctx;
}

/**
 * The one way into business mode, from the profile screen or the drawer.
 * Replaces rather than pushes: this is switching experience, not drilling
 * into a screen, so back shouldn't step out of it. The business tabs send an
 * account with no business profile on to onboarding.
 */
export function useEnterBusiness(): () => Promise<void> {
  const router = useRouter();
  const { setMode } = useBusiness();
  return useCallback(async () => {
    await setMode("business");
    router.replace("/business");
  }, [router, setMode]);
}
