
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Animated, Easing, FlatList, RefreshControl } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Search, ArrowBigDown as CaretDown, AlertTriangle, MoreVertical } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSellerAnalyticsOverview, getSellerAnalyticsTimeseries } from '../../services/sections/analytics';
import { getMyProducts } from '../../services/sections/product';
import { getSellerOrders, updateSellerOrderItem } from '../../services/sections/orders';
import { deleteProduct } from '../../services/sections/product';
import { SellerAnalyticsOverview, SellerAnalyticsTimeseries } from '../../models/analytics';
import { ProductResponse } from '../../models/products';
import { OrderItem, SellerOrderItem } from '../../models/orders';
import { useToast } from '../../components/ToastProvider';
import ProductFormBottomSheet from '../../components/productCreateBottomSheet';
import CreateNicheBottomSheet from '../../components/nicheCreateBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import StartCards from '../../components/startCards';
import { useTheme } from '../../components/themeProvider';

const { width: screenWidth } = Dimensions.get('window');

export default function SellerDashboard() {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);

  // Bottom sheet ref for product creation
  const productFormRef = useRef<BottomSheet>(null);

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
        const analyticsOverviewData = await getSellerAnalyticsOverview(windowDays);
        const analyticsTimeseriesData = await getSellerAnalyticsTimeseries({
          bucket: "month",
          start_date: fromDate,
          end_date: toDate,
          metric: "sales"
        });
        const ordersData = await getSellerOrders(1, 5);
        const productsData = await getMyProducts(1, 50);
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
  }, [show, windowDays]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const date = new Date();
      const fromDate = (new Date(date.getFullYear() - 1, date.getMonth(), 1)).toISOString();
      const toDate = (new Date()).toISOString();
      const [analyticsOverviewData, analyticsTimeseriesData, ordersData, productsData] = await Promise.all([
        getSellerAnalyticsOverview(windowDays),
        getSellerAnalyticsTimeseries({
          bucket: "month",
          start_date: fromDate,
          end_date: toDate,
          metric: "sales"
        }),
        getSellerOrders(1, 5),
        getMyProducts(1, 50),
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
  }, [show, windowDays]);

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

  // Currency: NGN (Nigerian Naira) — SELLER_DASHBOARD improvement §1
  const formatCurrency = useCallback((n?: number) => {
    const val = n ?? 0;
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(val);
    } catch {
      return `₦${Math.round(val).toLocaleString()}`;
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

      const pulseColor = isDark ? "#f0f1f2" : "#000000";

      return (
        <View style={{ width: 4, backgroundColor: pulseColor, position: 'relative' }}>
          <Animated.View
            style={{
              position: 'absolute',
              top: -6,
              bottom: -6,
              left: -4,
              right: -4,
              backgroundColor: pulseColor,
              opacity,
              borderRadius: 8,
            }}
          />
        </View>
      );
    };
  }, [isDark]);

  // Safe color fn for chart config (accepts opacity)
  const chartColor = (opacity = 1) => isDark ? `rgba(240,241,242,${opacity})` : `rgba(0,0,0,${opacity})`;
  const chartLabelColor = (opacity = 1) => isDark ? `rgba(198,197,207,${opacity})` : `rgba(113,113,122,${opacity})`;

  // Handlers (now wired)
  const handleExport = () => {
    setExportMenuVisible(false);
    show({ variant: 'info', title: 'Export report', message: 'Export started (not implemented).' });
  };

  const pendingOrderCount = sellerRecentOrders.filter((o) => o.status === 'pending').length;
  const periodLabel = windowDays === 7 ? 'Last 7 days' : windowDays === 30 ? 'Last 30 days' : 'Last 90 days';
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
      await updateSellerOrderItem(item.id, { status: 'processing' });
      setSellerRecentOrders(prev => prev.map(it => it.id === item.id ? { ...it, status: 'processing' } : it));
      show({ variant: 'success', title: 'Order accepted', message: 'Order item marked as processing.' });
    } catch (err) {
      show({ variant: 'error', title: 'Accept failed', message: 'Could not accept order.' });
    }
  };

  const handleDeclineOrder = async (item: SellerOrderItem) => {
    try {
      await updateSellerOrderItem(item.id, { status: 'cancelled' });
      setSellerRecentOrders(prev => prev.map(it => it.id === item.id ? { ...it, status: 'cancelled' } : it));
      show({ variant: 'success', title: 'Order declined', message: 'Order item cancelled.' });
    } catch (err) {
      show({ variant: 'error', title: 'Decline failed', message: 'Could not decline order.' });
    }
  };

  const handleUpdateOrderStatus = async (item: SellerOrderItem, newStatus: string) => {
    try {
      await updateSellerOrderItem(item.id, { status: newStatus });
      setSellerRecentOrders(prev => prev.map(it => it.id === item.id ? { ...it, status: newStatus } : it));
      show({ variant: 'success', title: 'Status updated', message: `Order item set to ${newStatus}.` });
    } catch (err) {
      show({ variant: 'error', title: 'Update failed', message: 'Could not update order status.' });
    }
  };

  // Render helpers
  const renderOrderItem = ({ item }: { item: SellerOrderItem }) => (
    <View className={`px-4 py-4 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
      <View className="flex-row justify-between items-start">
        <View style={{ flex: 1 }}>
          <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{item.product?.name}</Text>
          <Text className={`font-inter text-xs mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>{formatCurrency(item.price)}</Text>
          <Text className={`font-inter text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Order #: {item.order.order_number ?? item.order_id}</Text>
          <View className="flex-row items-center mt-3">
            <Image
              source={{ uri: item.order?.buyer?.profile_picture ?? item.order?.buyer?.profile_picture_url }}
              className={`w-6 h-6 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
            />
            <Text className={`font-inter text-xs ml-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{item.order?.buyer?.buyername ?? item.order?.buyer?.username ?? "Buyer"}</Text>
          </View>
        </View>

        <View className="items-end ml-3">
          {item.status === 'pending' ? (
            <>
              <TouchableOpacity onPress={() => handleAcceptOrder(item)} className="bg-primary rounded px-4 py-2 mb-2">
                <Text className="text-white font-geist font-bold text-xs">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeclineOrder(item)} className={`rounded px-4 py-2 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
                <Text className={`font-geist font-bold text-xs ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Decline</Text>
              </TouchableOpacity>
            </>
          ) : item.status === 'processing' ? (
            <>
              <TouchableOpacity onPress={() => handleUpdateOrderStatus(item, 'shipped')} className="bg-primary rounded px-4 py-2 mb-2">
                <Text className="text-white font-geist font-bold text-xs">Mark Shipped</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeclineOrder(item)} className={`rounded px-4 py-2 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
                <Text className={`font-geist font-bold text-xs ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : item.status === 'shipped' ? (
            <TouchableOpacity onPress={() => handleUpdateOrderStatus(item, 'delivered')} className="bg-primary rounded px-4 py-2">
              <Text className="text-white font-geist font-bold text-xs">Mark Delivered</Text>
            </TouchableOpacity>
          ) : (
            <Text className={`font-geist font-bold text-sm capitalize ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{item.status}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderProductItem = ({ item }: { item: any }) => (
    <View className={`flex-row items-center justify-between px-4 py-4 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
      <View className="flex-1 pr-3">
        <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>{item.name}</Text>
        <Text className={`font-inter text-xs mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Status: {item.status}</Text>
        <Text className={`font-inter text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Price: {formatCurrency(item.price)}, Stock: {item.stock}</Text>
      </View>

      <TouchableOpacity
        accessibilityLabel={`delete-${item.id || item.name}`}
        onPress={() => handleDeleteProduct(item.id)}
        className={`rounded px-4 h-9 items-center justify-center border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
      >
        <Text className="text-error font-geist font-bold text-xs">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
      <ScrollView
        className={isDark ? "bg-[#1a1c1d]" : "bg-white"}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />}
      >
        {/* Time selector (7d / 30d / 90d) + Export menu */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className={`flex-row rounded p-1 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            {([7, 30, 90] as const).map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => { setWindowDays(d); setExportMenuVisible(false); }}
                className={`px-5 py-2 rounded ${windowDays === d ? "bg-primary shadow-sm" : ""}`}
                accessibilityLabel={`${d} days`}
                accessibilityState={{ selected: windowDays === d }}
              >
                <Text className={`text-xs font-geist font-bold ${windowDays === d ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setExportMenuVisible(!exportMenuVisible)}
            className="p-2 -mr-2"
            accessibilityLabel="More options"
          >
            <MoreVertical size={22} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
        </View>
        {exportMenuVisible && (
          <TouchableOpacity
            onPress={handleExport}
            className={`mx-6 mb-4 py-4 px-5 rounded border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}
          >
            <Text className={`font-geist font-bold text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Export report</Text>
          </TouchableOpacity>
        )}

        {/* Period label */}
        <Text className={`font-inter text-xs px-6 -mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>{periodLabel}</Text>

        {/* Metrics cards — Revenue first, visual hierarchy, empty states */}
        <View className="flex-row flex-wrap gap-4 p-6">
          <View className={`min-w-[160px] flex-1 rounded p-6 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`} style={{ borderLeftWidth: 4, borderLeftColor: isDark ? '#f0f1f2' : '#000000' }}>
            <Text className={`text-[10px] font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Revenue</Text>
            <Text className={`text-2xl font-geist font-bold mt-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              {formatCurrency(analyticsOverview?.revenue_30d)}
            </Text>
            {(analyticsOverview?.revenue_30d ?? 0) === 0 && (
              <Text className={`font-inter text-[10px] mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No sales yet. Share your products to get started.</Text>
            )}
          </View>
          <View className={`min-w-[158px] flex-1 rounded p-6 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
            <Text className={`text-[10px] font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Orders</Text>
            <Text className={`text-2xl font-geist font-bold mt-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{analyticsOverview?.orders_30d ?? 0}</Text>
            {(analyticsOverview?.orders_30d ?? 0) === 0 && (
              <Text className={`font-inter text-[10px] mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No orders yet.</Text>
            )}
          </View>
          <View className={`min-w-[158px] flex-1 rounded p-6 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
            <Text className={`text-[10px] font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Product Views</Text>
            <Text className={`text-2xl font-geist font-bold mt-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{analyticsOverview?.views_30d ?? 0}</Text>
            {(analyticsOverview?.views_30d ?? 0) === 0 && (
              <Text className={`font-inter text-[10px] mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No product views yet.</Text>
            )}
          </View>
          <View className={`min-w-[158px] flex-1 rounded p-6 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
            <Text className={`text-[10px] font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Conversion Rate</Text>
            <Text className={`text-2xl font-geist font-bold mt-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{(analyticsOverview?.conversion_30d ?? 0)}%</Text>
          </View>
        </View>

        {/* Start cards (onboarding) — SELLER_DASHBOARD_API_AND_MOBILE_GUIDE §2.4 */}
        <StartCards title="Getting started" />

        {/* Primary CTA — Create Product */}
        <View className="px-6 py-4">
          <TouchableOpacity
            accessibilityLabel="create-product-btn"
            onPress={handleCreateProduct}
            className="rounded h-12 items-center justify-center bg-primary"
          >
            <Text className="text-white font-geist font-bold text-base">Create Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => nicheFormRef.current?.expand()}
            className={`mt-3 rounded h-12 items-center justify-center border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
          >
            <Text className={`font-geist font-bold text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create Community</Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions — with badges */}
        <View className="flex-row flex-wrap gap-4 px-6 py-4">
          <TouchableOpacity
            accessibilityLabel="orders-quicknav"
            onPress={() => router.push("/(tabs)/sellerOrders")}
            className={`flex-row items-center rounded h-12 px-6 ${pendingOrderCount > 0 ? "bg-primary border border-primary" : (isDark ? "border-[#46464e] bg-[#2f3132]" : "border border-border bg-white")}`}
          >
            <Text className={`font-geist font-bold text-sm ${pendingOrderCount > 0 ? "text-white" : (isDark ? "text-[#f0f1f2]" : "text-black")}`}>Orders</Text>
            {pendingOrderCount > 0 && (
              <View className={`ml-2 min-w-[20px] h-5 rounded items-center justify-center px-1.5 ${isDark ? "bg-[#1a1c1d]" : "bg-primary"}`}>
                <Text className={`${isDark ? "text-primary" : "text-white"} text-[10px] font-bold`}>{pendingOrderCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/messages")}
            className={`rounded h-12 px-6 items-center justify-center border ${isDark ? "border-[#46464e] bg-[#2f3132]" : "border border-border bg-white"}`}
          >
            <Text className={`font-geist font-bold text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/requests")}
            className={`rounded h-12 px-6 items-center justify-center border ${isDark ? "border-[#46464e] bg-[#2f3132]" : "border border-border bg-white"}`}
          >
            <Text className={`font-geist font-bold text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Requests</Text>
          </TouchableOpacity>
        </View>

        {/* Sales trends card */}
        <View className="px-6 py-6">
          <View className={`rounded border p-6 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Sales Trends</Text>
            <Text className={`text-[32px] font-geist font-bold mt-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatCurrency(analyticsOverview?.revenue_30d ?? 0)}</Text>
            <View className="flex-row gap-2 items-center mt-2">
              <Text className={`font-inter text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Last 30 Days</Text>
              <Text className="text-success font-inter text-sm font-bold">+15%</Text>
            </View>
            <View className="py-6">
              <LineChart
                data={(analyticsTimeseries && analyticsTimeseries.series && analyticsTimeseries.series.length > 0) ? {
                  labels: analyticsTimeseries.series.map(d => {
                    try { return months[new Date(d.bucket_start).getMonth()]; } catch { return ''; }
                  }),
                  datasets: [{ data: analyticsTimeseries.series.map(d => d.value || 0), strokeWidth: 3 }]
                } : {
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{ data: [0, 0, 0, 0, 0, 0], strokeWidth: 3 }]
                }}
                width={chartWidth - 48}
                height={160}
                chartConfig={{
                  backgroundGradientFrom: isDark ? '#1a1c1d' : '#ffffff',
                  backgroundGradientTo: isDark ? '#1a1c1d' : '#ffffff',
                  color: (opacity = 1) => `rgba(233, 76, 42, ${opacity})`,
                  labelColor: (opacity = 1) => chartLabelColor(opacity),
                  decimalPlaces: 0,
                  propsForDots: { r: '3' },
                  strokeWidth: 3,
                }}
                bezier
                style={{ borderRadius: 8 }}
                withInnerLines={false}
                withOuterLines={false}
              />
            </View>
          </View>
        </View>

        {/* Recent Orders card */}
        <View className="px-6 pt-4">
          <Text className={`text-xl font-geist font-bold px-1 pb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Recent Orders</Text>
          {loading && !sellerRecentOrders.length ? (
            <Text className={`font-inter text-sm px-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Loading recent orders...</Text>
          ) : sellerRecentOrders.length === 0 ? (
            <Text className={`font-inter text-sm px-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No recent orders</Text>
          ) : (
            <View className={`rounded border overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
              <FlatList
                data={sellerRecentOrders}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderOrderItem}
                scrollEnabled={false}
              />
            </View>
          )}
          {error ? <Text className="text-error font-inter text-sm mt-3 px-1">{error}</Text> : null}
        </View>

        {/* Low Stock Alerts (pulsing red-accent) */}
        <View className="px-6 pt-10">
          <Text className={`text-xl font-geist font-bold px-1 pb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Low Stock Alerts</Text>

          <View className={`rounded border overflow-hidden ${isDark ? "bg-[#2f3132] border-[#ba1a1a]" : "bg-error-bg border-error"}`}>
            {sellerInventory.filter((item) => (item.stock ?? 0) < 5).length === 0 ? (
              <Text className={`font-inter text-sm px-6 py-5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No low stock items</Text>
            ) : (
              sellerInventory.filter((item) => (item.stock ?? 0) < 5).map((a, idx, arr) => (
                <View
                  key={a.id ?? a.name ?? idx}
                  className={`flex-row items-stretch ${idx < arr.length - 1 ? (isDark ? 'border-b border-[#ba1a1a]/20' : 'border-b border-error/20') : ''}`}
                >
                  {/* Left accent bar  */}
                  <LeftAccentPulse />

                  {/* Content */}
                  <View className="flex-1 flex-row items-center justify-between px-6 py-5">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center gap-2">
                        <AlertTriangle size={16} color="#ba1a1a" />
                        <Text className="text-error font-geist font-bold text-xs uppercase tracking-wider">Low stock</Text>
                      </View>

                      <Text className={`font-geist font-bold text-base mt-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{a.name}</Text>
                      <Text className={`font-inter text-xs mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Last Updated: {formatDate(a.created_at)}</Text>
                      <Text className={`font-inter text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Stock Left: {a.stock}</Text>

                      {/* Visual urgency bar*/}
                      <View className={`mt-3 h-1.5 rounded overflow-hidden ${isDark ? "bg-[#1a1c1d]" : "bg-error/10"}`}>
                        <View
                          style={{ width: `${Math.min(Number(a.stock ?? 0), 20) * 5}%` }}
                          className="h-1.5 bg-error"
                        />
                      </View>
                    </View>

                    {/* Badge */}
                    <View className={`rounded px-3 py-1 border ${isDark ? "bg-[#1a1c1d] border-[#ba1a1a]" : "bg-white border-error"}`}>
                      <Text className="text-error font-geist font-bold text-[10px] uppercase tracking-wider">Action needed</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Inventory search + filters */}
        <View className="px-6 pt-10">
          <Text className={`text-xl font-geist font-bold px-1 pb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Inventory</Text>
          <View className={`rounded border p-6 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            <View className={`flex-row items-center rounded overflow-hidden border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
              <View className="w-12 items-center justify-center">
                <Search size={20} color={isDark ? "#c6c5cf" : "#71717A"} />
              </View>
              <TextInput
                placeholder="Search products"
                className={`flex-1 h-12 px-3 font-inter text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
                placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
                value={searchText}
                onChangeText={setSearchText}
                accessibilityLabel="inventory-search"
              />
            </View>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity className={`h-10 items-center justify-center rounded pl-5 pr-4 flex-row gap-2 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
                <Text className={`font-geist font-bold text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Status</Text>
                <CaretDown size={16} color={isDark ? "#f0f1f2" : "#000000"} />
              </TouchableOpacity>
              <TouchableOpacity className="h-10 items-center justify-center rounded bg-primary px-5">
                <Text className="text-white font-geist font-bold text-sm">All</Text>
              </TouchableOpacity>
              <TouchableOpacity className={`h-10 items-center justify-center rounded px-5 border ${isDark ? "bg-[#ba1a1a]/10 border-[#ba1a1a]" : "bg-error-bg border-error"}`}>
                <Text className="text-error font-geist font-bold text-sm">Low</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Inventory list card */}
        <View className="px-6 pt-4">
          {loading && !filteredInventory.length ? (
            <Text className={`font-inter text-sm px-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Loading inventory...</Text>
          ) : filteredInventory.length === 0 ? (
            <Text className={`font-inter text-sm px-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No products in inventory</Text>
          ) : (
            <View className={`rounded border overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
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
        <View className="flex-row w-full items-center justify-center gap-3 py-10">
          <View className="h-2 w-2 rounded bg-primary" />
          <View className={`h-2 w-2 rounded ${isDark ? "bg-[#46464e]" : "bg-border"}`} />
          <View className={`h-2 w-2 rounded ${isDark ? "bg-[#46464e]" : "bg-border"}`} />
        </View>

        <View className="h-4" />
      </ScrollView>

      <ProductFormBottomSheet ref={productFormRef} />
      <CreateNicheBottomSheet ref={nicheFormRef} />
    </SafeAreaView>
  );
}
