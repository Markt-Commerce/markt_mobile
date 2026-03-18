import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { WebView } from "react-native-webview";
import { ArrowLeft, ChevronsUpDown } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getPaymentDetails, verifyPayment } from "../../../services/sections/payments";
import { Transaction } from "../../../models/payments";



export default function PaymentInfo() {
  const router = useRouter();

  //this id is not the transaction id, but rather the payment id
  const { id } = useLocalSearchParams();
  
  const [paymentdata, setPaymentdata] = useState<Transaction>();
  
  useEffect(() => {
    
  }, [id])
  
/* We would need to check here if access code is available */
  return (
    <View className="flex-1 bg-white justify-between">
        <WebView
          source={{ uri: `https://checkout.paystack.com/${paymentdata?.gateway_response["access_code"]}` }}
          style={{ marginTop: 20 }}
        />
    </View>
  );
}
