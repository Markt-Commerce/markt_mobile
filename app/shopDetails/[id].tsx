import React, { useMemo, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, StatusBar } from "react-native";
import { Image } from "expo-image";
import { ArrowLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

type Item = { id: string | number; title: string; image: string };

export default function NicheDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; image?: string }>();

  const nicheName = params.name || "Niche";
  const nicheImage =
    params.image ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=60";

  const [tab, setTab] = useState<"overview" | "items" | "creators">("overview");

  const items: Item[] = useMemo(
    () => [
      { id: 1, title: `${nicheName} Pick #1`, image: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=1000&q=60" },
      { id: 2, title: `${nicheName} Pick #2`, image: "https://images.unsplash.com/photo-1483982258113-b72862e6cff6?auto=format&fit=crop&w=1000&q=60" },
      { id: 3, title: `${nicheName} Pick #3`, image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=60" },
      { id: 4, title: `${nicheName} Pick #4`, image: "https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?auto=format&fit=crop&w=1000&q=60" },
      { id: 5, title: `${nicheName} Pick #5`, image: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1000&q=60" },
      { id: 6, title: `${nicheName} Pick #6`, image: "https://images.unsplash.com/photo-1520975693412-35ec29f3c7b3?auto=format&fit=crop&w=1000&q=60" },
    ],
    [nicheName]
  );

  const keyExtractor = useCallback((it: Item) => String(it.id), []);

  const GridItem = useCallback(
    ({ item }: { item: Item }) => (
      <View style={{ width: "50%", padding: 8 }}>
        <Pressable className="rounded-2xl overflow-hidden bg-neutral-100" android_ripple={{ color: "#00000022" }}>
          <View className="relative" style={{ width: "100%", aspectRatio: 1 }}>
            <Image
              source={{ uri: item.image }}
              className="absolute"
              style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          </View>
          <View className="px-3 py-2">
            <Text className="text-[#171312] font-semibold" numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        </Pressable>
      </View>
    ),
    []
  );

  const Header = (
    <View>
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center justify-between p-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={10} className="pr-2">
          <ArrowLeft color="#171312" size={24} />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-[#171312] pr-6">{nicheName}</Text>
      </View>

      {/* Hero */}
      <View className="mx-4 rounded-2xl overflow-hidden bg-neutral-100">
        <View className="relative" style={{ width: "100%", aspectRatio: 16 / 9 }}>
          <Image
            source={{ uri: nicheImage }}
            className="absolute"
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row items-center justify-around mt-4 mx-4">
        <Pressable onPress={() => setTab("overview")} className="px-3 py-2 rounded-full" android_ripple={{ color: "#00000011" }}>
          <Text className={tab === "overview" ? "font-semibold text-[#171312]" : "text-neutral-500"}>Overview</Text>
        </Pressable>
        <Pressable onPress={() => setTab("items")} className="px-3 py-2 rounded-full" android_ripple={{ color: "#00000011" }}>
          <Text className={tab === "items" ? "font-semibold text-[#171312]" : "text-neutral-500"}>Items</Text>
        </Pressable>
        <Pressable onPress={() => setTab("creators")} className="px-3 py-2 rounded-full" android_ripple={{ color: "#00000011" }}>
          <Text className={tab === "creators" ? "font-semibold text-[#171312]" : "text-neutral-500"}>Creators</Text>
        </Pressable>
      </View>

      {/* Overview content */}
      {tab === "overview" && (
        <View className="mx-4 mt-4">
          <Text className="text-base text-neutral-700">
            Explore curated content for <Text className="font-semibold">{nicheName}</Text>. Browse trending items,
            discover creators, and follow updates.
          </Text>
          <View className="flex-row gap-2 mt-3">
            <Pressable className="px-4 py-3 rounded-xl bg-black" android_ripple={{ color: "#ffffff22" }}>
              <Text className="text-white font-semibold">Follow {nicheName}</Text>
            </Pressable>
            <Pressable className="px-4 py-3 rounded-xl bg-neutral-200" android_ripple={{ color: "#00000011" }} onPress={() => setTab("items")}>
              <Text className="text-[#171312] font-semibold">Explore Items</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Items header */}
      {tab !== "overview" && (
        <View className="mx-4 mt-4 flex-row items-center justify-between">
          <Text className="text-base text-neutral-600">Top picks</Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {tab === "overview" ? (
        <FlatList
          data={[]}
          ListHeaderComponent={Header}
          keyExtractor={() => "0"}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={() => null}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={GridItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
          ListHeaderComponent={Header}
        />
      )}
    </View>
  );
}
