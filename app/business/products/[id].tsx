/**
 * Edit (or remove) one product's business terms. Owner only — the backend
 * enforces that too.
 */
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "../../../components/ScreenHeader";
import Button from "../../../components/button";
import { Loading } from "../../../components/business/ui";
import ListingTermsFields, { termsStateFrom, toListingInput, type TermsState } from "../../../components/business/ListingTermsFields";
import { useBusiness } from "../../../hooks/businessContext";
import { useToast } from "../../../components/ToastProvider";
import { confirmDestructive } from "../../../utils/confirm";
import { getProductById } from "../../../services/sections/product";
import { getListing, removeListing, saveListing } from "../../../services/sections/business";
import { friendlyErrorMessage } from "../../../utils/errorMessages";
import { formatNaira } from "../../../utils/formatCurrency";
import { unitSingular } from "../../../models/business";

export default function BusinessProductTermsScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { id, error: createError } = useLocalSearchParams<{ id: string; error?: string }>();
  const { config } = useBusiness();
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [listed, setListed] = useState(false);
  const [terms, setTerms] = useState<TermsState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(createError ? `The product was created, but its business terms weren't saved (${createError}). Fill them in below.` : null);

  useEffect(() => {
    (async () => {
      try {
        const product = await getProductById(id);
        setProductName(product.name);
        setPrice(product.price);
      } catch {
        setError("This product couldn't be loaded.");
      }
      try {
        const listing = await getListing(id);
        setListed(true);
        setTerms(termsStateFrom(listing));
      } catch {
        setTerms(termsStateFrom()); // no terms yet
      }
    })();
  }, [id]);

  const save = async () => {
    if (!terms) return;
    setError(null);
    const input = toListingInput(terms);
    if (typeof input === "string") return setError(input);
    setSaving(true);
    try {
      await saveListing(id, input);
      setListed(true);
      show({ variant: "success", title: "Saved", message: "Business terms updated." });
    } catch (e) {
      setError(friendlyErrorMessage(e, "Could not save the business terms."));
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    confirmDestructive({
      title: "Stop listing for businesses?",
      message: "This removes the business terms. The product itself stays on Markt.",
      confirmLabel: "Remove terms",
      onConfirm: async () => {
        try {
          await removeListing(id);
          router.back();
        } catch (e) {
          show({ variant: "error", title: "Couldn't remove", message: friendlyErrorMessage(e) });
        }
      },
    });

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="Business terms" fallback="/business/products" />
      {!terms ? (
        <Loading />
      ) : (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Text className="text-[22px] font-bold tracking-tight text-text-primary">{productName}</Text>
            <Text className="mt-1 mb-5 text-[13px] text-text-secondary">
              {price !== null ? `${formatNaira(price)} per ${terms.unit[0] ? unitSingular(config.units, terms.unit[0]) : "unit"} · ` : ""}
              {listed ? "Listed for businesses" : "Not listed for businesses yet"}
            </Text>
            <ListingTermsFields units={config.units} value={terms} onChange={setTerms} />
            {error ? <Text className="mb-3 text-sm text-danger-text">{error}</Text> : null}
            <Button text={listed ? "Save terms" : "List for businesses"} loading={saving} onPress={save} />
            {listed ? (
              <View className="mt-3 gap-3">
                <Button variant="outline" text="View listing" onPress={() => router.push(`/business/listing/${id}`)} />
                <TouchableOpacity onPress={remove} className="items-center py-3">
                  <Text className="text-sm font-bold text-danger-text">Remove business terms</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
