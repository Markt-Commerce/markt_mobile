
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Animated, Easing, FlatList, RefreshControl } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Search, ArrowBigDown as CaretDown, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSellerAnalyticsOverview, getSellerAnalyticsTimeseries } from '../../services/sections/analytics';
import { getSellerProducts } from '../../services/sections/product';
import { getSellerOrders, updateSellerOrderItem } from '../../services/sections/orders';
import { deleteProduct } from '../../services/sections/product';
import { SellerAnalyticsOverview, SellerAnalyticsTimeseries } from '../../models/analytics';
import { ProductResponse } from '../../models/products';
import { OrderItem, SellerOrderItem } from '../../models/orders';
import { useToast } from '../../components/ToastProvider';
import ProductFormBottomSheet from '../../components/productCreateBottomSheet'; 
import CreateNicheBottomSheet from '../../components/nicheCreateBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet';

const { width: screenWidth } = Dimensions.get('window');

export default function SellerDashboard() {
  const { show } = useToast();
  //chart width
  const chartWidth = Math.min(screenWidth - 32, 800);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const [analyticsTimeseries, setAnalyticsTimeseries] = useState<SellerAnalyticsTimeseries | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<SellerAnalyticsOverview | null>(null);
  const [sellerRecentOrders, setSellerRecentOrders] = useState<SellerOrderItem[]>([]);
  const [sellerInventory, setSellerInventory] = useState<ProductResponse[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Bottom sheet ref for product creation
  const productFormRef = useRef<any>(null);

  const nicheFormRef = useRef<BottomSheet>(null);

  // Search state (controlled + debounced)
  const [searchText, setSearchText] = useState<string>('');
  const [filteredInventory, setFilteredInventory] = useState<ProductResponse[]>([]);

  // Mounted flag to avoid state updates after unmount
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        if (mounted) {
          setLoading(true);
          setError(null);
        }
        const date = new Date();
        const fromDate = (new Date(date.getFullYear() - 1, date.getMonth(), 1)).toISOString();
        const toDate = (new Date()).toISOString();
        const analyticsOverviewData = await getSellerAnalyticsOverview(30);
        const analyticsTimeseriesData = await getSellerAnalyticsTimeseries({
          bucket: "month",
          start_date: fromDate,
          end_date: toDate,
          metric: "sales"
        });
        const ordersData = await getSellerOrders(1,5);
        const productsData = await getSellerProducts(1,50);
        if (!mounted) return;
        setAnalyticsOverview(analyticsOverviewData);
        setAnalyticsTimeseries(analyticsTimeseriesData);
        setSellerRecentOrders(ordersData.items || []);
        setSellerInventory(productsData || []);
        setFilteredInventory(productsData || []);
      } catch (err) {
        if (!mounted) return;
        setError('There was an issue retrieving your seller dashboard information.');
        show({
          variant: "error",
          title: "Error loading dashboard data",
          message: "There was an issue retrieving your seller dashboard information.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [show]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const date = new Date();
      const fromDate = (new Date(date.getFullYear() - 1, date.getMonth(), 1)).toISOString();
      const toDate = (new Date()).toISOString();
      const [analyticsOverviewData, analyticsTimeseriesData, ordersData, productsData] = await Promise.all([
        getSellerAnalyticsOverview(30),
        getSellerAnalyticsTimeseries({
          bucket: "month",
          start_date: fromDate,
          end_date: toDate,
          metric: "sales"
        }),
        getSellerOrders(1,5),
        getSellerProducts(1,50),
      ]);
      setAnalyticsOverview(analyticsOverviewData);
      setAnalyticsTimeseries(analyticsTimeseriesData);
      setSellerRecentOrders(ordersData.items || []);
      setSellerInventory(productsData || []);
      setFilteredInventory(productsData || []);
    } catch (err) {
      setError('Failed to refresh');
      show({ variant: 'error', title: 'Refresh failed', message: 'Could not refresh dashboard data.' });
    } finally {
      setRefreshing(false);
    }
  }, [show]);

  // Debounce search filter
  useEffect(() => {
    const t = setTimeout(() => {
      if (!searchText) {
        setFilteredInventory(sellerInventory);
        return;
      }
      const q = searchText.trim().toLowerCase();
      setFilteredInventory(
        sellerInventory.filter((p: any) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          String(p.id || '').toLowerCase().includes(q)
        )
      );
    }, 300);
    return () => clearTimeout(t);
  }, [searchText, sellerInventory]);

  // Utility formatters
  const formatCurrency = useCallback((n?: number) => {
    const val = n ?? 0;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    } catch {
      // fallback simple formatting
      return `$${Math.round(val).toLocaleString()}`;
    }
  }, []);

  const formatDate = useCallback((iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  }, []);

  // Stable pulsing accent (memoized)
  const LeftAccentPulse = useMemo(() => {
    return function LeftAccentPulseInner() {
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
  }, []);

  // Safe color fn for chart config (accepts opacity)
  const chartColor = (opacity = 1) => `rgba(226,97,54,${opacity})`;
  const chartLabelColor = (opacity = 1) => `rgba(135,109,100,${opacity})`;

  // Handlers (now wired)
  const handleExport = () => {
    show({ variant: 'info', title: 'Export', message: 'Export started (not implemented).' });
  };
  const handleDateRange = () => {
    show({ variant: 'info', title: 'Date Range', message: 'Date range picker (not implemented).' });
  };
  const handleCreateProduct = () => {
    productFormRef.current?.expand?.();
  };

  const handleDeleteProduct = async (productId: string | number) => {
    try {
      await deleteProduct(String(productId));
      setSellerInventory(prev => prev.filter(p => String(p.id) !== String(productId)));
      setFilteredInventory(prev => prev.filter(p => String(p.id) !== String(productId)));
      show({ variant: 'success', title: 'Deleted', message: 'Product removed from inventory.' });
    } catch (err) {
      show({ variant: 'error', title: 'Delete failed', message: 'Could not delete product.' });
    }
  };

  const handleAcceptOrder = async (item: SellerOrderItem) => {
    try {
      await updateSellerOrderItem(item.id, { status: 'completed' });
      setSellerRecentOrders(prev => prev.map(it => it.id === item.id ? { ...it, status: 'completed' } : it));
      show({ variant: 'success', title: 'Order accepted', message: 'Order item marked as completed.' });
    } catch (err) {
      show({ variant: 'error', title: 'Accept failed', message: 'Could not accept order.' });
    }
  };

  const handleDeclineOrder = async (item: SellerOrderItem) => {
    try {
      await updateSellerOrderItem(item.id, { status: 'cancelled' });
      setSellerRecentOrders(prev => prev.map(it => it.id === item.id ? { ...it, status: 'cancelled' } : it));
      show({ variant: 'success', title: 'Order declined', message: 'Order item declined.' });
    } catch (err) {
      show({ variant: 'error', title: 'Decline failed', message: 'Could not decline order.' });
    }
  };

  // Render helpers
  const renderOrderItem = ({ item }: { item: SellerOrderItem }) => (
    <View className="px-4 py-3 border-b border-[#efe9e7] bg-white">
      <View className="flex-row justify-between items-start">
        <View style={{ flex: 1 }}>
          <Text className="text-[#171311] text-base font-medium">{item.product?.name}</Text>
          <Text className="text-[#876d64] text-xs">{formatCurrency(item.price)}</Text>
          <Text className="text-[#876d64] text-xs">Order #: {item.order.order_number ?? item.order_id}</Text>
          <View className="flex-row items-center mt-1">
            <Image source={{ uri: item.order.buyer.profile_picture_url }} className="w-6 h-6 rounded-full" />
            <Text className="text-[#171311] text-xs ml-2">{item.order.buyer.buyername}</Text>
          </View>
        </View>

        <View className="items-end ml-3">
          {item.status === 'pending' ? (
            <>
              <TouchableOpacity onPress={() => handleAcceptOrder(item)} className="bg-[#0f8b3a] rounded-full px-3 py-1 mb-2">
                <Text className="text-white text-sm">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeclineOrder(item)} className="bg-[#f4dedc] rounded-full px-3 py-1">
                <Text className="text-[#b51f08] text-sm">Decline</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text className="text-[#171311] text-base font-semibold">{item.status}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderProductItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#efe9e7]">
      <View className="flex-1 pr-3">
        <Text className="text-[#171311] text-base font-medium" numberOfLines={1}>{item.name}</Text>
        <Text className="text-[#876d64] text-xs">Status: {item.status}</Text>
        <Text className="text-[#876d64] text-xs">Price: {formatCurrency(item.price)}, Stock: {item.stock}</Text>
      </View>

      <TouchableOpacity
        accessibilityLabel={`delete-${item.id || item.name}`}
        onPress={() => handleDeleteProduct(item.id)}
        className="rounded-full px-4 h-9 items-center justify-center border border-[#f1dede] bg-white"
      >
        <Text className="text-[#b51f08] text-sm font-semibold">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      // ...existing code...
      <ScrollView
        className="bg-white"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-3 justify-between border-b border-[#efe9e7]">
          <Text className="text-[#171311] text-lg font-extrabold flex-1 text-center">Seller Dashboard</Text>
        </View>

        {/* Primary actions */}
        <View className="flex-row justify-end px-4 py-3 gap-3">
          <TouchableOpacity
            accessibilityLabel="date-range-btn"
            onPress={handleDateRange}
            className="rounded-full h-10 px-4 items-center justify-center border border-[#e5dedc] bg-white"
          >
            <Text className="text-[#171311] text-sm font-semibold">Date Range</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="export-btn"
            onPress={handleExport}
            className="rounded-full h-10 px-4 items-center justify-center bg-[#e26136]"
          >
            <Text className="text-white text-sm font-semibold">Export</Text>
          </TouchableOpacity>
        </View>

        {/* Stats cards */}
        <View className="flex-row flex-wrap gap-4 p-4">
          <View className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white">
            <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">Product Views</Text>
            <Text className="text-[#171311] text-2xl font-extrabold mt-1">{analyticsOverview?.views_30d || 0}</Text>
          </View>
          <View className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white">
            <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">Total Orders</Text>
            <Text className="text-[#171311] text-2xl font-extrabold mt-1">{analyticsOverview?.orders_30d || 0}</Text>
          </View>
          <View className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white">
            <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">Total Revenue</Text>
            <Text className="text-[#171311] text-2xl font-extrabold mt-1">{formatCurrency(analyticsOverview?.revenue_30d)}</Text>
          </View>
          <View className="min-w-[158px] flex-1 rounded-2xl p-5 border border-[#e5dedc] bg-white">
            <Text className="text-[#6f5d57] text-xs font-semibold uppercase tracking-wider">Conversions</Text>
            <Text className="text-[#171311] text-2xl font-extrabold mt-1">{analyticsOverview?.conversion_30d || 0}</Text>
          </View>
        </View>

        {/* Orders quick nav */}
        <View className="px-4 py-3">
          <TouchableOpacity accessibilityLabel="orders-quicknav" className="rounded-full h-10 px-4 items-center justify-center border border-[#e5dedc] bg-white">
            <Text className="text-[#171311] text-sm font-semibold">Orders</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between px-4 py-2">
          <TouchableOpacity
            accessibilityLabel="create-product-btn"
            onPress={handleCreateProduct}
            className="rounded-full h-10 px-4 items-center justify-center bg-[#e26136]"
          >
            <Text className="text-white text-sm font-semibold">Create Product</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between px-4 py-2">
          <TouchableOpacity
            accessibilityLabel="create-product-btn"
            onPress={() => nicheFormRef.current?.expand()}
            className="rounded-full h-10 px-4 items-center justify-center bg-[#e26136]"
          >
            <Text className="text-white text-sm font-semibold">Create Niche</Text>
          </TouchableOpacity>
        </View>

        {/* Sales trends card */}
        <View className="px-4 py-4">
          <View className="rounded-2xl border border-[#e5dedc] bg-white p-4">
            <Text className="text-[#171311] text-base font-semibold">Sales Trends</Text>
            <Text className="text-[#171311] text-[28px] font-extrabold mt-1">{formatCurrency(analyticsOverview?.revenue_30d)}</Text>
            <View className="flex-row gap-2 items-center mt-1">
              <Text className="text-[#876d64] text-sm">Last 30 Days</Text>
              <Text className="text-[#07880b] text-sm font-semibold">+15%</Text>
            </View>
            <View className="py-4">
              <LineChart
                data={(analyticsTimeseries && analyticsTimeseries.series && analyticsTimeseries.series.length > 0) ? {
                  labels: analyticsTimeseries.series.map(d => {
                    try { return months[new Date(d.bucket_start).getMonth()]; } catch { return ''; }
                  }),
                  datasets: [{ data: analyticsTimeseries.series.map(d => d.value || 0), strokeWidth: 3 }]
                } : {
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{ data: [0,0,0,0,0,0], strokeWidth: 3 }]
                }}
                width={chartWidth}
                height={160}
                chartConfig={{
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => chartColor(opacity),
                  labelColor: (opacity = 1) => chartLabelColor(opacity),
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
          {loading && !sellerRecentOrders.length ? (
            <Text className="text-[#876d64] text-sm px-1">Loading recent orders...</Text>
          ) : sellerRecentOrders.length === 0 ? (
            <Text className="text-[#876d64] text-sm px-1">No recent orders</Text>
          ) : (
            <View className="rounded-2xl border border-[#e5dedc] bg-white overflow-hidden">
              <FlatList
                data={sellerRecentOrders}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderOrderItem}
                scrollEnabled={false}
              />
            </View>
          )}
          {error ? <Text className="text-[#b51f08] text-sm mt-2 px-1">{error}</Text> : null}
        </View>

        {/* Low Stock Alerts (pulsing red-accent) */}
        <View className="px-4 pt-6">
          <Text className="text-[#171311] text-[18px] font-extrabold px-1 pb-2">Low Stock Alerts</Text>

          <View className="rounded-2xl bg-[#fff5f3] border border-[#ffd9d2] overflow-hidden">
            {sellerInventory.filter((item)=> (item.stock ?? 0) < 5).length === 0 ? (
              <Text className="text-[#876d64] text-sm px-4 py-3">No low stock items</Text>
            ) : (
              sellerInventory.filter((item)=> (item.stock ?? 0) < 5).map((a, idx, arr) => (
                <View
                  key={a.id ?? a.name ?? idx}
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
                      <Text className="text-[#8a6c66] text-xs mt-0.5">Last Updated: {formatDate(a.created_at)}</Text>
                      <Text className="text-[#8a6c66] text-xs">Stock Left: {a.stock}</Text>

                      {/* Visual urgency bar*/}
                      <View className="mt-2 h-2 rounded-full bg-[#ffe6e1] overflow-hidden">
                        <View
                          style={{ width: `${Math.min(Number(a.stock ?? 0), 20) * 5}%` }}
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
              ))
            )}
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
                value={searchText}
                onChangeText={setSearchText}
                accessibilityLabel="inventory-search"
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
          {loading && !filteredInventory.length ? (
            <Text className="text-[#876d64] text-sm px-1">Loading inventory...</Text>
          ) : filteredInventory.length === 0 ? (
            <Text className="text-[#876d64] text-sm px-1">No products in inventory</Text>
          ) : (
            <View className="rounded-2xl border border-[#e5dedc] bg-white overflow-hidden">
              <FlatList
                data={filteredInventory}
                keyExtractor={(it) => String(it.id ?? it.name)}
                renderItem={renderProductItem}
                scrollEnabled={false}
              />
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
        {/* ... rest of the UI ... */}
        {/* end injected UI */}
       </ScrollView>

       <ProductFormBottomSheet ref={productFormRef} />
        <CreateNicheBottomSheet ref={nicheFormRef} />
     </SafeAreaView>
 // ...existing code...
  );
}
