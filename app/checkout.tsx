import React from 'react';
import { View, Text, ImageBackground, Pressable, ScrollView } from 'react-native';
import { ArrowLeft, Pencil } from 'lucide-react-native';

const CheckoutScreen = () => {
  return (
    <View className="flex-1 bg-white justify-between">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="flex flex-row items-center p-4 pb-2 justify-between">
          <ArrowLeft color="#171311" size={24} />
          <Text className="text-[#171311] text-lg font-bold text-center flex-1 pr-12">Checkout</Text>
        </View>

        {/* Shipping Address */}
        <Text className="text-[#171311] text-lg font-bold px-4 pb-2 pt-4">Shipping Address</Text>
        <View className="flex-row bg-white px-4 py-3 justify-between gap-4">
          <View className="flex-1 justify-center">
            <Text className="text-[#171311] text-base font-medium">Olivia Bennett</Text>
            <Text className="text-[#876d64] text-sm">Phone: (555) 123-4567</Text>
            <Text className="text-[#876d64] text-sm">123 Elm Street, Apt 4B, Springfield, IL 62704</Text>
          </View>
          <View className="shrink-0">
            <View className="text-[#171311] size-7 items-center justify-center">
              <Pencil color="#171311" size={24} />
            </View>
          </View>
        </View>

        {/* Items */}
        <Text className="text-[#171311] text-lg font-bold px-4 pb-2 pt-4">Items</Text>
        <View className="flex-row items-center gap-4 px-4 py-2 min-h-[72px]">
          <ImageBackground
            className="aspect-square size-14 rounded-lg"
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdmxuEEzSd3p2JL9xTRn3tjcwpe27YbuykcbZQZ7vsTDStaO2U23rirSpv1uCqVtZbsBqJZtmQT77dUhi5QD5cz0XtcN8Q80Wr9cIigXdSfNDWT7RVucfd7_PBEgVA7dXO0EcrylWIkpur6aYgxPquBCi4b8Y5GZ7VI2r6wTOlk2jFC5s6Tr-gL9TX3Tmf9GwA-e1kip-UkihrZi9rX2-uPbOJclLObLy7hV6VgyFg5d8sOIvhtLiJyuYt4nePrg8pJeQA8GWG5A',
            }}
            resizeMode="cover"
          />
          <View className="justify-center">
            <Text className="text-[#171311] text-base font-medium">Vintage Denim Jacket</Text>
            <Text className="text-[#876d64] text-sm">Size M · Qty 1</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 px-4 py-2 min-h-[72px]">
          <ImageBackground
            className="aspect-square size-14 rounded-lg"
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf4BMKzM5lkALrDH85dV9ShZf8ZapO9skVKK_BVPfOgpyCQFSm73oBiXZs8F1VAeIeKFyj4AHosqc5cFzWwIPRhW5OpVtSfAhhjtoovGaUU8koOuJ2fBwklXni3Wbn09owJEHQTTSQ9WzI0LIks294gjPA1pv-4uS-FKaTNVtxzCq3gj9gZVRwuUkJvceHcYb2o7qXxg9fotmnaTH0mzy7RF2kuMJtuLdp6MXsrI5tZ2Y9Bs3LehKYSLiUthvcdsX_NG6aohBkgg',
            }}
            resizeMode="cover"
          />
          <View className="justify-center">
            <Text className="text-[#171311] text-base font-medium">Leather Ankle Boots</Text>
            <Text className="text-[#876d64] text-sm">Size 8 · Qty 1</Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text className="text-[#171311] text-lg font-bold px-4 pb-2 pt-4">Payment Method</Text>
        <View className="flex-row items-center justify-between px-4 py-2 min-h-14">
          <View className="flex-row items-center gap-4">
            <ImageBackground
              className="h-6 w-10 bg-contain"
              source={require('../assets/mastercard.png')} // Replace with actual local path or use URI
              resizeMode="contain"
            />
            <Text className="text-[#171311] text-base flex-1 truncate">MasterCard ...1234</Text>
          </View>
          <Pencil color="#171311" size={24} />
        </View>

        {/* Pricing Summary */}
        <View className="p-4">
          {[
            { label: 'Subtotal', value: '$120.00' },
            { label: 'Shipping', value: '$5.00' },
            { label: 'Taxes', value: '$10.00' },
            { label: 'Total', value: '$135.00' },
          ].map(({ label, value }) => (
            <View key={label} className="flex-row justify-between py-2">
              <Text className="text-[#876d64] text-sm">{label}</Text>
              <Text className="text-[#171311] text-sm">{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View>
        <View className="px-4 py-3">
          <Pressable className="h-12 flex-1 bg-[#e26136] rounded-full items-center justify-center">
            <Text className="text-white text-base font-bold tracking-[0.015em]">Confirm and Pay</Text>
          </Pressable>
        </View>
        <View className="h-5 bg-white" />
      </View>
    </View>
  );
};

export default CheckoutScreen;
