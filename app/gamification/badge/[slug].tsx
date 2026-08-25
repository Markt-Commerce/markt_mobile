import React, { useMemo } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Award, Lock, CheckCircle2 } from "lucide-react-native";

import { useTheme } from "../../../components/themeProvider";
import { useUser } from "../../../hooks/userContextProvider";
import { useBadges } from "../../../hooks/useBadges";

export default function BadgeDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { resolvedTheme } = useTheme();
  const { user } = useUser();
  const isDark = resolvedTheme === "dark";

  const { badges, loading } = useBadges(user?.user_id);
  const badge = useMemo(
    () => badges.find((b) => b.slug === slug),
    [badges, slug]
  );

  const awardedDate = badge?.awarded_at
    ? new Date(badge.awarded_at).toLocaleDateString()
    : null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }}
      edges={["top", "bottom"]}
    >
      <View
        className={`flex-row items-center px-4 py-3 border-b ${
          isDark ? "border-[#46464e]" : "border-border"
        }`}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text
          className={`text-lg font-bold ml-2 ${
            isDark ? "text-[#f0f1f2]" : "text-black"
          }`}
        >
          Badge
        </Text>
      </View>

      {loading && !badge ? (
        <View className="items-center py-16">
          <ActivityIndicator color={isDark ? "#f0f1f2" : "#000000"} />
        </View>
      ) : !badge ? (
        <Text
          className={`text-center text-sm py-16 ${
            isDark ? "text-[#c6c5cf]" : "text-tertiary"
          }`}
        >
          Badge not found.
        </Text>
      ) : (
        <View className="items-center px-8 pt-10">
          <View
            className={`w-28 h-28 rounded-full items-center justify-center ${
              isDark ? "bg-[#2f3132]" : "bg-surface"
            }`}
            style={{ opacity: badge.earned ? 1 : 0.55 }}
          >
            {badge.icon_url ? (
              <Image
                source={{ uri: badge.icon_url }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : badge.earned ? (
              <Award size={52} color={isDark ? "#f0f1f2" : "#000000"} />
            ) : (
              <Lock size={44} color={isDark ? "#c6c5cf" : "#A1A1AA"} />
            )}
          </View>

          <Text
            className={`font-bold text-2xl mt-6 text-center ${
              isDark ? "text-[#f0f1f2]" : "text-black"
            }`}
          >
            {badge.name}
          </Text>

          {badge.earned ? (
            <View className="flex-row items-center mt-2">
              <CheckCircle2 size={16} color="#16a34a" />
              <Text className="text-success font-bold text-sm ml-1">
                Earned{awardedDate ? ` · ${awardedDate}` : ""}
              </Text>
            </View>
          ) : (
            <Text
              className={`font-bold text-sm mt-2 ${
                isDark ? "text-[#c6c5cf]" : "text-tertiary"
              }`}
            >
              Locked
            </Text>
          )}

          {!!badge.description && (
            <Text
              className={`text-base text-center mt-4 leading-6 ${
                isDark ? "text-[#c6c5cf]" : "text-tertiary"
              }`}
            >
              {badge.description}
            </Text>
          )}

          {!badge.earned && badge.progress > 0 && (
            <View className="w-full mt-8">
              <Text
                className={`font-bold text-xs mb-2 ${
                  isDark ? "text-[#c6c5cf]" : "text-tertiary"
                }`}
              >
                {Math.round(badge.progress * 100)}% there
              </Text>
              <View
                className={`h-2 rounded overflow-hidden ${
                  isDark ? "bg-[#2f3132]" : "bg-surface"
                }`}
              >
                <View
                  className="h-2 rounded bg-primary"
                  style={{ width: `${Math.min(100, badge.progress * 100)}%` }}
                />
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
