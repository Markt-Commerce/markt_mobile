import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { WebView } from "react-native-webview";
import { ArrowLeft, ChevronsUpDown } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";



export default function PaymentInfo() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white justify-between">
        <WebView
          source={{ uri: `https://checkout.paystack.com/${id}` }}
          style={{ marginTop: 20 }}
        />
    </View>
  );
}
