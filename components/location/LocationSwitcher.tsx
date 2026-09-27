import React from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { ChevronDown, MapPin } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { useBrowseLocation } from "../../hooks/browseLocationContext";

/**
 * The header location control.
 *
 * Top-left, showing where the feed is scoped to, with a chevron that opens the
 * picker — the pattern Chowdeck uses and the one Nigerian users already read
 * as "change my area".
 *
 * Shows a prompt rather than hiding when no location is set: an unset state
 * that looks like nothing is how a feature goes unnoticed. It works for guests
 * too, which is the whole point — the browse location is a preference, not an
 * identity.
 */
export default function LocationSwitcher({
  compact = false,
}: {
  /** Tighter type, for a dense header. */
  compact?: boolean;
}) {
  const t = useTokens();
  const router = useRouter();
  const { location, loading } = useBrowseLocation();

  const label = location?.label?.trim() || location?.lga || location?.state || null;

  return (
    <Pressable
      onPress={() => router.push("/location/picker")}
      accessibilityRole="button"
      accessibilityLabel={
        label
          ? `Browsing near ${label}. Change location`
          : "Set your location to see what's nearby"
      }
      hitSlop={8}
      className="flex-row items-center gap-1.5 pr-2 active:opacity-70"
      style={{ maxWidth: 240 }}
    >
      <MapPin size={compact ? 15 : 17} color={t.primaryText} strokeWidth={2.2} />

      <Text
        numberOfLines={1}
        className={`flex-shrink font-semibold ${
          compact ? "text-[13px]" : "text-[15px]"
        } ${label ? "text-text-primary" : "text-text-secondary"}`}
      >
        {loading && !label ? "Locating…" : (label ?? "Set your location")}
      </Text>

      <ChevronDown size={compact ? 14 : 16} color={t.textSecondary} strokeWidth={2.4} />
    </Pressable>
  );
}
