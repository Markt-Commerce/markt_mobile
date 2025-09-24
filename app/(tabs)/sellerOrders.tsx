import React from "react";
import { View, Text } from "react-native";
import OrdersList from "../../components/orderList";

const fetchSellerOrders = async (page: number) => {
  // Dummy data for now
  return new Promise<any[]>((resolve) =>
    setTimeout(
      () =>
        resolve(
          page > 2
            ? []
            : [
                { from: "Olivia Bennett", product: "Leather Wallet", order: "#123456 - 2 items", price: "$50" },
                { from: "Ethan Carter", product: "Vintage Sunglasses", order: "#345678 - 3 items", price: "$75" },
              ]
        ),
      1000
    )
  );
};

export default function SellerOrders() {
  return (
    <View className="flex-1 bg-white">
      <Text className="text-lg font-bold p-4">Shop Orders</Text>
      <OrdersList fetchOrders={fetchSellerOrders} isSeller />
    </View>
  );
}
