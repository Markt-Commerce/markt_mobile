/**
 * A product as a business listing: price per unit, business terms,
 * specifications and who supplies it — with a way to talk before ordering.
 */
import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import BottomSheet from "@gorhom/bottom-sheet";
import { Building2, MessageCircle, Package } from "lucide-react-native";
import ScreenHeader from "../../../components/ScreenHeader";
import Button from "../../../components/button";
import QuickChatBottomSheet from "../../../components/quickChatBottomSheet";
import { Badge, EmptyState, Loading, Term, VerificationBadge } from "../../../components/business/ui";
import { useBusiness } from "../../../hooks/businessContext";
import { useUser } from "../../../hooks/userContextProvider";
import { useTokens } from "../../../theme/useTokens";
import { getProductById } from "../../../services/sections/product";
import { getBusinessProfile, getListing } from "../../../services/sections/business";
import { formatNaira } from "../../../utils/formatCurrency";
import { formatQuantity, unitSingular, type BusinessListing, type BusinessProfile } from "../../../models/business";
import type { ProductDetail } from "../../../models/products";

export default function BusinessListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { user, profile } = useUser();
  // The profile id is always there once signed in; the session blob's user_id is optional.
  const myId = profile?.id ?? user?.user_id;
  const { config } = useBusiness();
  const chatRef = useRef<BottomSheet>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [terms, setTerms] = useState<BusinessListing | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, l] = await Promise.all([getProductById(id), getListing(id)]);
        setProduct(p);
        setTerms(l);
        if (p.seller_user?.id) getBusinessProfile(p.seller_user.id).then(setBusiness).catch(() => {});
      } catch {
        setFailed(true);
      }
    })();
  }, [id]);

  if (failed) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
        <ScreenHeader title="Listing" fallback="/business/discover" />
        <EmptyState icon={Package} title="This listing isn't available" message="It may have been removed or is no longer listed for businesses." />
      </SafeAreaView>
    );
  }
  if (!product || !terms) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
        <ScreenHeader title="Listing" fallback="/business/discover" />
        <Loading />
      </SafeAreaView>
    );
  }

  const sellerUserId = product.seller_user?.id;
  const isMine = !!sellerUserId && String(sellerUserId) === String(myId);
  const image = (product.images?.[0] as { media?: { mobile_url?: string; original_url?: string } } | undefined)?.media;
  const imageUri = image?.mobile_url ?? image?.original_url;
  const unit = unitSingular(config.units, terms.unit);
  const specs = Object.entries(terms.specifications ?? {});

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top"]}>
      <ScreenHeader title="Listing" fallback="/business/discover" />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {imageUri ? <Image source={{ uri: imageUri }} className="w-full h-56 bg-surface-sunken" resizeMode="cover" /> : null}
        <View className="px-4 pt-5">
          <Text className="text-[24px] font-bold tracking-tight text-text-primary">{product.name}</Text>
          <View className="flex-row items-center flex-wrap gap-2 mt-2">
            <Text className="text-[20px] font-bold text-text-primary">{formatNaira(product.price)}</Text>
            <Text className="text-[13px] font-semibold text-text-secondary">per {unit}</Text>
            {terms.price_negotiable ? <Badge label="Negotiable" tone="brand" /> : null}
          </View>
          {product.description ? <Text className="mt-3 text-[15px] leading-6 text-text-secondary">{product.description}</Text> : null}
        </View>

        <Text className="px-4 mt-6 mb-3 text-[17px] font-bold text-text-primary">Business terms</Text>
        <View className="flex-row flex-wrap gap-2 px-4">
          <Term label="Unit" value={unit} />
          {terms.available_quantity != null ? <Term label="Available" value={formatQuantity(terms.available_quantity, terms.unit, config.units)} /> : null}
          {terms.min_order_quantity != null ? <Term label="Minimum order" value={formatQuantity(terms.min_order_quantity, terms.unit, config.units)} /> : null}
          {terms.production_capacity ? <Term label="Production capacity" value={terms.production_capacity} /> : null}
          {terms.availability ? <Term label="Availability" value={terms.availability} /> : null}
          {terms.city || terms.state ? <Term label="Location" value={[terms.city, terms.state].filter(Boolean).join(", ")} /> : null}
        </View>

        {specs.length ? (
          <>
            <Text className="px-4 mt-6 mb-3 text-[17px] font-bold text-text-primary">Specifications</Text>
            <View className="mx-4 rounded-2xl border border-border overflow-hidden bg-surface-raised">
              {specs.map(([k, v], i) => (
                <View key={k} className={`flex-row px-4 py-3 ${i < specs.length - 1 ? "border-b border-border" : ""}`}>
                  <Text className="w-[40%] text-[14px] text-text-secondary">{k}</Text>
                  <Text className="flex-1 text-[14px] font-semibold text-text-primary">{v}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text className="px-4 mt-6 mb-3 text-[17px] font-bold text-text-primary">Supplied by</Text>
        <TouchableOpacity
          disabled={!business}
          onPress={() => business && router.push(`/business/company/${business.user_id}`)}
          activeOpacity={0.85}
          className="mx-4 flex-row items-center gap-3 p-4 rounded-2xl border border-border bg-surface-raised"
        >
          <View className="w-11 h-11 rounded-xl items-center justify-center bg-primary-muted">
            <Building2 size={20} color={t.primaryText} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-text-primary" numberOfLines={1}>
              {business?.name ?? product.seller?.shop_name ?? "Business"}
            </Text>
            {business ? (
              <View className="flex-row mt-1">
                <VerificationBadge status={business.verification_status} compact />
              </View>
            ) : null}
          </View>
          {business ? <Text className="text-[13px] font-bold text-primary-text">View</Text> : null}
        </TouchableOpacity>

        {!isMine ? (
          <Text className="mx-4 mt-4 text-[13px] leading-5 text-text-muted">
            Agree quantity, specifications, price and delivery with the supplier first, then order through Markt.
          </Text>
        ) : null}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pt-3 border-t border-border bg-surface-page gap-2" style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
        {isMine ? (
          <Button text="Edit business terms" onPress={() => router.push(`/business/products/${product.id}`)} />
        ) : (
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button variant="outline" text="Order" onPress={() => router.push(`/productDetails/${product.id}`)} />
            </View>
            <View className="flex-[1.4]">
              <Button onPress={() => chatRef.current?.expand()} disabled={!sellerUserId}>
                <View className="flex-row items-center gap-2">
                  <MessageCircle size={18} color={t.textOnPrimary} strokeWidth={2} />
                  <Text className="text-[16px] font-bold text-text-on-primary">Message supplier</Text>
                </View>
              </Button>
            </View>
          </View>
        )}
      </View>

      {!isMine && sellerUserId ? (
        <QuickChatBottomSheet
          sheetRef={chatRef}
          sellerId={sellerUserId}
          product_id={product.id}
          otherUser={{ username: business?.name ?? product.seller_user?.username, profile_picture: product.seller_user?.profile_picture }}
          asBuyer
        />
      ) : null}
    </SafeAreaView>
  );
}
