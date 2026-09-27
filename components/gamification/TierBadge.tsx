import React from "react";
import { View, Text } from "react-native";
import { Sprout, Zap, Handshake, Store, Building2, Crown } from "lucide-react-native";
import type { TierKey } from "../../types/gamification";
import { withAlpha } from "../../theme/tierColors";

type Size = "sm" | "md" | "lg";

const ICON_SIZE: Record<Size, number> = { sm: 14, md: 18, lg: 26 };
const TEXT_SIZE: Record<Size, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

// One distinct silhouette per tier (not a repeated icon) so tier is
// recognizable by shape, not just color — and doesn't read as a star
// rating, which this app already uses for something else (seller/product
// review scores).
const TIER_ICON: Record<TierKey, typeof Sprout> = {
  newcomer: Sprout,
  hustler: Zap,
  trader: Handshake,
  merchant: Store,
  magnate: Building2,
  mogul: Crown,
};

export interface TierBadgeProps {
  tier: TierKey;
  stars: number;
  /** Display name (falls back to a capitalised tier key). */
  name?: string;
  /** Tier colour from the API — never hard-coded client-side. */
  colorHex?: string;
  size?: Size;
  showName?: boolean;
  className?: string;
}

/**
 * Per-tier icon + optional tier-name pill. Shown next to a user's name
 * across the app (profile header, leaderboard rows, etc.). Colours come
 * from the API.
 */
export default function TierBadge({
  tier,
  name,
  colorHex,
  size = "md",
  showName = false,
  className = "",
}: TierBadgeProps) {
  const color = colorHex || "#F5A623";
  // Not `${color}22`. That only ever worked while every caller passed
  // a 6-digit hex -- the moment one passed an rgba() token the result
  // was the literal string "rgba(244,128,95,0.16)22", which is not a
  // colour, so the chip drew no background at all.
  const wash = withAlpha(color, 0.13);
  const s = ICON_SIZE[size];
  const displayName = name ?? tier.charAt(0).toUpperCase() + tier.slice(1);
  const Icon = TIER_ICON[tier] ?? Sprout;

  return (
    <View
      className={`flex-row items-center ${className}`}
      accessibilityLabel={`${displayName} tier`}
    >
      <View
        className="items-center justify-center rounded-full"
        style={{ width: s + 8, height: s + 8, backgroundColor: wash }}
      >
        <Icon size={s} color={color} strokeWidth={2.2} />
      </View>

      {showName && (
        <View
          className="ml-2 px-2 py-0.5 rounded"
          style={{ backgroundColor: wash, borderColor: color, borderWidth: 1 }}
        >
          <Text className={`font-bold ${TEXT_SIZE[size]}`} style={{ color }}>
            {displayName}
          </Text>
        </View>
      )}
    </View>
  );
}
