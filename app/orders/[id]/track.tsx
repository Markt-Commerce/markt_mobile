import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter , useLocalSearchParams } from "expo-router";
import { ArrowLeft, MapPin, Truck, PackageCheck, CheckCircle2, Clock } from "lucide-react-native";
import { getOrderDetails } from "../../../services/sections/orders";
import { Order } from "../../../models/orders";


const { id } = useLocalSearchParams();

type Step = {
  key: "placed" | "pending_payment" | "shipped" | "out" | "delivered";
  label: string;
  time?: string;
  done?: boolean;
};

export default function TrackOrderScreen() {
  const router = useRouter();
  // const { data, loading } = useOrderTracking(id as string);

  const [orderDetails, setOrderDetails] = useState<Order>();

  const [steps, setSteps] = useState<Step[]>();

  const progressPct = useMemo(() => {
    const total = steps?.length;
    const done = steps?.filter((s) => s.done).length;
    return Math.round((done || 0) / (total || 1) * 100);
  }, [steps]);

  useEffect(() => {
    // Fetch order tracking data here and update steps accordingly
    const fetchTrackingData = async () => {

      const steps: Step[] = [
        { key: "placed", label: "Order placed",  done: true },
        { key: "pending_payment", label: "Pending payment",  done: true },
        { key: "shipped", label: "Shipped", done: true },
        { key: "out", label: "Out for delivery",  done: false },
        { key: "delivered", label: "Delivered",  done: false },
      ];
      const data = await getOrderDetails(id as string);
      // Update steps based on fetched data
      let isSet = false;
      
      for (const step of steps) {
        if (isSet) {
          isSet = step.key === data.status;
        }
        step.done = !isSet;
      }
      setSteps(steps);
    };

    fetchTrackingData();
  }, [id]);

  const StatusIcon = ({ k, done }: { k: Step["key"]; done?: boolean }) => {
    const color = done ? "#000000" : "#A1A1AA";
    if (k === "placed") return <Clock size={16} color={color} />;
    if (k === "pending_payment") return <PackageCheck size={16} color={color} />;
    if (k === "shipped") return <Truck size={16} color={color} />;
    if (k === "out") return <MapPin size={16} color={color} />;
    return <CheckCircle2 size={16} color={color} />;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 rounded items-center justify-center bg-white border border-border"
        >
          <ArrowLeft size={18} color="#000000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-geist font-bold text-black -ml-10">
          Track order
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Progress header */}
        <View className="px-4">
          <View className="rounded bg-white border border-border p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-black font-geist font-bold">Order #{orderDetails?.id}</Text>
              <Text className="text-black font-semibold">{progressPct}%</Text>
            </View>
            <View className="mt-3 h-2 w-full rounded bg-border overflow-hidden">
              <View className="h-2 bg-primary rounded" style={{ width: `${progressPct}%` }} />
            </View>
            <Text className="mt-2 text-tertiary text-xs">Estimated delivery: Today, 2–4 PM</Text>
          </View>
        </View>

        {/* Timeline */}
        <View className="px-4 mt-4">
          <View className="rounded bg-white border border-border p-4">
            {steps?.map((s, idx) => {
              const last = idx === steps.length - 1;
              return (
                <View key={s.key} className="flex-row">
                  {/* Left rail */}
                  <View className="items-center mr-3">
                    <View
                      className={`h-6 w-6 rounded items-center justify-center ${
                        s.done ? "bg-primary" : "bg-surface-dim"
                      }`}
                    >
                      <StatusIcon k={s.key} done={s.done} />
                    </View>
                    {!last ? (
                      <View className={`flex-1 w-[2px] ${s.done ? "bg-primary" : "bg-border"}`} />
                    ) : (
                      <View className="w-[2px] flex-1" />
                    )}
                  </View>

                  {/* Content */}
                  <View className={`pb-5 ${last ? "pb-0" : ""} flex-1`}>
                    <Text
                      className={`text-base ${
                        s.done ? "text-black font-semibold" : "text-tertiary font-medium"
                      }`}
                    >
                      {s.label}
                    </Text>
                    {!!s.time && (
                      <Text className="text-xs text-tertiary mt-1">{s.time}</Text>
                    )}
                    {/* {s.meta && <Text className="text-xs text-[#8e7a74] mt-1">{s.meta}</Text>} */}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Map / location placeholder */}
        <View className="px-4 mt-4">
          <View className="rounded bg-white border border-border overflow-hidden">
            <View className="h-44 bg-surface items-center justify-center">
              {/* <MapView style={{ height: 220 }} initialRegion={...}>
                <Marker coordinate={{ latitude, longitude }} />
              </MapView> */}
              {/* <MapPin size={22} color="#000000" />
              <Text className="mt-2 text-[#7b6660] text-sm">Live map appears here</Text> */}
            </View>
           
          </View>
        </View>

        {/* Order details card */}
        <View className="px-4 mt-4">
          <View className="rounded bg-white border border-border p-4">
            <Text className="text-black font-geist font-bold mb-2">Delivery details</Text>

            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-tertiary">Courier</Text>
              <Text className="text-sm text-black">Markt Logistics</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-tertiary">Tracking ID</Text>
              <Text className="text-sm text-black">MK-8F2X-901234</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-tertiary">Address</Text>
              <Text className="text-sm text-right text-black w-48">
                221B Market Street, Lower Allston, MA
              </Text>
            </View>

            {/* Later hooks:
            <TouchableOpacity onPress={() => contactCourier()} className="mt-3 h-11 rounded bg-[#000000] items-center justify-center">
              <Text className="text-white font-semibold">Contact courier</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
