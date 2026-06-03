import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  ArrowLeft,
  Share2,
  MoreHorizontal,
  BadgeCheck,
  MapPin,
  MessageCircle,
  Tag,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { getRequestDetails } from "../../services/sections/request";
import { useToast } from "../../components/ToastProvider";
import { Request } from "../../models/request";
import { parseDate } from "../../utils/parseDate";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { useUser } from "../../hooks/userContextProvider";
import { useTheme } from "../../components/themeProvider";

const { width } = Dimensions.get("window");

export default function BuyerRequestDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [requestDetails, setRequestDetails] = useState<Request>();
  const { show } = useToast();
  const { role, user } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f5f5f5" : "#000000";
  const mutedIconColor = isDark ? "#c6c5cf" : "#71717A";

  const chatSheetRef = useRef<BottomSheet>(null);
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const data = await getRequestDetails(id as string);
      setRequestDetails(data);
    } catch (error) {
      show({
        variant: "error",
        title: "Error",
        message: "Could not fetch request details. Please try again later.",
      });
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
      <View className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
        {/* Top Navigation */}
        <View
          className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={20} color={iconColor} />
            </TouchableOpacity>
            <Text
              className={`text-lg font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
            >
              Request Details
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity>
              <Share2 size={20} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity>
              <MoreHorizontal size={20} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {/* Buyer Header */}
          <View
            className={`flex-row items-center gap-4 px-4 py-4 ${isDark ? "bg-dark-page" : "bg-white"}`}
          >
            {requestDetails?.user.profile_picture_url ? (
              <Image
                source={{ uri: requestDetails.user.profile_picture_url }}
                className={`h-12 w-12 rounded-full border-2 ${isDark ? "border-dark-border-strong" : "border-border"}`}
              />
            ) : (
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4NLBAN7hDkRl-9HwCICabka7xQ_sioumpHL0m5wDUnWALWnELPyTin0EriDdEXOVQzz4xOgMaLFT3R6fIuVhSSFNgB_K-OuzoH5mjfgVRy4Ks0vLH-prv-OPCQqhA7GVy4D0GbzmnhY2TlNpfdiOEhAEH2WCf9WL4LXVkLC0VxzufVYBLoQnhyGS6qsVhLekldLubvv-P0ZmCIL37VqPqdF190ZcWmq5McWcCO0WpCdAHGU6lAhXvmSPH8kRupGVTBH8KilNqxQ",
                }}
                className={`h-12 w-12 rounded-full border-2 ${isDark ? "border-dark-border-strong" : "border-border"}`}
              />
            )}

            <View>
              <View className="flex-row items-center gap-1">
                <Text
                  className={`font-geist font-bold text-base ${isDark ? "text-dark-text" : "text-black"}`}
                >
                  @{requestDetails?.user.username}
                </Text>
                <BadgeCheck size={14} color={mutedIconColor} />
              </View>
              {requestDetails?.created_at ? (
                <Text className="text-xs text-tertiary font-inter">
                  Posted {parseDate(requestDetails.created_at)} ago • Verified
                  Buyer
                </Text>
              ) : (
                <Text className="text-xs text-tertiary font-inter">
                  Posted • Verified Buyer
                </Text>
              )}
            </View>
          </View>

          {/* Image Gallery */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.8 + 12}
            decelerationRate="fast"
            className="px-4 py-2"
          >
            {requestDetails?.images.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: width * 0.8 }}
                className="h-52 mr-3 rounded"
              />
            ))}
          </ScrollView>

          {/* Details */}
          <View className="px-4 py-2 space-y-4">
            {/* Tags */}
            <View className="flex-row flex-wrap gap-2">
              <View
                className={`flex-row items-center gap-1 px-3 h-7 rounded border ${isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"}`}
              >
                <Tag size={12} color={mutedIconColor} />
                <Text
                  className={`text-xs font-bold uppercase ${isDark ? "text-dark-text" : "text-black"}`}
                >
                  {requestDetails?.categories[0]?.name || "General"}
                </Text>
              </View>

              <View className="px-3 h-7 rounded justify-center">
                <Text
                  className={`text-xs font-bold flex items-center ${isDark ? "text-dark-text" : "text-black"}`}
                >
                  Urgent
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              className={`text-2xl font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
            >
              {requestDetails?.title}
            </Text>

            {/* Location */}
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color={mutedIconColor} />
              <Text className="text-sm text-tertiary">
                Shipping to Direct Location
              </Text>
            </View>

            {/* Description */}
            <View
              className={`pt-4 border-t ${isDark ? "border-dark-border" : "border-border"}`}
            >
              <Text className="text-xs font-geist font-bold uppercase tracking-[2px] mb-2 text-tertiary">
                Description
              </Text>
              <Text
                className={`text-base leading-relaxed font-inter ${isDark ? "text-dark-text" : "text-black"}`}
              >
                {requestDetails?.description}
              </Text>
            </View>

            {/* Meta */}
            <View
              className={`flex-row gap-4 p-4 rounded border ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
            >
              <View className="flex-1">
                <Text className="text-xs uppercase text-tertiary font-bold mb-1">
                  Budget Range
                </Text>
                <Text
                  className={`text-lg font-bold ${isDark ? "text-dark-text" : "text-black"}`}
                >
                  {requestDetails?.budget || "$150 – $250"}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-xs uppercase text-tertiary font-bold mb-1">
                  Quantity Needed
                </Text>
                <Text
                  className={`text-lg font-bold ${isDark ? "text-dark-text" : "text-black"}`}
                >
                  1 Unit
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View
          className={`absolute bottom-0 left-0 right-0 border-t px-4 py-4 ${isDark ? "bg-dark-surface/95 border-dark-border" : "bg-white/90 border-border"}`}
        >
          <View className="flex-row gap-3">
            {role === "seller" && (
              <TouchableOpacity
                onPress={() => chatSheetRef.current?.expand()}
                className="flex-[2] h-14 rounded bg-primary items-center justify-center flex-row gap-2"
              >
                <MessageCircle size={18} className="text-white" />
                <Text className="text-white font-bold">Message</Text>
              </TouchableOpacity>
            )}

            {/* <TouchableOpacity className="flex-[2] h-14 rounded bg-primary items-center justify-center flex-row gap-2">
                <Tag size={18} className="text-white" />
                <Text className="text-white font-bold">Offer Product</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
      {role === "seller" && requestDetails && (
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
