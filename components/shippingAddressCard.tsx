import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { MapPin, Pencil } from "lucide-react-native";
import type { ShippingAddressPayload } from "../models/cart";
import type { ShippingAddressSource } from "../hooks/useShippingAddress";
import { isShippingAddressUsable } from "../utils/shippingAddress";
import { tokensFor } from "../theme/useTokens";

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

  const fieldClass = `rounded h-11 px-3 text-sm border ${
    "bg-surface-raised border-border text-text-primary"
  }`;
  const labelClass = `text-xs font-bold mb-1 text-text-secondary`;
  const placeholderColor = tokensFor(isDark).textMuted;

  return (
    <View className="rounded border p-4 mb-4 bg-surface-raised border-border">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-bold text-text-primary">
          Shipping Address
        </Text>
        {!loading && usable && (
          <TouchableOpacity onPress={() => setEditing((e) => !e)} className="flex-row items-center gap-1">
            <Pencil size={14} color={tokensFor(isDark).textSecondary} />
            <Text className="text-xs font-bold text-text-secondary">
              {editing ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-row items-center gap-2 py-2">
          <ActivityIndicator size="small" color={tokensFor(isDark).textPrimary} />
          <Text className="text-xs text-text-secondary">Resolving your address…</Text>
        </View>
      ) : !showForm ? (
        <View className="flex-row items-start gap-2">
          <MapPin size={16} color={tokensFor(isDark).textSecondary} style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-sm text-text-primary">{formatSummary(address!)}</Text>
            <Text className="text-[10px] mt-1 uppercase tracking-wider text-text-secondary">
              {source === "saved" ? "Saved address" : source === "geolocation" ? "Current location" : "Entered manually"}
            </Text>
          </View>
        </View>
      ) : (
        <View className="gap-3">
          {!usable && (
            <Text className="text-xs text-text-secondary">
              We need a shipping address before you can check out.
            </Text>
          )}

          <TouchableOpacity
            onPress={() => useCurrentLocation()}
            disabled={locating}
            className="flex-row items-center justify-center gap-2 h-11 rounded border bg-surface-sunken border-border"
          >
            {locating ? (
              <ActivityIndicator size="small" color={tokensFor(isDark).textPrimary} />
            ) : (
              <MapPin size={16} color={tokensFor(isDark).textPrimary} />
            )}
            <Text className="text-xs font-bold uppercase tracking-wider text-text-primary">
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
