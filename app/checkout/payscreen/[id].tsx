import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { WebView } from "react-native-webview";
import { ArrowLeft, ChevronsUpDown } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getPaymentDetails, verifyPayment } from "../../../services/sections/payments";
import { Transaction } from "../../../models/payments";
import { useTheme } from "../../../components/themeProvider";



export default function PaymentInfo() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  //this id is not the transaction id, but rather the payment id
  const { id } = useLocalSearchParams();
  
  const [paymentdata, setPaymentdata] = useState<Transaction>();
  
  useEffect(() => {
    if (id) {
      getPaymentDetails(id as string)
        .then((paymentData) => {
          setPaymentdata(paymentData);
        })
        .catch(console.error);
    }
  }, [id]);
  
  const gatewayData = paymentdata?.gateway_response.data;
  const checkoutUrl =
    gatewayData?.authorization_url ||
    (gatewayData?.access_code ? `https://checkout.paystack.com/${gatewayData.access_code}` : "");

  return (
    <View className={`flex-1 justify-between ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
        <WebView
          source={{ uri: checkoutUrl }}
          style={{ marginTop: 20, backgroundColor: isDark ? "#1a1c1d" : "white" }}
        />
    </View>
  );
}
