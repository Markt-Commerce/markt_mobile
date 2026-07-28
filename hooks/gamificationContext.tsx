/**
 * App-wide gamification layer: owns the current user's profile/badges and the
 * single realtime socket subscription (spec §6.4/§6.5). Mounted once at the
 * app root so points/badge/tier feedback fires no matter which screen the
 * user is on, instead of only inside the gamification hub.
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useGamificationProfile } from "./useGamificationProfile";
import { useBadges } from "./useBadges";
import { useGamificationSocket } from "./useGamificationSocket";
import { useUser } from "./userContextProvider";
import { useToast } from "../components/ToastProvider";
import { reasonLabel } from "../utils/gamification";
import BadgeUnlockModal from "../components/gamification/BadgeUnlockModal";
import TierUpAnimationModal from "../components/gamification/TierUpAnimationModal";
import type { GamMe, UserBadge, BadgeEarnedEvent, TierChangedEvent } from "../types/gamification";

export interface GamificationContextType {
  profile: GamMe | null;
  badges: UserBadge[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshBadges: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { show } = useToast();
  const { data, loading, error, refresh, bump } = useGamificationProfile();
  const { badges, refresh: refreshBadges } = useBadges(user?.user_id);

  const [unlockedBadge, setUnlockedBadge] = useState<BadgeEarnedEvent["badge"] | null>(null);
  const [tierEvent, setTierEvent] = useState<TierChangedEvent | null>(null);

  useGamificationSocket({
    onPoints: useCallback(
      (e) => {
        bump(e.delta);
        show({ variant: "success", title: `+${e.delta} pts`, message: reasonLabel(e.reason) });
      },
      [bump, show]
    ),
    onBadge: useCallback(
      (e) => {
        setUnlockedBadge(e.badge);
        refreshBadges();
      },
      [refreshBadges]
    ),
    onTier: useCallback(
      (e) => {
        setTierEvent(e);
        refresh();
      },
      [refresh]
    ),
  });

  return (
    <GamificationContext.Provider
      value={{ profile: data, badges, loading, error, refresh, refreshBadges }}
    >
      {children}
      <BadgeUnlockModal
        visible={!!unlockedBadge}
        badge={unlockedBadge}
        onClose={() => setUnlockedBadge(null)}
      />
      <TierUpAnimationModal
        visible={!!tierEvent}
        event={tierEvent}
        onClose={() => setTierEvent(null)}
      />
    </GamificationContext.Provider>
  );
};

export const useGamificationContext = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamificationContext must be used within a GamificationProvider");
  }
  return context;
};
