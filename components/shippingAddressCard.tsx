import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { MapPin, Pencil } from "lucide-react-native";
import type { ShippingAddressPayload } from "../models/cart";
import type { ShippingAddressSource } from "../hooks/useShippingAddress";
import { isShippingAddressUsable } from "../utils/shippingAddress";

interface Props {
  address: ShippingAddressPayload | null;
  source: ShippingAddressSource;
  loading: boolean;
  locating: boolean;
  locationDenied: boolean;
  useCurrentLocation: () => Promise<ShippingAddressPayload | null>;
  updateAddress: (patch: Partial<ShippingAddressPayload>) => void;
  isDark: boolean;
}

function formatSummary(addr: ShippingAddressPayload): string {
  const parts = [addr.street_address, addr.city, addr.state, addr.country].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  if (typeof addr.latitude === "number" && typeof addr.longitude === "number") {
    return `${addr.latitude.toFixed(5)}, ${addr.longitude.toFixed(5)}`;
  }
  return "";
}

export default function ShippingAddressCard({
  address,
  source,
  loading,
  locating,
  locationDenied,
  useCurrentLocation,
  updateAddress,
  isDark,
}: Props) {
  const [editing, setEditing] = useState(false);
  const usable = isShippingAddressUsable(address);
  const showForm = !loading && (editing || !usable);

  const fieldClass = `rounded h-11 px-3 text-sm font-inter border ${
    isDark ? "bg-[#1a1c1d] border-[#46464e] text-[#f0f1f2]" : "bg-white border-border text-black"
  }`;
  const labelClass = `text-xs font-geist font-bold mb-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`;
  const placeholderColor = isDark ? "#71717A" : "#A1A1AA";

  return (
    <View className={`rounded border p-4 mb-4 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          Shipping Address
        </Text>
        {!loading && usable && (
          <TouchableOpacity onPress={() => setEditing((e) => !e)} className="flex-row items-center gap-1">
            <Pencil size={14} color={isDark ? "#c6c5cf" : "#71717A"} />
            <Text className={`text-xs font-geist font-bold ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              {editing ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-row items-center gap-2 py-2">
          <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
          <Text className={`text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Resolving your address…</Text>
        </View>
      ) : !showForm ? (
        <View className="flex-row items-start gap-2">
          <MapPin size={16} color={isDark ? "#c6c5cf" : "#71717A"} style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className={`text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatSummary(address!)}</Text>
            <Text className={`text-[10px] mt-1 uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              {source === "saved" ? "Saved address" : source === "geolocation" ? "Current location" : "Entered manually"}
            </Text>
          </View>
        </View>
      ) : (
        <View className="gap-3">
          {!usable && (
            <Text className={`text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              We need a shipping address before you can check out.
            </Text>
          )}

          <TouchableOpacity
            onPress={() => useCurrentLocation()}
            disabled={locating}
            className={`flex-row items-center justify-center gap-2 h-11 rounded border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
          >
            {locating ? (
              <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
            ) : (
              <MapPin size={16} color={isDark ? "#f0f1f2" : "#000000"} />
            )}
            <Text className={`text-xs font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              Use current location
            </Text>
          </TouchableOpacity>
          {locationDenied && (
            <Text className="text-xs text-error">
              Location permission denied — enter your address below instead.
            </Text>
          )}

          <View>
            <Text className={labelClass}>Recipient name</Text>
            <TextInput
              className={fieldClass}
              value={address?.recipient_name ?? ""}
              onChangeText={(t) => updateAddress({ recipient_name: t })}
              placeholder="Who should we deliver to?"
              placeholderTextColor={placeholderColor}
            />
          </View>
          <View>
            <Text className={labelClass}>Street address</Text>
            <TextInput
              className={fieldClass}
              value={address?.street_address ?? ""}
              onChangeText={(t) => updateAddress({ street_address: t })}
              placeholder="123 Main St"
              placeholderTextColor={placeholderColor}
            />
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className={labelClass}>City</Text>
              <TextInput
                className={fieldClass}
                value={address?.city ?? ""}
                onChangeText={(t) => updateAddress({ city: t })}
                placeholder="City"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="flex-1">
              <Text className={labelClass}>State</Text>
              <TextInput
                className={fieldClass}
                value={address?.state ?? ""}
                onChangeText={(t) => updateAddress({ state: t })}
                placeholder="State"
                placeholderTextColor={placeholderColor}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className={labelClass}>Postal code</Text>
              <TextInput
                className={fieldClass}
                value={address?.postal_code ?? ""}
                onChangeText={(t) => updateAddress({ postal_code: t })}
                placeholder="Postal code"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="flex-1">
              <Text className={labelClass}>Country</Text>
              <TextInput
                className={fieldClass}
                value={address?.country ?? ""}
                onChangeText={(t) => updateAddress({ country: t })}
                placeholder="Country"
                placeholderTextColor={placeholderColor}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
