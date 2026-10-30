/**
 * Procurement: your requests (to review offers) and open requests from other
 * businesses (to answer). A request is never an order on its own.
 */
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ClipboardList, Plus } from "lucide-react-native";
import SearchField from "../../../components/SearchField";
import { FilterChip, FilterRail } from "../../../components/FilterChip";
import { Badge, EmptyState, Loading } from "../../../components/business/ui";
import { useBusiness } from "../../../hooks/businessContext";
import { useUser } from "../../../hooks/userContextProvider";
import { useTokens } from "../../../theme/useTokens";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import { getMyRequests, getOpenProcurementRequests } from "../../../services/sections/request";
import { formatNaira } from "../../../utils/formatCurrency";
import { formatQuantity } from "../../../models/business";
import type { Request } from "../../../models/request";

type Tab = "mine" | "open";

const STATUS_TONE: Record<string, "success" | "brand" | "muted"> = { OPEN: "success", FULFILLED: "brand" };

export default function ProcurementTab() {
  const router = useRouter();
  const t = useTokens();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { profile: user } = useUser();
  const { config } = useBusiness();
  const isBuyer = !!user?.is_buyer;
  const isSeller = !!user?.is_seller;

  // Buyers land on their own requests; seller-only businesses on open ones.
  const [tab, setTab] = useState<Tab>(params.tab === "open" || !isBuyer ? "open" : "mine");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (params.tab === "open" || params.tab === "mine") setTab(params.tab);
  }, [params.tab]);

  const applySearch = useDebouncedCallback((text: string) => setQuery(text), 350);

  const load = useCallback(async () => {
    setError(false);
    try {
      if (tab === "mine") {
        const mine = (await getMyRequests()) as unknown as Request[];
        setItems(mine.filter((r) => r.is_business));
      } else {
        const open = await getOpenProcurementRequests(query);
        setItems(open.items.filter((r) => String(r.user_id) !== String(user?.id)));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab, query, user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const renderItem = ({ item }: { item: Request }) => {
    const offers = item.offers ?? [];
    const pending = offers.filter((o: { status?: string }) => o.status === "PENDING").length;
    const details = [
      formatQuantity(item.quantity, item.unit, config.units),
      item.delivery_location ? `to ${item.delivery_location}` : "",
      item.budget ? `budget ${formatNaira(item.budget)}` : "",
    ].filter(Boolean);
    return (
      <TouchableOpacity
        onPress={() => router.push(`/requestDetails/${item.id}`)}
        activeOpacity={0.85}
        className="mx-4 mb-3 p-4 rounded-2xl border border-border bg-surface-raised"
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-[15px] font-bold text-text-primary" numberOfLines={2}>
            {item.title}
          </Text>
          <Badge label={String(item.status).toLowerCase()} tone={STATUS_TONE[String(item.status)] ?? "muted"} />
        </View>
        <Text className="mt-1.5 text-[13px] text-text-secondary" numberOfLines={2}>
          {details.length ? details.join(" · ") : item.description}
        </Text>
        <Text className="mt-2 text-[12px] font-semibold text-text-muted">
          {tab === "mine" && pending > 0
            ? `${pending} offer${pending === 1 ? "" : "s"} to review`
            : `${offers.length} offer${offers.length === 1 ? "" : "s"}`}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!config.features.procurement_enabled) {
    return <EmptyState icon={ClipboardList} title="Procurement requests aren't available right now" />;
  }

  return (
    <View className="flex-1 bg-surface-page">
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={t.textSecondary} />}
        ListHeaderComponent={
          <View className="pt-4">
            <FilterRail>
              {isBuyer ? <FilterChip label="My requests" active={tab === "mine"} onPress={() => setTab("mine")} /> : null}
              <FilterChip label="Open requests" active={tab === "open"} onPress={() => setTab("open")} />
            </FilterRail>
            {tab === "open" ? (
              <View className="px-4 pb-3">
                <SearchField
                  value={search}
                  onChangeText={(text: string) => {
                    setSearch(text);
                    applySearch(text);
                  }}
                  placeholder="Search requests"
                />
                {!isSeller ? (
                  <Text className="mt-2 text-[12px] text-text-muted">To send offers, add a seller account from your Profile.</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Loading />
          ) : error ? (
            <EmptyState icon={ClipboardList} title="Couldn't load requests" action="Try again" onAction={load} />
          ) : tab === "mine" ? (
            <EmptyState
              icon={ClipboardList}
              title="No procurement requests yet"
              message="Describe what you need — product, quantity, specifications, delivery — and suppliers will send offers."
              action="Create a request"
              onAction={() => router.push("/business/procurement-new")}
            />
          ) : (
            <EmptyState icon={ClipboardList} title={query ? "No requests match that search" : "No open requests right now"} />
          )
        }
      />

      {isBuyer ? (
        <TouchableOpacity
          onPress={() => router.push("/business/procurement-new")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="New procurement request"
          className="absolute right-4 bottom-5 h-12 px-5 rounded-full flex-row items-center gap-2 bg-primary-fill"
        >
          <Plus size={18} color={t.textOnPrimary} strokeWidth={2.4} />
          <Text className="text-sm font-bold text-text-on-primary">New request</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
