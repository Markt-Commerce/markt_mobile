import React, { useMemo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Trash2 } from "lucide-react-native";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

type Props = {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onSelect: (p: Product) => void;
  onRemove?: (p: Product) => void;
  selectedProducts: Product[];
};

export default function ProductPicker({
  visible,
  products,
  selectedProducts,
  onClose,
  onSelect,
  onRemove,
}: Props) {
  
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["40%", "80%", "100%"], []);

  if (!visible) return null;

  const isSelected = (product: Product) =>
    selectedProducts.some((p) => p.id === product.id);

  const handleSelect = (item: Product) => {
    onSelect(item);
    requestAnimationFrame(onClose); // smoother close
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
      backgroundStyle={{ backgroundColor: "#fff" }}
      handleIndicatorStyle={{
        backgroundColor: "#ccc",
        width: 40,
        height: 4,
        borderRadius: 2,
      }}
    >
      <BottomSheetView className="flex-1 px-4">
        <Text className="text-lg font-semibold mt-4 mb-2">Select Product</Text>

        {products.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No products available.
          </Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const selected = isSelected(item);

              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  className={`flex-row items-center p-3 mb-2 rounded-lg ${selected ? "bg-blue-100" : "bg-gray-100"}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name}, priced at $${item.price}`}
                >
                  <Image
                    source={
                      item.image
                        ? { uri: item.image }
                        : require("../assets/placeholder.png") // Make sure you have a placeholder image
                    }
                    className="w-12 h-12 rounded-md bg-gray-300 mr-3"
                  />

                  <View className="flex-1">
                    <Text className="text-base font-medium">{item.name}</Text>
                    <Text className="text-sm text-gray-500">${item.price}</Text>
                  </View>

                  {onRemove && (
                    <TouchableOpacity
                      onPress={() => handleRemove(item)}
                      className="p-2 rounded-full hover:bg-red-100"
                      accessibilityLabel={`Remove ${item.name}`}
                    >
                      <Trash2 color="#ef4444" size={20} />
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
