import { useCallback, useRef, useState } from "react";
import * as Location from "expo-location";
import logger from "../utils/logger";

export interface LookupResult {
  formatted_address: string;
  latitude: number;
  longitude: number;
}

/**
 * Turning what someone types, or where they are, into a place we can deliver.
 *
 * Deliberately built on expo-location, which uses the phone's own geocoder —
 * Apple's on iOS, Android's on Android. That is free and involves no API key
 * and no billing account. Google's Places Autocomplete would give better
 * results for a partial query, and it is one of the Maps APIs that actually
 * costs money per request, so it is not used here without that being a
 * deliberate, costed decision.
 *
 * The practical consequence: search works well for a real place name
 * ("Sabo Market Ogbomoso") and poorly for a half-typed fragment. Current
 * location is the better path and is offered first, which is also the one
 * that gives a coordinate we know is right.
 */
export function useAddressLookup() {
  const [results, setResults] = useState<LookupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Only the newest query may write results: someone typing produces several
  // in-flight lookups and a slow early one must not overwrite a fast later one.
  const queryId = useRef(0);

  const search = useCallback(async (query: string) => {
    const id = ++queryId.current;
    const q = query.trim();
    // Below this a query matches half the country and the geocoder returns
    // noise; showing nothing is more honest than showing that.
    if (q.length < 4) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const found = await Location.geocodeAsync(q);
      if (id !== queryId.current) return;
      // The OS geocoder returns coordinates without a formatted address, so
      // the query is echoed back as the label. It is what the buyer typed,
      // which is more recognisable to them than a re-derived string anyway.
      setResults(
        found.slice(0, 5).map((r) => ({
          formatted_address: q,
          latitude: r.latitude,
          longitude: r.longitude,
        }))
      );
    } catch (error) {
      if (id !== queryId.current) return;
      logger.error("Address search failed:", error);
      setResults([]);
    } finally {
      if (id === queryId.current) setSearching(false);
    }
  }, []);

  const useCurrentLocation = useCallback(async (): Promise<LookupResult | null> => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        return null;
      }
      setPermissionDenied(false);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let label = "My current location";
      try {
        const [addr] = await Location.reverseGeocodeAsync(pos.coords);
        if (addr) {
          // Whatever the geocoder could give, in the order a person reads it.
          label =
            [addr.name, addr.street, addr.district, addr.city, addr.region]
              .filter(Boolean)
              .join(", ") || label;
        }
      } catch {
        // A coordinate with a dull label still delivers. Never block on the
        // geocoder.
      }
      return {
        formatted_address: label,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch (error) {
      logger.error("Could not get current location:", error);
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  const clear = useCallback(() => {
    queryId.current++;
    setResults([]);
    setSearching(false);
  }, []);

  return { results, searching, locating, permissionDenied, search, useCurrentLocation, clear };
}
