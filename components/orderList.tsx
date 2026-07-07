// ...existing code...
import React, { useState, useCallback, useEffect, useRef } from "react";
import { FlatList, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import OrderCard from "./orderCard";
import { Order, OrderItem, SellerOrderItem } from "../models/orders";
import logger from "../utils/logger";

interface OrdersListProps<T> {
  fetchOrders: (page: number) => Promise<T[]>;
  pressed?: (item: T) => any;
  isSeller?: boolean;
}

function dedupeById<T>(items: T[]): T[] {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    const id = (item as any).id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export default function OrdersList<T extends Order | OrderItem | SellerOrderItem>({
  fetchOrders,
  isSeller,
  pressed,
}: OrdersListProps<T>) {
  const [orders, setOrders] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Ref guard, not state — FlatList can fire onEndReached more than once before
  // a state update flushes, which would otherwise let two calls fetch the same
  // page and append duplicate ids (causing the FlatList "same key" error).
  const loadingRef = useRef(false);

  const loadOrders = useCallback(
    async (reset = false) => {
      if (loadingRef.current || (!hasMore && !reset)) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const nextPage = reset ? 1 : page;
        const newOrders = await fetchOrders(nextPage);
        setOrders((prev) => dedupeById(reset ? newOrders : [...prev, ...newOrders]));
        setPage(nextPage + 1);
        setHasMore(newOrders.length > 0);
      } catch (err) {
        logger.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        loadingRef.current = false;
      }
    },
    [page, hasMore, fetchOrders]
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(true);
  };

  // Fetch the first page as soon as this list mounts — previously nothing
  // triggered a fetch until the user manually pulled to refresh.
  useEffect(() => {
    loadOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FlatList
      data={orders}
      keyExtractor={(item: any) => String(item.id)}
      renderItem={({ item }) => (
          <TouchableOpacity onPress={() => pressed && pressed(item)} activeOpacity={0.7}>
            <OrderCard order={item} isSeller={isSeller} />
          </TouchableOpacity>
      )}
      onEndReached={() => loadOrders()}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={loading ? <ActivityIndicator className="mt-5" /> : <Text className="text-center text-tertiary mt-5">No orders found</Text>}
    />
  );
}