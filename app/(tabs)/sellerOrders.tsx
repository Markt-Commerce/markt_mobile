import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";

import OrdersList from "../../components/orderList";
import {
  getSellerOrders,
  updateSellerOrderItem,
} from "../../services/sections/orders";
import { OrderItem } from "../../models/orders";

type OrderStatus = "pending" | "shipped" | "delivered" | "canceled";

export default function SellerOrders() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [sort, setSort] = useState<"latest" | "price_asc" | "price_desc">(
    "latest"
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const pageSize = 10;

  /**
   * Fetch seller order items
   * OrdersList controls pagination; we only filter/sort client-side
   */
  const fetchSellerOrders = useCallback(
    async (page: number): Promise<OrderItem[]> => {
      const res = await getSellerOrders(page, pageSize);
      let items = res.items;

      // Status filter
      if (status !== "all") {
        items = items.filter((i) => i.status === status);
      }

      // Search filter
      const q = query.trim().toLowerCase();
      if (q) {
        items = items.filter((i) =>
          i.product?.name?.toLowerCase().includes(q)
        );
      }

      // Sorting
      if (sort === "price_asc") {
        items = [...items].sort((a, b) => a.price - b.price);
      } else if (sort === "price_desc") {
        items = [...items].sort((a, b) => b.price - a.price);
      }
      // "latest" = backend order

      return items;
    },
    [pageSize, query, sort, status]
  );

  /**
   * Seller action: update item status
   */
  const handleUpdateStatus = async (
    item: OrderItem,
    newStatus: OrderStatus
  ) => {
    try {
      await updateSellerOrderItem(item.variant_id!, {
        status: newStatus,
      });
      setRefreshKey((k) => k + 1);
    } catch {
      Alert.alert("Error", "Failed to update order status");
    }
  };

  /**
   * Long press = seller actions
   */
  const handleItemPress = (item: OrderItem) => {
    Alert.alert(
      "Update Order Status",
      item.product?.name ?? "Order Item",
      [
        {
          text: "Mark Shipped",
          onPress: () => handleUpdateStatus(item, "shipped"),
        },
        {
          text: "Mark Delivered",
          onPress: () => handleUpdateStatus(item, "delivered"),
        },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => handleUpdateStatus(item, "canceled"),
        },
        { text: "Close", style: "cancel" },
      ]
    );
  };

  const listKey = useMemo(
    () => `${status}|${sort}|${query}|${refreshKey}`,
    [status, sort, query, refreshKey]
  );

  const Pill = ({
    active,
    children,
    onPress,
  }: {
    active?: boolean;
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`h-9 px-3 rounded-full items-center justify-center border ${
        active
          ? "bg-[#e26136] border-[#e26136]"
          : "bg-white border-[#e5dedc]"
      }`}
    >
      <Text
        className={
          active
            ? "text-white font-semibold"
            : "text-[#171311] font-medium"
        }
      >
        {children}
      </Text>
    </TouchableOpacity>
  );

  const SortBtn = ({ label, v }: { label: string; v: typeof sort }) => (
    <TouchableOpacity
      onPress={() => setSort(v)}
      className={`h-9 px-3 rounded-full border ${
        sort === v
          ? "bg-[#f5f2f1] border-[#e5dedc]"
          : "bg-white border-[#e5dedc]"
      } items-center justify-center`}
      activeOpacity={0.85}
    >
      <Text className="text-[#171311] text-xs font-medium">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 border-b border-[#efe9e7]">
        <Text className="text-lg font-extrabold text-[#171311]">
          Shop Orders
        </Text>
        <Text className="text-xs text-[#876d64] mt-0.5">
          Manage and fulfill customer orders
        </Text>
      </View>

      {/* Search + Filters */}
      <View className="px-4 pt-3">
        {/* Search */}
        <View className="flex-row items-center rounded-full overflow-hidden border border-[#e5dedc]">
          <View className="bg-[#f4f1f0] h-11 w-11 items-center justify-center">
            <Search size={18} color="#876d64" />
          </View>
          <TextInput
            className="flex-1 h-11 bg-[#f4f1f0] px-4 text-[#171311]"
            placeholder="Search product name"
            placeholderTextColor="#9a8a85"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>

        {/* Status pills */}
        <View className="flex-row flex-wrap gap-2 mt-3">
          <Pill active={status === "all"} onPress={() => setStatus("all")}>
            All
          </Pill>
          <Pill active={status === "pending"} onPress={() => setStatus("pending")}>
            Pending
          </Pill>
          <Pill active={status === "shipped"} onPress={() => setStatus("shipped")}>
            Shipped
          </Pill>
          <Pill
            active={status === "delivered"}
            onPress={() => setStatus("delivered")}
          >
            Delivered
          </Pill>
          <Pill
            active={status === "canceled"}
            onPress={() => setStatus("canceled")}
          >
            Canceled
          </Pill>
        </View>

        {/* Sort */}
        <View className="flex-row gap-2 mt-3">
          <SortBtn label="Latest" v="latest" />
          <SortBtn label="Price ↑" v="price_asc" />
          <SortBtn label="Price ↓" v="price_desc" />
        </View>
      </View>

      {/* Orders */}
      <View className="flex-1 mt-2">
        <OrdersList
          key={listKey}
          fetchOrders={fetchSellerOrders}
          isSeller
          onPress={handleItemPress}
        />
      </View>
    </SafeAreaView>
  );
}
