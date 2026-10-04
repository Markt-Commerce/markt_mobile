import { useEffect, useRef } from "react";
import { useUser, type StartupState } from "./userContextProvider";
import { afterFeedLoads } from "../utils/startupGate";

/**
 * First value from the start-up payload, later values from the provider's own
 * endpoint.
 *
 * Badges and gamification each used to make their own request on app open.
 * GET /users/bootstrap now carries all of them, so a provider waits for it
 * (UserProvider's `startup`) and takes its section from there: once per
 * signed-in user. After that -- a role switch, a re-render with a new
 * fetcher -- it fetches normally.
 *
 * When the bootstrap has nothing for it (the call failed, the server is too
 * old to have the endpoint, or the section came back null), `fetch` runs
 * instead. It still waits for the feed (utils/startupGate) so the fallback
 * does not undo the point of the bootstrap on a cold start.
 *
 * `fetch` doubles as the dependency: when its identity changes (it closes
 * over the user or role) the effect runs again and fetches.
 */
export function useStartupSeed<T>(
  select: (data: NonNullable<StartupState["data"]>) => T | null | undefined,
  apply: (value: T) => void,
  fetch: () => void | Promise<void>
) {
  const { user, startup } = useUser();
  const seededFor = useRef<string | null>(null);
  // Read through refs so inline callers do not re-run the effect per render.
  const selectRef = useRef(select);
  selectRef.current = select;
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const userId = user?.user_id ?? null;

  useEffect(() => {
    if (!userId) {
      seededFor.current = null;
      return;
    }
    // The bootstrap is in flight: its answer is a moment away, and asking
    // the old endpoint now would be the duplicate request this replaces.
    if (!startup.settled || startup.userId !== userId) return;

    if (seededFor.current !== userId) {
      seededFor.current = userId;
      const value = startup.data ? selectRef.current(startup.data) : null;
      if (value != null) {
        applyRef.current(value);
        return;
      }
    }

    let cancelled = false;
    afterFeedLoads().then(() => {
      if (!cancelled) void fetch();
    });
    return () => {
      cancelled = true;
    };
  }, [userId, startup.settled, startup.userId, startup.data, fetch]);
}
