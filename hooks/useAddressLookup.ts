import { useCallback, useRef, useState } from "react";
import * as Location from "expo-location";
import { searchAddresses } from "../services/geocoding";
import logger from "../utils/logger";

export interface LookupResult {
  formatted_address: string;
  /** City/state, so a result nowhere near the buyer is visibly wrong. */
  context?: string | null;
  city?: string | null;
  state?: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Turning what someone types, or where they are, into a place we can deliver.
 *
 * Search runs on OpenStreetMap through Photon (see services/geocoding.ts),
 * which needs no API key and no billing account — so address search does not
 * depend on the Google Maps key at all, and costs nothing whatever is decided
 * about Places Autocomplete. The phone's own geocoder is the fallback when
 * Photon is unreachable.
 *
 * Results are biased and distance-filtered around wherever the buyer is, once
 * we know: an unbounded fuzzy match for a Nigerian query will cheerfully
 * return a street in Berlin.
 */
export function useAddressLookup() {
  const [results, setResults] = useState<LookupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Only the newest query may write results: someone typing produces several
  // in-flight lookups and a slow early one must not overwrite a fast later one.
  const queryId = useRef(0);
  // Whatever we last knew about where the buyer is. Used to bias and
  // distance-filter search; null until they use current location once.
  const biasRef = useRef<{ latitude: number; longitude: number } | null>(null);

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
      const found = await searchAddresses(q, biasRef.current);
      if (id !== queryId.current) return;
      setResults(found);
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
      let reverse: Location.LocationGeocodedAddress | null = null;
      try {
        const [addr] = await Location.reverseGeocodeAsync(pos.coords);
        reverse = addr ?? null;
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
      biasRef.current = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      return {
        formatted_address: label,
        city: reverse?.city ?? null,
        state: reverse?.region ?? null,
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
