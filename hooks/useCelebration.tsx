import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * One queue and one renderer for every celebration in the app.
 *
 * Before this there were two hand-rolled modals wired straight into the
 * gamification context, each with its own visibility state. A third kind of
 * achievement meant a third modal, a third piece of state, and a third chance
 * for two of them to appear on top of each other.
 *
 * Now a celebration is a *descriptor*. Anything that can be earned describes
 * itself — kind, title, subtitle, an optional icon — and the overlay decides
 * how to present it. Adding a new achievement type is a new descriptor, not a
 * new animation.
 *
 * The queue matters more than it looks: earning a badge often tips the user
 * into a new tier in the same instant, and two overlapping full-screen
 * celebrations is worse than either one alone. They play in sequence.
 */

export type CelebrationKind = "badge" | "tier" | "streak" | "points";

export interface Celebration {
  /** Drives the visual treatment and the haptic weight. */
  kind: CelebrationKind;
  /** Identity, so the same award queued twice is only shown once. */
  id: string;
  title: string;
  subtitle?: string;
  /** Remote icon, when the achievement has artwork. */
  iconUrl?: string | null;
  /** Tier colour, or a badge category tint. */
  accent?: string;
  /**
   * Called once the celebration has actually been seen — this is what tells
   * the server to stop offering it. Deliberately fired on dismissal rather
   * than on enqueue: if the app dies mid-celebration the user sees it again.
   */
  onAcknowledge?: () => void;
  /**
   * Reserved. Sound is not implemented — it needs assets and a second
   * dependency, both noted as follow-ups in GAMIFICATION_NOTES.md — but the
   * slot exists so adding it later does not mean reopening this type.
   */
  sound?: string;
}

interface CelebrationContextValue {
  /** Queue a celebration. Ignores anything already queued or showing. */
  celebrate: (c: Celebration) => void;
  /** The one currently on screen, if any. */
  current: Celebration | null;
  /** Dismiss the current one and advance the queue. */
  dismiss: () => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Celebration[]>([]);
  // Every id ever queued this session. Without it, a socket event and the
  // unseen-achievements fetch on resume would both queue the same badge and
  // the user would watch the same celebration twice.
  const seen = useRef<Set<string>>(new Set());

  const celebrate = useCallback((c: Celebration) => {
    const key = `${c.kind}:${c.id}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);
    setQueue((q) => [...q, c]);
  }, []);

  const dismiss = useCallback(() => {
    setQueue((q) => {
      q[0]?.onAcknowledge?.();
      return q.slice(1);
    });
  }, []);

  const value = useMemo(
    () => ({ celebrate, current: queue[0] ?? null, dismiss }),
    [celebrate, queue, dismiss]
  );

  return (
    <CelebrationContext.Provider value={value}>
      {children}
    </CelebrationContext.Provider>
  );
}

export function useCelebration(): CelebrationContextValue {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    throw new Error("useCelebration must be used within CelebrationProvider");
  }
  return ctx;
}
