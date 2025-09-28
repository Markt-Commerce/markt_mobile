import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Search, ArrowBigDown as CaretDown } from 'lucide-react-native';
import { AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-3 justify-between border-b border-[#efe9e7]">
          <Text className="text-[#171311] text-lg font-extrabold flex-1 text-center">Seller Dashboard</Text>
        </View>

        {/* Primary actions */}
        <View className="flex-row justify-end px-4 py-3 gap-3">
          <TouchableOpacity className="rounded-full h-10 px-4 items-center justify-center border border-[#e5dedc] bg-white">
            <Text className="text-[#171311] text-sm font-semibold">Date Range</Text>
          </TouchableOpacity>
          <TouchableOpacity className="rounded-full h-10 px-4 items-center justify-center bg-[#e26136]">
            <Text className="text-white text-sm font-semibold">Export</Text>
          </TouchableOpacity>
        </View>

        {/* Stats cards */}
        <View className="flex-row flex-wrap gap-4 p-4">
          {stats.map((s) => (
            <View
              key={s.title}
              className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white"
            >
              <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">{s.title}</Text>
              <Text className="text-[#171311] text-2xl font-extrabold mt-1">{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Secondary actions */}
        <View className="flex-row justify-between px-4 py-2">
          <TouchableOpacity className="rounded-full h-10 px-4 items-center justify-center bg-[#e26136]">
            <Text className="text-white text-sm font-semibold">Create Product</Text>
          </TouchableOpacity>
          <TouchableOpacity className="rounded-full h-10 px-4 items-center justify-center border border-[#e5dedc] bg-white">
            <Text className="text-[#171311] text-sm font-semibold">Inventory</Text>
          </TouchableOpacity>
        </View>

        {/* Orders quick nav */}
        <View className="px-4 py-3">
          <TouchableOpacity className="rounded-full h-10 px-4 items-center justify-center border border-[#e5dedc] bg-white">
            <Text className="text-[#171311] text-sm font-semibold">Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Sales trends card */}
        <View className="px-4 py-4">
          <View className="rounded-2xl border border-[#e5dedc] bg-white p-4">
            <Text className="text-[#171311] text-base font-semibold">Sales Trends</Text>
            <Text className="text-[#171311] text-[28px] font-extrabold mt-1">$12,345</Text>
            <View className="flex-row gap-2 items-center mt-1">
              <Text className="text-[#876d64] text-sm">Last 30 Days</Text>
              <Text className="text-[#07880b] text-sm font-semibold">+15%</Text>
            </View>
            <View className="py-4">
              <LineChart
                data={salesData}
                width={chartWidth}
                height={160}
                chartConfig={{
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: () => `#e26136`,
                  labelColor: () => '#876d64',
                  decimalPlaces: 0,
                  propsForDots: { r: '3' },
                  strokeWidth: 3,
                }}
                bezier
                style={{ borderRadius: 12 }}
                withInnerLines={false}
                withOuterLines={false}
              />
            </View>
          </View>
        </View>

        {/* Recent Orders card */}
        <View className="px-4 pt-2">
          <Text className="text-[#171311] text-[18px] font-extrabold px-1 pb-2">Recent Orders</Text>
          <View className="rounded-2xl border border-[#e5dedc] bg-white overflow-hidden">
            {recentOrders.map((o, idx) => (
              <View
                key={o.id}
                className={`flex-row items-center justify-between px-4 py-3 ${idx < recentOrders.length - 1 ? 'border-b border-[#efe9e7]' : ''}`}
              >
                <View>
                  <Text className="text-[#171311] text-base font-medium">{o.name}</Text>
                  <Text className="text-[#876d64] text-xs">Order ID: {o.id}</Text>
                </View>
                <Text className="text-[#171311] text-base font-semibold">{o.amount}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Products card */}
        <View className="px-4 pt-6">
          <Text className="text-[#171311] text-[18px] font-extrabold px-1 pb-2">Top Products</Text>
          <View className="rounded-2xl border border-[#e5dedc] bg-white overflow-hidden">
            {topProducts.map((p, idx) => (
              <View
                key={p.name}
                className={`flex-row items-center gap-4 px-4 py-3 ${idx < topProducts.length - 1 ? 'border-b border-[#efe9e7]' : ''}`}
              >
                <Image source={{ uri: p.image }} className="w-14 h-14 rounded-xl" />
                <View className="flex-1">
                  <Text className="text-[#171311] text-base font-medium" numberOfLines={1}>{p.name}</Text>
                  <Text className="text-[#876d64] text-xs">Total Sales: {p.sales}, Revenue: {p.revenue}</Text>
                </View>
                <View className="rounded-full px-2 py-1 bg-[#f5f2f1]">
                  <Text className="text-[12px] text-[#171311] font-semibold">{p.sales}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Low Stock Alerts (red-accented) */}
          <View className="px-4 pt-6">
            <Text className="text-[#171311] text-[18px] font-extrabold px-1 pb-2">
              Low Stock Alerts
            </Text>

            <View className="rounded-2xl bg-[#fff5f3] border border-[#ffd9d2] overflow-hidden">
              {[
                { name: 'Product D', last: '2024-01-15', stock: 5 },
                { name: 'Product E', last: '2024-01-10', stock: 2 },
              ].map((a, idx, arr) => (
                <View
                  key={a.name}
                  className={`flex-row items-stretch ${idx < arr.length - 1 ? 'border-b border-[#ffd9d2]' : ''}`}
                >
                  {/* Left accent bar */}
                  <View className="w-1 bg-[#e26136]" />

                  {/* Content */}
                  <View className="flex-1 flex-row items-center justify-between px-4 py-3">
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center gap-2">
                        <AlertTriangle size={16} color="#b51f08" />
                        <Text className="text-[#b51f08] text-[13px] font-semibold">
                          Low stock
                        </Text>
                      </View>

                      <Text className="text-[#171311] text-base font-medium mt-1">
                        {a.name}
                      </Text>
                      <Text className="text-[#8a6c66] text-xs mt-0.5">
                        Last Updated: {a.last}
                      </Text>
                      <Text className="text-[#8a6c66] text-xs">
                        Stock Left: {a.stock}
                      </Text>

                      {/* Visual urgency bar (UI only) */}
                      <View className="mt-2 h-2 rounded-full bg-[#ffe6e1] overflow-hidden">
                        <View
                          // purely visual: cap at 100%
                          style={{ width: `${Math.min(a.stock, 20) * 5}%` }}
                          className="h-2 bg-[#e26136]"
                        />
                      </View>
                    </View>

                    {/* Badge */}
                    <View className="rounded-full px-3 py-1 bg-[#ffe9e6] border border-[#ffcdc4]">
                      <Text className="text-[#b51f08] text-[12px] font-semibold">
                        Action needed
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>


        {/* Inventory search + filters */}
        <View className="px-4 pt-6">
          <Text className="text-[#171311] text-[18px] font-extrabold px-1 pb-2">Inventory</Text>
          <View className="rounded-2xl border border-[#e5dedc] bg-white p-4">
            <View className="flex-row items-center rounded-full overflow-hidden border border-[#e5dedc]">
              <View className="bg-[#f4f1f0] h-12 w-12 items-center justify-center">
                <Search size={20} color="#876d64" />
              </View>
              <TextInput
                placeholder="Search products"
                className="flex-1 h-12 bg-[#f4f1f0] px-4 text-[#171311]"
                placeholderTextColor="#9a8a85"
              />
            </View>

            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity className="h-8 items-center justify-center rounded-full bg-[#f5f2f1] pl-4 pr-3 flex-row gap-2 border border-[#e5dedc]">
                <Text className="text-[#171311] text-sm font-medium">Status</Text>
                <CaretDown size={16} color="#171311" />
              </TouchableOpacity>
              <TouchableOpacity className="h-8 items-center justify-center rounded-full bg-[#f5f2f1] px-3 border border-[#e5dedc]">
                <Text className="text-[#171311] text-sm font-medium">All</Text>
              </TouchableOpacity>
              <TouchableOpacity className="h-8 items-center justify-center rounded-full bg-[#fff2f0] px-3 border border-[#ffd9d2]">
                <Text className="text-[#b51f08] text-sm font-medium">Low</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Inventory list card */}
        <View className="px-4 pt-3">
          <View className="rounded-2xl border border-[#e5dedc] bg-white overflow-hidden">
            {inventory.map((it, idx) => (
              <View
                key={it.name}
                className={`flex-row items-center justify-between px-4 py-3 ${idx < inventory.length - 1 ? 'border-b border-[#efe9e7]' : ''}`}
              >
                <View className="flex-1">
                  <Text className="text-[#171311] text-base font-medium" numberOfLines={1}>{it.name}</Text>
                  <Text className="text-[#876d64] text-xs">Status: {it.status}</Text>
                  <Text className="text-[#876d64] text-xs">Price: {it.price}, Stock: {it.stock}</Text>
                </View>
                <TouchableOpacity className="rounded-full px-4 h-9 items-center justify-center border border-[#e5dedc] bg-white">
                  <Text className="text-[#171311] text-sm font-semibold">Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Pager dots */}
        <View className="flex-row w-full items-center justify-center gap-2 py-6">
          <View className="h-2 w-2 rounded-full bg-[#171311]" />
          <View className="h-2 w-2 rounded-full bg-[#e5dedc]" />
          <View className="h-2 w-2 rounded-full bg-[#e5dedc]" />
        </View>

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
