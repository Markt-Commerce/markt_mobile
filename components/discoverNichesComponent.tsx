import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ImageBackground, ActivityIndicator } from "react-native";
import { getNiches, joinNiche, leaveNiche } from "../services/sections/niches";
import { Niches } from "../models/niches";
import { useRouter } from "expo-router";
import { useToast } from "./ToastProvider";

export default function DiscoverNiches() {
  const [niches, setNiches] = useState<Niches[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinedNiches, setJoinedNiches] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { show } = useToast();

  useEffect(() => {
    loadNiches();
  }, []);

  const loadNiches = async () => {
    setLoading(true);
    try {
      const res = await getNiches(1, 10);
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
    return <ActivityIndicator size="large" color="#e26136" style={{ marginVertical: 20 }} />;
  }

  return (
    <View className="my-4 border-y border-[#f4f2f1] bg-[#faf9f9] py-6">
      <Text className="px-4 pb-4 text-[20px] font-bold tracking-[-0.015em] text-[#171312]">
        Discover Niches
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 24, paddingHorizontal: 16 }}
      >
        {niches.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Text className="text-[#876d64] text-sm">No niches available</Text>
          </View>
        ) : (
          niches.map((niche) => {
            const isJoined = joinedNiches.has(niche.id);
            return (
              <View
                key={niche.id}
                className="min-w-[100px] items-center gap-3"
              >
                <Pressable onPress={() => router.push(`/niches/${niche.id}`)} className="h-20 w-20 overflow-hidden rounded-full border border-[#f4f2f1] bg-white shadow-sm">
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

                <Text className="text-sm font-bold text-[#171312]" numberOfLines={1}>
                  {niche.name}
                </Text>

                <Pressable
                  onPress={() => (isJoined ? handleLeave(niche) : handleJoin(niche))}
                  className={`w-full rounded-full px-4 py-1.5 ${
                    isJoined
                      ? "bg-[#171312]"
                      : "bg-[#f4f2f1]"
                  }`}
                >
                  <Text
                    className={`text-center text-[12px] font-bold ${
                      isJoined
                        ? "text-white"
                        : "text-[#171312]"
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
