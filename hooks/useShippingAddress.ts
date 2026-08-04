import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import { getUserProfile } from "../services/sections/profile";
import { mapProfileToShippingAddress } from "../utils/shippingAddress";
import type { ShippingAddressPayload } from "../models/cart";
import type { UserProfile } from "../models/profile";

function fallbackRecipientName(profile: UserProfile | null | undefined): string | undefined {
  return profile?.buyer_account?.buyername || profile?.username || undefined;
}

export type ShippingAddressSource = "saved" | "geolocation" | "manual" | null;

/**
 * Resolves a shipping address for checkout: prefers the buyer's saved address
 * (from their profile), falls back to device geolocation, and otherwise lets
 * the caller fill it in manually. See tempinst.py for the backend shape this feeds.
 */
export function useShippingAddress() {
  const [address, setAddress] = useState<ShippingAddressPayload | null>(null);
  const [source, setSource] = useState<ShippingAddressSource>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [profileFallbackName, setProfileFallbackName] = useState<string | undefined>(undefined);

  const resolveFromGeolocation = useCallback(async (): Promise<ShippingAddressPayload | null> => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationDenied(true);
        return null;
      }
      setLocationDenied(false);
      const loc = await Location.getCurrentPositionAsync({});
      const resolved: ShippingAddressPayload = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      try {
        const [reverse] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverse) {
          resolved.street_address = reverse.street ?? reverse.name ?? undefined;
          resolved.city = reverse.city ?? reverse.subregion ?? reverse.district ?? undefined;
          resolved.state = reverse.region ?? undefined;
          resolved.country = reverse.country ?? undefined;
          resolved.postal_code = reverse.postalCode ?? undefined;
        }
      } catch {
        // Reverse geocoding is a nice-to-have — coordinates alone still satisfy checkout.
      }
      return resolved;
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const profile = await getUserProfile().catch(() => null);
        const nameFallback = fallbackRecipientName(profile);
        setProfileFallbackName(nameFallback);
        const saved = mapProfileToShippingAddress(profile);
        if (cancelled) return;
        if (saved) {
          setAddress(saved);
          setSource("saved");
          return;
        }
        const located = await resolveFromGeolocation();
        if (cancelled) return;
        if (located) {
          setAddress((prev) => ({ recipient_name: nameFallback, ...(prev ?? {}), ...located }));
          setSource("geolocation");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolveFromGeolocation]);

  const useCurrentLocation = useCallback(async () => {
    const located = await resolveFromGeolocation();
    if (located) {
      setAddress((prev) => ({ recipient_name: profileFallbackName, ...(prev ?? {}), ...located }));
      setSource("geolocation");
    }
    return located;
  }, [resolveFromGeolocation, profileFallbackName]);

  const updateAddress = useCallback((patch: Partial<ShippingAddressPayload>) => {
    setAddress((prev) => ({ ...(prev ?? {}), ...patch }));
    setSource("manual");
  }, []);

  return {
    address,
    source,
    loading,
    locating,
    locationDenied,
    useCurrentLocation,
    updateAddress,
  };
}
