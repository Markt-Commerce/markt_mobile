import React from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, Store } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import SearchField from "../../components/SearchField";
import MapPinPicker from "../../components/address/MapPinPicker";
import { useAddressLookup } from "../../hooks/useAddressLookup";
import { getUserProfile, updateSellerProfile } from "../../services/sections/profile";
import { checkServiceable } from "../../services/sections/delivery";
import { useToast } from "../../components/ToastProvider";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import logger from "../../utils/logger";

/**
 * Where the shop is.
 *
 * The same picker a buyer uses for a delivery address, because it is the same
 * problem: get a coordinate a rider can reach. It was previously GPS-only,
 * which meant a seller had to be standing in their shop to set it — and if
 * they tapped it at home, their shop moved there silently.
 *
 * This is not a saved address. A shop has exactly one location and it belongs
 * on the seller profile, so it is written to the shop rather than into the
 * buyer's address book.
 *
 * It also matters more than a buyer's address: an unpinned shop cannot be
 * quoted from at all, and never appears in a distance-ranked search.
 */
export default function ShopLocationScreen() {
  const router = useRouter();
  const t = useTokens();
  const { show } = useToast();
  const lookup = useAddressLookup();

  const [query, setQuery] = React.useState("");
  const [pin, setPin] = React.useState<{ latitude: number; longitude: number } | null>(null);
  // What the place is called, saved next to the coordinate. A buyer deciding
  // whether to order from a shop two streets away should not have to read a
  // latitude, and a rider given only a pin has nothing to ask for at the gate.
  const [addressLine, setAddressLine] = React.useState<{
    formatted: string | null;
    city: string | null;
    state: string | null;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [coverage, setCoverage] = React.useState<{ serviceable: boolean; city: string | null } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const profile = await getUserProfile();
        const s = profile.seller_account as any;
        if (s?.shop_latitude != null && s?.shop_longitude != null) {
          setPin({ latitude: s.shop_latitude, longitude: s.shop_longitude });
        }
        if (s?.shop_address?.formatted) setAddressLine(s.shop_address);
      } catch (error) {
        logger.error("Could not load shop location:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Tell the seller whether we actually deliver from where they have put the
  // pin. Finding that out at their first order is far too late.
  React.useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    checkServiceable(pin.latitude, pin.longitude)
      .then((r) => !cancelled && setCoverage({ serviceable: r.serviceable, city: r.city }))
      .catch(() => !cancelled && setCoverage(null));
    return () => {
      cancelled = true;
    };
  }, [pin?.latitude, pin?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const handle = setTimeout(() => lookup.search(query), 350);
    return () => clearTimeout(handle);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!pin || saving) return;
    setSaving(true);
    try {
      await updateSellerProfile({
        shop_latitude: pin.latitude,
        shop_longitude: pin.longitude,
        // Only when we have one: overwriting a good address with nulls
        // because the pin was nudged on the map would lose the useful half.
        ...(addressLine?.formatted ? { shop_address: addressLine } : {}),
      });
      show({ variant: "success", title: "Shop location saved", message: "" });
      router.back();
    } catch (error) {
      show({
        variant: "error",
        title: "Couldn't save your shop location",
        message: friendlyErrorMessage(error, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-page">
        <ActivityIndicator size="large" color={t.textPrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <View className="flex-row items-center gap-3 px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-sunken"
        >
          <ArrowLeft size={20} color={t.textPrimary} />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-text-primary">Shop location</Text>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5">
          <Text className="mb-3 text-[13px] leading-5 text-text-secondary">
            This is where riders collect from, and it's what puts your shop in
            nearby search results. Search for it, or drop the pin exactly.
          </Text>

          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search for your shop or a landmark"
          />

          {lookup.searching ? (
            <View className="flex-row items-center gap-2 py-3">
              <ActivityIndicator size="small" color={t.textSecondary} />
              <Text className="text-[13px] text-text-secondary">Searching…</Text>
            </View>
          ) : null}

          {lookup.results.map((r, i) => (
            <TouchableOpacity
              key={`${r.latitude}-${r.longitude}-${i}`}
              onPress={() => {
                setPin({ latitude: r.latitude, longitude: r.longitude });
                setAddressLine({
                  formatted: r.formatted_address,
                  city: r.city ?? null,
                  state: r.state ?? null,
                });
                setQuery("");
                lookup.clear();
              }}
              accessibilityRole="button"
              className="flex-row items-start gap-3 border-b border-border py-3"
            >
              <Search size={16} color={t.textSecondary} />
              <View className="flex-1">
                <Text className="text-[15px] text-text-primary">{r.formatted_address}</Text>
                {r.context ? (
                  <Text className="mt-0.5 text-[12px] text-text-muted">{r.context}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}

          <View className="mt-4">
            <MapPinPicker
              latitude={pin?.latitude ?? 7.4477}
              longitude={pin?.longitude ?? 3.8967}
              onChange={setPin}
              locating={lookup.locating}
              onUseCurrentLocation={async () => {
                const found = await lookup.useCurrentLocation();
                if (found) {
                  setPin({ latitude: found.latitude, longitude: found.longitude });
                  setAddressLine({
                    formatted: found.formatted_address,
                    city: found.city ?? null,
                    state: found.state ?? null,
                  });
                }
              }}
              height={220}
            />
          </View>

          {addressLine?.formatted ? (
            <Text className="mt-3 text-[14px] leading-5 text-text-primary">
              {addressLine.formatted}
              {addressLine.city ? (
                <Text className="text-text-secondary">{`\n${[addressLine.city, addressLine.state].filter(Boolean).join(", ")}`}</Text>
              ) : null}
            </Text>
          ) : null}

          {!pin ? (
            <Text className="mt-3 text-[13px] leading-5 text-text-muted">
              Your shop has no location set yet. Until it does, we can't quote
              a delivery from it and it won't show up in nearby searches.
            </Text>
          ) : coverage && !coverage.serviceable ? (
            <View className="mt-3 rounded-xl border border-warning bg-surface-sunken p-3">
              <View className="flex-row items-center gap-2">
                <Store size={16} color={t.warningText} />
                <Text className="flex-1 text-[13px] leading-5 text-text-secondary">
                  We don't deliver from this area yet. You can still sell here —
                  buyers just won't be able to have it delivered until we
                  arrive.
                </Text>
              </View>
            </View>
          ) : coverage?.serviceable ? (
            <Text className="mt-3 text-[13px] text-text-secondary">
              We deliver from here{coverage.city ? ` — ${coverage.city}` : ""}.
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={save}
            disabled={!pin || saving}
            accessibilityRole="button"
            className={`mt-8 h-12 items-center justify-center rounded-xl ${
              !pin || saving ? "bg-surface-sunken" : "bg-primary-fill"
            }`}
          >
            <Text
              className={`text-[15px] font-bold ${
                !pin || saving ? "text-text-muted" : "text-text-on-primary"
              }`}
            >
              {saving ? "Saving…" : "Save shop location"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
