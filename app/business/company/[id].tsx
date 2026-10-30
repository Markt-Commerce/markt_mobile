/**
 * A business's public profile: who they are, where, how to reach them, and
 * the products they list for businesses.
 */
import React, { useEffect, useRef, useState } from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import BottomSheet from "@gorhom/bottom-sheet";
import { Building2, Globe, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react-native";
import ScreenHeader from "../../../components/ScreenHeader";
import Button from "../../../components/button";
import QuickChatBottomSheet from "../../../components/quickChatBottomSheet";
import { Badge, Card, EmptyState, ListRow, Loading, VerificationBadge } from "../../../components/business/ui";
import { useBusiness } from "../../../hooks/businessContext";
import { useUser } from "../../../hooks/userContextProvider";
import { useTokens } from "../../../theme/useTokens";
import { getBusinessProfile, searchListings } from "../../../services/sections/business";
import { formatNaira } from "../../../utils/formatCurrency";
import { formatQuantity, optionLabel, type BusinessListingResult, type BusinessProfile } from "../../../models/business";

function ContactLine({ icon: Icon, text, onPress }: { icon: LucideIcon; text: string; onPress?: () => void }) {
  const t = useTokens();
  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} className="flex-row items-center gap-2.5 py-2">
      <Icon size={15} color={t.textSecondary} strokeWidth={2} />
      <Text className={`flex-1 text-[14px] ${onPress ? "font-semibold text-primary-text" : "text-text-primary"}`}>{text}</Text>
    </TouchableOpacity>
  );
}

export default function BusinessCompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { user, profile } = useUser();
  // The profile id is always there once signed in; the session blob's user_id is optional.
  const myId = profile?.id ?? user?.user_id;
  const { config } = useBusiness();
  const chatRef = useRef<BottomSheet>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [listings, setListings] = useState<BusinessListingResult[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getBusinessProfile(id)
      .then((b) => {
        setBusiness(b);
        if (b.sells) searchListings({ sellerUserId: id, perPage: 30 }).then((r) => setListings(r.items)).catch(() => {});
      })
      .catch(() => setFailed(true));
  }, [id]);

  const isMe = String(myId) === String(id);

  if (failed || !business) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
        <ScreenHeader title="Business" fallback="/business/discover" />
        {failed ? <EmptyState icon={Building2} title="This business isn't available" /> : <Loading />}
      </SafeAreaView>
    );
  }

  const location = [business.address, business.city, business.state, business.country].filter(Boolean).join(", ");

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top"]}>
      <ScreenHeader title="Business" fallback="/business/discover" />
      <ScrollView contentContainerStyle={{ paddingBottom: isMe ? 32 : 120 }}>
        <View className="px-4 pt-5 pb-5 bg-surface-raised">
          <View className="flex-row items-center gap-3">
            <View className="w-14 h-14 rounded-2xl items-center justify-center bg-primary-muted">
              <Building2 size={26} color={t.primaryText} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-[22px] font-bold tracking-tight text-text-primary">{business.name}</Text>
              <Text className="text-[13px] text-text-secondary" numberOfLines={2}>
                {business.business_types.map((k) => optionLabel(config.business_types, k)).join(", ")}
              </Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2 mt-3">
            <VerificationBadge status={business.verification_status} compact />
            {business.industry ? <Badge label={optionLabel(config.industries, business.industry)} /> : null}
            <Badge label={business.buys && business.sells ? "Buys and sells" : business.sells ? "Sells" : "Buys"} />
          </View>
          {business.description ? <Text className="mt-4 text-[15px] leading-6 text-text-secondary">{business.description}</Text> : null}
        </View>

        <Card className="mx-4 mt-4">
          <Text className="mb-1 text-[15px] font-bold text-text-primary">Contact</Text>
          {location ? <ContactLine icon={MapPin} text={location} /> : null}
          {business.contact_email ? (
            <ContactLine icon={Mail} text={business.contact_email} onPress={() => Linking.openURL(`mailto:${business.contact_email}`)} />
          ) : null}
          {business.contact_phone ? (
            <ContactLine icon={Phone} text={business.contact_phone} onPress={() => Linking.openURL(`tel:${business.contact_phone}`)} />
          ) : null}
          {business.website ? (
            <ContactLine icon={Globe} text={business.website.replace(/^https?:\/\//, "")} onPress={() => Linking.openURL(business.website!)} />
          ) : null}
        </Card>

        {business.sells ? (
          <>
            <Text className="px-4 mt-6 mb-3 text-[17px] font-bold text-text-primary">Products</Text>
            <Card className="mx-4 p-0 overflow-hidden">
              {listings.length === 0 ? (
                <Text className="p-4 text-sm text-text-secondary">No business listings yet.</Text>
              ) : (
                listings.map((l, i) => (
                  <ListRow
                    key={l.id}
                    title={l.name}
                    meta={[
                      l.business_listing.available_quantity != null
                        ? `${formatQuantity(l.business_listing.available_quantity, l.business_listing.unit, config.units)} available`
                        : "",
                      l.business_listing.min_order_quantity != null
                        ? `min. ${formatQuantity(l.business_listing.min_order_quantity, l.business_listing.unit, config.units)}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    aside={formatNaira(l.price)}
                    onPress={() => router.push(`/business/listing/${l.id}`)}
                    last={i === listings.length - 1}
                  />
                ))
              )}
            </Card>
          </>
        ) : null}
      </ScrollView>

      {!isMe ? (
        <View className="absolute bottom-0 left-0 right-0 px-4 pt-3 border-t border-border bg-surface-page" style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
          <Button onPress={() => chatRef.current?.expand()}>
            <View className="flex-row items-center gap-2">
              <MessageCircle size={18} color={t.textOnPrimary} strokeWidth={2} />
              <Text className="text-[16px] font-bold text-text-on-primary">Message {business.name}</Text>
            </View>
          </Button>
        </View>
      ) : null}
      {!isMe ? <QuickChatBottomSheet sheetRef={chatRef} sellerId={id} otherUser={{ username: business.name }} asBuyer /> : null}
    </SafeAreaView>
  );
}
