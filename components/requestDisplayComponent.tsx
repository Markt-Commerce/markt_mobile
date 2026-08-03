import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { BuyerRequest } from "../models/feed";
import { router } from "expo-router";
import { useTheme } from "./themeProvider";
import { useUser } from "../hooks/userContextProvider";
import { defaultProfilePicture } from "../models/defaults";

type Buyer = {
  profile_picture_url?: string;
  username?: string;
};

type Props = {
  req: BuyerRequest;
  onMessagePress?: () => void;
};

const formatDeadline = (d?: string | number | Date) => {
  if (!d) return "No deadline";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "Invalid date";
  return date.toDateString();
};

const RequestDisplayComponent: React.FC<Props> = ({ req, onMessagePress }) => {
  const { resolvedTheme } = useTheme();
  const { user } = useUser();
  const isDark = resolvedTheme === "dark";
  // No messaging yourself about your own request.
  const isOwnRequest =
    !!user?.user_id && String(req.user?.id ?? req.user_id) === String(user.user_id);

  const isExpired =
    !!req.expires_at && new Date(req.expires_at).getTime() < Date.now();
  const statusRaw = (req.status ?? "OPEN").toUpperCase();
  const statusLabel = statusRaw === "OPEN" && isExpired ? "EXPIRED" : statusRaw;
  const isOpen = statusLabel === "OPEN";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/requestDetails/${req.id}`)}
      activeOpacity={0.85}
      className="px-6 pt-6"
    >
      <View
        className={`rounded border p-5 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1 pr-3">
            <Image
              source={{
                uri: req.user?.profile_picture_url || defaultProfilePicture,
              }}
              className={`w-10 h-10 rounded-full mr-3 ${isDark ? "bg-dark-elevated" : "bg-surface"}`}
            />
            <View>
              <Text
                className={`font-geist font-bold text-base ${isDark ? "text-dark-text" : "text-black"}`}
              >
                {req.user?.username || "Unknown buyer"}
              </Text>
              <View className="mt-1 flex-row items-center">
                <View className="h-1.5 w-1.5 rounded bg-primary mr-2" />
                <Text className="text-[10px] font-geist font-bold text-tertiary uppercase tracking-wider">
                  Buyer request
                </Text>
              </View>
            </View>
          </View>
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
              className={`text-[10px] font-geist font-bold uppercase tracking-wider ${
                isOpen ? "text-primary" : isDark ? "text-dark-muted" : "text-tertiary"
              }`}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <Text
          className={`font-geist font-bold text-lg mb-1 ${isDark ? "text-dark-text" : "text-black"}`}
          numberOfLines={2}
        >
          {req.title || "Untitled request"}
        </Text>
        <Text
          className={`${isDark ? "text-dark-muted" : "text-tertiary"} font-inter text-sm mb-4 leading-6`}
          numberOfLines={3}
        >
          {req.description || "No description provided."}
        </Text>

        <View
          className={`flex-row items-center justify-between border-t pt-4 ${isDark ? "border-dark-border" : "border-border"}`}
        >
          <View>
            <Text
              className={`text-base font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
            >
              ₦{(req.budget ?? 0).toLocaleString()}
            </Text>
            <Text
              className={`text-[11px] font-inter mt-0.5 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
            >
              Deadline: {formatDeadline(req.expires_at)}
            </Text>
          </View>
          {!isOwnRequest && (
            <TouchableOpacity
              className="px-5 py-2.5 bg-primary rounded"
              onPress={() => onMessagePress?.()}
              activeOpacity={0.85}
            >
              <Text className="text-white text-xs font-geist font-bold tracking-[1px] uppercase">
                Message
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RequestDisplayComponent;
