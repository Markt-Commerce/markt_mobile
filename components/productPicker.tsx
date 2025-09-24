import React, { useMemo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";

type Props = {
  visible: boolean;
  products: { id: string; name: string; price: number; image?: string }[];
  onClose: () => void;
  onSelect: (p: { id: string; name: string; price: number; image?: string }) => void;
};

export default function ProductPicker({ visible, products, onClose, onSelect }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["40%", "80%", "100%"], []);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#fff" }}
      handleIndicatorStyle={{ backgroundColor: "#ccc", width: 40, height: 4, borderRadius: 2 }}
    >
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginVertical: 10 }}>Select Product</Text>
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              style={{ flexDirection: "row", paddingVertical: 10, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eee" }}
            >
              <Image source={{ uri: item.image }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: "#ddd" }} />
              <View>
                <Text style={{ fontSize: 16, fontWeight: "500" }}>{item.name}</Text>
                <Text style={{ fontSize: 14, color: "#666" }}>${item.price}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </BottomSheet>
  );
}
