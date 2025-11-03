import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Truck,
  Package,
  Bell,
  MessageSquare,
  Tag,
  Check,
} from "lucide-react-native";
import { useRouter } from "expo-router";

// ---- Your data (kept, just typed a bit) ----
type NotificationItem =
  | {
      id: number | string;
      type: "avatar";
      name: string;
      time: string;
      image: string; // avatar url
      read?: boolean;
    }
  | {
      id: number | string;
      type: "icon";
      name: string;
      time: string;
      icon?: React.ComponentType<any>; // lucide icon component
      read?: boolean;
    };

const notifications: NotificationItem[] = [
  {
    id: 1,
    type: "avatar",
    name: "Liam Carter liked your post",
    time: "2d",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDN4yy6jkI988RPXDv_c1XIvFc9hBXXhE6NHVuLOnNvvSd5lnHQ8yx1e1xT9eB86_TDBMZvXIVi1KvZ-JmNX-FHfdm6ttmcxPvk8NC6L2YY_oxUmdnBZmiQaYNU1Ea5U17D5shJYHms-mj-FGXNpIwzKR4_Gle7smAP1UBwDIDlvl1VKNRHinW4PDVm0KJrcdt02QNM9CQGHK3IWR2f0Use9paZl6SCRQxZRBJEnsuysWKJCWCRcSXkLWw1LrlLalxzSemGcWq5ug",
  },
  {
    id: 2,
    type: "avatar",
    name: "You have a new follower",
    time: "1d",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDVqT_khGhGbUlxaXHdg1NSA065X_k4IeqWZavkUlXSc335Rxz5D2cgWkRcYh9M1EDdmU1tap8Qkd7bRBcKwevhDT0dEr7nnhNLt-FphLRtXyrFDRTUHItWl550VBVR3NcnNk9WFsBCecVjcaJXSZMw2cfu7t4oMJZwysWfe6EqOBBYjaOBeiGHQb1E3_EfzlMraGxWjvLO7dyau2yOejsI00iHPsJgnPPEMjq5IqRpL-Grqj_tMJP-r3FQze7ltKga0iis-kQS0w",
  },
  {
    id: 3,
    type: "icon",
    name: "Your order has been shipped",
    time: "1d",
    icon: Truck,
  },
  {
    id: 4,
    type: "avatar",
    name: "Sophia Bennett sent you a message",
    time: "2d",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuANN47Phzq5Tpj6yntoJRKamA75JS6Ur7G_hM6UiEf-MrYxRsxwGMjevG3YJFFI8Ybdt_wxJqdxUAj1XdSjJFau_fGxSHlCRYa-fzmJbOonWKvUDV-m0ojCsnRwVPT6TtsBTXHFPHWGGjaHZw_jbMGzvJEfsTGNaZcSFxhu_mx8Dvg6EQW13VF27zC1qz_m1x0InN9TbfenVyZxWIy7dLXYADEDXMMydxQKpZXJFCDKS-7q9pQ_0BSmQzFF6CXpK6cq1j6D0v_nIw",
  },
  {
    id: 5,
    type: "icon",
    name: "Your order has been delivered",
    time: "2d",
    icon: Package,
  },
];

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
