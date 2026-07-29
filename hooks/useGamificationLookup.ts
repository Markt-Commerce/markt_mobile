import { useEffect, useState } from "react";
import { getUserGamification } from "../services/sections/gamification";
import type { PublicGamProfile } from "../types/gamification";

const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: PublicGamProfile | null;
  fetchedAt: number;
  promise?: Promise<PublicGamProfile | null>;
}

const cache = new Map<string, CacheEntry>();

function fetchGamification(userId: string): Promise<PublicGamProfile | null> {
  const entry = cache.get(userId);
  const fresh = entry && Date.now() - entry.fetchedAt < TTL_MS && !entry.promise;
  if (fresh) return Promise.resolve(entry!.data);
  if (entry?.promise) return entry.promise;

  const promise = getUserGamification(userId)
    .then((data) => {
      cache.set(userId, { data, fetchedAt: Date.now() });
      return data;
    })
    .catch(() => {
      cache.set(userId, { data: null, fetchedAt: Date.now() });
      return null;
    });

  cache.set(userId, { data: entry?.data ?? null, fetchedAt: entry?.fetchedAt ?? 0, promise });
  return promise;
}

/**
 * Tier/badges for another user (feed authors, sellers) — not the signed-in
 * user, which is covered by GamificationProvider. Cached per user id for the
 * session so multiple cards for the same seller only ever fetch once.
 */
export function useGamificationLookup(userId?: string | null) {
  const [profile, setProfile] = useState<PublicGamProfile | null>(
    userId ? cache.get(userId)?.data ?? null : null
  );

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    fetchGamification(userId).then((data) => {
      if (!cancelled) setProfile(data);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { profile };
}
