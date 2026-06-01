import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronsUpDown } from "lucide-react-native";
import { useTheme } from "../../components/themeProvider";



export default function PaymentInfo() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [useLinkedPhone, setUseLinkedPhone] = useState(false);
  const [useLinkedEmail, setUseLinkedEmail] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [bank, setBank] = useState("");



  const getBankList = () => {
    // This function would ideally fetch a list of banks from an API or a static list
    return ["Bank A", "Bank B", "Bank C"];
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }}>
      <ScrollView>

        
        {/* Header */}
        <View className={`flex-row items-center p-4 pb-2 justify-between ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
          <TouchableOpacity onPress={() => router.back()} className="size-12 items-center justify-center">
            <ArrowLeft size={24} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
          <Text className={`text-lg font-geist font-bold text-center flex-1 pr-12 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Direct from Account
          </Text>
        </View>

        {/* Account Number */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Account Number"
            placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
            value={accountNumber}
            onChangeText={setAccountNumber}
            className={`w-full rounded h-14 p-4 text-base ${isDark ? "bg-[#2f3132] text-[#f0f1f2]" : "bg-surface text-black"}`}
          />
        </View>

        {/* Phone Number */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            className={`w-full rounded h-14 p-4 text-base ${isDark ? "bg-[#2f3132] text-[#f0f1f2]" : "bg-surface text-black"}`}
          />
        </View>

        {/* Use App-linked Phone */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className={`text-base flex-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Use app-linked phone number
          </Text>
          <Switch
            value={useLinkedPhone}
            onValueChange={setUseLinkedPhone}
            trackColor={{ false: isDark ? "#46464e" : "#E4E4E7", true: "#000000" }}
            thumbColor={isDark ? "#f0f1f2" : "#FFFFFF"}
          />
        </View>

        {/* Email */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Email"
            placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
            value={email}
            onChangeText={setEmail}
            className={`w-full rounded h-14 p-4 text-base ${isDark ? "bg-[#2f3132] text-[#f0f1f2]" : "bg-surface text-black"}`}
          />
        </View>

        {/* Use App-linked Email */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className={`text-base flex-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Use app-linked email address
          </Text>
          <Switch
            value={useLinkedEmail}
            onValueChange={setUseLinkedEmail}
            trackColor={{ false: isDark ? "#46464e" : "#E4E4E7", true: "#000000" }}
            thumbColor={isDark ? "#f0f1f2" : "#FFFFFF"}
          />
        </View>

        {/* Select Bank */}
        <View className="px-4 py-3">
          <View className={`flex-row items-center rounded h-14 overflow-hidden ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
            <TextInput
              placeholder="Select Bank"
              placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
              value={bank}
              onChangeText={setBank}
              className={`flex-1 h-14 p-4 text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
            />
            <View className="pr-4">
              <ChevronsUpDown size={24} color={isDark ? "#c6c5cf" : "#71717A"} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View className={`px-4 py-3 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
        <TouchableOpacity
          onPress={() => router.push("/checkout/confirmation")}
          className="flex items-center justify-center bg-primary h-12 rounded"
        >
          <Text className="text-white text-base font-bold tracking-[0.015em]">
            Pay
          </Text>
        </TouchableOpacity>
      </View>

      <View className={`h-5 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`} />
    </SafeAreaView>
  );
}
