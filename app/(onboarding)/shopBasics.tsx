import React, { useCallback, useState } from "react";
import { ActivityIndicator, Text, View, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTokens } from "../../theme/useTokens";
import { SuccessMark } from "../../components/illustrations/MarktIllustration";
import * as Location from "expo-location";
import { MapPin } from "lucide-react-native";
import { updateSellerProfile } from "../../services/sections/profile";
import * as haptics from "../../utils/haptics";
import { logger } from "../../utils/logger";

/**
 * The two things a shop cannot open without.
 *
 * The old seller path asked for shop name, username, phone and a description
 * on one screen, then a full address on the next — five fields and an address
 * before the seller had listed anything. Username now comes from the name
 * screen, phone is asked when a buyer first needs to reach them, and the
 * description is prompted from the shop page where it is actually visible.
 *
 * What remains is the shop's name and what it sells. Everything else is a
 * "finish your shop" nudge on the dashboard, where it has context.
 */
export default function ShopBasics() {
  const router = useRouter();
  const t = useTokens();
  const [shopName, setShopName] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const valid = shopName.trim().length >= 2;

  /**
   * Where the shop is.
   *
   * Asked here rather than later because it is what makes the seller findable:
   * an unlocated shop only ever appears on the feed's nationwide rung, so a new
   * seller with no coordinate is effectively invisible to the buyers standing
   * closest to them.
   */
  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationLabel(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      haptics.tick();

      try {
        const [addr] = await Location.reverseGeocodeAsync(pos.coords);
        setLocationLabel(
          [addr?.city ?? addr?.subregion, addr?.region].filter(Boolean).join(", ") ||
            "Location set"
        );
      } catch {
        setLocationLabel("Location set");
      }
    } catch {
      setLocationLabel(null);
    } finally {
      setLocating(false);
    }
  }, []);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    haptics.celebrate();

    try {
      await updateSellerProfile({
        ...(shopName.trim() ? { shop_name: shopName.trim() } : {}),
        // Only as a pair — the backend refuses a lone coordinate anyway, and
        // sending one would be a round trip that can only fail.
        ...(coords ? { shop_latitude: coords.latitude, shop_longitude: coords.longitude } : {}),
      });
    } catch (e) {
      // Best-effort: a failed write must not strand a seller on the last step
      // of signup. Both values are editable from the dashboard.
      logger.warn("onboarding: could not save shop details", e);
    }

    // replace, so the onboarding stack is gone for good.
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-6">
            <SuccessMark size={92} />
          </View>
          <Text className="text-[28px] font-bold leading-9 text-center text-text-primary">
            Name your shop
          </Text>
          <Text className="text-base mt-2 text-center text-text-secondary">
            This is what buyers see. You can change it later.
          </Text>

          <TextInput
            value={shopName}
            onChangeText={setShopName}
            placeholder="e.g. Amaka Fabrics"
            placeholderTextColor={t.textMuted}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => valid && finish()}
            accessibilityLabel="Shop name"
            className="h-14 mt-8 px-4 rounded border border-border-strong bg-surface-sunken text-[17px] text-text-primary"
          />

          {/* The location ask, in the same breath as the name. */}
          <Pressable
            onPress={locate}
            disabled={locating}
            accessibilityRole="button"
            accessibilityLabel={
              coords ? `Shop location set to ${locationLabel}. Change` : "Set shop location"
            }
            className="flex-row items-center gap-3 mt-4 h-14 px-4 rounded-xl bg-surface-sunken"
          >
            {locating ? (
              <ActivityIndicator size="small" color={t.primaryText} />
            ) : (
              <MapPin size={19} color={coords ? t.primaryText : t.textSecondary} strokeWidth={2} />
            )}
            <View className="flex-1">
              <Text
                className={`text-[15px] ${coords ? "font-semibold text-text-primary" : "text-text-secondary"}`}
                numberOfLines={1}
              >
                {locating
                  ? "Finding your shop…"
                  : (locationLabel ?? "Set your shop location")}
              </Text>
              {coords ? (
                <Text className="text-[12px] text-text-muted mt-0.5">
                  Buyers nearby will see you first
                </Text>
              ) : null}
            </View>
          </Pressable>

          <Text className="text-[13px] mt-4 leading-5 text-text-muted">
            You'll add your first product, categories and payout details from
            your dashboard — no need to do it all now.
          </Text>
        </ScrollView>

        <View className="px-6 pb-6 gap-3">
          <Pressable
            onPress={finish}
            disabled={!valid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !valid }}
            className={`h-[52px] rounded items-center justify-center ${
              valid ? "bg-primary-fill" : "bg-surface-sunken"
            }`}
          >
            <Text
              className={`text-[16px] font-bold ${
                valid ? "text-text-on-primary" : "text-text-muted"
              }`}
            >
              Open my shop
            </Text>
          </Pressable>

          {/* No dead end: a seller who isn't ready to name a shop yet can still
              get into the app rather than being stuck on a required field. */}
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            className="h-11 items-center justify-center"
            hitSlop={8}
          >
            <Text className="text-[15px] font-semibold text-text-secondary">
              I'll do this later
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
