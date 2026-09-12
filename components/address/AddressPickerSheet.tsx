import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTokens } from "../../theme/useTokens";
import AddressList from "./AddressList";
import { listAddresses, createAddress } from "../../services/sections/addresses";
import type { SavedAddress } from "../../models/addresses";
import type { LookupResult } from "../../hooks/useAddressLookup";
import { useToast } from "../ToastProvider";
import logger from "../../utils/logger";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** The chosen address, whether saved or picked once. */
  onChoose: (address: SavedAddress) => void;
  selectedId?: number | null;
  title?: string;
}

/**
 * Choosing where a delivery goes.
 *
 * The same list as the address book in Profile, in a sheet, with a different
 * title — which is the whole design: a buyer should not learn two different
 * address interfaces, and we should not maintain two.
 *
 * Replaces typing street / city / postcode into a form at checkout. That form
 * asked for a postcode, which most of the places Markt delivers to do not
 * have, and produced no coordinate at all — so the fee could not be priced
 * from it and a rider could not be sent to it.
 */
export default function AddressPickerSheet({
  visible,
  onClose,
  onChoose,
  selectedId,
  title = "Delivery address",
}: Props) {
  const t = useTokens();
  const router = useRouter();
  const { show } = useToast();
  const [addresses, setAddresses] = React.useState<SavedAddress[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setAddresses(await listAddresses());
    } catch (error) {
      logger.error("Could not load saved addresses:", error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  /** A place found by search or GPS. Saved immediately, because an address
   * you delivered to once you will almost certainly deliver to again — and
   * asking "do you want to save this?" at checkout is a question nobody wants
   * mid-purchase. It can be renamed or deleted later. */
  const handlePicked = async (found: LookupResult) => {
    try {
      const saved = await createAddress({
        formatted_address: found.formatted_address,
        latitude: found.latitude,
        longitude: found.longitude,
      });
      onChoose(saved);
      onClose();
    } catch (error) {
      logger.error("Could not save the picked address:", error);
      show({
        variant: "error",
        title: "Couldn't use that address",
        message: "Please try again, or pick one you've saved before.",
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <SafeAreaView className="flex-1 bg-surface-page">
        <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
          <Text className="text-[24px] font-bold text-text-primary">{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-sunken"
          >
            <X size={20} color={t.textPrimary} />
          </TouchableOpacity>
        </View>

        <AddressList
          addresses={addresses}
          loading={loading}
          selectedId={selectedId}
          showUseOnce
          onSelect={(a) => {
            onChoose(a);
            onClose();
          }}
          onEdit={(a) => {
            onClose();
            router.push(`/address/${a.id}` as any);
          }}
          onPick={handlePicked}
        />
      </SafeAreaView>
    </Modal>
  );
}
