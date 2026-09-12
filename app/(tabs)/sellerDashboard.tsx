
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Animated, Easing, FlatList, RefreshControl } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Search, ChevronDown, AlertTriangle, ChevronRight, Pencil, Trash2, Plus, ShoppingBag, MessageCircle, FileText, Users, CheckCircle2, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSellerAnalyticsOverview, getSellerAnalyticsTimeseries } from '../../services/sections/analytics';
import { getMyProducts, getMyProductsPage } from '../../services/sections/product';
import { getSellerOrders, updateSellerOrderItem } from '../../services/sections/orders';
/** Both dashboard lists page at the same size, so the control reads the same. */
const LIST_PAGE_SIZE = 10;
import { friendlyErrorMessage } from '../../utils/errorMessages';
import { formatStatus, statusTone } from '../../utils/formatStatus';

/** Tone -> [light, dark] classes, matching the order list. */

import { deleteProduct } from '../../services/sections/product';
import { SellerAnalyticsOverview, SellerAnalyticsTimeseries } from '../../models/analytics';
import { ProductResponse } from '../../models/products';
import { OrderItem, SellerOrderItem } from '../../models/orders';
import logger from '../../utils/logger';
import Pager from '../../components/Pager';
import SearchField from '../../components/SearchField';
import { useToast } from '../../components/ToastProvider';
import ProductFormBottomSheet from '../../components/productCreateBottomSheet';
import { type InputSheetHandle } from '../../components/InputSheet';
import CreateNicheBottomSheet from '../../components/nicheCreateBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import StartCards from '../../components/startCards';
import { useTheme } from '../../components/themeProvider';
import { useTokens } from '../../theme/useTokens';
import { TONE_BG, TONE_TEXT } from "../../theme/tone";
import InventoryEditSheet from "../../components/InventoryEditSheet";
import { formatPrice } from "../../utils/money";
import { formatDate as watDate, formatMonthShort as watMonthShort } from "../../utils/datetime";

// The line between 'fine' and 'running out'. Shared by the Low filter and
// the per-row chip so the two can never disagree.
const LOW_STOCK_THRESHOLD = 5;

/**
 * The statuses a product can actually have, and what to call them.
 *
 * The menu used to offer "active" and "inactive". `inactive` is not one of
 * the five values the server knows, so picking it could never have matched a
 * product — the list just went empty and looked like an empty inventory.
 */
const PRODUCT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "archived", label: "Archived" },
] as const;

type StatusValue = (typeof PRODUCT_STATUSES)[number]["value"];
const isStatusFilter = (v: string): v is StatusValue =>
  PRODUCT_STATUSES.some((s) => s.value === v);

const { width: screenWidth } = Dimensions.get('window');

export default function SellerDashboard() {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTokens();
  //chart width
  const chartWidth = Math.min(screenWidth - 32, 800);


  const [analyticsTimeseries, setAnalyticsTimeseries] = useState<SellerAnalyticsTimeseries | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<SellerAnalyticsOverview | null>(null);
  const [sellerRecentOrders, setSellerRecentOrders] = useState<SellerOrderItem[]>([]);
  const [sellerInventory, setSellerInventory] = useState<ProductResponse[]>([]);

  /**
   * Which of the two lists is showing, and where each one is in its pages.
   *
   * Both endpoints have always been paginated and the dashboard never used
   * it: orders asked for page 1 of 5 and threw the pagination object away,
   * inventory asked for 50 and hoped that covered it. A seller with 60
   * products simply could not see the last ten.
   */
  /**
   * The screen's top-level view.
   *
   * Orders and inventory used to be the last section of a long page: past the
   * stats, the getting-started cards, the quick actions, the sales chart and
   * the low-stock alerts. A seller opening this screen to see what sold, or
   * to add a product, scrolled past everything else to reach it every time.
   *
   * Three flat tabs rather than an Overview/Activity pair with the old
   * orders-vs-inventory pills nested inside: tabs under tabs make you read
   * two rows to work out where you are, and there are only three places to
   * go.
   */
  const [tab, setTab] = useState<"overview" | "orders" | "products">("overview");
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const [invPages, setInvPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  // Inventory filter: 'all' | 'low' (below LOW_STOCK_THRESHOLD) | product status. 'Status' chip
  // opens a small menu to pick active/inactive.
  const [invFilter, setInvFilter] = useState<'all' | 'low' | StatusValue>('all');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Bottom sheet ref for product creation
  const productFormRef = useRef<InputSheetHandle>(null);

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
        const ordersData = await getSellerOrders(1, LIST_PAGE_SIZE);
        const productsData = await getMyProductsPage(1, LIST_PAGE_SIZE);
        if (!mounted) return;
        setAnalyticsOverview(analyticsOverviewData);
        setAnalyticsTimeseries(analyticsTimeseriesData);
        setSellerRecentOrders(ordersData.items || []);
        setOrdersPages(ordersData.pagination?.total_pages ?? 1);
        setSellerInventory(productsData.items || []);
        setFilteredInventory(productsData.items || []);
        setInvPages(productsData.pagination?.total_pages ?? 1);
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
        getSellerOrders(1, LIST_PAGE_SIZE),
        getMyProductsPage(1, LIST_PAGE_SIZE),
      ]);
      setAnalyticsOverview(analyticsOverviewData);
      setAnalyticsTimeseries(analyticsTimeseriesData);
      setSellerRecentOrders(ordersData.items || []);
      setOrdersPages(ordersData.pagination?.total_pages ?? 1);
      setOrdersPage(1);
      setSellerInventory(productsData.items || []);
      setFilteredInventory(productsData.items || []);
      setInvPages(productsData.pagination?.total_pages ?? 1);
      setInvPage(1);
    } catch (err) {
      setError('Failed to refresh');
      show({ variant: 'error', title: 'Refresh failed', message: 'Could not refresh dashboard data.' });
    } finally {
      setRefreshing(false);
    }
  }, [show, windowDays]);

  // Debounce search + apply the active inventory filter (status / low stock).
  /**
   * Inventory filters, asked of the server.
   *
   * This used to filter `sellerInventory` in place, which only ever held one
   * page — so searching looked at ten products and reported nothing found
   * with complete confidence. Debounced because it is a keystroke away from
   * a request.
   */
  useEffect(() => {
    const handle = setTimeout(() => {
      let cancelled = false;
      (async () => {
        try {
          const data = await getMyProductsPage(1, LIST_PAGE_SIZE, {
            search: searchText,
            status:
              invFilter === "all" || invFilter === "low" ? undefined : invFilter,
            low_stock: invFilter === "low",
          });
          if (cancelled) return;
          setSellerInventory(data.items || []);
          setFilteredInventory(data.items || []);
          setInvPages(data.pagination?.total_pages ?? 1);
          setInvPage(1);
        } catch (e) {
          // Leave what is on screen. An empty list here would read as "you
          // have no products matching that", which is a different claim.
          logger.warn("dashboard: inventory filter failed", e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, 300);
    return () => clearTimeout(handle);
  }, [searchText, invFilter]);


  // Currency: NGN (Nigerian Naira) — SELLER_DASHBOARD improvement §1
  const formatCurrency = useCallback((n?: number) => {
    const val = n ?? 0;
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(val);
    } catch {
      return `₦${Math.round(val).toLocaleString()}`;
    }
  }, []);

  const formatDate = useCallback(
    (iso?: string) => watDate(iso, { withYear: true }) || (iso ?? ''),
    []
  );

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

      const pulseColor = t.textPrimary;

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

  /**
   * Move one of the lists to another page.
   *
   * Replaces rather than appends: this is a dashboard, and the seller is
   * paging through a list to find something, not scrolling a feed. "Page 3
   * of 7" answers "where am I" in a way an infinite scroll never does.
   */
  const goToPage = React.useCallback(
    async (which: "orders" | "inventory", page: number) => {
      if (pageLoading || page < 1) return;
      setPageLoading(true);
      try {
        if (which === "orders") {
          const data = await getSellerOrders(page, LIST_PAGE_SIZE);
          setSellerRecentOrders(data.items || []);
          setOrdersPages(data.pagination?.total_pages ?? 1);
          setOrdersPage(page);
        } else {
          const data = await getMyProductsPage(page, LIST_PAGE_SIZE);
          setSellerInventory(data.items || []);
          setInvPages(data.pagination?.total_pages ?? 1);
          setInvPage(page);
        }
      } catch (e) {
        // Keep the page the seller is on rather than blanking the list —
        // a failed "next" should look like nothing happened, not like the
        // inventory vanished.
        logger.warn("dashboard: could not load page", e);
        show({
          variant: "error",
          title: "Couldn't load that page",
          message: "Check your connection and try again.",
        });
      } finally {
        setPageLoading(false);
      }
    },
    [pageLoading, show]
  );

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
      className="px-4 py-4 border-b bg-surface-raised border-border"
    >
      <View className="flex-row justify-between items-start">
        <View style={{ flex: 1 }}>
          <Text className="font-bold text-base text-text-primary">{item.product?.name}</Text>
          <Text className="text-xs mt-1 text-text-secondary">{formatCurrency(item.price)}</Text>
          <Text className="text-xs text-text-secondary">Order #: {item.order.order_number ?? item.order_id}</Text>
          <View className="flex-row items-center mt-3">
            <Image
              source={{ uri: item.order?.buyer?.profile_picture ?? item.order?.buyer?.profile_picture_url ?? undefined }}
              className="w-6 h-6 rounded-full bg-surface-sunken"
            />
            <Text className="text-xs ml-2 text-text-primary">{item.order?.buyer?.buyername ?? item.order?.buyer?.username ?? "Buyer"}</Text>
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
          <View className={`px-2.5 py-1 rounded-full ${TONE_BG[statusTone(item.status)]}`}>
            <Text className={`text-[12px] font-semibold ${TONE_TEXT[statusTone(item.status)]}`}>
              {formatStatus(item.status)}
            </Text>
          </View>
          <ChevronRight size={18} color={t.textMuted} strokeWidth={2} />
        </View>
      </View>
    </TouchableOpacity>
  );

  // A row the width of the screen was carrying "Status: active" and
  // "Price: X, Stock: Y" as label:value prose, with no product image and one
  // action. Inventory is scanned, so the things a seller scans for -- is it
  // live, is it running out, what does it cost -- are now chips and a
  // thumbnail, and the row itself opens the editor.
  const renderProductItem = ({ item }: { item: any }) => {
    const stock = Number(item.stock ?? 0);
    const isLive = (item.status ?? 'active') === 'active';
    const out = stock <= 0;
    const low = !out && stock < LOW_STOCK_THRESHOLD;
    const thumb = item.images?.[0]?.media?.original_url;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setEditingProduct(item)}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}. ${formatPrice(item.price)}, ${stock} in stock, ${isLive ? 'listed' : 'hidden'}.`}
        className="flex-row items-center gap-3 py-3"
      >
        {thumb ? (
          <Image source={{ uri: thumb }} className="w-14 h-14 rounded-xl bg-media" />
        ) : (
          <View className="w-14 h-14 rounded-xl bg-media" />
        )}

        <View className="flex-1 min-w-0">
          {/* State first. A seller scanning this list is looking for what is
              wrong -- hidden, or out of stock -- not reading names. */}
          <View className="flex-row items-center gap-1.5">
            {isLive ? (
              <CheckCircle2 size={13} color={t.successText} />
            ) : (
              <EyeOff size={13} color={t.textMuted} />
            )}
            <Text
              className={`text-[12px] font-semibold ${isLive ? "text-success-text" : "text-text-muted"}`}
            >
              {isLive ? "Active" : "Hidden"}
            </Text>
            {out || low ? (
              <>
                <Text className="text-[12px] text-text-muted">·</Text>
                <Text
                  className={`text-[12px] font-semibold ${out ? "text-danger-text" : "text-warning-text"}`}
                >
                  {out ? "Out of stock" : "Low stock"}
                </Text>
              </>
            ) : null}
          </View>

          <Text
            className="mt-0.5 text-[15px] font-semibold text-text-primary"
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {/* Price and stock on one line, the way a spec sheet reads, rather
              than each in its own pill -- the pills were three bordered
              shapes inside a bordered row inside a bordered card. */}
          <Text className="mt-0.5 text-[13px] text-text-secondary" numberOfLines={1}>
            <Text className="font-bold text-text-primary">{formatPrice(item.price)}</Text>
            {`  ·  ${stock} ${stock === 1 ? "stock" : "stocks"}`}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <View className="w-9 h-9 items-center justify-center" accessibilityElementsHidden>
            <Pencil size={17} color={t.textSecondary} />
          </View>
          <TouchableOpacity
            accessibilityLabel={`delete-${item.id || item.name}`}
            accessibilityRole="button"
            onPress={() => handleDeleteProduct(item.id)}
            hitSlop={8}
            className="w-9 h-9 items-center justify-center"
          >
            <Trash2 size={17} color={t.dangerText} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
      {/* Outside the ScrollView on purpose: a tab bar that scrolls away is a
          tab bar you have to scroll back up to use, which is the problem it
          was added to solve. */}
      <View className="flex-row gap-2 px-6 pt-3 pb-3 bg-surface-page">
        {([
          { key: "overview", label: "Overview" },
          { key: "orders", label: "Orders" },
          { key: "products", label: "Products" },
        ] as const).map(({ key, label }) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => { setTab(key); setStatusMenuVisible(false); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`flex-1 h-10 items-center justify-center rounded-xl ${
                active ? "bg-text-primary" : "bg-surface-sunken"
              }`}
            >
              <Text
                className={`text-[14px] font-semibold ${
                  // Inverted fill, so the label is the page colour. "on
                  // primary" is white in both themes and vanished against the
                  // near-white dark-mode fill.
                  active ? "text-surface-page" : "text-text-secondary"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        className={"bg-surface-page"}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.textPrimary} />}
      >
        {tab === "overview" ? (
          <>
        {/* Time selector (7d / 30d / 90d) + Export menu */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row rounded p-1 border bg-surface-sunken border-border">
            {([7, 30, 90] as const).map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => { setWindowDays(d); setStatusMenuVisible(false); }}
                className={`px-5 py-2 rounded ${windowDays === d ? "bg-primary-fill shadow-sm" : "shadow-none"}`}
                accessibilityLabel={`${d} days`}
                accessibilityState={{ selected: windowDays === d }}
              >
                <Text className={`text-xs font-bold ${windowDays === d ? "text-white" : "text-text-secondary"}`}>
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Period label */}
        <Text className="text-xs px-6 -mt-1 text-text-secondary">{periodLabel}</Text>

        {/* Revenue leads on its own, then the supporting numbers in a row.
            This was four equal bordered boxes with p-6 inside each, and a stray
            4px black bar down the left of one of them — so nothing led, and the
            accent read as a rendering artefact rather than emphasis. */}
        <View className="px-5 pt-4">
          <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            Revenue
          </Text>
          <Text className="text-[34px] font-bold mt-1 text-text-primary">
            {formatCurrency(analyticsOverview?.revenue_30d)}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-[13px] text-text-muted">
              {periodLabel}
            </Text>
            {trendPct !== null && (analyticsOverview?.revenue_30d ?? 0) > 0 ? (
              <Text
                className={`text-[13px] font-semibold ml-2 ${trendPct >= 0 ? "text-success" : "text-danger-text"}`}
              >
                {trendPct >= 0 ? "+" : ""}
                {trendPct.toFixed(0)}%
              </Text>
            ) : null}
          </View>
          {(analyticsOverview?.revenue_30d ?? 0) === 0 ? (
            <Text className="text-[13px] mt-1.5 text-text-muted">
              No sales yet — share a product to get started.
            </Text>
          ) : null}
        </View>

        <View
          className="flex-row mx-5 mt-5 rounded-2xl bg-surface-sunken"
        >
          {[
            { label: "Orders", value: String(analyticsOverview?.orders_30d ?? 0) },
            { label: "Views", value: String(analyticsOverview?.views_30d ?? 0) },
            { label: "Conversion", value: `${analyticsOverview?.conversion_30d ?? 0}%` },
          ].map((stat, i) => (
            <View
              key={stat.label}
              className={`flex-1 py-4 items-center ${i > 0 ? "border-l" : ""} ${
                "border-border-strong"
              }`}
            >
              <Text className="text-[20px] font-bold text-text-primary">
                {stat.value}
              </Text>
              <Text className="text-[12px] mt-0.5 text-text-muted">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Start cards (onboarding) — SELLER_DASHBOARD_API_AND_MOBILE_GUIDE §2.4 */}
        <StartCards title="Getting started" />

        {/* Quick actions — equal tiles, so they read as one control */}
        <View className="flex-row gap-3 px-6 pb-5">
          {[
            {
              key: "orders",
              label: "Orders",
              Icon: ShoppingBag,
              badge: pendingOrderCount,
              onPress: () => router.push("/(tabs)/sellerOrders"),
            },
            {
              key: "chats",
              label: "Chats",
              Icon: MessageCircle,
              badge: 0,
              onPress: () => router.push("/(tabs)/messages"),
            },
            {
              key: "requests",
              label: "Requests",
              Icon: FileText,
              badge: 0,
              onPress: () => router.push("/(tabs)/requests"),
            },
            {
              key: "community",
              label: "Community",
              Icon: Users,
              badge: 0,
              onPress: () => nicheFormRef.current?.expand(),
            },
          ].map(({ key, label, Icon, badge, onPress }) => (
            <TouchableOpacity
              key={key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={badge > 0 ? `${label}, ${badge} pending` : label}
              className="flex-1 items-center gap-1.5 rounded-2xl border border-border bg-surface-raised px-1 py-3.5"
            >
              <View className="relative">
                <Icon size={20} color={t.textPrimary} strokeWidth={1.9} />
                {badge > 0 ? (
                  // Sits on the icon rather than after the label: a count
                  // beside the text pushed the tiles to different widths.
                  <View className="absolute -right-2.5 -top-1.5 min-w-[18px] h-[18px] items-center justify-center rounded-full px-1 bg-primary-fill">
                    <Text className="text-[10px] font-bold text-text-on-primary">
                      {badge > 9 ? "9+" : badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-[12px] font-semibold text-text-secondary" numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sales trends card */}
        <View className="px-6 py-6">
          <View className="rounded border p-6 bg-surface-raised border-border">
            {/* The figure and trend now lead the screen; repeating them here
                just made the same number appear twice. */}
            <Text className="font-bold text-base text-text-primary">Sales trends</Text>
            <View className="py-6">
              <LineChart
                data={(analyticsTimeseries && analyticsTimeseries.series && analyticsTimeseries.series.length > 0) ? {
                  labels: analyticsTimeseries.series.map(d => {
                    return watMonthShort(d.bucket_start);
                  }),
                  datasets: [{ data: analyticsTimeseries.series.map(d => d.value || 0), strokeWidth: 3 }]
                } : {
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{ data: [0, 0, 0, 0, 0, 0], strokeWidth: 3 }]
                }}
                width={chartWidth - 48}
                height={160}
                chartConfig={{
                  backgroundGradientFrom: t.surfaceRaised,
                  backgroundGradientTo: t.surfaceRaised,
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

        {/* Low stock */}
        <View className="px-5 pt-8">
          <Text className="text-[17px] font-bold pb-3 text-text-primary">Stock</Text>

          {/* The container only turns red when something is actually wrong.
              "No low stock items" is good news, and it was being rendered as a
              red-bordered pink alert box — the one state that should reassure
              looked like the one state that shouldn't. */}
          <View
            className={`rounded-xl overflow-hidden ${
              sellerInventory.filter((item) => (item.stock ?? 0) < 5).length === 0
                ? "bg-surface-sunken"
                : isDark
                  ? "bg-surface-sunken border border-danger"
                  : "bg-danger-muted border border-danger"
            }`}
          >
            {sellerInventory.filter((item) => (item.stock ?? 0) < 5).length === 0 ? (
              <Text className="text-[14px] px-4 py-4 text-text-muted">
                Everything's in stock.
              </Text>
            ) : (
              sellerInventory.filter((item) => (item.stock ?? 0) < 5).map((a, idx, arr) => (
                <View
                  key={a.id ?? a.name ?? idx}
                  className={`flex-row items-stretch ${idx < arr.length - 1 ? (isDark ? 'border-b border-danger/20' : 'border-b border-danger/20') : ''}`}
                >
                  {/* Left accent bar  */}
                  <LeftAccentPulse />

                  {/* Content */}
                  <View className="flex-1 flex-row items-center justify-between px-6 py-5">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center gap-2">
                        <AlertTriangle size={16} color={t.dangerText} />
                        <Text className="text-danger-text font-bold text-xs uppercase tracking-wider">Low stock</Text>
                      </View>

                      <Text className="font-bold text-base mt-2 text-text-primary">{a.name}</Text>
                      <Text className="text-xs mt-1 text-text-secondary">Last Updated: {formatDate(a.created_at)}</Text>
                      <Text className="text-xs text-text-secondary">Stock Left: {a.stock}</Text>

                      {/* Visual urgency bar*/}
                      <View className={`mt-3 h-1.5 rounded overflow-hidden ${isDark ? "bg-surface-raised" : "bg-danger/10"}`}>
                        <View
                          style={{ width: `${Math.min(Number(a.stock ?? 0), 20) * 5}%` }}
                          className="h-1.5 bg-danger"
                        />
                      </View>
                    </View>

                    {/* Badge */}
                    <View className="rounded px-3 py-1 border bg-surface-raised border-danger">
                      <Text className="text-danger-text font-bold text-[10px] uppercase tracking-wider">Action needed</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

          </>
        ) : null}

        {/* Orders and inventory. Reached by the tabs above rather than by
            scrolling to the bottom of the overview. */}
        {tab !== "overview" ? (
        <View className="px-6 pt-6">
          {/* Adding a product sits above the list of products, so a seller
              can see what is already there while they add to it -- and does
              not have to leave to find the button. */}
          {tab === "products" ? (
            <TouchableOpacity
              accessibilityLabel="create-product-btn"
              accessibilityRole="button"
              onPress={handleCreateProduct}
              className="mb-4 h-[52px] flex-row items-center justify-center gap-2 rounded-xl bg-primary-fill"
            >
              <Plus size={18} color={t.textOnPrimary} strokeWidth={2.5} />
              <Text className="text-[16px] font-bold text-text-on-primary">
                Create product
              </Text>
            </TouchableOpacity>
          ) : null}
          {tab === "orders" ? (
            <>
              {loading && !sellerRecentOrders.length ? (
                <Text className="text-sm px-1 text-text-secondary">Loading recent orders…</Text>
              ) : sellerRecentOrders.length === 0 ? (
                <Text className="text-sm px-1 text-text-secondary">No recent orders</Text>
              ) : (
                <View className="rounded-2xl border overflow-hidden bg-surface-raised border-border">
                  <FlatList
                    data={sellerRecentOrders}
                    keyExtractor={(it) => String(it.id)}
                    renderItem={renderOrderItem}
                    scrollEnabled={false}
                  />
                </View>
              )}
              <Pager
                page={ordersPage}
                pages={ordersPages}
                busy={pageLoading}
                onChange={(n: number) => goToPage("orders", n)}
              />
              {error ? <Text className="text-danger-text text-sm mt-3 px-1">{error}</Text> : null}
            </>
          ) : (
            <>
          <View>
            <SearchField
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search products"
            />

            <View className="flex-row gap-3 mt-4">
              <View>
                <TouchableOpacity
                  onPress={() => setStatusMenuVisible((v) => !v)}
                  className={`h-10 items-center justify-center rounded pl-5 pr-4 flex-row gap-2 border ${isStatusFilter(invFilter) ? "bg-primary-fill border-primary" : ("bg-surface-sunken border-border")}`}
                >
                  <Text className={`font-bold text-sm capitalize ${isStatusFilter(invFilter) ? "text-white" : ("text-text-primary")}`}>
                    {isStatusFilter(invFilter)
                      ? PRODUCT_STATUSES.find((x) => x.value === invFilter)?.label
                      : 'Status'}
                  </Text>
                  <ChevronDown size={18} color={isStatusFilter(invFilter) ? t.textOnPrimary : (t.textPrimary)} />
                </TouchableOpacity>
                {statusMenuVisible && (
                  <View className="absolute top-11 left-0 z-10 rounded border overflow-hidden min-w-[130px] bg-surface-raised border-border">
                    {PRODUCT_STATUSES.map(({ value, label }) => (
                      <TouchableOpacity
                        key={value}
                        onPress={() => { setInvFilter(value); setStatusMenuVisible(false); }}
                        className="px-4 py-3"
                      >
                        <Text className="font-bold text-sm text-text-primary">{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => { setInvFilter('all'); setStatusMenuVisible(false); }}
                className={`h-10 items-center justify-center rounded px-5 border ${invFilter === 'all' ? "bg-primary-fill border-primary" : ("bg-surface-sunken border-border")}`}
              >
                <Text className={`font-bold text-sm ${invFilter === 'all' ? "text-white" : ("text-text-primary")}`}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setInvFilter(invFilter === 'low' ? 'all' : 'low'); setStatusMenuVisible(false); }}
                className={`h-10 items-center justify-center rounded px-5 border ${invFilter === 'low' ? "bg-danger border-danger" : ("bg-danger-muted border-danger")}`}
              >
                <Text className={`font-bold text-sm ${invFilter === 'low' ? "text-white" : "text-danger-text"}`}>Low</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="pt-4" />
          {loading && !filteredInventory.length ? (
            <Text className="text-sm px-1 text-text-secondary">Loading inventory...</Text>
          ) : filteredInventory.length === 0 ? (
            <Text className="text-sm px-1 text-text-secondary">No products in inventory</Text>
          ) : (
            <FlatList
              data={filteredInventory}
              keyExtractor={(it) => String(it.id ?? it.name)}
              renderItem={renderProductItem}
              scrollEnabled={false}
              // Rows run edge to edge with the hairline inset to start under
              // the text, the list language the settings screens already
              // speak. The card around them was a bordered box inside a
              // bordered screen, and it cost width on every row.
              ItemSeparatorComponent={() => (
                <View className="h-px ml-[68px] bg-border" />
              )}
            />
          )}
              <Pager
                page={invPage}
                pages={invPages}
                busy={pageLoading}
                onChange={(n: number) => goToPage("inventory", n)}
              />
            </>
          )}
        </View>
        ) : null}

        <View className="h-8" />
      </ScrollView>

      <ProductFormBottomSheet
        ref={productFormRef}
        // This screen has no refetch-on-focus -- only pull-to-refresh -- so
        // without this a seller creates a product and the inventory list
        // below still shows the world as it was.
        onCreated={(product) => {
          onRefresh();
          // Straight to what they just made, the way saving an edit already
          // shows the changed row. Creating something and being left on the
          // same screen reads as if it did not work.
          if (product?.id) router.push(`/productDetails/${product.id}` as any);
        }}
      />
      <CreateNicheBottomSheet ref={nicheFormRef} />
      <InventoryEditSheet
        product={editingProduct}
        visible={editingProduct != null}
        onClose={() => setEditingProduct(null)}
        onSaved={(updated) => {
          // Patch in place rather than refetching the whole dashboard: the
          // seller is looking at this row and expects it to change now.
          setSellerInventory((prev: any[]) =>
            prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
          );
        }}
      />
    </SafeAreaView>
  );
}
