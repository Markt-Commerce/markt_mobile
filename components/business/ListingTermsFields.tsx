/**
 * Business-terms inputs for a product: unit, quantities, negotiable price,
 * capacity, availability, location and specifications. Controlled; the screen
 * owns the state and turns it into a BusinessListingInput with toListingInput.
 */
import React from "react";
import { Switch, Text, View } from "react-native";
import { Field, OptionPicker, SpecificationEditor, parseOptionalNumber, rowsToSpecs, specsToRows } from "./ui";
import { useTokens } from "../../theme/useTokens";
import type { BusinessListing, BusinessListingInput, BusinessOption } from "../../models/business";

export interface TermsState {
  unit: string[];
  available: string;
  minOrder: string;
  negotiable: boolean;
  capacity: string;
  availability: string;
  city: string;
  state: string;
  specs: { key: string; value: string }[];
}

export function termsStateFrom(listing?: BusinessListing | null): TermsState {
  return {
    unit: listing?.unit ? [listing.unit] : [],
    available: listing?.available_quantity != null ? String(listing.available_quantity) : "",
    minOrder: listing?.min_order_quantity != null ? String(listing.min_order_quantity) : "",
    negotiable: listing?.price_negotiable ?? false,
    capacity: listing?.production_capacity ?? "",
    availability: listing?.availability ?? "",
    city: listing?.city ?? "",
    state: listing?.state ?? "",
    specs: specsToRows(listing?.specifications),
  };
}

/** The input, or a message saying what's wrong with it. */
export function toListingInput(s: TermsState): BusinessListingInput | string {
  if (!s.unit[0]) return "Choose a unit.";
  const available = parseOptionalNumber(s.available);
  const minOrder = parseOptionalNumber(s.minOrder);
  if (Number.isNaN(available) || Number.isNaN(minOrder)) return "Quantities must be numbers of zero or more.";
  return {
    unit: s.unit[0],
    available_quantity: available,
    min_order_quantity: minOrder,
    price_negotiable: s.negotiable,
    production_capacity: s.capacity.trim() || null,
    availability: s.availability.trim() || null,
    specifications: rowsToSpecs(s.specs),
    city: s.city.trim() || null,
    state: s.state.trim() || null,
  };
}

export default function ListingTermsFields({
  units,
  value,
  onChange,
}: {
  units: BusinessOption[];
  value: TermsState;
  onChange: (next: TermsState) => void;
}) {
  const t = useTokens();
  const set = <K extends keyof TermsState>(key: K, v: TermsState[K]) => onChange({ ...value, [key]: v });

  return (
    <View>
      <OptionPicker label="Unit" options={units} selected={value.unit} onToggle={(k) => set("unit", [k])} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Available quantity" value={value.available} onChangeText={(v) => set("available", v)} keyboardType="decimal-pad" />
        </View>
        <View className="flex-1">
          <Field label="Minimum order" value={value.minOrder} onChangeText={(v) => set("minOrder", v)} keyboardType="decimal-pad" />
        </View>
      </View>
      <View className="flex-row items-center justify-between mb-4 px-4 h-14 rounded-xl bg-surface-sunken">
        <Text className="text-[15px] font-semibold text-text-primary">Price is negotiable</Text>
        <Switch
          value={value.negotiable}
          onValueChange={(v) => set("negotiable", v)}
          trackColor={{ true: t.primaryFill, false: t.borderStrong }}
          accessibilityLabel="Price is negotiable"
        />
      </View>
      <Field label="Production capacity" value={value.capacity} onChangeText={(v) => set("capacity", v)} maxLength={150} placeholder="e.g. 20 tonnes per month" />
      <Field label="Availability" value={value.availability} onChangeText={(v) => set("availability", v)} maxLength={150} placeholder="e.g. Year-round" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="City / town" value={value.city} onChangeText={(v) => set("city", v)} maxLength={100} />
        </View>
        <View className="flex-1">
          <Field label="State" value={value.state} onChangeText={(v) => set("state", v)} maxLength={100} />
        </View>
      </View>
      <Text className="-mt-2 mb-4 text-xs text-text-muted">Leave location blank to use your business location.</Text>
      <SpecificationEditor rows={value.specs} onChange={(specs) => set("specs", specs)} />
    </View>
  );
}
