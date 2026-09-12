import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { ArrowLeft, Crosshair, MapPin } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { useBrowseLocation } from "../../hooks/browseLocationContext";
import { LocationMark } from "../../components/illustrations/MarktIllustration";
import * as haptics from "../../utils/haptics";

/**
 * Choose where to browse.
 *
 * **Not the shipping address** — the copy says so, because the two being
 * confusable is exactly the failure this design exists to avoid.
 *
 * The map-first version (search box + draggable pin) needs a Google Maps key,
 * which is not configured yet. Rather than ship a dead map, this offers the two
 * paths that work today: use my current location, or pick a major area. The map
 * slots into `MapPickerSlot` below when the key lands — no other screen
 * changes.
 */

/** Somewhere to start when GPS is refused. Not a substitute for the map. */
const AREAS = [
  { label: "Ikeja, Lagos", latitude: 6.6018, longitude: 3.3515, state: "Lagos" },
  { label: "Lekki, Lagos", latitude: 6.4698, longitude: 3.5852, state: "Lagos" },
  { label: "Yaba, Lagos", latitude: 6.5095, longitude: 3.3711, state: "Lagos" },
  { label: "Bodija, Ibadan", latitude: 7.4326, longitude: 3.9089, state: "Oyo" },
  { label: "Akobo, Ibadan", latitude: 7.4247, longitude: 3.9297, state: "Oyo" },
  { label: "Wuse, Abuja", latitude: 9.0765, longitude: 7.3986, state: "FCT" },
  { label: "Port Harcourt", latitude: 4.8156, longitude: 7.0498, state: "Rivers" },
  { label: "Kano", latitude: 12.0022, longitude: 8.5920, state: "Kano" },
];

export default function LocationPicker() {
  const t = useTokens();
  const router = useRouter();
  const { location, setLocation } = useBrowseLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = useCallback(
    async (loc: { label: string; latitude: number; longitude: number; state?: string }) => {
      haptics.tick();
      await setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        label: loc.label,
        state: loc.state ?? null,
      });
      router.back();
    },
    [setLocation, router]
  );

  const useCurrent = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // Refusal is a choice, not a failure — offer the other path rather
        // than a dead end.
        setError("Location is off. You can pick an area below instead.");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Label it if we can, but never block on the geocoder: a coordinate with
      // no name still scopes the feed correctly.
      let label = "Current location";
      let state: string | null = null;
      try {
        const [addr] = await Location.reverseGeocodeAsync(pos.coords);
        if (addr) {
          label =
            [addr.city ?? addr.subregion ?? addr.district, addr.region]
              .filter(Boolean)
              .join(", ") || label;
          state = addr.region ?? null;
        }
      } catch {
        /* keep the fallback label */
      }

      haptics.celebrate();
      await setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        label,
        state,
      });
      router.back();
    } catch {
      setError("Couldn't get your location. Pick an area below instead.");
    } finally {
      setBusy(false);
    }
  }, [setLocation, router]);

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-sunken"
        >
          <ArrowLeft size={20} color={t.textPrimary} />
        </Pressable>
        <Text className="text-[17px] font-bold text-text-primary">Choose your area</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="items-center pt-2 pb-6">
          <LocationMark size={92} />
          <Text className="text-[15px] mt-3 px-10 text-center text-text-secondary">
            We'll show you what's available near here.
          </Text>
          {/* The distinction, said plainly rather than assumed. */}
          <Text className="text-[13px] mt-1.5 px-10 text-center text-text-muted">
            This only changes what you see — not your delivery address.
          </Text>
        </View>

        <View className="px-4">
          <Pressable
            onPress={useCurrent}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
            className="h-14 rounded-2xl flex-row items-center justify-center gap-2.5 bg-primary-fill active:opacity-90"
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            {busy ? (
              <ActivityIndicator size="small" color={t.textOnPrimary} />
            ) : (
              <Crosshair size={19} color={t.textOnPrimary} strokeWidth={2.2} />
            )}
            <Text className="text-[16px] font-bold text-text-on-primary">
              {busy ? "Finding you…" : "Use my current location"}
            </Text>
          </Pressable>

          {error ? (
            <Text
              className="text-[13px] mt-2.5 text-center text-danger-text"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          ) : null}

          <Text className="text-[13px] font-semibold mt-7 mb-2 text-text-secondary">
            Or pick an area
          </Text>

          {AREAS.map((a) => {
            const active = location?.label === a.label;
            return (
              <Pressable
                key={a.label}
                onPress={() => choose(a)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`flex-row items-center gap-3 h-14 px-4 rounded-2xl mb-2 ${
                  active ? "bg-primary-muted" : "bg-surface-sunken"
                }`}
              >
                <MapPin
                  size={18}
                  color={active ? t.primaryText : t.textSecondary}
                  strokeWidth={2}
                />
                <Text
                  className={`flex-1 text-[15px] ${
                    active ? "font-bold text-primary-text" : "text-text-primary"
                  }`}
                >
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
