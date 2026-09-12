import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import AddressList from "../../components/address/AddressList";
import { listAddresses, createAddress } from "../../services/sections/addresses";
import type { SavedAddress } from "../../models/addresses";
import type { LookupResult } from "../../hooks/useAddressLookup";
import { useToast } from "../../components/ToastProvider";
import logger from "../../utils/logger";

/**
 * The address book in Profile.
 *
 * The same list and the same rows as the checkout picker, with a different
 * title and one behaviour change: tapping a row opens it for editing rather
 * than choosing it, because here there is nothing to choose.
 */
export default function AddressesScreen() {
  const router = useRouter();
  const t = useTokens();
  const { show } = useToast();
  const [addresses, setAddresses] = React.useState<SavedAddress[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setAddresses(await listAddresses());
    } catch (error) {
      logger.error("Could not load addresses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // On focus, not just on mount: coming back from the editor must show the
  // edit, and coming back from a delete must not show a row that is gone.
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const handlePicked = async (found: LookupResult) => {
    try {
      const saved = await createAddress({
        formatted_address: found.formatted_address,
        latitude: found.latitude,
        longitude: found.longitude,
        // Carried so checkout can fill the order's shipping address, which
        // still requires a city and state as fields.
        city: found.city ?? null,
        state: found.state ?? null,
      });
      // Straight into the editor, because a place that has just been found
      // has no label, no entry code and no directions — and this is the one
      // moment the buyer knows all three.
      router.push(`/address/${saved.id}` as any);
    } catch (error) {
      logger.error("Could not save address:", error);
      show({
        variant: "error",
        title: "Couldn't save that address",
        message: "Please try again.",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <View className="flex-row items-center gap-3 px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-sunken"
        >
          <ArrowLeft size={20} color={t.textPrimary} />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-text-primary">Saved addresses</Text>
      </View>

      <AddressList
        addresses={addresses}
        loading={loading}
        onEdit={(a) => router.push(`/address/${a.id}` as any)}
        onPick={handlePicked}
      />
    </SafeAreaView>
  );
}
