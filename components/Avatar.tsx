/**
 * Avatar — Profile/shop image with initials fallback
 * Shows initials when no profile picture (e.g. first letters of name).
 */

import React, { useEffect, useState } from "react";
import { View, Text, Image, Platform } from "react-native";

function getInitials(name: string | null | undefined, fallback = "?"): string {
  if (!name || typeof name !== "string") return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/** Pick a consistent background hue from a string (deterministic) */
function getAvatarColor(name: string | null | undefined): string {
  if (!name) return "#71717A";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = ["#000000", "#71717A"];
  return hues[Math.abs(hash) % hues.length];
}

interface AvatarProps {
  uri: string | null | undefined;
  name?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ uri, name, size = 40, className = "" }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [uri]);

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const hasValidUri = uri && uri.length > 0 && !imageError;

  return (
    <View
      className={`rounded overflow-hidden flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: hasValidUri ? "#F4F4F5" : bgColor,
      }}
    >
      {hasValidUri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          className="text-white font-geist font-bold"
          style={{
            fontSize: size * 0.42,
            textAlign: "center",
            textAlignVertical: "center",
            lineHeight: size, // Force line height to match size for vertical centering
            ...(Platform.OS === "android" && { includeFontPadding: false }),
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
