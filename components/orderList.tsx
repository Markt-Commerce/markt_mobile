// ...existing code...
import React, { useState, useCallback } from "react";
import { FlatList, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import OrderCard from "./orderCard";
import { Order, OrderItem, SellerOrderItem } from "../models/orders";

interface OrdersListProps<T> {
  fetchOrders: (page: number) => Promise<T[]>;
  pressed?: (item: T) => any;
  isSeller?: boolean;
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
    [loading, page, hasMore, orders, fetchOrders]
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(true);
  };

  return (
    <FlatList
      data={orders}
      renderItem={({ item }) => (
          <TouchableOpacity onPress={() => pressed && pressed(item)} activeOpacity={0.7}>
            <OrderCard order={item} isSeller={isSeller} />
          </TouchableOpacity>
      )}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={<Text className="text-center text-tertiary mt-5">No orders found</Text>} 
    />
  );
}