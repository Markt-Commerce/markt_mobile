import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MessageSquare } from "lucide-react-native";
import { BuyerRequest } from "../models/feed";
import { router } from "expo-router";
import { useTheme } from "./themeProvider";
import { useUser } from "../hooks/userContextProvider";
import Avatar from "./Avatar";

type Props = {
  req: BuyerRequest;
  onMessagePress?: () => void;
};

/** "3 days left" reads better than a date when the point is urgency. */
const formatDeadline = (d?: string | number | Date) => {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;

  const msLeft = date.getTime() - Date.now();
  if (msLeft <= 0) return "Closed";

  const days = Math.floor(msLeft / 86_400_000);
  if (days >= 7) return `${Math.floor(days / 7)}w left`;
  if (days >= 1) return `${days}d left`;

  const hours = Math.floor(msLeft / 3_600_000);
  if (hours >= 1) return `${hours}h left`;
  return "Closing soon";
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
  const deadline = formatDeadline(req.expires_at);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/requestDetails/${req.id}`)}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`Request: ${req.title || "Untitled"}, budget ₦${(
        req.budget ?? 0
      ).toLocaleString()}${deadline ? `, ${deadline}` : ""}`}
      // Full-bleed. This used to be a rounded, bordered card inset by 16px on
      // each side, sitting inside a screen that already draws its own borders --
      // three competing outlines per row and 32px of width given away for
      // nothing. The row now runs edge to edge and a single hairline separates
      // one request from the next.
      className={`px-4 py-3 border-b ${
        isDark ? "bg-surface-raised border-border" : "bg-white border-border-light"
      }`}
    >
      {/* Who, and how the request stands */}
      <View className="flex-row items-center mb-2">
        <Avatar
          uri={req.user?.profile_picture_url}
          name={req.user?.username}
          size={28}
        />
        <View className="flex-1 ml-2.5">
          <Text
            className={`text-[14px] text-text-secondary`}
            numberOfLines={1}
          >
            <Text className={`font-semibold text-text-primary`}>
              {req.user?.username || "Unknown buyer"}
            </Text>
            {deadline ? `  ·  ${deadline}` : ""}
          </Text>
        </View>

        {/* Tint only, no outline. Colour already carries the meaning; the
            border was a third weight fighting the card and the pill. */}
        <View
          className={`px-2.5 py-1 rounded-full ${
            isOpen
              ? "bg-primary-muted"
              : isDark
                ? "bg-surface-sunken"
                : "bg-surface"
          }`}
        >
          <Text
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isOpen ? "text-primary" : isDark ? "text-text-muted" : "text-tertiary"
            }`}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* What they want */}
      <Text
        className={`font-bold text-[16px] leading-[21px] ${
          isDark ? "text-text-primary" : "text-black"
        }`}
        numberOfLines={1}
      >
        {req.title || "Untitled request"}
      </Text>
      {req.description ? (
        <Text
          className={`text-[13px] leading-[18px] mt-0.5 ${
            isDark ? "text-text-muted" : "text-tertiary"
          }`}
          numberOfLines={2}
        >
          {req.description}
        </Text>
      ) : null}

      {/* Budget and the action. No border-t: the gap does that job, and the
          budget is what a seller actually scans for, so it leads. */}
      <View className="flex-row items-center justify-between mt-2.5">
        <View className="flex-row items-baseline">
          <Text
            className={`text-[10px] font-bold uppercase tracking-[1.2px] mr-1.5 ${
              isDark ? "text-text-muted" : "text-tertiary"
            }`}
          >
            Budget
          </Text>
          <Text
            className={`text-[16px] font-bold text-text-primary`}
          >
            ₦{(req.budget ?? 0).toLocaleString()}
          </Text>
        </View>

        {!isOwnRequest && onMessagePress ? (
          <TouchableOpacity
            className={`flex-row items-center px-4 h-9 rounded-lg justify-center ${
              isDark ? "bg-[#f0f1f2]" : "bg-black"
            }`}
            onPress={onMessagePress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Message ${req.user?.username || "buyer"} about this request`}
          >
            <MessageSquare
              size={14}
              color={isDark ? "#1a1c1d" : "#FFFFFF"}
              strokeWidth={2.2}
            />
            <Text
              className={`text-[13px] font-semibold ml-1.5 ${isDark ? "text-[#1a1c1d]" : "text-white"}`}
            >
              Message
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default RequestDisplayComponent;
