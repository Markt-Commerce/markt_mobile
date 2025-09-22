import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StatusBar, Image as RNImage } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { ArrowLeft, Search } from "lucide-react-native";
import { useRouter } from "expo-router";

type Niche = { id: string | number; name: string; image: string };

// Known-good HTTPS images
const FEATURED: Niche[] = [
  { id: 1, name: "Fashion", image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=60" },
  { id: 2, name: "Tech",    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=60" },
  { id: 3, name: "Beauty",  image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1000&q=60" },
];

const ALL_NICHES: Niche[] = [
  ...FEATURED,
  { id: 4, name: "Home & Decor", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=60" },
  { id: 5, name: "Sports",       image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1000&q=60}"},
  { id: 6, name: "Food",         image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=60" },
];

function SmartImage({
  uri,
  cover = true,
  className,
  style,
}: {
  uri: string;
  cover?: boolean;
  className?: string;
  style?: any;
}) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    // RN Image fallback
    return (
      <RNImage
        source={{ uri }}
        resizeMode={cover ? "cover" : "contain"}
        style={style}
        onError={() => {}}
      />
    );
  }

  return (
    <ExpoImage
      source={{ uri }}
      contentFit={cover ? "cover" : "contain"}
      cachePolicy="memory-disk"
      transition={200}
      className={className}
      style={style}
      onError={() => setUseFallback(true)}
    />
  );
}

export default function NichesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NICHES;
    return ALL_NICHES.filter((n) => n.name.toLowerCase().includes(q));
  }, [query]);

  const keyExtractor = useCallback((item: Niche) => String(item.id), []);

  const FeaturedItem = useCallback(({ item }: { item: Niche }) => (
    <Pressable className="w-32 mr-3" android_ripple={{ color: "#00000022" }}>
      <View
        className="rounded-xl overflow-hidden bg-neutral-100 relative"
        style={{ width: "100%", aspectRatio: 1 }}
      >
        <SmartImage
          uri={item.image}
          className="absolute"
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" }}
        />
      </View>
      <Text className="mt-2 text-base font-medium text-[#171312]" numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  ), []);

  const GridItem = useCallback(({ item }: { item: Niche }) => (
    <View style={{ width: "50%", padding: 8 }}>
      <Pressable className="rounded-2xl overflow-hidden bg-neutral-100" android_ripple={{ color: "#00000022" }}>
        <View className="relative" style={{ width: "100%", aspectRatio: 1 }}>
          <SmartImage
            uri={item.image}
            className="absolute"
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" }}
          />
        </View>
        <View className="px-3 py-2">
          <Text className="text-[#171312] font-semibold" numberOfLines={1}>{item.name}</Text>
        </View>
      </Pressable>
    </View>
  ), []);

  const Header = (
    <View>
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center justify-between p-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={10} className="pr-2">
          <ArrowLeft color="#171312" size={24} />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-[#171312] pr-6">Niches</Text>
      </View>

      <View className="flex-row items-center bg-[#f4f2f1] rounded-xl mx-4 px-3 h-12">
        <Search color="#826f68" size={22} />
        <TextInput
          className="flex-1 text-base ml-2 text-[#171312]"
          placeholder="Search niches"
          placeholderTextColor="#826f68"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <Text className="text-[22px] font-bold text-[#171312] mt-5 mb-2 mx-4">Featured</Text>
      <FlatList
        data={FEATURED}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={FeaturedItem}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
      />

      <View className="mt-4 mb-1 mx-4 flex-row items-center justify-between">
        <Text className="text-base text-neutral-600">{filtered.length} results</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={GridItem}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
        ListHeaderComponent={Header}
      />
    </View>
  );
}
