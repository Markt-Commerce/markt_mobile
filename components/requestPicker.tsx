import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import InputSheet from "./InputSheet";
import type { BuyerRequest } from "../models/feed";
import { useTokens } from "../theme/useTokens";

type Props = {
  visible: boolean;
  requests: BuyerRequest[];
  loading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSelect: (request: BuyerRequest) => void;
};

/**
 * Picks one of the buyer's requests to share in a chat.
 *
 * On InputSheet (a Modal) for the same reason as ProductPicker: the quick
 * chat renders this inside its own Modal, where a gorhom sheet was squeezed
 * under the message bar and could not be swiped closed. The footer button
 * is the reliable way out.
 */
export default function RequestPicker({
  visible,
  requests,
  loading = false,
  disabled = false,
  onClose,
  onSelect,
}: Props) {
  const t = useTokens();

  const handleSelect = (item: BuyerRequest) => {
    if (disabled) return;
    onSelect(item);
  };

  const footer = (
    <>
      <View className="flex-1" />
      <TouchableOpacity
        onPress={onClose}
        accessibilityRole="button"
        className="min-h-[44px] items-center justify-center rounded-xl px-5 bg-primary-fill"
      >
        <Text className="text-[15px] font-bold text-text-on-primary">Close</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <InputSheet
      title="Share a request"
      visible={visible}
      onClose={onClose}
      footer={footer}
      maxHeight="80%"
    >
      {loading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator
            size="large"
            color={t.textPrimary}
          />
          <Text
            className="text-text-secondary text-sm mt-3"
          >
            Loading requests...
          </Text>
        </View>
      ) : requests.length === 0 ? (
        <View className="items-center justify-center py-12">
          <Text
            className="text-center text-text-secondary"
          >
            No requests to share.
          </Text>
          <Text
            className="text-center text-sm mt-1 text-text-secondary"
          >
            Create a request from the Requests tab first.
          </Text>
        </View>
      ) : (
        // A plain map: InputSheet's body is already a ScrollView.
        requests.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleSelect(item)}
            disabled={disabled}
            className={`p-3 mb-2 rounded border bg-surface-sunken border-border ${disabled ? "opacity-50" : ""}`}
            accessibilityRole="button"
            accessibilityLabel={`Share request ${item.title}`}
          >
            <Text
              className="text-base font-medium text-text-primary"
              numberOfLines={2}
            >
              {item.title || "Untitled request"}
            </Text>
            {item.description ? (
              <Text
                className="text-sm mt-1 text-text-secondary"
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
            {item.budget != null && (
              <Text
                className="text-sm font-semibold mt-1 text-text-primary"
              >
                Budget: ₦{Number(item.budget).toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        ))
      )}
    </InputSheet>
  );
}
