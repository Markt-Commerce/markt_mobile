import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Animated, Easing, } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Search, ArrowBigDown as CaretDown, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSellerAnalyticsOverview, getSellerAnalyticsTimeseries } from '../../services/sections/analytics';
import { getSellerProducts } from '../../services/sections/product';
import { getSellerOrders } from '../../services/sections/orders';
import { SellerAnalyticsOverview, SellerAnalyticsTimeseries } from '../../models/analytics';
import { ProductResponse } from '../../models/products';
import { OrderItem } from '../../models/orders';
import { useToast } from '../../components/ToastProvider';

const { width: screenWidth } = Dimensions.get('window');

export default function SellerDashboard() {
  const { show } = useToast();
  //chart width
  const chartWidth = Math.min(screenWidth - 32, 800);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const [analyticsTimeseries, setAnalyticsTimeseries] = useState<SellerAnalyticsTimeseries | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<SellerAnalyticsOverview | null>(null);
  const [sellerRecentOrders, setSellerRecentOrders] = useState<OrderItem[]>([]);
  const [sellerInventory, setSellerInventory] = useState<ProductResponse[]>([]);

  useEffect(() => {
    const fetchData =async () => {
      try {
        const date = new Date();
        const fromDate = (new Date(date.getFullYear() - 1, date.getMonth(), 1)).toISOString();
        const toDate = (new Date()).toISOString();
        const analyticsOverviewData = await getSellerAnalyticsOverview(30);
        setAnalyticsOverview(analyticsOverviewData);
        const analyticsTimeseriesData = await getSellerAnalyticsTimeseries({
          bucket: "month",//only get by month for now, we can add an option for the user to select by day, week or month later
          start_date: fromDate,
          end_date: toDate,
          metric: "sales"
        })
        setAnalyticsTimeseries(analyticsTimeseriesData);
        const ordersData = await getSellerOrders(1,5);// TODO: ask backend team to add an endpoint to get recent orders
        setSellerRecentOrders(ordersData.items);
        const productsData = await getSellerProducts(1,20);
        setSellerInventory(productsData);
      } catch (error) {
        show({
          variant: "error",
          title: "Error loading dashboard data",
          message: "There was an issue retrieving your seller dashboard information.",
        })
        //later we would show the error on the UI using a toasts
      }
    };
    fetchData();
  }, []);

  // Subtle pulsing accent bar used in Low Stock Alerts
  const LeftAccentPulse = () => {
    const opacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 900,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [opacity]);

    return (
      <View style={{ width: 4, backgroundColor: '#e26136', position: 'relative' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: -6,
            bottom: -6,
            left: -4,
            right: -4,
            backgroundColor: '#e26136',
            opacity,
            borderRadius: 8,
          }}
        />
      </View>
    );
  };

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
          <View
            className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white"
          >
            <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">Product Views</Text>
            <Text className="text-[#171311] text-2xl font-extrabold mt-1">{analyticsOverview?.views_30d || 0}</Text>
          </View>
          <View
            className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white"
          >
            <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">Total Orders</Text>
            <Text className="text-[#171311] text-2xl font-extrabold mt-1">{analyticsOverview?.orders_30d || 0}</Text>
          </View>
          <View
            className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white"
          >
            <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">Total Revenue</Text>
            <Text className="text-[#171311] text-2xl font-extrabold mt-1">{analyticsOverview?.revenue_30d || 0}</Text>
          </View>
          <View
            className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white"
          >
            <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">Conversions</Text>
            <Text className="text-[#171311] text-2xl font-extrabold mt-1">{analyticsOverview?.conversion_30d || 0}</Text>
          </View>
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
        {/* Check and work on this section later */}
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
                data={(analyticsTimeseries && analyticsTimeseries.series.length > 0) ? {
                  labels: analyticsTimeseries.series.map(d => months[new Date(d.bucket_start).getMonth()]),
                  datasets: [{ data: analyticsTimeseries.series.map(d => d.value), strokeWidth: 3 }]
                } : {
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{ data: [0,0,0,0,0,0], strokeWidth: 3 }]
                }}
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
          {sellerRecentOrders.length === 0 ? (
            <Text className="text-[#876d64] text-sm px-1">No recent orders</Text>
          ) : (
            <View className="rounded-2xl border border-[#e5dedc] bg-white overflow-hidden">
            {sellerRecentOrders.map((o, idx) => (
              <View
                key={idx}
                className={`flex-row items-center justify-between px-4 py-3 ${idx < sellerRecentOrders.length - 1 ? 'border-b border-[#efe9e7]' : ''}`}
              >
                <View>
                  <Text className="text-[#171311] text-base font-medium">{o.product?.name}</Text>
                  <Text className="text-[#876d64] text-xs">Order ID: {o.price}</Text>
                </View>
                <Text className="text-[#171311] text-base font-semibold">{o.status}</Text>
              </View>
            ))}
          </View>
          )}
        </View>

        {/* Top Products card */}
        {/* <View className="px-4 pt-6">
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
        </View> */}

        {/* Low Stock Alerts (pulsing red-accent) */}
        <View className="px-4 pt-6">
          <Text className="text-[#171311] text-[18px] font-extrabold px-1 pb-2">Low Stock Alerts</Text>

          <View className="rounded-2xl bg-[#fff5f3] border border-[#ffd9d2] overflow-hidden">
            {sellerInventory.filter((item)=> item.stock! < 5).map((a, idx, arr) => (
              <View
                key={a.name}
                className={`flex-row items-stretch ${idx < arr.length - 1 ? 'border-b border-[#ffd9d2]' : ''}`}
              >
                {/* Left accent bar  */}
                <LeftAccentPulse />

                {/* Content */}
                <View className="flex-1 flex-row items-center justify-between px-4 py-3">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center gap-2">
                      <AlertTriangle size={16} color="#b51f08" />
                      <Text className="text-[#b51f08] text-[13px] font-semibold">Low stock</Text>
                    </View>

                    <Text className="text-[#171311] text-base font-medium mt-1">{a.name}</Text>
                    <Text className="text-[#8a6c66] text-xs mt-0.5">Last Updated: {a.created_at}</Text>
                    <Text className="text-[#8a6c66] text-xs">Stock Left: {a.stock}</Text>

                    {/* Visual urgency bar*/}
                    <View className="mt-2 h-2 rounded-full bg-[#ffe6e1] overflow-hidden">
                      <View
                        style={{ width: `${Math.min(a.stock || 0, 20) * 5}%` }}
                        className="h-2 bg-[#e26136]"
                      />
                    </View>
                  </View>

                  {/* Badge */}
                  <View className="rounded-full px-3 py-1 bg-[#ffe9e6] border border-[#ffcdc4]">
                    <Text className="text-[#b51f08] text-[12px] font-semibold">Action needed</Text>
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
          {sellerInventory.length === 0 ? (
            <Text className="text-[#876d64] text-sm px-1">No products in inventory</Text>
          ) : (
            <View className="rounded-2xl border border-[#e5dedc] bg-white overflow-hidden">
            {sellerInventory.map((it, idx) => (
              <View
                key={it.name}
                className={`flex-row items-center justify-between px-4 py-3 ${idx < sellerInventory.length - 1 ? 'border-b border-[#efe9e7]' : ''}`}
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
        )}
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
