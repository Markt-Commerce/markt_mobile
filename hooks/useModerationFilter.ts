import { useEffect, useSyncExternalStore } from "react";
import { listBlockedUsers } from "../services/sections/moderation";
import { useUser } from "./userContextProvider";

/**
 * Who this person has blocked and what they have reported, shared by every
 * screen.
 *
 * App Store Guideline 1.2: blocking must remove the abusive user's content
 * from the feed instantly. A block can now start on a product page, a profile
 * or a chat, and each feed used to keep its own hidden set, so a block from
 * anywhere but the feed itself changed nothing on the feed. One store means
 * every list that reads it drops the content the moment the block lands.
 *
 * Reported items are hidden for the reporter too: they have said they don't
 * want to see it, and leaving it in place reads as nothing having happened.
 *
 * Plain module rather than context, like utils/badgeEvents, so the sheet that
 * performs the block does not need to sit under a particular provider.
 */

type Snapshot = { blocked: ReadonlySet<string>; reported: ReadonlySet<string> };

let snapshot: Snapshot = { blocked: new Set(), reported: new Set() };
let seededFor: string | null = null;
const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const contentKey = (type: string, id: string | number) => `${type}:${id}`;

export function markBlocked(userId: string) {
  if (!userId || snapshot.blocked.has(userId)) return;
  emit({ ...snapshot, blocked: new Set(snapshot.blocked).add(userId) });
}

export function markUnblocked(userId: string) {
  if (!snapshot.blocked.has(userId)) return;
  const blocked = new Set(snapshot.blocked);
  blocked.delete(userId);
  emit({ ...snapshot, blocked });
}

export function markReported(type: string, id: string | number) {
  const key = contentKey(type, id);
  if (snapshot.reported.has(key)) return;
  emit({ ...snapshot, reported: new Set(snapshot.reported).add(key) });
}

/**
 * The shared filter. Seeds the blocked list from the server once per signed-in
 * account, so people blocked in an earlier session stay hidden too.
 */
export function useModerationFilter() {
  const { user } = useUser();
  const state = useSyncExternalStore(subscribe, () => snapshot);
  const userId = user?.user_id ?? null;

  useEffect(() => {
    if (!userId) {
      // Signed out: nothing to hide, and the next account starts clean.
      if (seededFor !== null) {
        seededFor = null;
        emit({ blocked: new Set(), reported: new Set() });
      }
      return;
    }
    if (seededFor === userId) return;
    seededFor = userId;
    listBlockedUsers()
      .then((list) => {
        if (seededFor !== userId) return;
        const blocked = new Set(snapshot.blocked);
        list.forEach((b) => blocked.add(b.user_id));
        emit({ ...snapshot, blocked });
      })
      .catch(() => {
        // Retry on the next mount rather than never.
        if (seededFor === userId) seededFor = null;
      });
  }, [userId]);

  return {
    isBlocked: (userId?: string | null) => !!userId && state.blocked.has(userId),
    isReported: (type: string, id?: string | number | null) =>
      id != null && state.reported.has(contentKey(type, id)),
    /** Changes whenever either set does — for memo dependencies. */
    version: state,
  };
}
