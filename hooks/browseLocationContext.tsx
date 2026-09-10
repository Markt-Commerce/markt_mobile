import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import {
  getBrowseLocation,
  setBrowseLocation,
  type BrowseLocation,
} from "../services/sections/location";
import { logger } from "../utils/logger";

/**
 * The browse location, app-wide.
 *
 * Held here rather than on the feed screen because the header switcher, the
 * feed and the picker all need the same value, and threading it through props
 * would mean every screen between them knowing about it.
 *
 * Persisted locally *and* on the server. Local so the app opens with the right
 * area before any network call returns; server so it follows a signed-in user
 * to a second device.
 *
 * Explicitly **not** the shipping address. Changing where you browse must
 * never change where an order is delivered.
 */

const LOCATION_KEY = "@markt_browse_location";
const GUEST_KEY = "@markt_guest_id";

interface Ctx {
  location: BrowseLocation | null;
  /** Stable per install, so a guest's choice survives an app restart. */
  guestId: string | null;
  loading: boolean;
  setLocation: (loc: BrowseLocation) => Promise<void>;
}

const BrowseLocationContext = createContext<Ctx | undefined>(undefined);

export function BrowseLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocal] = useState<BrowseLocation | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // A device id, not an identity: it only ever keys a browse preference.
        let gid = await AsyncStorage.getItem(GUEST_KEY);
        if (!gid) {
          gid = Crypto.randomUUID();
          await AsyncStorage.setItem(GUEST_KEY, gid);
        }
        if (!alive) return;
        setGuestId(gid);

        // Local first so the header renders the right place immediately.
        const cached = await AsyncStorage.getItem(LOCATION_KEY);
        if (cached && alive) setLocal(JSON.parse(cached));

        // Then reconcile with the server, which is authoritative for a
        // signed-in user who set their location on another device.
        try {
          const remote = await getBrowseLocation(gid);
          if (alive && remote?.latitude != null) {
            setLocal(remote);
            await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(remote));
          }
        } catch {
          // Offline, or nothing stored yet. The cached value stands and the
          // feed falls back to nationwide — neither is an error worth showing.
        }
      } catch (e) {
        logger.warn("browse location: could not restore", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const setLocation = useCallback(
    async (loc: BrowseLocation) => {
      // Optimistic: the header and feed update now. A failed sync leaves the
      // choice working locally rather than snapping back under the user.
      setLocal(loc);
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc)).catch(() => {});
      try {
        await setBrowseLocation({ ...loc, guest_id: guestId ?? undefined });
      } catch (e) {
        logger.warn("browse location: could not sync to server", e);
      }
    },
    [guestId]
  );

  const value = useMemo(
    () => ({ location, guestId, loading, setLocation }),
    [location, guestId, loading, setLocation]
  );

  return (
    <BrowseLocationContext.Provider value={value}>
      {children}
    </BrowseLocationContext.Provider>
  );
}

export function useBrowseLocation(): Ctx {
  const ctx = useContext(BrowseLocationContext);
  if (!ctx) {
    throw new Error("useBrowseLocation must be used within BrowseLocationProvider");
  }
  return ctx;
}
