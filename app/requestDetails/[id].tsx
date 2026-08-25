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
  Eye,
  Clock,
  MessageCircle,
  Wallet,
  FileText,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getRequestDetails } from "../../services/sections/request";
import { Request } from "../../models/request";
import { parseDate } from "../../utils/parseDate";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { useUser } from "../../hooks/userContextProvider";
import { useTheme } from "../../components/themeProvider";
import { defaultProfilePicture } from "../../models/defaults";

const { width } = Dimensions.get("window");

/** Images may arrive as plain URL strings or as media objects — resolve both. */
function resolveImageUrls(images: any[] | undefined): string[] {
  return (images ?? [])
    .map((img: any) =>
      typeof img === "string"
        ? img
        : img?.media?.mobile_url ??
          img?.media?.original_url ??
          img?.media?.thumbnail_url ??
          img?.url ??
          null
    )
    .filter(Boolean) as string[];
}

function SectionLabel({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <Text
      className={`text-[11px] font-bold tracking-[2px] uppercase ${
        isDark ? "text-dark-muted" : "text-tertiary"
      }`}
    >
      {children}
    </Text>
  );
}

export default function BuyerRequestDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [requestDetails, setRequestDetails] = useState<Request>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { role, user } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";
  const mutedIconColor = isDark ? "#c6c5cf" : "#71717A";

  const chatSheetRef = useRef<BottomSheet>(null);
  // Dual-role users in seller mode shouldn't be offered a chat with themselves
  // on their own request.
  const isOwnRequest =
    !!user?.user_id &&
    String(requestDetails?.user?.id ?? requestDetails?.user_id) === String(user.user_id);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getRequestDetails(id as string);
      setRequestDetails(data);
    } catch (error) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const imageUrls = resolveImageUrls(requestDetails?.images);
  const isExpired =
    requestDetails?.expires_at != null &&
    new Date(requestDetails.expires_at).getTime() < Date.now();
  const statusRaw = (requestDetails?.status ?? "OPEN").toUpperCase();
  const statusLabel =
    statusRaw === "OPEN" && isExpired ? "EXPIRED" : statusRaw;
  const isOpen = statusLabel === "OPEN";
  const showMessageBar = role === "seller" && !isOwnRequest && !!requestDetails;

  const Header = (
    <View
      className={`flex-row items-center justify-between px-4 py-3 border-b ${
        isDark ? "bg-dark-page border-dark-border" : "bg-white border-border"
      }`}
    >
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className={`w-10 h-10 rounded items-center justify-center border ${
            isDark ? "bg-dark-surface border-dark-border-strong" : "bg-surface border-border"
          }`}
        >
          <ArrowLeft size={20} color={iconColor} />
        </TouchableOpacity>
        <Text
          className={`text-lg font-bold tracking-tight ${
            isDark ? "text-dark-text" : "text-black"
          }`}
        >
          Request Details
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
        {Header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={iconColor} />
          <Text
            className={`mt-4 font-bold text-[11px] tracking-[2px] uppercase ${
              isDark ? "text-dark-muted" : "text-tertiary"
            }`}
          >
            Loading request
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !requestDetails) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
        {Header}
        <View className="flex-1 items-center justify-center px-8">
          <View
            className={`w-16 h-16 rounded items-center justify-center border mb-5 ${
              isDark ? "bg-dark-surface border-dark-border-strong" : "bg-surface border-border"
            }`}
          >
            <FileText size={26} color={iconColor} strokeWidth={1.8} />
          </View>
          <Text
            className={`text-xl font-bold text-center ${
              isDark ? "text-dark-text" : "text-black"
            }`}
          >
            Couldn't load this request
          </Text>
          <Text
            className={`text-sm text-center mt-2 leading-5 ${
              isDark ? "text-dark-muted" : "text-tertiary"
            }`}
          >
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={fetchData}
            activeOpacity={0.85}
            className="mt-6 h-12 px-7 rounded bg-primary items-center justify-center"
          >
            <Text className="text-white font-bold text-[11px] tracking-[2px] uppercase">
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
      {Header}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: showMessageBar ? 120 : 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + posted */}
        <View className="px-6 pt-5 flex-row items-center justify-between">
          <View
            className={`px-3 py-1.5 rounded border ${
              isOpen
                ? "bg-primary-muted border-primary/30"
                : isDark
                  ? "bg-dark-elevated border-dark-border-strong"
                  : "bg-surface border-border"
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-[2px] ${
                isOpen ? "text-primary" : isDark ? "text-dark-muted" : "text-tertiary"
              }`}
            >
              {statusLabel}
            </Text>
          </View>
          {requestDetails.created_at ? (
            <Text
              className={`text-xs ${isDark ? "text-dark-muted" : "text-tertiary"}`}
            >
              Posted {parseDate(requestDetails.created_at)}
            </Text>
          ) : null}
        </View>

        {/* Title */}
        <View className="px-6 pt-3">
          <Text
            className={`text-[26px] font-bold leading-8 tracking-tight ${
              isDark ? "text-dark-text" : "text-black"
            }`}
          >
            {requestDetails.title || "Untitled request"}
          </Text>
        </View>

        {/* Category chips */}
        {(requestDetails.categories?.length ?? 0) > 0 && (
          <View className="px-6 pt-4 flex-row flex-wrap gap-2">
            {requestDetails.categories.map((cat) => (
              <View
                key={cat.id}
                className={`px-3 h-7 rounded border justify-center ${
                  isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? "text-dark-text" : "text-black"
                  }`}
                >
                  {cat.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Budget + expiry card */}
        <View className="px-6 pt-5">
          <View
            className={`rounded border overflow-hidden ${
              isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"
            }`}
          >
            <View className="flex-row">
              <View className="flex-1 p-5">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Wallet size={13} color={mutedIconColor} strokeWidth={2} />
                  <SectionLabel isDark={isDark}>Budget</SectionLabel>
                </View>
                <Text
                  className={`text-[22px] font-bold tracking-tight ${
                    isDark ? "text-dark-text" : "text-black"
                  }`}
                >
                  {requestDetails.budget != null
                    ? `₦${Number(requestDetails.budget).toLocaleString()}`
                    : "Not stated"}
                </Text>
              </View>
              <View className={`w-px ${isDark ? "bg-dark-border" : "bg-border"}`} />
              <View className="flex-1 p-5">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Clock size={13} color={mutedIconColor} strokeWidth={2} />
                  <SectionLabel isDark={isDark}>
                    {isExpired ? "Expired" : "Expires"}
                  </SectionLabel>
                </View>
                <Text
                  className={`text-base font-bold ${
                    isDark ? "text-dark-text" : "text-black"
                  }`}
                >
                  {requestDetails.expires_at
                    ? new Date(requestDetails.expires_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No deadline"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Buyer card */}
        <View className="px-6 pt-4">
          <View
            className={`rounded border p-4 flex-row items-center ${
              isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"
            }`}
          >
            <Image
              source={{
                uri: requestDetails.user?.profile_picture_url || defaultProfilePicture,
              }}
              className={`h-12 w-12 rounded-full ${isDark ? "bg-dark-elevated" : "bg-surface"}`}
            />
            <View className="ml-3 flex-1">
              <Text
                className={`font-bold text-base ${
                  isDark ? "text-dark-text" : "text-black"
                }`}
                numberOfLines={1}
              >
                @{requestDetails.user?.username ?? "unknown"}
              </Text>
              <View className="mt-1 flex-row items-center">
                <View className="h-1.5 w-1.5 rounded bg-primary mr-2" />
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? "text-dark-muted" : "text-tertiary"
                  }`}
                >
                  {isOwnRequest ? "Your request" : "Requested by"}
                </Text>
              </View>
            </View>
            {typeof requestDetails.views === "number" && (
              <View className="flex-row items-center gap-1.5">
                <Eye size={14} color={mutedIconColor} strokeWidth={2} />
                <Text
                  className={`text-xs ${isDark ? "text-dark-muted" : "text-tertiary"}`}
                >
                  {requestDetails.views}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View className="px-6 pt-6">
          <SectionLabel isDark={isDark}>Description</SectionLabel>
          <Text
            className={`mt-2 text-base leading-7 ${
              isDark ? "text-dark-text" : "text-black"
            }`}
          >
            {requestDetails.description || "No description provided."}
          </Text>
        </View>

        {/* Photos */}
        {imageUrls.length > 0 && (
          <View className="pt-6">
            <View className="px-6">
              <SectionLabel isDark={isDark}>Photos</SectionLabel>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={width * 0.7 + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12 }}
            >
              {imageUrls.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{ width: width * 0.7, height: 208 }}
                  className={`mr-3 rounded border ${
                    isDark ? "bg-dark-elevated border-dark-border" : "bg-surface border-border"
                  }`}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar — sellers only, never on your own request */}
      {showMessageBar && (
        <View
          className={`absolute bottom-0 left-0 right-0 border-t px-6 pt-4 pb-8 ${
            isDark ? "bg-dark-page border-dark-border" : "bg-white border-border"
          }`}
        >
          <TouchableOpacity
            onPress={() => chatSheetRef.current?.expand()}
            activeOpacity={0.85}
            className="h-14 rounded bg-primary items-center justify-center flex-row gap-2"
          >
            <MessageCircle size={18} color="#FFFFFF" strokeWidth={2} />
            <Text className="text-white font-bold text-[12px] tracking-[2px] uppercase">
              Message buyer
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showMessageBar && (
        <QuickChatBottomSheet
          sheetRef={chatSheetRef}
          sellerId={user?.user_id ?? ""}
          buyerId={requestDetails.user.id}
          otherUser={{
            username: requestDetails.user.username,
            profile_picture:
              requestDetails.user.profile_picture ??
              requestDetails.user.profile_picture_url ??
              undefined,
          }}
          asBuyer={false}
        />
      )}
    </SafeAreaView>
  );
}
