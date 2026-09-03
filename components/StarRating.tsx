/**
 * Stars, for display and for input.
 *
 * The app had no star component at all — product detail printed
 * `Average Rating: 0` as text — so ratings were both invisible and unreadable
 * at a glance. Half-stars matter here: an average of 4.5 shown as 4 or 5 is a
 * misrepresentation of a seller's record.
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Star } from "lucide-react-native";

const FILLED = "#F5A623";

type DisplayProps = {
  /** 0–5, fractional allowed. */
  value: number;
  size?: number;
  /** Shows the numeric value beside the stars. */
  showValue?: boolean;
  /** e.g. 12 → "(12)". Omitted when undefined. */
  count?: number;
  dark?: boolean;
};

export function StarRating({
  value,
  size = 14,
  showValue = false,
  count,
  dark = false,
}: DisplayProps) {
  const safe = Math.max(0, Math.min(5, Number(value) || 0));
  const empty = dark ? "#46464e" : "#E4E4E7";

  return (
    <View
      className="flex-row items-center"
      accessibilityRole="image"
      accessibilityLabel={
        count != null
          ? `Rated ${safe.toFixed(1)} out of 5, ${count} ${count === 1 ? "review" : "reviews"}`
          : `Rated ${safe.toFixed(1)} out of 5`
      }
    >
      {[0, 1, 2, 3, 4].map((i) => {
        // How much of this particular star is filled: 1, a fraction, or 0.
        const fill = Math.max(0, Math.min(1, safe - i));
        return (
          <View key={i} style={{ width: size, height: size, marginRight: 2 }}>
            <Star size={size} color={empty} fill={empty} strokeWidth={0} />
            {fill > 0 ? (
              // Clip the filled star to the fraction, so 4.5 reads as 4.5.
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: size * fill,
                  height: size,
                  overflow: "hidden",
                }}
              >
                <Star size={size} color={FILLED} fill={FILLED} strokeWidth={0} />
              </View>
            ) : null}
          </View>
        );
      })}
      {showValue ? (
        <Text
          className={`text-[13px] ml-1.5 ${dark ? "text-[#c6c5cf]" : "text-tertiary"}`}
        >
          {safe.toFixed(1)}
          {count != null ? ` (${count})` : ""}
        </Text>
      ) : null}
    </View>
  );
}

type InputProps = {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  dark?: boolean;
};

/** Tappable stars for writing a review. Whole stars only — asking someone to
 *  hit a half-star on a phone is a worse experience than the precision is
 *  worth. */
export function StarRatingInput({
  value,
  onChange,
  size = 36,
  dark = false,
}: InputProps) {
  const empty = dark ? "#46464e" : "#E4E4E7";
  return (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${n} ${n === 1 ? "star" : "stars"}`}
            style={{ marginRight: 8 }}
          >
            <Star
              size={size}
              color={active ? FILLED : empty}
              fill={active ? FILLED : "transparent"}
              strokeWidth={active ? 0 : 1.8}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default StarRating;
