import React, { useMemo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Trash2 } from "lucide-react-native";
import { ProductResponse } from "../models/products";
import { resolveProductImageUri } from "../utils/imageUri";
import { formatNaira } from "../utils/formatCurrency";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

type Props = {
  visible: boolean;
  products: ProductResponse[];
  loading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSelect: (p: Product) => void;
  onRemove?: (p: Product) => void;
  selectedProducts: ProductResponse[];
};

export default function ProductPicker({
  visible,
  products,
  loading = false,
  disabled = false,
  selectedProducts,
  onClose,
  onSelect,
  onRemove,
}: Props) {
  
  const sheetRef = useRef<BottomSheet>(null); //refs should control the bottomsheet state and not bools
  //note to work on this later and expose refs to parent
  const snapPoints = useMemo(() => ["60%", "100%"], []);

  if (!visible) return null;

  const isSelected = (product: Product) =>
    selectedProducts.some((p) => p.id === product.id);

  const handleSelect = (item: Product) => {
    if (disabled) return;
    onSelect(item);
  };

  const handleRemove = (item: Product) => {
    if (onRemove) {
      onRemove(item);
    }
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
        <Text className="text-lg font-semibold mt-4 mb-2">Select Product</Text>

        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#000000" />
            <Text className="text-tertiary text-sm mt-3">Loading products…</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-center text-tertiary">
              No products available.
            </Text>
            <Text className="text-center text-tertiary text-sm mt-1">
              Create products in your dashboard first.
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const selected = isSelected(item);
              const imageUri = resolveProductImageUri(item);

              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  disabled={disabled}
                  className={`flex-row items-center p-3 mb-2 rounded border ${
                    selected ? "bg-white border-border" : "bg-surface border-transparent"
                  } ${disabled ? "opacity-50" : ""}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name}, priced at ${formatNaira(item.price)}`}
                >
                  <Image
                    source={
                      imageUri ? { uri: imageUri } : require("../assets/icon.png")
                    }
                    className="w-12 h-12 rounded bg-surface-dim border border-border mr-3"
                  />

                  <View className="flex-1">
                    <Text className="text-base font-medium">{item.name}</Text>
                    <Text className="text-sm text-tertiary">{formatNaira(item.price)}</Text>
                  </View>

                  {onRemove && (
                    <TouchableOpacity
                      onPress={() => handleRemove(item)}
                      className="p-2 rounded bg-white border border-border"
                      accessibilityLabel={`Remove ${item.name}`}
                    >
                      <Trash2 color="#ba1a1a" size={20} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
