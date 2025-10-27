import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronsUpDown } from "lucide-react-native";

export default function PaymentInfo() {
  const router = useRouter();

  const [useLinkedPhone, setUseLinkedPhone] = useState(false);
  const [useLinkedEmail, setUseLinkedEmail] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [bank, setBank] = useState("");

  return (
    <View className="flex-1 bg-white justify-between">
      <ScrollView>
        {/* Header */}
        <View className="flex-row items-center bg-white p-4 pb-2 justify-between">
          <TouchableOpacity onPress={() => router.back()} className="size-12 items-center justify-center">
            <ArrowLeft size={24} color="#171311" />
          </TouchableOpacity>
          <Text className="text-[#171311] text-lg font-bold text-center flex-1 pr-12">
            Direct from Account
          </Text>
        </View>

        {/* Account Number */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Account Number"
            placeholderTextColor="#876d64"
            value={accountNumber}
            onChangeText={setAccountNumber}
            className="w-full bg-[#f4f1f0] text-[#171311] rounded-lg h-14 p-4 text-base"
          />
        </View>

        {/* Phone Number */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#876d64"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            className="w-full bg-[#f4f1f0] text-[#171311] rounded-lg h-14 p-4 text-base"
          />
        </View>

        {/* Use App-linked Phone */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-[#171311] text-base flex-1">
            Use app-linked phone number
          </Text>
          <Switch
            value={useLinkedPhone}
            onValueChange={setUseLinkedPhone}
            trackColor={{ false: "#f4f1f0", true: "#e26136" }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Email */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Email"
            placeholderTextColor="#876d64"
            value={email}
            onChangeText={setEmail}
            className="w-full bg-[#f4f1f0] text-[#171311] rounded-lg h-14 p-4 text-base"
          />
        </View>

        {/* Use App-linked Email */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-[#171311] text-base flex-1">
            Use app-linked email address
          </Text>
          <Switch
            value={useLinkedEmail}
            onValueChange={setUseLinkedEmail}
            trackColor={{ false: "#f4f1f0", true: "#e26136" }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Select Bank */}
        <View className="px-4 py-3">
          <View className="flex-row items-center bg-[#f4f1f0] rounded-lg h-14 overflow-hidden">
            <TextInput
              placeholder="Select Bank"
              placeholderTextColor="#876d64"
              value={bank}
              onChangeText={setBank}
              className="flex-1 text-[#171311] h-14 p-4 text-base"
            />
            <View className="pr-4">
              <ChevronsUpDown size={24} color="#876d64" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View className="px-4 py-3">
        <TouchableOpacity
          onPress={() => router.push("/checkout/confirmation")}
          className="flex items-center justify-center bg-[#e26136] h-12 rounded-lg"
        >
          <Text className="text-white text-base font-bold tracking-[0.015em]">
            Pay
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-white" />
    </View>
  );
}
