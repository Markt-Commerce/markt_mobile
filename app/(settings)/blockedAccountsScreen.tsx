/**
 * Blocked accounts — see who you've blocked and undo it.
 *
 * Blocking is one tap from a feed card, so unblocking has to be findable or
 * that tap is a dead end. Only shows people *you* blocked; who blocked you is
 * deliberately not exposed by the API.
 */

import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ShieldOff, RotateCw } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import { useTheme } from "../../components/themeProvider";
import { useToast } from "../../components/ToastProvider";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import { listBlockedUsers, unblockUser, type BlockedUser } from "../../services/sections/moderation";

export default function BlockedAccountsScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ink = isDark ? "text-text-primary" : "text-black";
  const muted = isDark ? "text-text-secondary" : "text-tertiary";
  const rule = isDark ? "border-border-strong" : "border-border";

  const load = useCallback(async (opts: { refresh?: boolean } = {}) => {
    if (opts.refresh) setRefreshing(true);
    setError(null);
    try {
      setUsers(await listBlockedUsers());
    } catch (e) {
      if ((e as { status?: number })?.status !== 401) {
        setError(friendlyErrorMessage(e, "We couldn't load your blocked accounts."));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleUnblock = async (user: BlockedUser) => {
    if (busyId) return;
    setBusyId(user.user_id);
    const snapshot = users;
    setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
    try {
      await unblockUser(user.user_id);
      show({
        variant: "success",
        title: `Unblocked ${user.username}`,
        message: "Their posts and products can show up again.",
      });
    } catch (e) {
      setUsers(snapshot);
      show({
        variant: "error",
        title: "Couldn't unblock them",
        message: friendlyErrorMessage(e, "Try again in a moment."),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 bg-surface-raised`}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Blocked accounts" onBack={() => router.back()} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E94C2A" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className={`text-[15px] text-center leading-6 ${ink}`}>{error}</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              load();
            }}
            className="mt-6 h-12 px-8 rounded bg-primary items-center justify-center flex-row gap-2"
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <RotateCw size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.user_id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load({ refresh: true })}
              tintColor="#E94C2A"
            />
          }
          renderItem={({ item }) => (
            <View className={`flex-row items-center gap-4 px-6 py-4 border-b ${rule}`}>
              <Avatar uri={item.profile_picture} name={item.username} size={44} />
              <Text className={`flex-1 text-[15px] font-semibold ${ink}`} numberOfLines={1}>
                {item.username}
              </Text>
              <Pressable
                onPress={() => handleUnblock(item)}
                disabled={busyId === item.user_id}
                className={`min-h-[44px] px-5 justify-center rounded-full border ${rule}`}
                accessibilityRole="button"
                accessibilityLabel={`Unblock ${item.username}`}
                accessibilityState={{ disabled: busyId === item.user_id }}
              >
                {busyId === item.user_id ? (
                  <ActivityIndicator size="small" color="#E94C2A" />
                ) : (
                  <Text className={`font-bold text-[11px] tracking-[1.5px] uppercase ${ink}`}>
                    Unblock
                  </Text>
                )}
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center px-10 pt-24">
              <View
                className={`w-20 h-20 rounded-full items-center justify-center mb-6 bg-surface-sunken`}
              >
                <ShieldOff size={30} color={isDark ? "#c6c5cf" : "#A1A1AA"} strokeWidth={1.6} />
              </View>
              <Text className={`text-xl font-bold text-center ${ink}`}>
                You haven't blocked anyone
              </Text>
              <Text className={`text-[15px] mt-2 text-center leading-6 ${muted}`}>
                If someone's bothering you, tap the “…” on their post and choose
                Block. They'll show up here if you change your mind.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
