import React from 'react';
import { View, Text, ImageBackground, ScrollView, Pressable } from 'react-native';
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react-native';

export default function OrdersScreen() {
  const orders = [
    {
      id: '789012',
      date: '12/15/23',
      total: '$125',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCZQO4IWQ9en4kaC0BkDuSvo6lTsR6AZ9TSIz6TjK3qKSbM0LNG1jtWCtkVc25xoqZjIKahnE_H0AF4aTPge9Jg40cJgpZHDDNGmJNvSEOp1LethHSB05K1Zs0oCPu34tmJPgvYMbRWsr9Tbi8LrM4DM6n3_b11g6oPtT2_Sv1HMk3bl2CLY92MMnlXvjqpp-QmG2zeym60ShebZHqT51xhqg0-3e8z2SfG7iDgnmn-fcc70UDCxeO1ymulPmBJObV1LwKu99wiNw',
    },
    {
      id: '345678',
      date: '11/20/23',
      total: '$75',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDmCyJxWlCXwf2hrkXRgGRu4ATOx0vVDIBtQE7Ts9ltxtQYm_a_whiE9_kGd5Zc5nKTlLGbQwgWl2-K-qHUc2PrGn97MTWgccQ9ql2wxNdSyWScL83UzQ-_E-tIHr701a_Wku6tISnnnXpbMPcYV60ubSg15FqKK9LaADTwgq9uGQyc1KnNV5156Qh_gf8FFRNcXceXktfYuSXOkYLBDc7Vhuhza05QvsuZgqHITKJNdapFMKgdP_iPIFmpvggUGmXqQVAkp9ltJQ',
    },
    {
      id: '901234',
      date: '10/25/23',
      total: '$200',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCUe-w-9vRCLr1V5TkbrLNDbvoHnLbGAFGTStbFevNlzzQOunL4EoI7b5oJYQynJL4NRUcpn9Oc-hmTykuC0oyJLbwZC3OrU5-HI89bIlr2wVbR-hY8ehuqW8dsJSsFaBevkgIHqprXqhPXDjKxKIfDD5BVldeLay-hgN2Lfl0uF8SrGtPi31CJaRYALqegmuwb4FkRSbPokEsJa0usfsd1FMm-pFWnxnJ4CwAy8LeHWT6vVU3MjXaf_NX17o2vJ1mKOSU8MJLUmw',
    },
    {
      id: '567890',
      date: '09/30/23',
      total: '$50',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBYrGlZ5byF4l3HfHKQ97NTJTZaBQB0tMF1Xd5yKRtiGdZyFrmkgf3Kgk2eNJyq-zkZbqv-uJ2GowdwkHbQ_54oB6IBw2rd0epIRmRZ-yjxDKgBWmoZh1dI9X6juMe7KPUmFr27EM0AtWacogSoaDzn_hJsa0EQhO2VDFMRmDPZc7eUR_q2PCtB6t3ly6gE3w5wwIWnu_XbSOf61tO_e51TRI8UceAMQs1KIo4EDD1cE0lKt1E-BuDgN0ySCY3-QTBG4MpTTu-ttA',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
      <View className="p-4 pb-2 flex-row justify-between items-center">
        <ArrowLeft size={24} color="#181111" />
        <Text className="text-[#181111] text-lg font-bold text-center flex-1 -ml-6">Orders</Text>
        <Pressable className="h-12 w-12 items-center justify-center">
          <ShoppingBag size={24} color="#181111" />
        </Pressable>
      </View>

      <View className="border-b border-[#e5dcdc] px-4 pb-[13px] pt-4 flex-row justify-between">
        <Text className="text-sm font-bold text-[#886364] border-b-[3px] border-transparent pb-[13px] flex-1 text-center">Active</Text>
        <Text className="text-sm font-bold text-[#181111] border-b-[3px] border-[#181111] pb-[13px] flex-1 text-center">History</Text>
      </View>

      {orders.map((order) => (
        <View key={order.id} className="flex-row justify-between items-start gap-4 px-4 py-3">
          <ImageBackground
            source={{ uri: order.image }}
            className="rounded-lg w-[70px] aspect-[3/4] bg-cover bg-center"
            imageStyle={{ borderRadius: 8 }}
          />
          <View className="flex-1 justify-center">
            <Text className="text-[#181111] text-base font-medium">Order number: {order.id}</Text>
            <Text className="text-[#886364] text-sm">Order date: {order.date}</Text>
            <Text className="text-[#886364] text-sm">Total: {order.total}</Text>
          </View>
          <ArrowRight size={24} color="#181111" />
        </View>
      ))}
    </ScrollView>
  );
}
