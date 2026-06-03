import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type { BuyerRequest } from "../models/feed";
import { useTheme } from "./themeProvider";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
      backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "#FFFFFF" }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#46464e" : "#E4E4E7",
        width: 40,
        height: 4,
        borderRadius: 8,
      }}
    >
      <BottomSheetView className="flex-1 px-4">
        <Text
          className={`text-lg font-semibold mt-4 mb-2 ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Share a request
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator
              size="large"
              color={isDark ? "#f5f5f5" : "#000000"}
            />
            <Text
              className={`${isDark ? "text-dark-muted" : "text-tertiary"} text-sm mt-3`}
            >
              Loading requests...
            </Text>
          </View>
        ) : requests.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Text
              className={`text-center ${isDark ? "text-dark-muted" : "text-tertiary"}`}
            >
              No requests to share.
            </Text>
            <Text
              className={`text-center text-sm mt-1 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
            >
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
                className={`p-3 mb-2 rounded border ${isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"} ${disabled ? "opacity-50" : ""}`}
                accessibilityRole="button"
                accessibilityLabel={`Share request ${item.title}`}
              >
                <Text
                  className={`text-base font-medium ${isDark ? "text-dark-text" : "text-black"}`}
                  numberOfLines={2}
                >
                  {item.title || "Untitled request"}
                </Text>
                {item.description ? (
                  <Text
                    className={`text-sm mt-1 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}
                {item.budget != null && (
                  <Text
                    className={`text-sm font-semibold mt-1 ${isDark ? "text-dark-text" : "text-black"}`}
                  >
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
