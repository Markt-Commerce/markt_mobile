/**
 * A new product with its business terms in one step. Photos are added
 * afterwards in the seller dashboard's inventory editor (InventoryEditSheet),
 * as for any product.
 */
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "../../../components/ScreenHeader";
import Button from "../../../components/button";
import { Field } from "../../../components/business/ui";
import ListingTermsFields, { termsStateFrom, toListingInput } from "../../../components/business/ListingTermsFields";
import { useBusiness } from "../../../hooks/businessContext";
import { createProduct } from "../../../services/sections/product";
import { saveListing } from "../../../services/sections/business";
import { friendlyErrorMessage } from "../../../utils/errorMessages";

export default function NewBusinessProductScreen() {
  const router = useRouter();
  const { config } = useBusiness();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [terms, setTerms] = useState(termsStateFrom());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const unitPrice = Number(price.replace(/,/g, ""));
    const stockCount = stock.trim() ? Number(stock) : undefined;
    if (name.trim().length < 2) return setError("Enter a product name.");
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return setError("Enter a price per unit above zero.");
    if (stockCount !== undefined && (!Number.isInteger(stockCount) || stockCount < 0)) return setError("Stock must be a whole number.");
    const listing = toListingInput(terms);
    if (typeof listing === "string") return setError(listing);

    setSaving(true);
    let productId: string;
    try {
      const product = await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        price: unitPrice,
        stock: stockCount,
        status: "active",
      });
      productId = product.id;
    } catch (e) {
      setSaving(false);
      return setError(friendlyErrorMessage(e, "Could not create the product."));
    }

    try {
      await saveListing(productId, listing);
      router.replace(`/business/products/${productId}`);
    } catch (e) {
      // The product exists; open it to finish the terms rather than create a
      // duplicate on retry.
      router.replace(`/business/products/${productId}?error=${encodeURIComponent(friendlyErrorMessage(e, "terms not saved"))}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="New business listing" fallback="/business/products" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text className="mb-1 text-[15px] font-bold text-text-primary">Product</Text>
          <Text className="mb-4 text-[13px] text-text-secondary">Add photos afterwards from your seller dashboard's inventory.</Text>
          <Field label="Product name" value={name} onChangeText={setName} maxLength={100} placeholder="e.g. Fresh cassava roots" />
          <Field label="Description" value={description} onChangeText={setDescription} multiline placeholder="Variety, grade, packaging, storage." />
          <Field label="Price per unit (₦)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <Field
            label="Stock for Markt checkout (optional)"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            hint="Whole units buyers can order directly through checkout."
          />
          <Text className="mt-2 mb-3 text-[15px] font-bold text-text-primary">Business terms</Text>
          <ListingTermsFields units={config.units} value={terms} onChange={setTerms} />
          {error ? <Text className="mb-3 text-sm text-danger-text">{error}</Text> : null}
          <Button text="Create listing" loading={saving} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
