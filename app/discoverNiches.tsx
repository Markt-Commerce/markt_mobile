/**
 * Communities.
 *
 * Modelled on X's Communities: a Home tab for the ones you're in and an Explore
 * tab for the ones you aren't, a rail of your communities across the top, and
 * rows carried by the community's own avatar rather than a coloured initial.
 *
 * Two things had to exist on the server first (markt_python
 * feat/niche-media-and-filters): niches had no imagery at all, and the list was
 * hardcoded to member_count desc with no way to ask "am I in this one" — so a
 * card couldn't show Join vs Joined without a request each.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, Users, Plus, ArrowUpDown } from "lucide-react-native";
import { useTheme } from "../components/themeProvider";
import { useToast } from "../components/ToastProvider";
import { getNiches, joinNiche, leaveNiche } from "../services/sections/niches";
import type { Niches, NichesListParams } from "../models/niches";
import { friendlyErrorMessage } from "../utils/errorMessages";

type Tab = "home" | "explore";
type Sort = NonNullable<NichesListParams["sort"]>;

const SORTS: { key: Sort; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "newest", label: "Newest" },
  { key: "members", label: "Members" },
  { key: "name", label: "A–Z" },
];

function compactCount(n?: number) {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

/** The community's face, or its initials on a tinted tile if it has none. */
function CommunityAvatar({
  niche,
  size,
  isDark,
}: {
  niche: Niches;
  size: number;
  isDark: boolean;
}) {
  const radius = Math.round(size * 0.28);
  if (niche.image_url) {
    return (
      <Image
        source={{ uri: niche.image_url }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  const initials = (niche.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <View
      style={{ width: size, height: size, borderRadius: radius }}
      className={`items-center justify-center bg-surface-sunken`}
    >
      <Text
        style={{ fontSize: size * 0.36 }}
        className={`font-bold text-text-secondary`}
      >
        {initials}
      </Text>
    </View>
  );
}

export default function CommunitiesScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

  const [tab, setTab] = useState<Tab>("home");
  const [sort, setSort] = useState<Sort>("trending");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Niches[]>([]);
  const [mine, setMine] = useState<Niches[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Per-community, so one slow join doesn't freeze every button on screen.
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const [list, joined] = await Promise.all([
        getNiches({
          membership: tab === "home" ? "joined" : "not_joined",
          sort,
          search: query.trim() || undefined,
          per_page: 30,
        }),
        // The rail always shows what you're in, whichever tab you're on.
        getNiches({ membership: "joined", per_page: 20 }),
      ]);
      setItems(list.items ?? []);
      setMine(joined.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, sort, query]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, query ? 250 : 0); // debounce typing only
    return () => clearTimeout(t);
  }, [load, query]);

  const toggleMembership = async (niche: Niches) => {
    const joining = !niche.is_member;
    setBusy((b) => ({ ...b, [niche.id]: true }));
    // Optimistic: the button is the whole interaction, so it has to move now.
    setItems((list) =>
      list.map((n) => (n.id === niche.id ? { ...n, is_member: joining } : n))
    );
    try {
      if (joining) await joinNiche(niche.id);
      else await leaveNiche(niche.id);
      await load();
    } catch (e) {
      setItems((list) =>
        list.map((n) => (n.id === niche.id ? { ...n, is_member: !joining } : n))
      );
      show({
        variant: "error",
        title: joining ? "Couldn't join" : "Couldn't leave",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setBusy((b) => ({ ...b, [niche.id]: false }));
    }
  };

  const strong = isDark ? "text-text-primary" : "text-black";
  const muted = isDark ? "text-text-muted" : "text-tertiary";
  const hairline = isDark ? "border-border" : "border-border-light";

  const header = useMemo(
    () => (
      <View>
        {/* Your communities, as a rail — the shortcut back into a place you
            already belong to, which is what X puts at the top. */}
        {mine.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}
          >
            {mine.map((n) => (
              <TouchableOpacity
                key={n.id}
                onPress={() => router.push(`/niches/${n.id}` as any)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open ${n.name}`}
                style={{ width: 108 }}
                className={`rounded-2xl border p-3 items-center ${hairline} ${
                  isDark ? "bg-surface-raised" : "bg-white"
                }`}
              >
                <CommunityAvatar niche={n} size={52} isDark={isDark} />
                <Text
                  className={`text-[12px] font-semibold mt-2 text-center ${strong}`}
                  numberOfLines={1}
                >
                  {n.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        <View className="px-4 pb-3">
          <View
            className={`flex-row items-center h-11 px-3 rounded-xl ${
              isDark ? "bg-surface-sunken" : "bg-[#F4F4F5]"
            }`}
          >
            <Search size={17} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search communities"
              placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"}
              className={`flex-1 ml-2 text-[15px] ${strong}`}
              returnKeyType="search"
              accessibilityLabel="Search communities"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 12 }}
          >
            <View className="flex-row items-center pr-1">
              <ArrowUpDown size={13} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
            </View>
            {SORTS.map((s) => {
              const active = sort === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setSort(s.key)}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  className={`px-3.5 h-8 rounded-full items-center justify-center ${
                    active
                      ? isDark
                        ? "bg-[#f0f1f2]"
                        : "bg-black"
                      : isDark
                        ? "bg-surface-sunken"
                        : "bg-[#F4F4F5]"
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      active
                        ? isDark
                          ? "text-black"
                          : "text-white"
                        : isDark
                          ? "text-text-secondary"
                          : "text-[#52525B]"
                    }`}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    ),
    [mine, query, sort, isDark, strong, hairline, router]
  );

  const renderRow = ({ item }: { item: Niches }) => {
    const working = !!busy[item.id];
    const joined = !!item.is_member;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/niches/${item.id}` as any)}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${compactCount(item.member_count)} members`}
        className={`flex-row items-center px-4 py-3.5 border-b ${hairline}`}
      >
        <CommunityAvatar niche={item} size={48} isDark={isDark} />
        <View className="flex-1 ml-3 pr-3">
          <Text className={`text-[15px] font-bold ${strong}`} numberOfLines={1}>
            {item.name}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Users size={12} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
            <Text className={`text-[12px] ml-1 ${muted}`}>
              {compactCount(item.member_count)} members
            </Text>
          </View>
          {item.description ? (
            <Text className={`text-[13px] leading-[18px] mt-1 ${muted}`} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => toggleMembership(item)}
          disabled={working}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={joined ? `Leave ${item.name}` : `Join ${item.name}`}
          accessibilityState={{ busy: working }}
          className={`px-4 h-9 rounded-full items-center justify-center ${
            working ? "opacity-60" : ""
          } ${
            joined
              ? isDark
                ? "bg-surface-sunken"
                : "bg-[#F4F4F5]"
              : isDark
                ? "bg-[#f0f1f2]"
                : "bg-black"
          }`}
        >
          <Text
            className={`text-[13px] font-bold ${
              joined
                ? isDark
                  ? "text-text-secondary"
                  : "text-[#52525B]"
                : isDark
                  ? "text-black"
                  : "text-white"
            }`}
          >
            {joined ? "Joined" : "Join"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-surface-page"
      edges={["top", "left", "right"]}
    >
      <View className="flex-row items-center px-4 h-12">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text className={`flex-1 text-center text-[17px] font-bold ${strong}`}>
          Communities
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/niches/create" as any)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Create a community"
        >
          <Plus size={22} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <View className={`flex-row border-b ${hairline}`}>
        {(["home", "explore"] as const).map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className="flex-1 items-center py-3"
            >
              <Text
                className={`text-[15px] ${active ? `font-bold ${strong}` : `font-medium ${muted}`}`}
              >
                {t === "home" ? "Home" : "Explore"}
              </Text>
              <View
                className={`h-[3px] w-14 rounded-full mt-2 ${active ? "bg-primary" : "bg-transparent"}`}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={renderRow}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={isDark ? "#f0f1f2" : "#000000"}
          />
        }
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color={isDark ? "#f0f1f2" : "#000000"} />
            </View>
          ) : (
            <View className="px-8 py-16 items-center">
              <Text className={`text-[16px] font-semibold text-center ${strong}`}>
                {query.trim()
                  ? "Nothing matches that"
                  : tab === "home"
                    ? "You haven't joined any communities"
                    : "No communities to show"}
              </Text>
              <Text className={`text-[14px] mt-1.5 text-center leading-[20px] ${muted}`}>
                {query.trim()
                  ? "Try a different word."
                  : tab === "home"
                    ? "Find one in Explore and join it — you'll see its posts in your feed."
                    : "Check back soon, or start one yourself."}
              </Text>
              {!query.trim() && tab === "home" ? (
                <TouchableOpacity
                  onPress={() => setTab("explore")}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  className="mt-5 px-5 h-11 rounded-xl bg-primary items-center justify-center"
                >
                  <Text className="text-white font-semibold text-[15px]">Explore</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
