import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";

import OrdersList from "../../components/orderList";
import {
  getSellerOrders,
  updateSellerOrderItem,
} from "../../services/sections/orders";
import { OrderItem, SellerOrderItem } from "../../models/orders";
import { Seller } from "../../models/search";
import { useTheme } from "../../components/themeProvider";

type OrderStatus = "pending" | "shipped" | "delivered" | "canceled";

export default function SellerOrders() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [sort, setSort] = useState<"latest" | "price_asc" | "price_desc">(
    "latest"
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const pageSize = 10;

  /**
   * Fetch seller order items
   * OrdersList controls pagination; we only filter/sort client-side
   */
  const fetchSellerOrders = useCallback(
    async (page: number): Promise<SellerOrderItem[]> => {
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
    item: SellerOrderItem,
    newStatus: OrderStatus
  ) => {
    try {
      await updateSellerOrderItem(item.id!, {
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
  const handleItemPress = (item: SellerOrderItem) => {
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
      className={`h-9 px-4 rounded items-center justify-center border ${
        active
          ? "bg-primary border-primary"
          : isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"
      }`}
    >
      <Text
        className={`text-xs font-geist font-bold ${
          active ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"
        }`}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );

  const SortBtn = ({ label, v }: { label: string; v: typeof sort }) => (
    <TouchableOpacity
      onPress={() => setSort(v)}
      className={`h-9 px-4 rounded border ${
        sort === v
          ? "bg-primary border-primary"
          : isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"
      } items-center justify-center`}
      activeOpacity={0.85}
    >
      <Text className={`text-[10px] font-geist font-bold uppercase tracking-wider ${sort === v ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
      {/* Header */}
      <View className={`px-6 py-4 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <Text className={`text-xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          Shop Orders
        </Text>
        <Text className={`text-xs font-inter mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
          Manage and fulfill customer orders
        </Text>
      </View>

      {/* Search + Filters */}
      <View className="px-6 pt-6">
        {/* Search */}
        <View className={`flex-row items-center rounded overflow-hidden border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
          <View className="w-12 items-center justify-center">
            <Search size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
          </View>
          <TextInput
            className={`flex-1 h-11 px-3 font-inter text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
            placeholder="Search product name"
            placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>

        {/* Status pills */}
        <View className="mt-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
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
          </ScrollView>
        </View>

        {/* Sort */}
        <View className="flex-row gap-3 mt-4">
          <SortBtn label="Latest" v="latest" />
          <SortBtn label="Price ↑" v="price_asc" />
          <SortBtn label="Price ↓" v="price_desc" />
        </View>
      </View>

      {/* Orders */}
      <View className="flex-1 mt-4">
        <OrdersList
          key={listKey}
          fetchOrders={fetchSellerOrders}
          isSeller
          pressed={handleItemPress}
        />
      </View>
    </SafeAreaView>
  );
}
