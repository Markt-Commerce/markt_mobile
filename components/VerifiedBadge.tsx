/**
 * The verified mark, in one place.
 *
 * There were five different treatments of the same idea: a grey uppercase
 * "VERIFIED" chip on Discover Shops, a different chip on the market screen, a
 * ring around the avatar in the shop strip, a pill on reviews, and — on the shop
 * detail — the raw `verification_status` printed straight out, so an unverified
 * seller's page said "pending" in a box that looked like a badge.
 *
 * A verification mark is a trust signal. If it looks different in every place it
 * appears, it stops reading as one thing and starts reading as decoration, which
 * is the opposite of what it's for.
 *
 * Two kinds, deliberately distinct in words and colour:
 *
 * - `seller`  — Markt checked who this seller is. Brand orange.
 * - `purchase` — this reviewer actually bought the item. Green, because it says
 *   something about the review rather than the person, and conflating the two
 *   would let a verified purchase imply a vetted seller.
 */
import React from "react";
import { View, Text } from "react-native";
import { BadgeCheck } from "lucide-react-native";

export type VerifiedKind = "seller" | "purchase";

const TONE: Record<VerifiedKind, { fg: string; bg: string; label: string }> = {
  seller: { fg: "#E94C2A", bg: "rgba(233,76,42,0.12)", label: "Verified" },
  purchase: { fg: "#0F7B3F", bg: "rgba(15,123,63,0.12)", label: "Verified purchase" },
};

type Props = {
  kind?: VerifiedKind;
  /** Icon only. For sitting inline beside a name, where a chip would crowd it. */
  compact?: boolean;
  size?: number;
  /** Override the wording without losing the mark (e.g. "Verified seller"). */
  label?: string;
};

export default function VerifiedBadge({
  kind = "seller",
  compact = false,
  size = 14,
  label,
}: Props) {
  const tone = TONE[kind];
  const text = label ?? tone.label;

  if (compact) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={text}
        // Padding, not margin: the caller shouldn't have to know the mark
        // exists to space around it.
        style={{ marginLeft: 4 }}
      >
        <BadgeCheck size={size} color={tone.fg} strokeWidth={2.4} />
      </View>
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={text}
      className="flex-row items-center px-2 py-1 rounded-full"
      style={{ backgroundColor: tone.bg }}
    >
      <BadgeCheck size={size} color={tone.fg} strokeWidth={2.4} />
      <Text
        className="text-[11px] font-semibold ml-1"
        style={{ color: tone.fg }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

/** Whether a seller's status counts as verified. Kept here so callers don't
 *  each re-implement the string comparison — and get it subtly different. */
export function isVerifiedSeller(status?: string | null): boolean {
  return String(status ?? "").toLowerCase() === "verified";
}
