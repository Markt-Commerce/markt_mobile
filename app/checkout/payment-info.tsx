import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronsUpDown } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";



export default function PaymentInfo() {
  const router = useRouter();
  const t = useTokens();

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
    <SafeAreaView className="flex-1 bg-surface-page">
      <ScrollView>

        
        {/* Header */}
        <View className="flex-row items-center p-4 pb-2 justify-between bg-surface-raised">
          <TouchableOpacity onPress={() => router.back()} className="size-12 items-center justify-center">
            <ArrowLeft size={24} color={t.textPrimary} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-center flex-1 pr-12 text-text-primary">
            Direct from Account
          </Text>
        </View>

        {/* Account Number */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Account Number"
            placeholderTextColor={t.textSecondary}
            value={accountNumber}
            onChangeText={setAccountNumber}
            className="w-full rounded h-14 p-4 text-base bg-surface-sunken text-text-primary"
          />
        </View>

        {/* Phone Number */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor={t.textSecondary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            className="w-full rounded h-14 p-4 text-base bg-surface-sunken text-text-primary"
          />
        </View>

        {/* Use App-linked Phone */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-base flex-1 text-text-primary">
            Use app-linked phone number
          </Text>
          <Switch
            value={useLinkedPhone}
            onValueChange={setUseLinkedPhone}
            trackColor={{ false: t.borderStrong, true: t.textPrimary }}
            thumbColor={t.textPrimary}
          />
        </View>

        {/* Email */}
        <View className="px-4 py-3">
          <TextInput
            placeholder="Email"
            placeholderTextColor={t.textSecondary}
            value={email}
            onChangeText={setEmail}
            className="w-full rounded h-14 p-4 text-base bg-surface-sunken text-text-primary"
          />
        </View>

        {/* Use App-linked Email */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-base flex-1 text-text-primary">
            Use app-linked email address
          </Text>
          <Switch
            value={useLinkedEmail}
            onValueChange={setUseLinkedEmail}
            trackColor={{ false: t.borderStrong, true: t.textPrimary }}
            thumbColor={t.textPrimary}
          />
        </View>

        {/* Select Bank */}
        <View className="px-4 py-3">
          <View className="flex-row items-center rounded h-14 overflow-hidden bg-surface-sunken">
            <TextInput
              placeholder="Select Bank"
              placeholderTextColor={t.textSecondary}
              value={bank}
              onChangeText={setBank}
              className="flex-1 h-14 p-4 text-base text-text-primary"
            />
            <View className="pr-4">
              <ChevronsUpDown size={24} color={t.textSecondary} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View className="px-4 py-3 bg-surface-raised">
        <TouchableOpacity
          onPress={() => router.push("/checkout/confirmation")}
          className="flex items-center justify-center bg-primary-fill h-12 rounded"
        >
          <Text className="text-white text-base font-bold tracking-[0.015em]">
            Pay
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-surface-raised" />
    </SafeAreaView>
  );
}
