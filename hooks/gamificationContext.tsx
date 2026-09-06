/**
 * App-wide gamification layer: owns the current user's profile/badges and the
 * single realtime socket subscription (spec §6.4/§6.5). Mounted once at the
 * app root so points/badge/tier feedback fires no matter which screen the
 * user is on, instead of only inside the gamification hub.
 */
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { AppState } from "react-native";
import { useGamificationProfile } from "./useGamificationProfile";
import { useBadges } from "./useBadges";
import { useGamificationSocket } from "./useGamificationSocket";
import { useUser } from "./userContextProvider";
import { useToast } from "../components/ToastProvider";
import { reasonLabel } from "../utils/gamification";
import { useCelebration } from "./useCelebration";
import {
  getUnseenAchievements,
  markAchievementsSeen,
} from "../services/sections/gamification";
import * as haptics from "../utils/haptics";
import type { GamMe, UserBadge } from "../types/gamification";

/** "top_seller" -> "Top Seller". The socket sends a key, not a label. */
const tierLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export interface GamificationContextType {
  profile: GamMe | null;
  badges: UserBadge[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshBadges: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined
);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { show } = useToast();
  const { data, loading, error, refresh, bump } = useGamificationProfile();
  const { badges, refresh: refreshBadges } = useBadges(user?.user_id);
  const { celebrate } = useCelebration();

  /**
   * Ask the server what it still owes the user.
   *
   * The socket only reaches a running, foregrounded app, so a badge earned
   * while it was closed would never be celebrated. The queue de-duplicates by
   * id, so an achievement that arrives both ways is still shown once.
   */
  const drainUnseen = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const unseen = await getUnseenAchievements();

      for (const badge of unseen.badges ?? []) {
        celebrate({
          kind: "badge",
          id: badge.slug,
          title: `${badge.name} unlocked!`,
          subtitle: badge.description ?? undefined,
          iconUrl: badge.icon_url,
          onAcknowledge: () => {
            markAchievementsSeen({ badge_slugs: [badge.slug] }).catch(() => {});
          },
        });
      }

      if (unseen.tier_up) {
        const tier = unseen.tier_up;
        celebrate({
          kind: "tier",
          id: tier.to_tier,
          title: `You reached ${tier.tier?.name ?? tier.to_tier}!`,
          subtitle: "Keep going to unlock the next one.",
          accent: tier.tier?.color_hex,
          onAcknowledge: () => {
            markAchievementsSeen({ tier: tier.to_tier }).catch(() => {});
          },
        });
      }
    } catch {
      // A missed celebration must never surface as an error. The server still
      // holds it, so the next open tries again.
    }
  }, [user?.user_id, celebrate]);

  // On mount, and whenever the app comes back to the foreground -- which is
  // exactly when a celebration earned while it was away should land.
  useEffect(() => {
    drainUnseen();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") drainUnseen();
    });
    return () => sub.remove();
  }, [drainUnseen]);

  useGamificationSocket({
    onPoints: useCallback(
      (e) => {
        bump(e.delta);
        haptics.tick();
        show({
          variant: "success",
          title: `+${e.delta} pts`,
          message: reasonLabel(e.reason),
        });
      },
      [bump, show]
    ),
    onBadge: useCallback(
      (e) => {
        celebrate({
          kind: "badge",
          id: e.badge.slug,
          title: `${e.badge.name} unlocked!`,
          subtitle: e.badge.description ?? undefined,
          iconUrl: e.badge.icon_url,
          onAcknowledge: () => {
            markAchievementsSeen({ badge_slugs: [e.badge.slug] }).catch(() => {});
          },
        });
        refreshBadges();
      },
      [celebrate, refreshBadges]
    ),
    onTier: useCallback(
      (e) => {
        // The socket payload carries only the tier keys and a star count --
        // no display name or colour. Titling it from the key is honest and
        // still correct; the richer copy comes from the unseen-achievements
        // fetch, and the queue de-duplicates whichever arrives second.
        celebrate({
          kind: "tier",
          id: e.new_tier,
          title: `You reached ${tierLabel(e.new_tier)}!`,
          subtitle: "Keep going to unlock the next one.",
          onAcknowledge: () => {
            markAchievementsSeen({ tier: e.new_tier }).catch(() => {});
          },
        });
        refresh();
      },
      [celebrate, refresh]
    ),
    onStreak: useCallback(
      (e) => {
        // Only milestones get the overlay. A celebration every single day is
        // not a celebration, and the streak counter on screen already moves.
        if (!e.is_milestone) {
          haptics.tick();
          return;
        }
        celebrate({
          kind: "streak",
          id: `streak-${e.streak_days}`,
          title: `${e.streak_days}-day streak!`,
          subtitle:
            e.streak_days >= e.longest_streak
              ? "That is your best run yet."
              : "Keep it going.",
        });
      },
      [celebrate]
    ),
  });

  return (
    <GamificationContext.Provider
      value={{ profile: data, badges, loading, error, refresh, refreshBadges }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamificationContext = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error(
      "useGamificationContext must be used within a GamificationProvider"
    );
  }
  return context;
};
