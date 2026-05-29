import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Truck, Package, User, Dot, PlusSquare, Search, Home, LucideIcon, Bell, Check, MessageSquare, Tag } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { NotificationItem } from '../models/notifications';
import { getNotifications, markAllAsRead } from '../services/sections/notifications';
import { useRouter } from 'expo-router';


// ---- Small presentational helpers ----
const IconBubble = ({ Cmp }: { Cmp?: React.ComponentType<any> }) => (
  <View className="w-12 h-12 rounded bg-surface items-center justify-center">
    {Cmp ? <Cmp size={20} color="#000000" strokeWidth={1.5} /> : <Bell size={20} color="#000000" strokeWidth={1.5} />}
  </View>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"all" | "orders" | "messages" | "promos">("all");

  useEffect(() => {
    const getpresentNotifs = async () => {
      try {
        const notifs = await getNotifications(20);
        setItems(notifs.items);
      } catch {
        setItems([]);
      }
    };
    getpresentNotifs()
  }, []);

  // ... filtered logic
  const filtered = useMemo(() => {
    if (tab === "all") return items;
    if (tab === "orders")
      return items?.filter((n) => n.type === "icon");
    if (tab === "messages")
      return items?.filter((n) => n.type === "avatar" || n.type === "icon");
    return items?.filter((n) => n.type === "icon"); // promos
  }, [items, tab]);

  const today = filtered?.slice(0, 3);
  const yesterday = filtered?.slice(3);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const notifs = await getNotifications(20);
      setItems(notifs.items);
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  const markAllRead = () => {
    setItems((prev) => prev?.map((n) => ({ ...n, is_read: true })));
  };

  const TabPill = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active?: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`px-4 py-2 rounded ${
        active ? "bg-primary" : "bg-surface"
      }`}
    >
      <Text className={`text-xs font-geist font-bold ${active ? "text-white" : "text-tertiary"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const Row = ({ n }: { n: NotificationItem }) => (
    <View className="flex-row items-center gap-4 px-5 py-5">
     <IconBubble />

      <View className="flex-1">
        <Text className="text-black font-geist font-bold text-sm">{n.title}</Text>
        <Text
          className={`text-sm font-inter mt-1 leading-5 ${n.is_read ? "text-tertiary" : "text-black font-medium"}`}
          numberOfLines={2}
        >
          {n.message}
        </Text>
        <Text className="text-tertiary font-inter text-[10px] mt-1.5">{n.created_at}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 rounded bg-surface border border-border items-center justify-center"
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#000000" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-geist font-bold text-black tracking-widest uppercase pr-10">
          Alerts
        </Text>
      </View>

      {/* Tabs + mark-all */}
      <View className="px-6 mb-8">
        <View className="flex-row items-center justify-between gap-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            <View className="flex-row gap-3">
              <TabPill label="ALL" active={tab === "all"} onPress={() => setTab("all")} />
              <TabPill label="ORDERS" active={tab === "orders"} onPress={() => setTab("orders")} />
              <TabPill label="MESSAGES" active={tab === "messages"} onPress={() => setTab("messages")} />
            </View>
          </ScrollView>
          <TouchableOpacity
            onPress={markAllRead}
            className="h-10 px-4 rounded bg-primary items-center justify-center"
            activeOpacity={0.85}
          >
             <Text className="text-[10px] font-geist font-bold text-white tracking-widest uppercase">Clear all</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lists */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />}
      >
        <View className="px-6">
          <View className="rounded bg-white border border-border overflow-hidden">
            <Text className="px-6 pt-6 pb-2 text-[10px] font-geist font-bold uppercase tracking-[0.2em] text-tertiary">Recents</Text>
            {today?.length ? (
              today.map((n, i) => (
                <View key={n.id} className={`${i !== today.length - 1 ? "border-b border-border" : ""}`}>
                  <Row n={n} />
                </View>
              ))
            ) : (
              <View className="px-6 pb-10 pt-4">
                <Text className="text-surface-dim font-geist font-bold text-xs tracking-widest uppercase italic">No Activity</Text>
              </View>
            )}
          </View>

          {yesterday?.length ? (
            <View className="rounded bg-white border border-border overflow-hidden mt-8">
              <Text className="px-6 pt-6 pb-2 text-[10px] font-geist font-bold uppercase tracking-[0.2em] text-tertiary">Previous</Text>
              {yesterday.map((n, i) => (
                <View key={n.id} className={`${i !== yesterday.length - 1 ? "border-b border-border" : ""}`}>
                  <Row n={n} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
