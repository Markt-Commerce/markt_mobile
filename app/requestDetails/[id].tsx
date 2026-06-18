import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  ArrowLeft,
  Tag,
  MessageCircle,
  Clock,
  Eye,
  ChevronUp,
  FileText,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getRequestDetails } from "../../services/sections/request";
import { useToast } from "../../components/ToastProvider";
import type { Request } from "../../models/request";
import { parseDate } from "../../utils/parseDate";
import { formatNaira } from "../../utils/formatCurrency";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { useUser } from "../../hooks/userContextProvider";
import { useTheme } from "../../components/themeProvider";
import Avatar from "../../components/Avatar";

const { width } = Dimensions.get("window");

function StatusPill({ status, isDark }: { status: string; isDark: boolean }) {
  const isOpen = status === "OPEN";
  const isExpired = status === "EXPIRED";

  const styles = isOpen
    ? {
        bg: isDark ? "bg-green-900/30" : "bg-green-50",
        border: isDark ? "border-green-800" : "border-green-200",
        text: "text-green-500",
      }
    : isExpired
    ? {
        bg: isDark ? "bg-amber-900/30" : "bg-amber-50",
        border: isDark ? "border-amber-800" : "border-amber-200",
        text: "text-amber-500",
      }
    : {
        bg: isDark ? "bg-[#2f3132]" : "bg-surface",
        border: isDark ? "border-[#46464e]" : "border-border",
        text: isDark ? "text-[#c6c5cf]" : "text-tertiary",
      };

  return (
    <View className={`px-3 h-6 rounded-full flex-row items-center border ${styles.bg} ${styles.border}`}>
      <Text className={`text-[10px] font-geist font-bold uppercase tracking-[2px] ${styles.text}`}>
        {status}
      </Text>
    </View>
  );
}

export default function BuyerRequestDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const { role, user } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chatSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getRequestDetails(id as string)
      .then(setRequestDetails)
      .catch(() =>
        show({
          variant: "error",
          title: "Error",
          message: "Could not fetch request details. Please try again later.",
        })
      )
      .finally(() => setLoading(false));
  }, [id]);

  const pageBackground = isDark ? "#1a1c1d" : "white";

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: pageBackground }} edges={["top", "left", "right"]}>
        <View className={`flex-row items-center px-4 py-3 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
          <Text className={`mt-4 font-geist font-bold text-[11px] tracking-[2px] uppercase ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Loading request
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!requestDetails) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: pageBackground }} edges={["top", "left", "right"]}>
        <View className={`flex-row items-center px-4 py-3 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className={`w-24 h-24 rounded items-center justify-center mb-6 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            <FileText size={40} color={isDark ? "#c6c5cf" : "#A1A1AA"} strokeWidth={1.2} />
          </View>
          <Text className={`text-xl font-geist font-bold text-center ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Request not found
          </Text>
          <Text className={`mt-2 font-inter text-sm text-center leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            This request may have been removed or is no longer available.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-8 h-12 px-8 rounded bg-primary items-center justify-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-geist font-bold text-sm">Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUri =
    requestDetails.user.profile_picture_url ??
    requestDetails.user.profile_picture ??
    undefined;
  const offerCount = requestDetails.offers?.length ?? 0;

  const expiresLabel = requestDetails.expires_at
    ? new Date(requestDetails.expires_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBackground }} edges={["top", "left", "right"]}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          Buyer Request
        </Text>
        {/* Spacer to keep title centred */}
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: role === "seller" ? 108 : 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Buyer info row */}
        <View className={`flex-row items-center gap-3 px-4 py-4 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
          <Avatar uri={avatarUri} name={requestDetails.user.username} size={48} />
          <View className="flex-1">
            <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              @{requestDetails.user.username}
            </Text>
            <Text className={`font-inter text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              Posted {parseDate(requestDetails.created_at)} ago · Buyer
            </Text>
          </View>
          <StatusPill status={requestDetails.status} isDark={isDark} />
        </View>

        {/* Image gallery */}
        {requestDetails.images && requestDetails.images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 56}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
          >
            {requestDetails.images.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: width - 72, height: 200, borderRadius: 8 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        {/* Body */}
        <View className="px-4 pt-4 gap-5">
          {/* Category pills */}
          {requestDetails.categories.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {requestDetails.categories.map((cat) => (
                <View
                  key={cat.id}
                  className={`flex-row items-center gap-1.5 px-3 h-7 rounded border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
                >
                  <Tag size={11} color={isDark ? "#c6c5cf" : "#71717A"} />
                  <Text className={`text-[11px] font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                    {cat.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Title */}
          <Text className={`text-2xl font-geist font-bold leading-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            {requestDetails.title}
          </Text>

          {/* Description */}
          {!!requestDetails.description && (
            <View className={`pt-4 border-t ${isDark ? "border-[#46464e]" : "border-border"}`}>
              <Text className={`text-[11px] font-geist font-bold uppercase tracking-[2px] mb-3 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Description
              </Text>
              <Text className={`font-inter text-base leading-7 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                {requestDetails.description}
              </Text>
            </View>
          )}

          {/* Budget + expiry card */}
          <View className={`rounded border overflow-hidden ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            <View className="flex-row">
              <View className="flex-1 px-4 py-4">
                <Text className={`text-[10px] font-geist font-bold uppercase tracking-[2px] mb-1.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  Budget
                </Text>
                <Text className={`text-xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {requestDetails.budget ? formatNaira(requestDetails.budget) : "Open budget"}
                </Text>
              </View>

              {expiresLabel && (
                <>
                  <View className={`w-px my-4 ${isDark ? "bg-[#46464e]" : "bg-border"}`} />
                  <View className="flex-1 px-4 py-4">
                    <View className="flex-row items-center gap-1 mb-1.5">
                      <Clock size={11} color={isDark ? "#c6c5cf" : "#71717A"} />
                      <Text className={`text-[10px] font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                        Expires
                      </Text>
                    </View>
                    <Text className={`text-base font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                      {expiresLabel}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Stats row */}
            <View className={`flex-row items-center gap-5 px-4 py-3 border-t ${isDark ? "border-[#46464e]" : "border-border"}`}>
              <View className="flex-row items-center gap-1.5">
                <Eye size={13} color={isDark ? "#c6c5cf" : "#71717A"} />
                <Text className={`text-xs font-inter ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  {requestDetails.views ?? 0} views
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <ChevronUp size={13} color={isDark ? "#c6c5cf" : "#71717A"} />
                <Text className={`text-xs font-inter ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  {requestDetails.upvotes ?? 0} upvotes
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <MessageCircle size={13} color={isDark ? "#c6c5cf" : "#71717A"} />
                <Text className={`text-xs font-inter ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  {offerCount} {offerCount === 1 ? "offer" : "offers"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action bar — sellers only */}
      {role === "seller" && (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: pageBackground }}>
          <View className={`px-4 pt-3 pb-3 border-t ${isDark ? "border-[#46464e]" : "border-border"}`}>
            <TouchableOpacity
              onPress={() => chatSheetRef.current?.expand()}
              className="h-14 rounded bg-primary items-center justify-center flex-row gap-2"
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Message buyer"
            >
              <MessageCircle size={18} color="#ffffff" />
              <Text className="text-white font-geist font-bold text-sm tracking-widest uppercase">
                Message Buyer
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {role === "seller" && requestDetails && (
        <QuickChatBottomSheet
          sheetRef={chatSheetRef}
          sellerId={user?.user_id ?? ""}
          buyerId={requestDetails.user.id}
          otherUser={{
            username: requestDetails.user.username,
            profile_picture: avatarUri,
          }}
          asBuyer={false}
        />
      )}
    </SafeAreaView>
  );
}
