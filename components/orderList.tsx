import React, { useState, useCallback } from "react";
import { FlatList, ActivityIndicator, Text } from "react-native";
import OrderCard from "./orderCard";

interface OrdersListProps {
  fetchOrders: (page: number) => Promise<any[]>;
  isSeller?: boolean;
}

export default function OrdersList({ fetchOrders, isSeller }: OrdersListProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadOrders = useCallback(
    async (reset = false) => {
      if (loading || (!hasMore && !reset)) return;
      setLoading(true);

      try {
        const nextPage = reset ? 1 : page;
        const newOrders = await fetchOrders(nextPage);
        setOrders(reset ? newOrders : [...orders, ...newOrders]);
        setPage(nextPage + 1);
        setHasMore(newOrders.length > 0);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading, page, hasMore, orders]
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(true);
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={(item, idx) => idx.toString()}
      renderItem={({ item }) => <OrderCard order={item} isSeller={isSeller} />}
      onEndReached={() => loadOrders()}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListFooterComponent={loading && !refreshing ? <ActivityIndicator size="large" color="#e26136" /> : null}
      ListEmptyComponent={<Text className="text-center text-[#876d64] mt-5">No orders found</Text>}
    />
  );
}
