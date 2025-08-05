import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';

const cartItems = [
  {
    id: 1,
    name: 'Vintage Denim Jacket',
    size: 'Size M',
    quantity: 1,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCGqfg2D9plOtmNp8_rSMVOFDfWq2GWtu7ljwp9RJoKH3XOC56bBVvfsNx29sJ3Sz_XopPVcfpujab3y7ztDVcZInibhpnEgGivsLrSCO-i5-Rp8OQkhMnHTstBkPu38B6FfxkdGSMiSdeiMDwV7Mw8n-M5UgZcdr-QuErfr_8-5N62lR2HxboAWhjb835ljqUoUqyqt9KqnxsYpRgkNShsPT5QVfPftyKLgaOfieyf04raIkyuubH9sa5PKBYKfjMztCzUxeViaA'
  },
  {
    id: 2,
    name: 'Striped Cotton T-Shirt',
    size: 'Size S',
    quantity: 2,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDxUyVpTUkB87tFoEMqdpRf25TULCM_hlemJXWEDBO-qqKs6SuMC98waXaopOqw5aWkJWO2ykkqKpXlKSDGZOR4Tl1Qcnob61SmhHdWjju-U_bHwjiqgaFfkw6pv0Q7iVmq9619w-i4oo2PhXM7RIIGI3jSDLzhLhp3nsGmg47Bbp19g-MCyWnA38qcXKuCwU-b0SMFbPCGf2wkT0woKPwrRilJGzfgcei7n4jxFGpemXOyhSBmTnokQ31yaQBaCi2AYRyJ7vjOvA'
  },
  {
    id: 3,
    name: 'Leather Ankle Boots',
    size: 'Size 8',
    quantity: 1,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB-lSUJ1GxL0sVJ6DhgaMkEBqx8foDZ3KENSScxUTV7C38ZAucfhYwqztrsymGS8vrOI51Gcny5IHNqD0r8N7UYss6hLvJW7CPJfB_LUbJF3Cft6uMwbCs0UTmAf7mcL24N10NY06WVa_7ZHBtJcsYE9siid_VrfG9AGItK3BHSs-HocdVDYdEiMlO2XvyVNpw008Df8nZQUlLXg2eyiDaBH2WnGvIcxX8ZOmm5b5DRNnY9s3QCKSsFAkXB59TK5MFeFFrcc27mjw'
  }
];

export default function CartScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="w-12 h-12 items-center justify-center">
          {/* Replace with <ArrowLeft /> if needed */}
        </View>
        <Text className="flex-1 text-center pr-12 text-lg font-bold text-[#171311]">Cart</Text>
      </View>

      {/* Cart Items */}
      {cartItems.map((item) => (
        <View key={item.id} className="flex-row items-center justify-between gap-4 px-4 py-2 min-h-[72px]">
          <View className="flex-row items-center gap-4">
            <Image source={{ uri: item.image }} className="w-14 h-14 rounded-lg" />
            <View>
              <Text className="text-[#171311] text-base font-medium">{item.name}</Text>
              <Text className="text-[#876d64] text-sm">{item.size}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity className="w-7 h-7 items-center justify-center rounded-full bg-[#f4f1f0]">
              <Text className="text-base font-medium text-[#171311]">-</Text>
            </TouchableOpacity>
            <Text className="w-4 text-center text-base font-medium text-[#171311]">{item.quantity}</Text>
            <TouchableOpacity className="w-7 h-7 items-center justify-center rounded-full bg-[#f4f1f0]">
              <Text className="text-base font-medium text-[#171311]">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Order Summary */}
      <Text className="text-[#171311] text-lg font-bold px-4 pt-4 pb-2">Order Summary</Text>
      <View className="px-4">
        <View className="flex-row justify-between py-2">
          <Text className="text-sm text-[#876d64]">Subtotal</Text>
          <Text className="text-sm text-[#171311]">$125.00</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-sm text-[#876d64]">Shipping</Text>
          <Text className="text-sm text-[#171311]">Free</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-sm text-[#876d64]">Total</Text>
          <Text className="text-sm text-[#171311]">$125.00</Text>
        </View>
      </View>

      {/* Checkout Button */}
      <View className="px-4 py-3">
        <TouchableOpacity className="bg-[#e26136] h-12 items-center justify-center rounded-full">
          <Text className="text-white text-base font-bold tracking-[0.015em]">Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
      <View className="h-5 bg-white" />
    </ScrollView>
  );
}
