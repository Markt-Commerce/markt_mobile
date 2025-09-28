import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OrdersList from "../../components/orderList";
import { Search } from "lucide-react-native";

// Dummy data & helpers 
type OrderStatus = "pending" | "shipped" | "delivered" | "canceled";

type OrderRow = {
  from: string;
  product: string;
  order: string; 
  price: string; 
  status: OrderStatus;
  dateISO: string; 
};

// simple helpers
const names = [
  "Olivia Bennett", "Ethan Carter", "Ava Johnson", "Liam Davis", "Mia Wilson",
  "Noah Harper", "Chloe Clark", "Owen Carter", "Sophia Lewis", "James Reed",
];
const products = [
  "Leather Wallet", "Vintage Sunglasses", "Wireless Earbuds", "Smartwatch",
  "Bluetooth Speaker", "Gaming Mouse", "Mechanical Keyboard", "USB-C Hub",
  "Portable SSD", "Laptop Sleeve",
];
const statuses: OrderStatus[] = ["pending", "shipped", "delivered", "canceled"];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function orderLine(id: number) {
  // e.g. "#345678 - 3 items"
  const items = (id % 4) + 1;
  const base = 100000 + id;
  return `#${base} - ${items} item${items > 1 ? "s" : ""}`;
}

// generate N mock orders with varying dates & prices
function buildMockOrders(N = 44): OrderRow[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const arr: OrderRow[] = [];
  for (let i = 0; i < N; i++) {
    const name = names[i % names.length];
    const product = products[(i * 3) % products.length];
    const status = statuses[i % statuses.length];
    const daysAgo = (i * 2) % 60; // within last ~2 months
    const price = 10 + ((i * 7) % 90); // 10..99
    arr.push({
      from: name,
      product,
      order: orderLine(1000 + i),
      price: money(price),
      status,
      dateISO: new Date(now - daysAgo * oneDay).toISOString(),
    });
  }
  return arr;
}

const MOCK_ORDERS = buildMockOrders();

// ---- Screen ----
export default function SellerOrders() {
  // UI state that affects how we fetch pages (search/filter/sort)
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | OrderStatus>("all");
  const [sort, setSort] = React.useState<"latest" | "price_asc" | "price_desc">("latest");

  const pageSize = 10;

  // Derive counts for pills
  const counts = React.useMemo(() => {
    const base = MOCK_ORDERS;
    const byStatus: Record<"all" | OrderStatus, number> = {
      all: base.length,
      pending: base.filter((o) => o.status === "pending").length,
      shipped: base.filter((o) => o.status === "shipped").length,
      delivered: base.filter((o) => o.status === "delivered").length,
      canceled: base.filter((o) => o.status === "canceled").length,
    };
    return byStatus;
  }, []);

  // Our fetch function matches OrdersList API: (page: number) => Promise<OrderRow[]>
  // It applies filters & sorting on the mock data and paginates.
  const fetchSellerOrders = React.useCallback(async (page: number) => {
    // ---- Real API (uncomment and adapt when backend is ready) ----
    /*
    // Example with your request helper:
    const res = await request('/orders/seller', {
      method: 'GET',
      params: {
        page,
        pageSize,
        status: status === 'all' ? undefined : status,
        q: query || undefined,
        sort, // 'latest' | 'price_asc' | 'price_desc'
      },
    });
    // Expecting res.data.items in your OrdersList format:
    return res.data.items;
    */

    await new Promise((r) => setTimeout(r, 500)); // small delay for UX

    // filter
    let rows = MOCK_ORDERS.filter((o) => {
      const matchStatus = status === "all" ? true : o.status === status;
      const q = query.trim().toLowerCase();
      const matchQuery = q
        ? o.from.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q) ||
          o.order.toLowerCase().includes(q)
        : true;
      return matchStatus && matchQuery;
    });

    // sort
    rows.sort((a, b) => {
      if (sort === "latest") {
        return new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime();
      }
      const priceA = parseFloat(a.price.replace("$", ""));
      const priceB = parseFloat(b.price.replace("$", ""));
      if (sort === "price_asc") return priceA - priceB;
      return priceB - priceA; // price_desc
    });

    // paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = rows.slice(start, end);

    // Map to the minimal shape your existing OrdersList expects.
    return slice.map((o) => ({
      from: o.from,
      product: o.product,
      order: o.order,
      price: o.price,
      // Extra fields are fine if OrdersList ignores them:
      status: o.status,
      dateISO: o.dateISO,
    }));
  }, [pageSize, query, sort, status]);

  // Re-mount OrdersList when filters change so it calls fetch from page 1
  const listKey = `${status}|${sort}|${query}`;

  const Pill = ({
    active,
    children,
    onPress,
  }: {
    active?: boolean;
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`h-9 px-3 rounded-full items-center justify-center border ${
        active ? "bg-[#e26136] border-[#e26136]" : "bg-white border-[#e5dedc]"
      }`}
    >
      <Text className={active ? "text-white font-semibold" : "text-[#171311] font-medium"}>
        {children}
      </Text>
    </TouchableOpacity>
  );

  // Sort toggle button
  const SortBtn = ({ label, v }: { label: string; v: typeof sort }) => (
    <TouchableOpacity
      onPress={() => setSort(v)}
      className={`h-9 px-3 rounded-full border ${
        sort === v ? "bg-[#f5f2f1] border-[#e5dedc]" : "bg-white border-[#e5dedc]"
      } items-center justify-center`}
      activeOpacity={0.85}
    >
      <Text className="text-[#171311] text-xs font-medium">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 border-b border-[#efe9e7]">
        <Text className="text-lg font-extrabold text-[#171311]">Shop Orders</Text>
        <Text className="text-xs text-[#876d64] mt-0.5">
          {status === "all"
            ? `${counts.all} orders total`
            : `${counts[status]} ${status} orders`}
        </Text>
      </View>

      {/* Search + Status filters */}
      <View className="px-4 pt-3">
        {/* Search */}
        <View className="flex-row items-center rounded-full overflow-hidden border border-[#e5dedc]">
          <View className="bg-[#f4f1f0] h-11 w-11 items-center justify-center">
            <Search size={18} color="#876d64" />
          </View>
          <TextInput
            className="flex-1 h-11 bg-[#f4f1f0] px-4 text-[#171311]"
            placeholder="Search by buyer, product, or order #"
            placeholderTextColor="#9a8a85"
            value={query}
            onChangeText={setQuery}
            // nice to have: submit clears keyboard; OrdersList will re-mount via key anyway
            returnKeyType="search"
          />
        </View>

        {/* Status pills */}
        <View className="flex-row flex-wrap gap-2 mt-3">
          <Pill active={status === "all"} onPress={() => setStatus("all")}>
            All ({counts.all})
          </Pill>
          <Pill active={status === "pending"} onPress={() => setStatus("pending")}>
            Pending ({counts.pending})
          </Pill>
          <Pill active={status === "shipped"} onPress={() => setStatus("shipped")}>
            Shipped ({counts.shipped})
          </Pill>
          <Pill active={status === "delivered"} onPress={() => setStatus("delivered")}>
            Delivered ({counts.delivered})
          </Pill>
          <Pill active={status === "canceled"} onPress={() => setStatus("canceled")}>
            Canceled ({counts.canceled})
          </Pill>
        </View>

        {/* Sort toggles */}
        <View className="flex-row gap-2 mt-3">
          <SortBtn label="Latest" v="latest" />
          <SortBtn label="Price ↑" v="price_asc" />
          <SortBtn label="Price ↓" v="price_desc" />
        </View>
      </View>

      {/* List */}
      <View className="flex-1 mt-2">
        <OrdersList
          key={listKey}
          fetchOrders={fetchSellerOrders}
          isSeller
        />
      </View>
    </SafeAreaView>
  );
}
