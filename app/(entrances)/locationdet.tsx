import React from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { ArrowLeft } from "lucide-react-native";

export default function AddAddressScreen() {
  return (
    <ScrollView className="flex-1 bg-white px-4" contentContainerStyle={{ justifyContent: 'space-between', flexGrow: 1 }}>
      <View className="w-full max-w-[480px] mx-auto">
        <View className="flex-row items-center justify-between pb-2 pt-4">
          <View className="size-12 justify-center">
            <ArrowLeft color="#171212" size={24} />
          </View>
          <Text className="text-[#171212] text-lg font-bold text-center pr-12 flex-1">
            Add Address
          </Text>
        </View>

        <Text className="text-[#171212] text-[22px] font-bold leading-tight text-left pb-3 pt-5">
          Where are you located?
        </Text>

        <TouchableOpacity className="min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#f4f1f1] text-[#171212] text-sm font-bold mb-4">
          <Text className="truncate">Use Current Location</Text>
        </TouchableOpacity>

        <View className="gap-4">
          <View>
            <Text className="text-[#171212] text-base font-medium pb-2">Street Address</Text>
            <TextInput
              placeholder="Street Address"
              placeholderTextColor="#826869"
              className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
            />
          </View>

          <View>
            <Text className="text-[#171212] text-base font-medium pb-2">House Number</Text>
            <TextInput
              placeholder="House Number"
              placeholderTextColor="#826869"
              className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
            />
          </View>

          <View>
            <Text className="text-[#171212] text-base font-medium pb-2">City</Text>
            <TextInput
              placeholder="City"
              placeholderTextColor="#826869"
              className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
            />
          </View>

          <View>
            <Text className="text-[#171212] text-base font-medium pb-2">State</Text>
            <TextInput
              placeholder="State"
              placeholderTextColor="#826869"
              className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
            />
          </View>

          <View>
            <Text className="text-[#171212] text-base font-medium pb-2">Country</Text>
            <TextInput
              placeholder="Country"
              placeholderTextColor="#826869"
              className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
            />
          </View>

          <View>
            <Text className="text-[#171212] text-base font-medium pb-2">Postal Code</Text>
            <TextInput
              placeholder="Postal Code"
              placeholderTextColor="#826869"
              className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
            />
          </View>
        </View>
      </View>

      <View className="w-full max-w-[480px] mx-auto py-4">
        <TouchableOpacity className="min-w-[84px] items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-[#e9b8ba] text-[#171212] text-base font-bold">
          <Text className="truncate">Save</Text>
        </TouchableOpacity>
        <View className="h-5 bg-white" />
      </View>
    </ScrollView>
  );
}
