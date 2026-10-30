/**
 * UserContext
 * - Restores session from AsyncStorage on app start (checkAuthStatus)
 * - Registers onUnauthorized for 401 → clear user, redirect to login
 * - Session persistence: user + role + 7-day expiry
 */
import React, { createContext, useState, useContext, useEffect, useCallback, useRef, ReactNode } from "react";
import { getStoredUser, getCachedProfile, setCachedProfile } from "../services/authStorage";
import { setOnUnauthorized } from "../services/api";
import { useToast } from "../components/ToastProvider";
import { navigateToGuestHome } from "../utils/authNavigation";
import { getUserProfile } from "../services/sections/profile";
import { getBootstrap, type Bootstrap } from "../services/sections/bootstrap";
import type { UserProfile } from "../models/profile";

type UserRole = "buyer" | "seller" | null;

interface User {
  account_type: UserRole;
  email: string;
  user_id?: string;
}

export interface UserContextType {
  user: User | null;
  role: UserRole;
  setUser: (user: User | null) => void;
  setRole: (role: UserRole) => void;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  refreshProfile: () => Promise<UserProfile | null>;
  /**
   * True when this account exists but has not proved it owns its address.
   *
   * Undefined until the profile has loaded — "we don't know yet" is a
   * different answer from "no", and treating it as either would either flash
   * the verification screen at every returning user or let an unverified one
   * into the app for a beat.
   */
  needsEmailVerification: boolean | undefined;
  /** True while restoring session from storage on app start */
  isRestoringSession: boolean;
  /** Re-check stored session (e.g. after returning from background) */
  checkAuthStatus: () => Promise<void>;
  /**
   * The start-up payload from GET /users/bootstrap, for the providers that
   * used to make their own first request (badges, gamification). `settled`
   * turns true once the attempt has finished for the signed-in user, whether
   * it worked or not; until then they wait rather than fetch. `data` is null
   * when it failed, and `userId` says whose it is, so a provider never seeds
   * one account's badge with another's numbers.
   */
  startup: StartupState;
}

export type StartupState = {
  settled: boolean;
  userId: string | null;
  data: Omit<Bootstrap, "profile"> | null;
};

const STARTUP_IDLE: StartupState = { settled: false, userId: null, data: null };

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("buyer");
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [startup, setStartup] = useState<StartupState>(STARTUP_IDLE);
  const { show } = useToast();
  const hasShownSessionExpiredRef = useRef(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const session = await getStoredUser();
      if (session?.user) {
        // The last profile this device saw, so the header, role and tab bar
        // are right on the first frame instead of after a round trip. The
        // fresh one from the bootstrap replaces it moments later.
        //
        // Without `onboarding`: email verification and the unfinished-signup
        // redirect route on it, and a stale answer there could send someone
        // to the wrong screen. Those keep waiting for the server, exactly as
        // they did before this cache existed.
        const cached = session.user.user_id
          ? await getCachedProfile<UserProfile>(session.user.user_id)
          : null;
        if (cached) {
          const { onboarding: _stale, ...display } = cached;
          setProfile(display as UserProfile);
        }
        setUser({
          email: session.user.email,
          account_type: session.role,
          user_id: session.user.user_id,
        });
        setRole(session.role);
      } else {
        setUser(null);
        setRole("buyer");
      }
    } catch {
      setUser(null);
      setRole("buyer");
    } finally {
      setIsRestoringSession(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return null;
    }
    try {
      const nextProfile = await getUserProfile();
      setProfile(nextProfile);
      return nextProfile;
    } catch {
      return null;
    }
  }, [user]);

  // One request on sign-in or app start, not five: the profile, both badge
  // counts and the gamification summary arrive together (GET
  // /users/bootstrap). If it fails -- an older server without the endpoint,
  // or a blip -- the profile falls back to its own endpoint and every other
  // section is left for its provider to fetch the old way.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setStartup(STARTUP_IDLE);
      return;
    }
    const userId = user.user_id ?? null;
    let cancelled = false;
    setStartup({ settled: false, userId, data: null });
    (async () => {
      try {
        const { profile: fresh, ...rest } = await getBootstrap();
        if (cancelled) return;
        setProfile(fresh);
        setStartup({ settled: true, userId, data: rest });
      } catch {
        if (cancelled) return;
        setStartup({ settled: true, userId, data: null });
        void refreshProfile();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshProfile]);

  // Whatever changes the profile -- the bootstrap, a refresh, a role switch
  // patched in by a screen -- the cache follows, so the next cold start
  // opens on the newest copy. Only a server-shaped profile is written: the
  // display-only copy restored above has no `onboarding` and is skipped.
  useEffect(() => {
    if (!user?.user_id || !profile?.onboarding) return;
    void setCachedProfile(user.user_id, profile);
  }, [user?.user_id, profile]);

  // An account is created before the code is entered — it has to be, or
  // there is nowhere to attach the code to and nothing survives closing the
  // app. What must NOT happen is that account reaching the marketplace: see
  // the guard in app/_layout.tsx, which this drives.
  // Keyed on `onboarding`, not on `profile`: the copy restored from the
  // device cache has no onboarding block, and that must read as "not known
  // yet" until the server's profile arrives -- not as "verified".
  const needsEmailVerification = profile?.onboarding
    ? profile.onboarding.email_verified === false
    : undefined;

  // Reset "session expired" toast flag when user logs in (so next 401 shows it again)
  useEffect(() => {
    if (user) hasShownSessionExpiredRef.current = false;
  }, [user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setRole("buyer");
      setProfile(null);
      if (!hasShownSessionExpiredRef.current) {
        hasShownSessionExpiredRef.current = true;
        show({ variant: "info", title: "Session expired", message: "Please sign in again." });
      }
      navigateToGuestHome();
    };
    setOnUnauthorized(handleUnauthorized);
    return () => setOnUnauthorized(null);
  }, [show]);

  return (
    <UserContext.Provider value={{ user, role, setUser, setRole, profile, setProfile, refreshProfile, needsEmailVerification, isRestoringSession, checkAuthStatus, startup }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
