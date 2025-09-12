import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Search, ArrowBigDown as CaretDown } from 'lucide-react-native';

// Seller Dashboard — React Native (Expo) + NativeWind + lucide-react-native
// This file uses `className` (NativeWind) for styling and `lucide-react-native` for icons
// Make sure your project has NativeWind and lucide-react-native installed and configured.

const { width: screenWidth } = Dimensions.get('window');

export default function SellerDashboard() {
  const chartWidth = Math.min(screenWidth - 32, 800);

  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: [30, 45, 28, 80, 99, 70], strokeWidth: 3 }],
  };

  const stats = [
    { title: 'Total Revenue', value: '$12,345' },
    { title: 'Total Orders', value: '567' },
    { title: 'Avg. Order Value', value: '$21.75' },
    { title: 'Active Listings', value: '123' },
  ];

  const recentOrders = [
    { name: 'Ava Bennett', id: '123456', amount: '$25.00' },
    { name: 'Owen Carter', id: '789012', amount: '$30.00' },
    { name: 'Chloe Clark', id: '345678', amount: '$15.00' },
    { name: 'Noah Harper', id: '901234', amount: '$40.00' },
  ];

  const topProducts = [
    { name: 'Product A', sales: 100, revenue: '$1,000', image: 'https://via.placeholder.com/80' },
    { name: 'Product B', sales: 80, revenue: '$800', image: 'https://via.placeholder.com/80' },
    { name: 'Product C', sales: 60, revenue: '$600', image: 'https://via.placeholder.com/80' },
  ];

  const inventory = [
    { name: 'Product F', status: 'Active', price: '$10', stock: 50 },
    { name: 'Product G', status: 'Inactive', price: '$15', stock: 20 },
    { name: 'Product H', status: 'Active', price: '$20', stock: 100 },
  ];

  return (
    <ScrollView className="bg-white min-h-screen" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="flex-row items-center bg-white p-4 justify-between">
        <Text className="text-[#171311] text-lg font-bold flex-1 text-center">Seller Dashboard</Text>
      </View>

      {/* Action buttons */}
      <View className="flex-row justify-end px-4 py-3 gap-3">
        <TouchableOpacity className="bg-[#f4f1f0] rounded-lg h-10 px-4 items-center justify-center">
          <Text className="text-[#171311] text-sm font-bold">Date Range</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#e26136] rounded-lg h-10 px-4 items-center justify-center">
          <Text className="text-white text-sm font-bold">Export</Text>
        </TouchableOpacity>
      </View>

      {/* Stats cards */}
      <View className="flex-row flex-wrap gap-4 p-4">
        {stats.map((s) => (
          <View key={s.title} className="min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#e5dedc] bg-white">
            <Text className="text-[#171311] text-base font-medium">{s.title}</Text>
            <Text className="text-[#171311] text-2xl font-bold">{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Secondary actions */}
      <View className="flex-row justify-between px-4 py-2">
        <TouchableOpacity className="bg-[#e26136] rounded-lg h-10 px-4 items-center justify-center">
          <Text className="text-white text-sm font-bold">Create Product</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#f4f1f0] rounded-lg h-10 px-4 items-center justify-center">
          <Text className="text-[#171311] text-sm font-bold">Inventory</Text>
        </TouchableOpacity>
      </View>

      {/* Orders button */}
      <View className="flex px-4 py-3 justify-end">
        <TouchableOpacity className="bg-[#f4f1f0] rounded-lg h-10 px-4 items-center justify-center">
          <Text className="text-[#171311] text-sm font-bold">Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Sales trends */}
      <View className="flex flex-wrap gap-4 px-4 py-6">
        <View className="flex-1 min-w-72 flex-col gap-2">
          <Text className="text-[#171311] text-base font-medium">Sales Trends</Text>
          <Text className="text-[#171311] text-[32px] font-bold">$12,345</Text>
          <View className="flex-row gap-1 items-center">
            <Text className="text-[#876d64] text-base">Last 30 Days</Text>
            <Text className="text-[#07880b] text-base font-medium">+15%</Text>
          </View>

          <View className="min-h-[180px] py-4">
            <LineChart
              data={salesData}
              width={chartWidth}
              height={148}
              chartConfig={{
                backgroundGradientFrom: '#f4f1f0',
                backgroundGradientTo: 'transparent',
                color: (opacity = 1) => `rgba(135,109,100, ${opacity})`,
                strokeWidth: 3,
              }}
              bezier
              style={{ borderRadius: 12 }}
            />

            <View className="flex-row justify-around mt-2">
              <Text className="text-[#876d64] text-[13px] font-bold">Jan</Text>
              <Text className="text-[#876d64] text-[13px] font-bold">Feb</Text>
              <Text className="text-[#876d64] text-[13px] font-bold">Mar</Text>
              <Text className="text-[#876d64] text-[13px] font-bold">Apr</Text>
              <Text className="text-[#876d64] text-[13px] font-bold">May</Text>
              <Text className="text-[#876d64] text-[13px] font-bold">Jun</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Orders */}
      <Text className="text-[#171311] text-[22px] font-bold px-4 pb-3 pt-5">Recent Orders</Text>
      {recentOrders.map((o) => (
        <View key={o.id} className="flex-row items-center gap-4 bg-white px-4 min-h-[72px] py-2 justify-between">
          <View className="flex flex-col justify-center">
            <Text className="text-[#171311] text-base font-medium">{o.name}</Text>
            <Text className="text-[#876d64] text-sm">Order ID: {o.id}</Text>
          </View>
          <Text className="text-[#171311] text-base">{o.amount}</Text>
        </View>
      ))}

      {/* Top Products */}
      <Text className="text-[#171311] text-[22px] font-bold px-4 pb-3 pt-5">Top Products</Text>
      {topProducts.map((p) => (
        <View key={p.name} className="flex-row items-center gap-4 bg-white px-4 min-h-[72px] py-2">
          <Image source={{ uri: p.image }} className="w-14 h-14 rounded-lg" />
          <View className="flex flex-col justify-center">
            <Text className="text-[#171311] text-base font-medium">{p.name}</Text>
            <Text className="text-[#876d64] text-sm">Total Sales: {p.sales}, Revenue: {p.revenue}</Text>
          </View>
        </View>
      ))}

      {/* Low Stock Alerts */}
      <Text className="text-[#171311] text-[22px] font-bold px-4 pb-3 pt-5">Low Stock Alerts</Text>
      <View className="flex gap-4 bg-white px-4 py-3 justify-between">
        <View className="flex-1 flex-col justify-center">
          <Text className="text-[#171311] text-base font-medium">Product D</Text>
          <Text className="text-[#876d64] text-sm">Last Updated: 2024-01-15</Text>
          <Text className="text-[#876d64] text-sm">Stock Left: 5</Text>
        </View>
        <Text className="text-[#171311]">Alert</Text>
      </View>

      <View className="flex gap-4 bg-white px-4 py-3 justify-between">
        <View className="flex-1 flex-col justify-center">
          <Text className="text-[#171311] text-base font-medium">Product E</Text>
          <Text className="text-[#876d64] text-sm">Last Updated: 2024-01-10</Text>
          <Text className="text-[#876d64] text-sm">Stock Left: 2</Text>
        </View>
        <Text className="text-[#171311]">Alert</Text>
      </View>

      {/* Inventory */}
      <Text className="text-[#171311] text-[22px] font-bold px-4 pb-3 pt-5">Inventory</Text>
      <View className="px-4 py-3">
        <View className="flex-row items-stretch rounded-lg h-12 w-full overflow-hidden">
          <View className="bg-[#f4f1f0] pl-4 items-center justify-center">
            <Search size={20} color="#876d64" />
          </View>
          <TextInput placeholder="Search products" className="flex-1 bg-[#f4f1f0] px-4 text-[#171311]" />
        </View>
      </View>

      <View className="flex gap-3 p-3 overflow-x-hidden">
        <TouchableOpacity className="h-8 items-center justify-center rounded-lg bg-[#f4f1f0] pl-4 pr-2 flex-row gap-2">
          <Text className="text-[#171311] text-sm font-medium">Status</Text>
          <CaretDown size={16} color="#171311" />
        </TouchableOpacity>
      </View>

      {inventory.map((it) => (
        <View key={it.name} className="flex gap-4 bg-white px-4 py-3 justify-between flex-row items-center">
          <View className="flex-1 flex-col justify-center">
            <Text className="text-[#171311] text-base font-medium">{it.name}</Text>
            <Text className="text-[#876d64] text-sm">Status: {it.status}</Text>
            <Text className="text-[#876d64] text-sm">Price: {it.price}, Stock: {it.stock}</Text>
          </View>
          <TouchableOpacity className="bg-[#f4f1f0] px-4 py-2 rounded-lg">
            <Text className="text-[#171311] text-sm font-medium">Edit</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View className="flex-row w-full items-center justify-center gap-3 py-5">
        <View className="h-2 w-2 rounded-full bg-[#171311]" />
        <View className="h-2 w-2 rounded-full bg-[#e5dedc]" />
        <View className="h-2 w-2 rounded-full bg-[#e5dedc]" />
      </View>

      <View className="h-5 bg-white" />
    </ScrollView>
  );
}
