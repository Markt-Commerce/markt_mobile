/**
 * Business dashboard: overview, quick actions, requests to answer or review,
 * your listings and recent activity. What leads depends on what the business
 * does — a producer sees supply first, a manufacturer sourcing first.
 */
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ClipboardList, MessageCircle, PackagePlus, Receipt, Search, UserCog, type LucideIcon } from "lucide-react-native";
import { Badge, Card, ListRow, SectionTitle, Stat, VerificationBadge } from "../../../components/business/ui";
import { useBusiness } from "../../../hooks/businessContext";
import { useUser } from "../../../hooks/userContextProvider";
import { useTokens } from "../../../theme/useTokens";
import { searchListings } from "../../../services/sections/business";
import { getMyRequests, getOpenProcurementRequests } from "../../../services/sections/request";
import { getBuyerOrders } from "../../../services/sections/orders";
import { formatNaira } from "../../../utils/formatCurrency";
import { formatQuantity, type BusinessListingResult, type BusinessProfile } from "../../../models/business";
import type { Request } from "../../../models/request";
import type { Order } from "../../../models/orders";

const ACTIVE_ORDER = new Set(["pending_payment", "ready_for_delivery", "pending", "processing", "shipped"]);

function completion(p: BusinessProfile): { percent: number; next?: string } {
  const checks: [string, boolean][] = [
    ["a description", !!p.description],
    ["your industry", !!p.industry],
    ["your city and state", !!(p.city && p.state)],
    ["a contact email or phone", !!(p.contact_email || p.contact_phone)],
    ["your address", !!p.address],
  ];
  const done = checks.filter(([, ok]) => ok).length + 1; // name + type are required
  return { percent: Math.round((done / (checks.length + 1)) * 100), next: checks.find(([, ok]) => !ok)?.[0] };
}

function QuickAction({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  const t = useTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="w-[48%] flex-row items-center gap-2.5 p-3.5 rounded-2xl border border-border bg-surface-raised"
    >
      <View className="w-9 h-9 rounded-xl items-center justify-center bg-primary-muted">
        <Icon size={17} color={t.primaryText} strokeWidth={2} />
      </View>
      <Text className="flex-1 text-[13px] font-bold text-text-primary" numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function BusinessDashboard() {
  const router = useRouter();
  const t = useTokens();
  const { profile: user } = useUser();
  const { config, myBusiness, refreshMyBusiness } = useBusiness();
  const sells = !!user?.is_seller;
  const buys = !!user?.is_buyer;
  const procurementOn = config.features.procurement_enabled;

  const [listings, setListings] = useState<BusinessListingResult[]>([]);
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [mine, setMine] = useState<Request[]>([]);
  const [incoming, setIncoming] = useState<Request[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const userId = user?.id;
    await Promise.all([
      refreshMyBusiness(),
      sells && userId
        ? searchListings({ sellerUserId: userId, perPage: 5 })
            .then((r) => {
              setListings(r.items);
              setListingCount(r.pagination.total_items);
            })
            .catch(() => {})
        : null,
      buys && procurementOn
        ? getMyRequests()
            .then((r) => setMine((r as unknown as Request[]).filter((x) => x.is_business)))
            .catch(() => {})
        : null,
      sells && procurementOn
        ? getOpenProcurementRequests()
            .then((r) => setIncoming(r.items.filter((x) => String(x.user_id) !== String(userId))))
            .catch(() => {})
        : null,
      // Business orders only: everyday shopping stays on the consumer side.
      buys ? getBuyerOrders(1, 20, { isBusiness: true }).then(setOrders).catch(() => {}) : null,
    ]);
  }, [user?.id, sells, buys, procurementOn]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const business = myBusiness?.profile;
  if (!business) return null; // the tabs layout sends a business-less account to onboarding

  const c = completion(business);
  const openMine = mine.filter((r) => r.status === "OPEN");
  const offersToReview = openMine.reduce((n, r) => n + (r.offers ?? []).filter((o: { status?: string }) => o.status === "PENDING").length, 0);
  const activeOrders = orders.filter((o) => ACTIVE_ORDER.has(o.status)).length;

  const sellActions = [
    { icon: PackagePlus, label: "Add a product", go: "/business/products/new" },
    ...(procurementOn ? [{ icon: ClipboardList, label: "Answer requests", go: "/business/procurement?tab=open" }] : []),
  ];
  const buyActions = [
    ...(config.features.discovery_enabled ? [{ icon: Search, label: "Find suppliers", go: "/business/discover" }] : []),
    ...(procurementOn ? [{ icon: ClipboardList, label: "Create a request", go: "/business/procurement-new" }] : []),
  ];
  const actions = [
    ...(sells && !buys ? sellActions : []),
    ...(buys ? buyActions : []),
    ...(sells && buys ? sellActions : []),
    { icon: Receipt, label: "View orders", go: "/business/orders" },
    { icon: MessageCircle, label: "Messages", go: "/business/messages" },
    { icon: UserCog, label: "Edit business profile", go: "/business/profile-edit" },
  ];

  return (
    <ScrollView
      className="flex-1 bg-surface-page"
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={t.textSecondary}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      {myBusiness?.requires_subscription ? (
        <TouchableOpacity onPress={() => router.push("/business/subscription")} className="mx-4 mt-4 p-4 rounded-2xl bg-warning-muted">
          <Text className="text-sm font-semibold text-warning-text">
            Your profile is saved but isn't visible to other businesses until you choose a plan. See plans →
          </Text>
        </TouchableOpacity>
      ) : null}

      <View className="px-4 pt-5">
        <Text className="text-[24px] font-bold tracking-tight text-text-primary">{business.name}</Text>
        <View className="flex-row flex-wrap gap-2 mt-2">
          <VerificationBadge status={business.verification_status} />
          {buys ? <Badge label="Buys" /> : null}
          {sells ? <Badge label="Sells" /> : null}
          {business.state ? <Badge label={[business.city, business.state].filter(Boolean).join(", ")} /> : null}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3 px-4 mt-5">
        <Stat label="Profile completion" value={`${c.percent}%`} hint={c.next ? `Add ${c.next}` : undefined} onPress={() => router.push("/business/profile-edit")} />
        {sells ? (
          <Stat label="Business listings" value={listingCount === null ? "—" : String(listingCount)} onPress={() => router.push("/business/products")} />
        ) : null}
        {buys && procurementOn ? (
          <Stat
            label="Open requests"
            value={String(openMine.length)}
            hint={offersToReview ? `${offersToReview} offer${offersToReview === 1 ? "" : "s"} to review` : undefined}
            onPress={() => router.push("/business/procurement")}
          />
        ) : null}
        {sells && procurementOn ? (
          <Stat label="Incoming requests" value={String(incoming.length)} hint="Open requests from businesses" onPress={() => router.push("/business/procurement?tab=open")} />
        ) : null}
        {buys ? <Stat label="Active business orders" value={String(activeOrders)} onPress={() => router.push("/business/orders")} /> : null}
      </View>

      <SectionTitle title="Quick actions" />
      <View className="flex-row flex-wrap justify-between gap-y-3 px-4">
        {actions.map((a) => (
          <QuickAction key={a.label} icon={a.icon} label={a.label} onPress={() => router.push(a.go as never)} />
        ))}
      </View>

      {sells && procurementOn ? (
        <>
          <SectionTitle title="Requests you could supply" action="See all" onAction={() => router.push("/business/procurement?tab=open")} />
          <Card className="mx-4 p-0 overflow-hidden">
            {incoming.length === 0 ? (
              <Text className="p-4 text-sm text-text-secondary">No open procurement requests right now.</Text>
            ) : (
              incoming.slice(0, 4).map((r, i, arr) => (
                <ListRow
                  key={r.id}
                  title={r.title}
                  meta={[formatQuantity(r.quantity, r.unit, config.units), r.delivery_location].filter(Boolean).join(" · ") || undefined}
                  aside={`${r.offers?.length ?? 0} offer${(r.offers?.length ?? 0) === 1 ? "" : "s"}`}
                  onPress={() => router.push(`/requestDetails/${r.id}`)}
                  last={i === arr.length - 1}
                />
              ))
            )}
          </Card>
        </>
      ) : null}

      {buys && procurementOn ? (
        <>
          <SectionTitle title="Your procurement requests" action="See all" onAction={() => router.push("/business/procurement")} />
          <Card className="mx-4 p-0 overflow-hidden">
            {mine.length === 0 ? (
              <Text className="p-4 text-sm text-text-secondary">Tell suppliers what you need and let them come to you.</Text>
            ) : (
              mine.slice(0, 4).map((r, i, arr) => (
                <ListRow
                  key={r.id}
                  title={r.title}
                  meta={[String(r.status).toLowerCase(), formatQuantity(r.quantity, r.unit, config.units)].filter(Boolean).join(" · ")}
                  aside={`${r.offers?.length ?? 0} offer${(r.offers?.length ?? 0) === 1 ? "" : "s"}`}
                  onPress={() => router.push(`/requestDetails/${r.id}`)}
                  last={i === arr.length - 1}
                />
              ))
            )}
          </Card>
        </>
      ) : null}

      {sells ? (
        <>
          <SectionTitle title="Your business listings" action="Manage" onAction={() => router.push("/business/products")} />
          <Card className="mx-4 p-0 overflow-hidden">
            {listings.length === 0 ? (
              <Text className="p-4 text-sm text-text-secondary">
                Add units, minimum orders and specifications so businesses can find your products.
              </Text>
            ) : (
              listings.map((l, i, arr) => (
                <ListRow
                  key={l.id}
                  title={l.name}
                  meta={
                    l.business_listing.available_quantity != null
                      ? `${formatQuantity(l.business_listing.available_quantity, l.business_listing.unit, config.units)} available`
                      : undefined
                  }
                  aside={formatNaira(l.price)}
                  onPress={() => router.push(`/business/products/${l.id}`)}
                  last={i === arr.length - 1}
                />
              ))
            )}
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}
