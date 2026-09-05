/**
 * Public profile — another user's page.
 *
 * The destination the feed's post-author header never had: shopDetails takes a
 * numeric seller id, post authors can be buyers, and until now
 * GET /users/<id>/public was a stub. Sellers get a link through to their shop
 * from here rather than this screen duplicating shopDetails.
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Store, UserPlus, UserMinus } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import { useTheme } from "../../components/themeProvider";
import { useToast } from "../../components/ToastProvider";
import {
  getUserPublicProfile,
  followSeller,
  unfollowSeller,
  type PublicProfile,
} from "../../services/sections/users";
import { friendlyErrorMessage } from "../../utils/errorMessages";

function Stat({
  value,
  label,
  isDark,
}: {
  value: number;
  label: string;
  isDark: boolean;
}) {
  return (
    <View className="items-center flex-1">
      <Text className={`text-xl font-bold text-text-primary`}>
        {value.toLocaleString()}
      </Text>
      <Text
        className={`font-bold text-[10px] tracking-[1.5px] uppercase mt-1 text-text-secondary`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const load = useCallback(
    async (opts: { refresh?: boolean } = {}) => {
      if (!id) return;
      if (opts.refresh) setRefreshing(true);
      try {
        const data = await getUserPublicProfile(id);
        setProfile(data);
        setFollowing(data.is_followed);
      } catch (e) {
        if ((e as { status?: number })?.status !== 401) {
          show({
            variant: "error",
            title: "Could not load profile",
            message: friendlyErrorMessage(e, "Pull down to try again."),
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, show]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleFollowToggle = async () => {
    if (!profile || followBusy) return;
    setFollowBusy(true);
    const prev = following;
    setFollowing(!prev);
    try {
      if (prev) await unfollowSeller(profile.id);
      else await followSeller(profile.id);
    } catch (e) {
      setFollowing(prev);
      show({
        variant: "error",
        title: prev ? "Could not unfollow" : "Could not follow",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setFollowBusy(false);
    }
  };

  const label = isDark ? "text-text-primary" : "text-black";
  const muted = isDark ? "text-text-secondary" : "text-tertiary";
  const card = isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border";

  return (
    <SafeAreaView
      className={`flex-1 bg-surface-raised`}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Profile" onBack={() => router.back()} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E94C2A" />
        </View>
      ) : !profile ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className={`text-center text-[15px] ${muted}`}>
            This profile isn't available.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load({ refresh: true })}
              tintColor="#E94C2A"
            />
          }
        >
          <View className="px-6 pt-8 items-center">
            <Avatar
              uri={profile.profile_picture}
              name={profile.username}
              size={88}
            />
            <Text className={`text-2xl font-bold mt-4 ${label}`}>
              {profile.username}
            </Text>
            {profile.joined_at && (
              <Text className={`text-[13px] mt-1 ${muted}`}>
                Joined {new Date(profile.joined_at).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            )}

            {!profile.is_self && (
              <TouchableOpacity
                onPress={handleFollowToggle}
                disabled={followBusy}
                activeOpacity={0.85}
                className={`mt-6 h-12 px-10 rounded items-center justify-center flex-row gap-2 ${following ? `border border-border-strong` : "bg-primary"}`}
                accessibilityRole="button"
                accessibilityLabel={following ? "Unfollow" : "Follow"}
              >
                {following ? (
                  <UserMinus size={16} color={isDark ? "#f0f1f2" : "#000000"} />
                ) : (
                  <UserPlus size={16} color="#FFFFFF" />
                )}
                <Text
                  className={`font-bold text-xs tracking-[2px] uppercase ${following ? label : "text-white"}`}
                >
                  {following ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            className={`flex-row mx-6 mt-8 py-5 rounded border ${card}`}
          >
            <Stat value={profile.posts_count} label="Posts" isDark={isDark} />
            <Stat value={profile.followers_count} label="Followers" isDark={isDark} />
            <Stat value={profile.following_count} label="Following" isDark={isDark} />
          </View>

          {profile.shop && (
            <TouchableOpacity
              onPress={() => router.push(`/shopDetails/${profile.shop!.id}`)}
              activeOpacity={0.85}
              className={`mx-6 mt-6 p-5 rounded border ${card}`}
              accessibilityRole="button"
              accessibilityLabel={`View ${profile.shop.shop_name ?? "shop"}`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`w-11 h-11 rounded items-center justify-center bg-surface-sunken`}
                >
                  <Store size={20} color="#E94C2A" strokeWidth={1.8} />
                </View>
                <View className="flex-1">
                  <Text className={`font-bold text-[15px] ${label}`} numberOfLines={1}>
                    {profile.shop.shop_name ?? "Shop"}
                  </Text>
                  <Text className={`text-[13px] mt-0.5 ${muted}`}>
                    {profile.shop.products_count} product
                    {profile.shop.products_count === 1 ? "" : "s"}
                    {profile.shop.average_rating != null &&
                      ` · ★ ${profile.shop.average_rating.toFixed(1)}`}
                  </Text>
                </View>
              </View>
              {profile.shop.description ? (
                <Text className={`text-[13px] mt-3 leading-5 ${muted}`} numberOfLines={3}>
                  {profile.shop.description}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
