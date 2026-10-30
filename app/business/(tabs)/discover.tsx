/**
 * Discover: business listings (supply with business terms) and businesses.
 */
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Building2, Package, SearchX } from "lucide-react-native";
import SearchField from "../../../components/SearchField";
import { FilterChip, FilterRail, RailDivider } from "../../../components/FilterChip";
import { Badge, EmptyState, Loading, VerificationBadge } from "../../../components/business/ui";
import { useBusiness } from "../../../hooks/businessContext";
import { useTokens } from "../../../theme/useTokens";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import { discoverBusinesses, searchListings } from "../../../services/sections/business";
import { formatNaira } from "../../../utils/formatCurrency";
import { formatQuantity, optionLabel, unitSingular, type BusinessListingResult, type BusinessProfile } from "../../../models/business";

type Tab = "listings" | "businesses";

export default function BusinessDiscover() {
  const router = useRouter();
  const t = useTokens();
  const { config } = useBusiness();
  const [tab, setTab] = useState<Tab>("listings");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<string | undefined>();
  const [side, setSide] = useState<"buys" | "sells" | undefined>();
  const [listings, setListings] = useState<BusinessListingResult[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const applySearch = useDebouncedCallback((text: string) => setQuery(text.trim()), 350);

  const load = useCallback(async () => {
    setError(false);
    try {
      if (tab === "listings") {
        setListings((await searchListings({ search: query, unit, perPage: 40 })).items);
      } else {
        setBusinesses((await discoverBusinesses({ search: query, side })).items);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab, query, unit, side]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const renderListing = ({ item }: { item: BusinessListingResult }) => {
    const terms = item.business_listing;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/business/listing/${item.id}`)}
        activeOpacity={0.85}
        className="mx-4 mb-3 flex-row gap-3 p-3 rounded-2xl border border-border bg-surface-raised"
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="w-20 h-20 rounded-xl bg-surface-sunken" />
        ) : (
          <View className="w-20 h-20 rounded-xl items-center justify-center bg-surface-sunken">
            <Package size={22} color={t.textMuted} strokeWidth={1.8} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-text-primary" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="mt-0.5 text-[12px] text-text-secondary" numberOfLines={1}>
            {item.business_name ?? "Business"}
            {terms.state ? ` · ${[terms.city, terms.state].filter(Boolean).join(", ")}` : ""}
          </Text>
          <Text className="mt-1 text-[15px] font-bold text-text-primary">
            {formatNaira(item.price)}
            <Text className="text-[12px] font-semibold text-text-secondary"> per {unitSingular(config.units, terms.unit)}</Text>
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mt-1.5">
            {terms.price_negotiable ? <Badge label="Negotiable" tone="brand" /> : null}
            {terms.min_order_quantity != null ? (
              <Badge label={`Min. ${formatQuantity(terms.min_order_quantity, terms.unit, config.units)}`} />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBusiness = ({ item }: { item: BusinessProfile }) => (
    <TouchableOpacity
      onPress={() => router.push(`/business/company/${item.user_id}`)}
      activeOpacity={0.85}
      className="mx-4 mb-3 p-4 rounded-2xl border border-border bg-surface-raised"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-xl items-center justify-center bg-primary-muted">
          <Building2 size={20} color={t.primaryText} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-text-primary" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-[12px] text-text-secondary" numberOfLines={1}>
            {item.business_types.map((k) => optionLabel(config.business_types, k)).join(", ")}
          </Text>
        </View>
      </View>
      {item.description ? (
        <Text className="mt-2.5 text-[13px] leading-5 text-text-secondary" numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap gap-1.5 mt-2.5">
        <VerificationBadge status={item.verification_status} compact />
        {item.industry ? <Badge label={optionLabel(config.industries, item.industry)} /> : null}
        {item.state ? <Badge label={[item.city, item.state].filter(Boolean).join(", ")} /> : null}
        {item.sells ? <Badge label="Sells" /> : null}
        {item.buys ? <Badge label="Buys" /> : null}
      </View>
    </TouchableOpacity>
  );

  const header = (
    <View className="pt-4">
      <View className="px-4 pb-3">
        <SearchField
          value={search}
          onChangeText={(text: string) => {
            setSearch(text);
            applySearch(text);
          }}
          placeholder={tab === "listings" ? "Cassava, PET bottles, palm oil…" : "Business name or description"}
        />
      </View>
      <FilterRail>
        <FilterChip label="Products" active={tab === "listings"} onPress={() => setTab("listings")} />
        <FilterChip label="Businesses" active={tab === "businesses"} onPress={() => setTab("businesses")} />
        <RailDivider />
        {tab === "listings"
          ? config.units.map((u) => (
              <FilterChip key={u.key} tone="neutral" label={u.label} active={unit === u.key} onPress={() => setUnit(unit === u.key ? undefined : u.key)} />
            ))
          : ([
              ["sells", "Suppliers & producers"],
              ["buys", "Buyers & manufacturers"],
            ] as const).map(([key, label]) => (
              <FilterChip key={key} tone="neutral" label={label} active={side === key} onPress={() => setSide(side === key ? undefined : key)} />
            ))}
      </FilterRail>
    </View>
  );

  if (!config.features.discovery_enabled) {
    return <EmptyState icon={SearchX} title="Discovery isn't available right now" />;
  }

  const empty = loading ? (
    <Loading />
  ) : error ? (
    <EmptyState icon={SearchX} title="Couldn't load results" message="Check your connection and try again." action="Try again" onAction={load} />
  ) : tab === "listings" ? (
    <EmptyState
      icon={Package}
      title="No business listings match"
      message="Try a broader search, or post a procurement request and let suppliers find you."
      action={config.features.procurement_enabled ? "Create a request" : undefined}
      onAction={() => router.push("/business/procurement-new")}
    />
  ) : (
    <EmptyState icon={Building2} title="No businesses match yet" />
  );

  return tab === "listings" ? (
    <FlatList
      className="flex-1 bg-surface-page"
      data={loading ? [] : listings}
      keyExtractor={(i) => i.id}
      renderItem={renderListing}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={t.textSecondary} />}
      keyboardShouldPersistTaps="handled"
    />
  ) : (
    <FlatList
      className="flex-1 bg-surface-page"
      data={loading ? [] : businesses}
      keyExtractor={(i) => i.user_id}
      renderItem={renderBusiness}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={t.textSecondary} />}
      keyboardShouldPersistTaps="handled"
    />
  );
}
