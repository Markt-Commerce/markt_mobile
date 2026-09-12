import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { MapPin, Navigation, Pencil, Search } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import SearchField from "../SearchField";
import { useAddressLookup, type LookupResult } from "../../hooks/useAddressLookup";
import type { SavedAddress } from "../../models/addresses";

interface Props {
  addresses: SavedAddress[];
  loading?: boolean;
  /** Tapping a saved address. In the picker this chooses it; on the address
   * book screen there is nothing to choose, so it opens the editor instead. */
  onSelect?: (address: SavedAddress) => void;
  onEdit?: (address: SavedAddress) => void;
  /** A place found by search or GPS that isn't saved yet. */
  onPick?: (result: LookupResult) => void;
  /** Shown only in the picker: use this place once without saving it. */
  showUseOnce?: boolean;
  /** Which one is currently chosen, so the picker can mark it. */
  selectedId?: number | null;
}

/**
 * The address list, used in two places with the same behaviour and a
 * different title: the checkout picker and the address book in Profile.
 *
 * Deliberately one component. They were always going to be the same list of
 * the same rows with the same edit affordance, and keeping two would mean
 * every future change to how an address is displayed has to be made twice —
 * which is precisely how the two cart screens drifted apart.
 */
export default function AddressList({
  addresses,
  loading,
  onSelect,
  onEdit,
  onPick,
  showUseOnce,
  selectedId,
}: Props) {
  const t = useTokens();
  const [query, setQuery] = React.useState("");
  const lookup = useAddressLookup();

  React.useEffect(() => {
    // Debounced: the OS geocoder is not free in time even though it is free
    // in money, and firing on every keystroke makes the list flicker.
    const handle = setTimeout(() => lookup.search(query), 350);
    return () => clearTimeout(handle);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCurrentLocation = async () => {
    const found = await lookup.useCurrentLocation();
    if (found) onPick?.(found);
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-2">
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Enter a new address"
        />
      </View>

      {/* Offered before search, because it is the path that gives a
          coordinate we know is right rather than one a geocoder guessed. */}
      <TouchableOpacity
        onPress={handleCurrentLocation}
        disabled={lookup.locating}
        accessibilityRole="button"
        className="mt-4 flex-row items-center gap-3 px-5 py-3"
      >
        {lookup.locating ? (
          <ActivityIndicator size="small" color={t.primaryText} />
        ) : (
          <Navigation size={20} color={t.primaryText} />
        )}
        <Text className="text-[15px] font-semibold text-primary-text">
          {lookup.locating ? "Finding you…" : "Use your current location"}
        </Text>
      </TouchableOpacity>

      {lookup.permissionDenied ? (
        <Text className="px-5 pb-2 text-[12px] leading-4 text-text-muted">
          Location is off for Markt. Turn it on in Settings, or search for the
          address instead.
        </Text>
      ) : null}

      {/* Search results: places we found but haven't saved. */}
      {lookup.searching ? (
        <View className="flex-row items-center gap-2 px-5 py-3">
          <ActivityIndicator size="small" color={t.textSecondary} />
          <Text className="text-[13px] text-text-secondary">Searching…</Text>
        </View>
      ) : null}

      {lookup.results.map((r, i) => (
        <TouchableOpacity
          key={`${r.latitude}-${r.longitude}-${i}`}
          onPress={() => onPick?.(r)}
          accessibilityRole="button"
          className="flex-row items-start gap-3 border-t border-border px-5 py-4"
        >
          <Search size={18} color={t.textSecondary} />
          <View className="flex-1">
            <Text className="text-[15px] text-text-primary">{r.formatted_address}</Text>
            <Text className="mt-0.5 text-[12px] text-text-muted">Tap to use this place</Text>
          </View>
        </TouchableOpacity>
      ))}

      {showUseOnce && query.trim().length >= 4 && !lookup.results.length && !lookup.searching ? (
        <Text className="px-5 py-3 text-[13px] text-text-muted">
          Nothing found for that. Try a landmark or a road name, or use your
          current location.
        </Text>
      ) : null}

      <View className="mt-2 h-2 bg-surface-sunken" />

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator size="small" color={t.textSecondary} />
        </View>
      ) : addresses.length === 0 ? (
        <View className="items-center px-8 py-10">
          <MapPin size={32} color={t.textMuted} strokeWidth={1.5} />
          <Text className="mt-3 text-center text-[15px] font-semibold text-text-primary">
            No saved addresses yet
          </Text>
          <Text className="mt-1 text-center text-[13px] leading-5 text-text-muted">
            Save the places you order to once, and they'll be here every time.
          </Text>
        </View>
      ) : (
        addresses.map((a) => {
          const chosen = selectedId === a.id;
          return (
            <View
              key={a.id}
              className={`flex-row items-start border-b border-border px-5 py-4 ${
                chosen ? "bg-surface-sunken" : ""
              }`}
            >
              <TouchableOpacity
                onPress={() => (onSelect ? onSelect(a) : onEdit?.(a))}
                accessibilityRole="button"
                accessibilityState={{ selected: chosen }}
                className="flex-1 flex-row items-start gap-3"
              >
                <MapPin size={18} color={chosen ? t.primaryText : t.successText} />
                <View className="flex-1">
                  <Text className="text-[15px] leading-5 text-text-primary">
                    {a.label || a.formatted_address}
                  </Text>
                  {a.label ? (
                    <Text className="mt-0.5 text-[13px] leading-4 text-text-muted">
                      {a.formatted_address}
                    </Text>
                  ) : null}
                  {a.is_default ? (
                    <Text className="mt-1 text-[11px] font-bold uppercase tracking-[1px] text-text-secondary">
                      Default
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
              {onEdit ? (
                <TouchableOpacity
                  onPress={() => onEdit(a)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${a.label || a.formatted_address}`}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="pl-3 pt-0.5"
                >
                  <Pencil size={18} color={t.successText} />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
