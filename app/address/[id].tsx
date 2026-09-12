import React from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Trash2, MapPin } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { useToast } from "../../components/ToastProvider";
import {
  listAddresses, updateAddress, deleteAddress,
} from "../../services/sections/addresses";
import { BUILDING_TYPES, type BuildingType, type SavedAddress } from "../../models/addresses";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import logger from "../../utils/logger";

/**
 * One saved address.
 *
 * The fields are what a rider needs to find a door, not what a postal system
 * wants: a label to recognise it by, what kind of building it is, the code to
 * get in, and the landmark that actually locates it. There is no postcode
 * field, because most of the places Markt delivers to do not have one and
 * asking for it taught buyers the form was for somebody else.
 */
export default function AddressInformation() {
  const router = useRouter();
  const t = useTokens();
  const { show } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const addressId = Number(id);

  const [address, setAddress] = React.useState<SavedAddress | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [label, setLabel] = React.useState("");
  const [buildingType, setBuildingType] = React.useState<BuildingType>("house");
  const [entryCode, setEntryCode] = React.useState("");
  const [directions, setDirections] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        // No single-address endpoint: the list is small, already ordered, and
        // one request beats two round trips for a screen opened from it.
        const found = (await listAddresses()).find((a) => a.id === addressId) ?? null;
        setAddress(found);
        if (found) {
          setLabel(found.label ?? "");
          setBuildingType(found.building_type);
          setEntryCode(found.entry_code ?? "");
          setDirections(found.directions ?? "");
        }
      } catch (error) {
        logger.error("Could not load address:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [addressId]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateAddress(addressId, {
        label: label.trim() || null,
        building_type: buildingType,
        entry_code: entryCode.trim() || null,
        directions: directions.trim() || null,
      });
      show({ variant: "success", title: "Address saved", message: "" });
      router.back();
    } catch (error) {
      show({
        variant: "error",
        title: "Couldn't save this address",
        message: friendlyErrorMessage(error, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this address?",
      "You can always add it again later.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(addressId);
              router.back();
            } catch (error) {
              show({
                variant: "error",
                title: "Couldn't delete that",
                message: friendlyErrorMessage(error, "Please try again."),
              });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-page">
        <ActivityIndicator size="large" color={t.textPrimary} />
      </SafeAreaView>
    );
  }

  if (!address) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-page px-8">
        <Text className="text-center text-[15px] text-text-secondary">
          That address isn't in your list any more.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="font-bold text-primary-text">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-sunken"
        >
          <ArrowLeft size={20} color={t.textPrimary} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-text-primary">Address information</Text>
        <TouchableOpacity
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete this address"
          className="h-10 w-10 items-center justify-center rounded-full bg-danger-muted"
        >
          <Trash2 size={18} color={t.dangerText} />
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Where it is. A map preview belongs here and is deliberately absent
            until there is a Maps API key — a blank grey rectangle reads as a
            broken feature rather than a missing key. */}
        <View className="mx-5 rounded-xl bg-surface-sunken p-4">
          <View className="flex-row items-start gap-2">
            <MapPin size={18} color={t.successText} />
            <View className="flex-1">
              <Text className="text-[15px] font-bold leading-5 text-text-primary">
                {address.label || address.formatted_address}
              </Text>
              <Text className="mt-1 text-[13px] leading-5 text-text-secondary">
                {address.formatted_address}
              </Text>
              <Text className="mt-1 text-[11px] text-text-muted">
                {address.latitude.toFixed(5)}, {address.longitude.toFixed(5)}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 pt-6">
          <Text className="mb-2 text-[13px] font-semibold text-text-secondary">Address label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Home"
            placeholderTextColor={t.textSecondary}
            className="h-14 rounded-xl bg-surface-sunken px-4 text-[16px] text-text-primary"
            accessibilityLabel="Address label"
          />

          <Text className="mb-2 mt-6 text-[13px] font-semibold text-text-secondary">
            Building type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BUILDING_TYPES.map((b) => {
              const on = buildingType === b.value;
              return (
                <TouchableOpacity
                  key={b.value}
                  onPress={() => setBuildingType(b.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className={`rounded-xl border px-4 py-2 ${
                    on ? "border-primary bg-primary-muted" : "border-border bg-surface-sunken"
                  }`}
                >
                  <Text className={`text-[13px] ${on ? "font-bold text-primary-text" : "text-text-secondary"}`}>
                    {b.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="mb-2 mt-6 text-[13px] font-semibold text-text-secondary">
            Entry code
          </Text>
          <TextInput
            value={entryCode}
            onChangeText={setEntryCode}
            placeholder="e.g. 1125"
            placeholderTextColor={t.textSecondary}
            className="h-14 rounded-xl bg-surface-sunken px-4 text-[16px] text-text-primary"
            accessibilityLabel="Entry code"
          />

          <Text className="mb-2 mt-6 text-[13px] font-semibold text-text-secondary">
            Directions for the rider
          </Text>
          <TextInput
            value={directions}
            onChangeText={setDirections}
            placeholder="e.g. Blue gate opposite the mosque, second floor"
            placeholderTextColor={t.textSecondary}
            multiline
            textAlignVertical="top"
            className="min-h-[100px] rounded-xl bg-surface-sunken px-4 py-3 text-[16px] text-text-primary"
            accessibilityLabel="Directions for the rider"
          />
          <Text className="mt-2 text-[12px] leading-4 text-text-muted">
            This is what actually finds you. A landmark beats a street name in
            most of the places we deliver.
          </Text>

          <TouchableOpacity
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            className={`mt-8 h-12 items-center justify-center rounded-xl ${
              saving ? "bg-surface-sunken" : "bg-primary-fill"
            }`}
          >
            <Text className={`text-[15px] font-bold ${saving ? "text-text-muted" : "text-text-on-primary"}`}>
              {saving ? "Saving…" : "Save address"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
