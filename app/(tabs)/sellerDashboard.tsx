import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import {
  ArrowLeft,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SellerDashboard() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-2 pb-1">
        <ArrowLeft color="#171312" size={24} />
        <Text className="text-[#171312] text-lg font-bold text-center flex-1 pr-12">
          Seller Dashboard
        </Text>
      </View>

      {/* Overview */}
      <Text className="text-[#171312] text-[22px] font-bold px-4 pt-5 pb-3">Overview</Text>
      <View className="flex-row flex-wrap gap-4 px-4">
        {[
          { label: 'Total Earnings', value: '$12,500', growth: '+15%' },
          { label: 'Sales This Month', value: '350', growth: '+8%' },
          { label: 'Top Product', value: 'Handmade Leather Wallet', growth: '+20%' },
        ].map((item, idx) => (
          <View key={idx} className="bg-[#f4f2f1] flex-1 min-w-[158px] rounded-xl p-6 gap-2">
            <Text className="text-base font-medium text-[#171312]">{item.label}</Text>
            <Text className="text-2xl font-bold text-[#171312]">{item.value}</Text>
            <Text className="text-base font-medium text-[#07880b]">{item.growth}</Text>
          </View>
        ))}
      </View>

      {/* Sales Trends */}
      <Text className="text-[#171312] text-[22px] font-bold px-4 pt-5 pb-3">Sales Trends</Text>
      <View className="px-4 py-6">
        <View className="border border-[#e4dfdd] rounded-xl p-6 gap-2">
          <Text className="text-base font-medium text-[#171312]">Monthly Sales</Text>
          <Text className="text-[32px] font-bold text-[#171312] truncate">$3,200</Text>
          <View className="flex-row gap-1">
            <Text className="text-base text-[#826f68]">Last 6 Months</Text>
            <Text className="text-base font-medium text-[#07880b]">+12%</Text>
          </View>

          {/* Graph Placeholder */}
          <View className="h-[180px] justify-center items-center py-4 relative overflow-hidden rounded-xl">
            <LinearGradient
              colors={['#f4f2f1', 'transparent']}
              className="absolute w-full h-full"
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Text className="text-[#826f68]">[Graph Placeholder]</Text>
          </View>

          <View className="flex-row justify-around">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => (
              <Text
                key={month}
                className="text-[13px] font-bold text-[#826f68] tracking-[0.015em]"
              >
                {month}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Top Products */}
      <Text className="text-[#171312] text-[22px] font-bold px-4 pt-5 pb-3">Top Products</Text>
      {[
        {
          tag: 'Best Seller',
          name: 'Handmade Leather Wallet',
          sold: '120 sold this month',
          img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUmgT0vU7dsYtvnXhPDNLkjVwYVj70ILYjScVbWD5Jwe7w91xZJNAMGvtjQUhBXXCmCOcmekZqRrgXbKiBjCvwugREzNnU1maZvBpc2LT3Rd8m79091i9Apyvalm_pG2Sk0sEXWau0UMinSUvDBeLWn_meA3MtLihYGh5Z559TxnBsIHS-dotKx8hEVgb_pqjYU6DU_rG_FxqBj_6QI1vUG5KEaKO8oHjnh2TX8_ntuusijws_YIVhAWEDxX8x8OhTE0z_Fc2Urw',
        },
        {
          tag: 'Popular',
          name: 'Artisan Soap Set',
          sold: '85 sold this month',
          img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaUVpird74wxAdCGZPvhm4F3hEj5U36SrbVXmWTYl-0mNM9Y0Mkm3jejDULz29jv9zMM4FQupuX98PVYIlFYfz13yM-d3iUPV9_HL469JlRXV9bPJztcZ-GqtWE-O6Y4PUZ9rIL-Fl2Clr4ShxXY_SPaEQGAI2DQk7TA3ZSXVaOX6qHsmhg8NjuJgtUUezoiuXOLOzM2Rws1xdzGnllOkfIgh2nLhRxMU-bdHXWQUQl4TlEFHNHyLWm-kcsXuiCVxwKMbTBH6ZVA',
        },
      ].map((product, index) => (
        <View key={index} className="flex-row gap-4 px-4 pb-4">
          <View className="flex-1 gap-4">
            <View className="gap-1">
              <Text className="text-sm text-[#826f68]">{product.tag}</Text>
              <Text className="text-base font-bold text-[#171312]">{product.name}</Text>
              <Text className="text-sm text-[#826f68]">{product.sold}</Text>
            </View>
            <TouchableOpacity className="rounded-full bg-[#f4f2f1] h-8 px-4 justify-center items-center w-fit">
              <Text className="text-sm text-[#171312] font-medium">View Product</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: product.img }}
            className="rounded-xl flex-1 aspect-video"
            resizeMode="cover"
          />
        </View>
      ))}
    </ScrollView>
  );
}


/**
 * 
 import React from "react";
import { View, Text, TextInput, TouchableOpacity, ImageBackground } from "react-native";
import { Search } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function ListingsScreen() {
  const listings = [
    {
      id: 1,
      title: "Vintage Leather Jacket",
      price: "$120",
      image: "https://source.unsplash.com/random/800x600/?jacket"
    },
    {
      id: 2,
      title: "Mountain Bike",
      price: "$300",
      image: "https://source.unsplash.com/random/800x600/?bike"
    },
    {
      id: 3,
      title: "Gaming Console",
      price: "$250",
      image: "https://source.unsplash.com/random/800x600/?gaming"
    },
    {
      id: 4,
      title: "Bookshelf",
      price: "$70",
      image: "https://source.unsplash.com/random/800x600/?bookshelf"
    },
  ];

  return (
    <View className="flex-1 bg-[#fcf8f8]">
      <View className="px-4 pt-12 pb-3 bg-[#fcf8f8]">
        <Text className="text-2xl font-bold text-[#1b0e0e]">Listings</Text>
      </View>

      <View className="flex-row items-center px-4 pb-3">
        <View className="flex-row items-center bg-[#f3e7e8] flex-1 rounded-lg h-12 px-4">
          <Search size={18} color="#994d51" />
          <TextInput
            placeholder="Search listings"
            placeholderTextColor="#994d51"
            className="ml-2 flex-1 text-[#1b0e0e] text-base"
          />
        </View>
        <TouchableOpacity className="ml-3 h-12 px-4 rounded-lg bg-[#ea2832] justify-center items-center">
          <Text className="text-sm text-[#fcf8f8] font-medium">Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {listings.map((item) => (
          <View key={item.id} className="mb-4 rounded-xl overflow-hidden bg-white shadow">
            <ImageBackground
              source={{ uri: item.image }}
              className="h-48 w-full bg-cover"
              imageStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            />
            <View className="p-4">
              <Text className="text-lg font-semibold text-[#1b0e0e]">{item.title}</Text>
              <Text className="text-[#994d51] mt-1 font-medium">{item.price}</Text>
            </View>
          </View>
        ))}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
 */ 