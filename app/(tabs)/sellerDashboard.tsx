
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Animated, Easing, FlatList, RefreshControl } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Search, ArrowBigDown as CaretDown, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSellerAnalyticsOverview, getSellerAnalyticsTimeseries } from '../../services/sections/analytics';
import { getMyProducts } from '../../services/sections/product';
import { getSellerOrders, updateSellerOrderItem } from '../../services/sections/orders';
import { friendlyErrorMessage } from '../../utils/errorMessages';
import { formatStatus, statusTone } from '../../utils/formatStatus';

/** Tone -> [light, dark] classes, matching the order list. */
const STATUS_BG: Record<string, [string, string]> = {
  positive: ['bg-[#E7F6EC]', 'bg-[#1E3A28]'],
  attention: ['bg-[#FEF3E2]', 'bg-[#3A2E18]'],
  negative: ['bg-[#FDECEC]', 'bg-[#3A1E1E]'],
  neutral: ['bg-[#F4F4F5]', 'bg-surface-sunken'],
};
const STATUS_FG: Record<string, [string, string]> = {
  positive: ['text-[#0F7B3F]', 'text-[#7BD9A2]'],
  attention: ['text-[#A15C00]', 'text-[#F0B667]'],
  negative: ['text-[#C42B2B]', 'text-[#F09A9A]'],
  neutral: ['text-[#52525B]', 'text-text-secondary'],
};
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
  // Inventory filter: 'all' | 'low' (stock < 5) | product status. 'Status' chip
  // opens a small menu to pick active/inactive.
  const [invFilter, setInvFilter] = useState<'all' | 'low' | 'active' | 'inactive'>('all');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

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

  // Debounce search + apply the active inventory filter (status / low stock).
  useEffect(() => {
    const t = setTimeout(() => {
      let list = sellerInventory;
      if (invFilter === 'low') {
        list = list.filter((p: any) => (p.stock ?? 0) < 5);
      } else if (invFilter === 'active') {
        list = list.filter((p: any) => p.status === 'active');
      } else if (invFilter === 'inactive') {
        list = list.filter((p: any) => p.status === 'inactive');
      }
      if (searchText) {
        const q = searchText.trim().toLowerCase();
        list = list.filter((p: any) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          String(p.id || '').toLowerCase().includes(q)
        );
      }
      setFilteredInventory(list);
    }, 300);
    return () => clearTimeout(t);
  }, [searchText, sellerInventory, invFilter]);

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

  const pendingOrderCount = sellerRecentOrders.filter((o) => o.status === 'pending').length;
  const periodLabel = windowDays === 7 ? 'Last 7 days' : windowDays === 30 ? 'Last 30 days' : 'Last 90 days';

  // Trend %: period-over-period change from the last two timeseries buckets.
  // null when there isn't enough data — so we don't show a fabricated number.
  const trendPct = useMemo(() => {
    const s = analyticsTimeseries?.series ?? [];
    if (s.length < 2) return null;
    const prev = s[s.length - 2]?.value ?? 0;
    const last = s[s.length - 1]?.value ?? 0;
    if (prev === 0) return last > 0 ? 100 : null;
    return ((last - prev) / prev) * 100;
  }, [analyticsTimeseries]);
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
      // Surface what the server said -- on an illegal transition it names both
      // states, which is more use than "Could not accept order."
      show({ variant: 'error', title: 'Accept failed', message: friendlyErrorMessage(err, 'Could not accept order.') });
    }
  };

  const handleDeclineOrder = async (item: SellerOrderItem) => {
    try {
      await updateSellerOrderItem(item.id, { status: 'cancelled' });
      setSellerRecentOrders(prev => prev.map(it => it.id === item.id ? { ...it, status: 'cancelled' } : it));
      show({ variant: 'success', title: 'Order declined', message: 'Order item cancelled.' });
    } catch (err) {
      // Surface what the server said -- on an illegal transition it names both
      // states, which is more use than "Could not decline order."
      show({ variant: 'error', title: 'Decline failed', message: friendlyErrorMessage(err, 'Could not decline order.') });
    }
  };

  const handleUpdateOrderStatus = async (item: SellerOrderItem, newStatus: string) => {
    try {
      await updateSellerOrderItem(item.id, { status: newStatus });
      setSellerRecentOrders(prev => prev.map(it => it.id === item.id ? { ...it, status: newStatus } : it));
      show({ variant: 'success', title: 'Status updated', message: `Order item set to ${newStatus}.` });
    } catch (err) {
      show({ variant: 'error', title: 'Update failed', message: friendlyErrorMessage(err, 'Could not update order status.') });
    }
  };

  // Render helpers
  const renderOrderItem = ({ item }: { item: SellerOrderItem }) => (
    <TouchableOpacity
      onPress={() => router.push(`/sellerOrder/${item.id}` as any)}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${item.product?.name ?? "Order"}, ${formatStatus(item.status)}. Open to manage.`}
      className={`px-4 py-4 border-b ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}
    >
      <View className="flex-row justify-between items-start">
        <View style={{ flex: 1 }}>
          <Text className={`font-bold text-base text-text-primary`}>{item.product?.name}</Text>
          <Text className={`text-xs mt-1 text-text-secondary`}>{formatCurrency(item.price)}</Text>
          <Text className={`text-xs text-text-secondary`}>Order #: {item.order.order_number ?? item.order_id}</Text>
          <View className="flex-row items-center mt-3">
            <Image
              source={{ uri: item.order?.buyer?.profile_picture ?? item.order?.buyer?.profile_picture_url ?? undefined }}
              className={`w-6 h-6 rounded-full bg-surface-sunken`}
            />
            <Text className={`text-xs ml-2 text-text-primary`}>{item.order?.buyer?.buyername ?? item.order?.buyer?.username ?? "Buyer"}</Text>
          </View>
        </View>

        {/* Status, not inline actions. Accept/Decline lived here as buttons,
            which meant a seller could decline — and therefore refund a buyer —
            with one tap and no confirmation, and the same order offered
            different actions depending on which screen you found it on.
            Actions now live on the seller order screen, reached by tapping the
            row, so there is one place a seller acts on an order. "Mark
            Delivered" is gone entirely: delivery is confirmed by the buyer or
            the rider through the POD flow, and the server refuses it here. */}
        <View className="items-end ml-3 justify-center">
          <View className={`px-2.5 py-1 rounded-full ${STATUS_BG[statusTone(item.status)][isDark ? 1 : 0]}`}>
            <Text className={`text-[12px] font-semibold ${STATUS_FG[statusTone(item.status)][isDark ? 1 : 0]}`}>
              {formatStatus(item.status)}
            </Text>
          </View>
          <ChevronRight size={18} color={isDark ? "#6b6d71" : "#A1A1AA"} strokeWidth={2} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: any }) => (
    <View className={`flex-row items-center justify-between px-4 py-4 border-b border-border-strong`}>
      <View className="flex-1 pr-3">
        <Text className={`font-bold text-base text-text-primary`} numberOfLines={1}>{item.name}</Text>
        <Text className={`text-xs mt-1 text-text-secondary`}>Status: {item.status}</Text>
        <Text className={`text-xs text-text-secondary`}>Price: {formatCurrency(item.price)}, Stock: {item.stock}</Text>
      </View>

      <TouchableOpacity
        accessibilityLabel={`delete-${item.id || item.name}`}
        onPress={() => handleDeleteProduct(item.id)}
        className={`rounded px-4 h-9 items-center justify-center border ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
      >
        <Text className="text-error font-bold text-xs">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
      <ScrollView
        className={isDark ? "bg-surface-raised" : "bg-white"}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />}
      >
        {/* Time selector (7d / 30d / 90d) + Export menu */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className={`flex-row rounded p-1 border ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}>
            {([7, 30, 90] as const).map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => { setWindowDays(d); setStatusMenuVisible(false); }}
                className={`px-5 py-2 rounded ${windowDays === d ? "bg-primary shadow-sm" : "shadow-none"}`}
                accessibilityLabel={`${d} days`}
                accessibilityState={{ selected: windowDays === d }}
              >
                <Text className={`text-xs font-bold ${windowDays === d ? "text-white" : isDark ? "text-text-secondary" : "text-tertiary"}`}>
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Period label */}
        <Text className={`text-xs px-6 -mt-1 text-text-secondary`}>{periodLabel}</Text>

        {/* Revenue leads on its own, then the supporting numbers in a row.
            This was four equal bordered boxes with p-6 inside each, and a stray
            4px black bar down the left of one of them — so nothing led, and the
            accent read as a rendering artefact rather than emphasis. */}
        <View className="px-5 pt-4">
          <Text className={`text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted`}>
            Revenue
          </Text>
          <Text className={`text-[34px] font-bold mt-1 text-text-primary`}>
            {formatCurrency(analyticsOverview?.revenue_30d)}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className={`text-[13px] text-text-muted`}>
              {periodLabel}
            </Text>
            {trendPct !== null && (analyticsOverview?.revenue_30d ?? 0) > 0 ? (
              <Text
                className={`text-[13px] font-semibold ml-2 ${trendPct >= 0 ? "text-success" : "text-error"}`}
              >
                {trendPct >= 0 ? "+" : ""}
                {trendPct.toFixed(0)}%
              </Text>
            ) : null}
          </View>
          {(analyticsOverview?.revenue_30d ?? 0) === 0 ? (
            <Text className={`text-[13px] mt-1.5 text-text-muted`}>
              No sales yet — share a product to get started.
            </Text>
          ) : null}
        </View>

        <View
          className={`flex-row mx-5 mt-5 rounded-2xl ${isDark ? "bg-surface-sunken" : "bg-[#F7F7F8]"}`}
        >
          {[
            { label: "Orders", value: String(analyticsOverview?.orders_30d ?? 0) },
            { label: "Views", value: String(analyticsOverview?.views_30d ?? 0) },
            { label: "Conversion", value: `${analyticsOverview?.conversion_30d ?? 0}%` },
          ].map((stat, i) => (
            <View
              key={stat.label}
              className={`flex-1 py-4 items-center ${i > 0 ? "border-l" : ""} ${
                isDark ? "border-border-strong" : "border-[#E4E4E7]"
              }`}
            >
              <Text className={`text-[20px] font-bold text-text-primary`}>
                {stat.value}
              </Text>
              <Text className={`text-[12px] mt-0.5 text-text-muted`}>
                {stat.label}
              </Text>
            </View>
          ))}
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
            <Text className="text-white font-bold text-base">Create Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => nicheFormRef.current?.expand()}
            className={`mt-3 rounded h-12 items-center justify-center border ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
          >
            <Text className={`font-bold text-sm text-text-primary`}>Create Community</Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions — with badges */}
        <View className="flex-row flex-wrap gap-4 px-6 py-4">
          <TouchableOpacity
            accessibilityLabel="orders-quicknav"
            onPress={() => router.push("/(tabs)/sellerOrders")}
            className={`flex-row items-center rounded h-12 px-6 ${pendingOrderCount > 0 ? "bg-primary border border-primary" : (isDark ? "border-border-strong bg-surface-sunken" : "border border-border bg-white")}`}
          >
            <Text className={`font-bold text-sm ${pendingOrderCount > 0 ? "text-white" : (isDark ? "text-text-primary" : "text-black")}`}>Orders</Text>
            {pendingOrderCount > 0 && (
              <View className={`ml-2 min-w-[20px] h-5 rounded items-center justify-center px-1.5 ${isDark ? "bg-surface-raised" : "bg-primary"}`}>
                <Text className={`${isDark ? "text-primary" : "text-white"} text-[10px] font-bold`}>{pendingOrderCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/messages")}
            className={`rounded h-12 px-6 items-center justify-center border ${isDark ? "border-border-strong bg-surface-sunken" : "border border-border bg-white"}`}
          >
            <Text className={`font-bold text-sm text-text-primary`}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/requests")}
            className={`rounded h-12 px-6 items-center justify-center border ${isDark ? "border-border-strong bg-surface-sunken" : "border border-border bg-white"}`}
          >
            <Text className={`font-bold text-sm text-text-primary`}>Requests</Text>
          </TouchableOpacity>
        </View>

        {/* Sales trends card */}
        <View className="px-6 py-6">
          <View className={`rounded border p-6 ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
            {/* The figure and trend now lead the screen; repeating them here
                just made the same number appear twice. */}
            <Text className={`font-bold text-base text-text-primary`}>Sales trends</Text>
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
          <Text className={`text-xl font-bold px-1 pb-4 text-text-primary`}>Recent Orders</Text>
          {loading && !sellerRecentOrders.length ? (
            <Text className={`text-sm px-1 text-text-secondary`}>Loading recent orders...</Text>
          ) : sellerRecentOrders.length === 0 ? (
            <Text className={`text-sm px-1 text-text-secondary`}>No recent orders</Text>
          ) : (
            <View className={`rounded border overflow-hidden ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
              <FlatList
                data={sellerRecentOrders}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderOrderItem}
                scrollEnabled={false}
              />
            </View>
          )}
          {error ? <Text className="text-error text-sm mt-3 px-1">{error}</Text> : null}
        </View>

        {/* Low stock */}
        <View className="px-5 pt-8">
          <Text className={`text-[17px] font-bold pb-3 text-text-primary`}>Stock</Text>

          {/* The container only turns red when something is actually wrong.
              "No low stock items" is good news, and it was being rendered as a
              red-bordered pink alert box — the one state that should reassure
              looked like the one state that shouldn't. */}
          <View
            className={`rounded-xl overflow-hidden ${
              sellerInventory.filter((item) => (item.stock ?? 0) < 5).length === 0
                ? isDark
                  ? "bg-surface-sunken"
                  : "bg-[#F7F7F8]"
                : isDark
                  ? "bg-surface-sunken border border-[#ba1a1a]"
                  : "bg-error-bg border border-error"
            }`}
          >
            {sellerInventory.filter((item) => (item.stock ?? 0) < 5).length === 0 ? (
              <Text className={`text-[14px] px-4 py-4 text-text-muted`}>
                Everything's in stock.
              </Text>
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
                        <Text className="text-error font-bold text-xs uppercase tracking-wider">Low stock</Text>
                      </View>

                      <Text className={`font-bold text-base mt-2 text-text-primary`}>{a.name}</Text>
                      <Text className={`text-xs mt-1 text-text-secondary`}>Last Updated: {formatDate(a.created_at)}</Text>
                      <Text className={`text-xs text-text-secondary`}>Stock Left: {a.stock}</Text>

                      {/* Visual urgency bar*/}
                      <View className={`mt-3 h-1.5 rounded overflow-hidden ${isDark ? "bg-surface-raised" : "bg-error/10"}`}>
                        <View
                          style={{ width: `${Math.min(Number(a.stock ?? 0), 20) * 5}%` }}
                          className="h-1.5 bg-error"
                        />
                      </View>
                    </View>

                    {/* Badge */}
                    <View className={`rounded px-3 py-1 border ${isDark ? "bg-surface-raised border-[#ba1a1a]" : "bg-white border-error"}`}>
                      <Text className="text-error font-bold text-[10px] uppercase tracking-wider">Action needed</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Inventory search + filters */}
        <View className="px-6 pt-10">
          <Text className={`text-xl font-bold px-1 pb-4 text-text-primary`}>Inventory</Text>
          <View className={`rounded border p-6 ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
            <View className={`flex-row items-center rounded overflow-hidden border ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}>
              <View className="w-12 items-center justify-center">
                <Search size={20} color={isDark ? "#c6c5cf" : "#71717A"} />
              </View>
              <TextInput
                placeholder="Search products"
                className={`flex-1 h-12 px-3 text-base text-text-primary`}
                placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
                value={searchText}
                onChangeText={setSearchText}
                accessibilityLabel="inventory-search"
              />
            </View>

            <View className="flex-row gap-3 mt-4">
              <View>
                <TouchableOpacity
                  onPress={() => setStatusMenuVisible((v) => !v)}
                  className={`h-10 items-center justify-center rounded pl-5 pr-4 flex-row gap-2 border ${(invFilter === 'active' || invFilter === 'inactive') ? "bg-primary border-primary" : (isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border")}`}
                >
                  <Text className={`font-bold text-sm capitalize ${(invFilter === 'active' || invFilter === 'inactive') ? "text-white" : (isDark ? "text-text-primary" : "text-black")}`}>
                    {invFilter === 'active' || invFilter === 'inactive' ? invFilter : 'Status'}
                  </Text>
                  <CaretDown size={16} color={(invFilter === 'active' || invFilter === 'inactive') ? "#ffffff" : (isDark ? "#f0f1f2" : "#000000")} />
                </TouchableOpacity>
                {statusMenuVisible && (
                  <View className={`absolute top-11 left-0 z-10 rounded border overflow-hidden min-w-[130px] ${isDark ? "bg-surface-sunken border-border-strong" : "bg-white border-border"}`}>
                    {(['active', 'inactive'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => { setInvFilter(s); setStatusMenuVisible(false); }}
                        className="px-4 py-3"
                      >
                        <Text className={`font-bold text-sm capitalize text-text-primary`}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => { setInvFilter('all'); setStatusMenuVisible(false); }}
                className={`h-10 items-center justify-center rounded px-5 border ${invFilter === 'all' ? "bg-primary border-primary" : (isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border")}`}
              >
                <Text className={`font-bold text-sm ${invFilter === 'all' ? "text-white" : (isDark ? "text-text-primary" : "text-black")}`}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setInvFilter(invFilter === 'low' ? 'all' : 'low'); setStatusMenuVisible(false); }}
                className={`h-10 items-center justify-center rounded px-5 border ${invFilter === 'low' ? "bg-error border-error" : (isDark ? "bg-[#ba1a1a]/10 border-[#ba1a1a]" : "bg-error-bg border-error")}`}
              >
                <Text className={`font-bold text-sm ${invFilter === 'low' ? "text-white" : "text-error"}`}>Low</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Inventory list card */}
        <View className="px-6 pt-4">
          {loading && !filteredInventory.length ? (
            <Text className={`text-sm px-1 text-text-secondary`}>Loading inventory...</Text>
          ) : filteredInventory.length === 0 ? (
            <Text className={`text-sm px-1 text-text-secondary`}>No products in inventory</Text>
          ) : (
            <View className={`rounded border overflow-hidden ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
              <FlatList
                data={filteredInventory}
                keyExtractor={(it) => String(it.id ?? it.name)}
                renderItem={renderProductItem}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>

      <ProductFormBottomSheet ref={productFormRef} />
      <CreateNicheBottomSheet ref={nicheFormRef} />
    </SafeAreaView>
  );
}
