import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { Link } from "expo-router";
import {
  Bell,
  Store,
  ShieldCheck,
  Mail,
  IdCard,
  Upload,
  UserCheck,
  ArrowRight,
  X,
} from "lucide-react-native";
import { getSellerStartCards } from "../services/sections/analytics";
import { useToast } from "./ToastProvider";

type StartCardUI = {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  status?: "pending" | "done";
  actionHref?: string;       // route like "/verifyEmail"
  icon?: string;             // "bell" | "store" | "shield" | ...
};

type Normalized = {
  totalSteps: number;
  completedSteps: number;
  cards: StartCardUI[];
};

type Props = {
  // override the fetcher for tests or other roles if needed
  fetcher?: () => Promise<any>;
  // If you want to ALWAYS render the header + progress even with no cards (default false)
  showWhenEmpty?: boolean;
  // Title override
  title?: string;
};

const iconMap: Record<string, React.ComponentType<any>> = {
  bell: Bell,
  store: Store,
  shield: ShieldCheck,
  mail: Mail,
  id: IdCard,
  upload: Upload,
  usercheck: UserCheck,
};

function pickIcon(name?: string) {
  if (!name) return Bell;
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  return iconMap[key] || Bell;
}

function safeText(value: any, fallback?: string) {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "label" in value) return value.label;
  return fallback;
}


// ---- Adapter: made the UI shape tolerant to backend naming ----
function normalizeResponse(raw: any): Normalized {
  // Try to read a few common server shapes:
  const total =
    raw?.total_steps ??
    raw?.totalSteps ??
    raw?.total ??
    raw?.meta?.total_steps ??
    0;

  const done =
    raw?.completed_steps ??
    raw?.completedSteps ??
    raw?.completed ??
    raw?.meta?.completed_steps ??
    0;

  const rawCards =
    raw?.cards ??
    raw?.items ??
    raw?.data ??
    [];

  const cards: StartCardUI[] = (rawCards as any[]).map((c, i) => {
    const ui: StartCardUI = {
      id: String(c?.id ?? c?.key ?? i),
      title: safeText(c?.title, "Action required"),
      subtitle: safeText(c?.subtitle),
      ctaText: safeText(c?.ctaText, "Open"),
      status:
        c?.status === "done" || c?.completed === true ? "done" : "pending",
      actionHref: c?.actionHref ?? c?.route ?? c?.link ?? undefined,
      icon: c?.icon ?? c?.icon_name ?? undefined,
    };
    return ui;
  });

  return {
    totalSteps: Number(total) || 0,
    completedSteps: Number(done) || 0,
    cards,
  };
}

export default function StartCards({
  fetcher = getSellerStartCards,
  showWhenEmpty = false,
  title = "Get started on Markt",
}: Props) {
  const [state, setState] = useState<{
    loading: boolean;
    data: Normalized | null;
    error: string | null;
  }>({ loading: true, data: null, error: null });

  const { show } = useToast?.() ?? { show: (_: any) => {} };

  const [removed, setRemoved ] = useState<boolean>(false);

  const load = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const res = await fetcher();
      const norm = normalizeResponse(res);
      setState({ loading: false, data: norm, error: null });
    } catch (e: any) {
      const message =
        typeof e?.message === "string" ? e.message : "Failed to load tasks";
      setState({ loading: false, data: null, error: message });
      // toast (optional)
      show?.({
        variant: "error",
        title: "Could not load",
        message,
      });
    }
  }, [fetcher]);

  useEffect(() => {
    load();
  }, []);

  const total = state.data?.totalSteps ?? 0;
  const done = state.data?.completedSteps ?? 0;
  const pct = useMemo(() => {
    if (!total) return 0;
    const v = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    return v;
  }, [done, total]);

  const cards = state.data?.cards?.filter((c) => c.status !== "done") ?? [];

  if (removed) {
    return null
  }

  // Hide the whole block when no work left (unless showWhenEmpty=true)
  if (!state.loading && !state.error && !showWhenEmpty && !cards.length) {
    return null;
  }

  return (
    <View className="px-4 pt-2 pb-3">
      {/* Header */}
      <View className="mb-2 flex-row justify-between">
        <Text className="text-[20px] font-extrabold text-[#171311]">{title}</Text>
        <Pressable onPress={()=>{setRemoved(true)}}>
          <X size={20}/>
        </Pressable>
      </View>

      {/* Progress row */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-[#5f4f4f]">
            {done} of {total || "—"} steps completed
          </Text>
          <Text className="text-sm font-semibold text-[#171311]">{pct}%</Text>
        </View>
        <View className="mt-2 h-2 w-full rounded-full bg-[#f1ecea] overflow-hidden">
          <View
            className="h-2 bg-[#171311] rounded-full"
            style={{ width: `${pct}%` }}
          />
        </View>
      </View>

      {/* Loading skeleton */}
      {state.loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="mr-3 w-64 rounded-2xl bg-white border border-[#efe9e7] p-4"
            >
              <View className="w-8 h-8 rounded-full bg-[#f4f1f0]" />
              <View className="mt-3 h-4 w-40 rounded bg-[#f4f1f0]" />
              <View className="mt-2 h-3 w-48 rounded bg-[#f4f1f0]" />
              <View className="mt-4 h-10 w-28 rounded-full bg-[#f4f1f0]" />
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {(cards.length ? cards : []).map((card) => {
            const Icon = pickIcon(card.icon);
            const body = (
              <View className="mr-3 w-64 rounded-2xl bg-white border border-[#efe9e7] p-4">
                <View className="flex-row items-center">
                  <View className="h-10 w-10 rounded-full bg-[#f4f1f0] items-center justify-center">
                    <Icon size={18} color="#171311" />
                  </View>
                  <Text className="ml-3 text-base font-semibold text-[#171311]" numberOfLines={1}>
                    {card.title}
                  </Text>
                </View>

                {card.subtitle && (
                  <Text className="mt-2 text-sm text-[#7b6660]" numberOfLines={2}>
                    {card.subtitle}
                  </Text>
                )}

                <View className="mt-3 flex-row">
                  <View className="flex-1" />
                  <TouchableOpacity
                    activeOpacity={0.9}
                    className="px-4 h-10 rounded-full bg-[#171311] items-center justify-center flex-row"
                  >
                    <Text className="text-white font-semibold text-sm">
                      {card.ctaText || "Open"}
                    </Text>
                    <ArrowRight size={16} color="#fff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            );

            // If we have a route, make the card CTA navigable
              { card.actionHref &&
                <Link key={card.id} href={card.actionHref || ""} asChild>
                  <TouchableOpacity activeOpacity={0.9}>{body}</TouchableOpacity>
                </Link>
          }
            return (
              <View key={card.id}>{body}</View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
