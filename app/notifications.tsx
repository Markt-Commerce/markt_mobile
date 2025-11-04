import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { ArrowLeft, Truck, Package, User, Dot, PlusSquare, Search, Home, LucideIcon } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { NotificationItem } from '../models/notifications';
import { getNotifications, markAllAsRead } from '../services/sections/notifications';


// ---- Small presentational helpers ----
const IconBubble = ({ Cmp }: { Cmp?: React.ComponentType<any> }) => (
  <View className="size-12 rounded-lg bg-[#f4f2f1] items-center justify-center">
    {Cmp ? <Cmp size={20} color="#171311" /> : <Bell size={20} color="#171311" />}
  </View>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"all" | "orders" | "messages" | "promos">("all");

  // optional local filters (UI only for now)
  const filtered = useMemo(() => {
    if (tab === "all") return items;
    if (tab === "orders")
      return items.filter(
        (n) => (n.type === "icon" && (n.icon === Truck || n.icon === Package)) // shipping/delivered
      );
    if (tab === "messages")
      return items.filter(
        (n) =>
          (n.type === "avatar" && /message/i.test(n.name)) ||
          (n.type === "icon" && n.icon === MessageSquare)
      );
    return items.filter((n) => n.type === "icon" && n.icon === Tag); // promos
  }, [items, tab]);

  const today = filtered.slice(0, 3);
  const yesterday = filtered.slice(3);

  const onRefresh = async () => {
    setRefreshing(true);
    // const fresh = await getNotifications();
    // setItems(fresh);
    setTimeout(() => setRefreshing(false), 800);
  };

  const markAllRead = () => {
    // await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
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
      className={`px-3 py-1.5 rounded-full ${
        active ? "bg-[#171311]" : "bg-[#f5f2f1]"
      }`}
    >
      <Text className={active ? "text-white font-semibold" : "text-[#171311] font-medium"}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const Row = ({ n }: { n: NotificationItem }) => (
    <View className="flex-row items-center gap-4 px-4 py-3">
      {n.type === "avatar" ? (
        <Image source={{ uri: n.image }} className="h-12 w-12 rounded-full bg-[#f4f2f1]" />
      ) : (
        <IconBubble Cmp={n.icon} />
      )}

      <View className="flex-1">
        <Text
          className={`text-base ${n.read ? "text-[#7b6660]" : "text-[#171311] font-medium"}`}
          numberOfLines={2}
        >
          {n.name}
        </Text>
        <Text className="text-[#826f68] text-xs mt-0.5">{n.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#faf9f8]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 rounded-full items-center justify-center bg-white border border-[#efe9e7]"
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#171311" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-extrabold text-[#171311] -ml-10">
          Notifications
        </Text>
        <View className="w-10" />
      </View>

      {/* Tabs + mark-all */}
      <View className="px-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <TabPill label="All" active={tab === "all"} onPress={() => setTab("all")} />
            <TabPill label="Orders" active={tab === "orders"} onPress={() => setTab("orders")} />
            <TabPill label="Messages" active={tab === "messages"} onPress={() => setTab("messages")} />
            <TabPill label="Promos" active={tab === "promos"} onPress={() => setTab("promos")} />
          </View>
          <TouchableOpacity
            onPress={markAllRead}
            className="h-9 px-3 rounded-full bg-white border border-[#efe9e7] items-center justify-center"
            activeOpacity={0.85}
          >
            <View className="flex-row items-center">
              <Check size={16} color="#171311" />
              <Text className="ml-1 text-xs font-semibold text-[#171311]">Mark all read</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lists */}
      <ScrollView
        className="flex-1 mt-3"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e26136" />}
      >
        <View className="px-4">
          <View className="rounded-2xl bg-white border border-[#efe9e7] overflow-hidden">
            <Text className="px-4 pt-3 pb-1 text-sm font-semibold text-[#8e7a74]">Today</Text>
            {today.length ? (
              today.map((n, i) => (
                <View key={n.id} className={`${i !== today.length - 1 ? "border-b border-[#f3efed]" : ""}`}>
                  <Row n={n} />
                </View>
              ))
            ) : (
              <View className="px-4 pb-3">
                <Text className="text-[#8e7a74] text-sm">No new notifications today.</Text>
              </View>
            )}
          </View>

          {yesterday.length ? (
            <View className="rounded-2xl bg-white border border-[#efe9e7] overflow-hidden mt-3">
              <Text className="px-4 pt-3 pb-1 text-sm font-semibold text-[#8e7a74]">Yesterday</Text>
              {yesterday.map((n, i) => (
                <View key={n.id} className={`${i !== yesterday.length - 1 ? "border-b border-[#f3efed]" : ""}`}>
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
