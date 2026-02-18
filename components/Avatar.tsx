/**
 * Avatar — Profile/shop image with initials fallback
 * Shows initials when no profile picture (e.g. first letters of name).
 */

import React, { useState } from "react";
import { View, Text, Image } from "react-native";

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
  if (!name) return "#876d64";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = ["#e26136", "#60758a", "#178b1f", "#876d64"];
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
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const hasValidUri = uri && uri.length > 0 && !imageError;

  return (
    <View
      className={`rounded-full overflow-hidden items-center justify-center ${className}`}
      style={{ width: size, height: size, backgroundColor: hasValidUri ? "#f4f1f0" : bgColor }}
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
          className="text-white font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
