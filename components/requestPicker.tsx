import React, { useMemo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type { BuyerRequest } from "../models/feed";

type Props = {
  visible: boolean;
  requests: BuyerRequest[];
  loading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSelect: (request: BuyerRequest) => void;
};

export default function RequestPicker({
  visible,
  requests,
  loading = false,
  disabled = false,
  onClose,
  onSelect,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "100%"], []);

  if (!visible) return null;

  const handleSelect = (item: BuyerRequest) => {
    if (disabled) return;
    onSelect(item);
  };

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
      handleIndicatorStyle={{
        backgroundColor: "#E4E4E7",
        width: 40,
        height: 4,
        borderRadius: 8,
      }}
    >
      <BottomSheetView className="flex-1 px-4">
        <Text className="text-lg font-semibold mt-4 mb-2">Share a request</Text>

        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#000000" />
            <Text className="text-tertiary text-sm mt-3">Loading requests…</Text>
          </View>
        ) : requests.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-center text-tertiary">No requests to share.</Text>
            <Text className="text-center text-tertiary text-sm mt-1">
              Create a request from the Requests tab first.
            </Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  disabled={disabled}
                  className={`p-3 mb-2 rounded bg-surface border border-border ${disabled ? "opacity-50" : ""}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Share request ${item.title}`}
                >
                <Text className="text-base font-medium text-black" numberOfLines={2}>
                  {item.title || "Untitled request"}
                </Text>
                {item.description ? (
                  <Text className="text-sm text-tertiary mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                {item.budget != null && (
                  <Text className="text-sm text-black font-semibold mt-1">
                    Budget: ₦{Number(item.budget).toLocaleString()}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
