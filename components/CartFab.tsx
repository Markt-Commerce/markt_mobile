import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTokens } from "../theme/useTokens";
import { useUser } from "../hooks/userContextProvider";
import { getCartSummary } from "../services/sections/cart";
import { onBadgeChanged } from "../utils/badgeEvents";

/**
 * A way back to the cart from a screen that has no tab bar.
 *
 * Product and shop pages are full-screen, so after adding something the only
 * route to the basket was Back, Back, then Orders — and the item you just
 * added gave no sign of having gone anywhere. This is the acknowledgement as
 * much as the shortcut.
 *
 * Buyers only, and only once there is something in the cart: a permanent
 * empty-cart button on every product page is furniture.
 */
export default function CartFab({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const router = useRouter();
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { role } = useUser();
  const [count, setCount] = React.useState(0);

  const refresh = React.useCallback(async () => {
    if (role !== "buyer") return;
    try {
      const summary = await getCartSummary();
      setCount(summary?.item_count ?? 0);
    } catch {
      // A shortcut is not worth an error. Staying hidden is the safe failure.
      setCount(0);
    }
  }, [role]);

  React.useEffect(() => {
    refresh();
    // Adding to cart emits this, so the badge moves the moment something
    // lands rather than on the next screen.
    return onBadgeChanged(refresh);
  }, [refresh]);

  if (role !== "buyer" || count <= 0) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/orders" as any)}
      accessibilityRole="button"
      accessibilityLabel={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
      activeOpacity={0.85}
      style={{ bottom: insets.bottom + 20 + bottomOffset, right: 20 }}
      className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary-fill shadow-lg"
    >
      <ShoppingCart size={22} color={t.textOnPrimary} />
      <View className="absolute -right-1 -top-1 h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-surface-page bg-danger px-1">
        <Text className="text-[11px] font-bold text-text-on-primary">
          {count > 99 ? "99+" : count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
