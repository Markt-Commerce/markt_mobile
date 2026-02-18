/**
 * UserContext
 * - Restores session from AsyncStorage on app start (checkAuthStatus)
 * - Registers onUnauthorized for 401 → clear user, redirect to login
 * - Session persistence: user + role + 7-day expiry
 */
import React, { createContext, useState, useContext, useEffect, useCallback, useRef, ReactNode } from "react";
import { useRouter } from "expo-router";
import { getStoredUser } from "../services/authStorage";
import { setOnUnauthorized } from "../services/api";
import { useToast } from "../components/ToastProvider";

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
  /** True while restoring session from storage on app start */
  isRestoringSession: boolean;
  /** Re-check stored session (e.g. after returning from background) */
  checkAuthStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("buyer");
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const { show } = useToast();
  const router = useRouter();
  const hasShownSessionExpiredRef = useRef(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const session = await getStoredUser();
      if (session?.user) {
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

  // Reset "session expired" toast flag when user logs in (so next 401 shows it again)
  useEffect(() => {
    if (user) hasShownSessionExpiredRef.current = false;
  }, [user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setRole("buyer");
      if (!hasShownSessionExpiredRef.current) {
        hasShownSessionExpiredRef.current = true;
        show({ variant: "info", title: "Session expired", message: "Please sign in again." });
      }
      router.replace("/introduction");
    };
    setOnUnauthorized(handleUnauthorized);
    return () => setOnUnauthorized(null);
  }, [show, router]);

  return (
    <UserContext.Provider value={{ user, role, setUser, setRole, isRestoringSession, checkAuthStatus }}>
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
