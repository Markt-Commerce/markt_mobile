import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ImageBackground, ActivityIndicator } from "react-native";
import { getNiches, joinNiche, leaveNiche } from "../services/sections/niches";
import { Niches } from "../models/niches";
import { useRouter } from "expo-router";
import { useToast } from "./ToastProvider";
import { useTheme } from "./themeProvider";

export default function DiscoverNiches() {
  const [niches, setNiches] = useState<Niches[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinedNiches, setJoinedNiches] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    loadNiches();
  }, []);

  const loadNiches = async () => {
    setLoading(true);
    try {
      const res = await getNiches({ page: 1, per_page: 10 });
      setNiches(res.items || []);
    } catch (err) {
      console.error("Failed to load niches:", err);
      show({ variant: "error", title: "Error", message: "Could not load niches." });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (niche: Niches) => {
    try {
      await joinNiche(niche.id);
      setJoinedNiches(prev => new Set([...prev, niche.id]));
      show({ variant: "success", title: "Joined", message: `Joined ${niche.name}` });
    } catch (err) {
      show({ variant: "error", title: "Error", message: "Could not join niche." });
    }
  };

  const handleLeave = async (niche: Niches) => {
    try {
      await leaveNiche(niche.id);
      setJoinedNiches(prev => {
        const newSet = new Set(prev);
        newSet.delete(niche.id);
        return newSet;
      });
      show({ variant: "success", title: "Left", message: `Left ${niche.name}` });
    } catch (err) {
      show({ variant: "error", title: "Error", message: "Could not leave niche." });
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} style={{ marginVertical: 20 }} />;
  }

  return (
    <View className={`my-4 border-y py-6 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}>
      <Text className={`px-4 pb-4 text-[20px] font-geist font-bold tracking-[-0.015em] ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
        Discover Niches
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 24, paddingHorizontal: 16 }}
      >
        {niches.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Text className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No niches available</Text>
          </View>
        ) : (
          niches.map((niche) => {
            const isJoined = joinedNiches.has(niche.id);
            return (
              <View
                key={niche.id}
                className="min-w-[100px] items-center gap-3"
              >
                <Pressable onPress={() => router.push(`/niches/${niche.id}`)} className={`h-20 w-20 overflow-hidden rounded border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
                  <ImageBackground
                    source={{ uri: "https://via.placeholder.com/80x80" }}
                    resizeMode="cover"
                    className="h-full w-full items-center justify-center"
                  >
                    <Text className="text-[10px] text-white font-bold text-center px-1">
                      {niche.name.slice(0, 10)}
                    </Text>
                  </ImageBackground>
                </Pressable>

                <Text className={`text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
                  {niche.name}
                </Text>

                <Pressable
                  onPress={() => (isJoined ? handleLeave(niche) : handleJoin(niche))}
                  className={`w-full rounded px-4 py-1.5 border ${
                    isJoined
                      ? "bg-primary border-primary"
                      : isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`text-center text-[12px] font-bold ${
                      isJoined
                        ? "text-white"
                        : isDark ? "text-[#f0f1f2]" : "text-black"
                    }`}
                  >
                    {isJoined ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
