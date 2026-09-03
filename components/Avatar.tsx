/**
 * Avatar — Profile/shop image with initials fallback
 * Shows initials when no profile picture (e.g. first letters of name).
 */

import React, { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import { Image } from "expo-image";

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
  /** People are circular by default; shop discovery tiles use a soft square. */
  shape?: "circle" | "rounded";
}

function Avatar({ uri, name, size = 40, className = "", shape = "circle" }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [uri]);

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const hasValidUri = uri && uri.length > 0 && !imageError;

  return (
    <View
      className={`${className} overflow-hidden flex items-center justify-center`}
      style={{
        width: size,
        height: size,
        borderRadius: shape === "circle" ? size / 2 : Math.min(12, size * 0.25),
        backgroundColor: hasValidUri ? "#f4f1f0" : bgColor,
      }}
    >
      {hasValidUri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          recyclingKey={uri}
          cachePolicy="memory-disk"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <Text
            className="text-white font-semibold"
            style={{
              fontSize: size * 0.4,
              textAlign: "center",
              ...(Platform.OS === "android" && { includeFontPadding: false }),
            }}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

// All props are primitives, so the default shallow compare is exactly right —
// and Avatar renders once per feed row, chat bubble and list item.
export default React.memo(Avatar);
