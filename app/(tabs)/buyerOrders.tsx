import React from "react";
import { View, Text } from "react-native";
import OrdersList from "../../components/orderList";

const fetchBuyerOrders = async (page: number) => {
  // Dummy data for now
  return new Promise<any[]>((resolve) =>
    setTimeout(
      () =>
        resolve(
          page > 2
            ? []
            : [
                { id: "#789012", status: "Shipped", total: "$150.00", progress: 75 },
                { id: "#901234", status: "Processing", total: "$220.00", progress: 25 },
              ]
        ),
      1000
    )
  );
};

export default function BuyerOrders() {
  return (
    <View className="flex-1 bg-white">
      <Text className="text-lg font-bold p-4">My Orders</Text>
      <OrdersList fetchOrders={fetchBuyerOrders} />
    </View>
  );
}
