import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View, ActivityIndicator } from "react-native";
import InputSheet from "./InputSheet";
import { useTokens } from "../theme/useTokens";
import { updateProduct } from "../services/sections/product";
import { useToast } from "./ToastProvider";
import { friendlyErrorMessage } from "../utils/errorMessages";
import type { ProductResponse } from "../models/products";

/**
 * Quick edit for a product from the inventory list.
 *
 * Scoped to the three fields that change day to day — price, stock, and
 * whether the listing is live. Everything else (images, variants, categories,
 * description) belongs in the full product form; putting it here would make
 * the common case slow to serve the rare one.
 *
 * Before this the inventory offered exactly one action, Delete, so a seller
 * whose price changed had to delete the listing and build it again — losing
 * its reviews, its view count and its place in anyone's saved items.
 */
export default function InventoryEditSheet({
  product,
  visible,
  onClose,
  onSaved,
}: {
  product: ProductResponse | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: ProductResponse) => void;
}) {
  const t = useTokens();
  const { show } = useToast();
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setPrice(String(product.price ?? ""));
    setStock(String(product.stock ?? ""));
    setActive((product.status ?? "active") === "active");
  }, [product]);

  if (!product) return null;

  const priceValue = Number(price);
  const stockValue = Number(stock);
  const priceValid = Number.isFinite(priceValue) && priceValue > 0;
  const stockValid = Number.isInteger(stockValue) && stockValue >= 0;
  const canSave = priceValid && stockValid && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await updateProduct(product.id, {
        price: priceValue,
        stock: stockValue,
        status: active ? "active" : "inactive",
      });
      onSaved({ ...product, ...updated });
      show({ variant: "success", title: "Saved", message: `${product.name} updated.` });
      onClose();
    } catch (e) {
      show({
        variant: "error",
        title: "Could not save",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <Text className="flex-1 text-[12px] text-text-muted" numberOfLines={1}>
        {saving ? "Saving…" : active ? "Listed" : "Hidden from buyers"}
      </Text>
      <Pressable
        onPress={save}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave, busy: saving }}
        className={`min-h-[44px] flex-row items-center justify-center gap-2 rounded-xl px-5 ${
          canSave ? "bg-primary-fill" : "bg-surface-sunken"
        }`}
      >
        {saving ? <ActivityIndicator size="small" color={t.textSecondary} /> : null}
        <Text
          className={`text-[15px] font-bold ${
            canSave ? "text-text-on-primary" : "text-text-muted"
          }`}
        >
          {saving ? "Saving…" : "Save changes"}
        </Text>
      </Pressable>
    </>
  );

  return (
    <InputSheet
      visible={visible}
      onClose={onClose}
      title={product.name}
      busy={saving}
      footer={footer}
    >
            <Text className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted mb-2">
              Price
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={t.textMuted}
              accessibilityLabel="Product price"
              className={`h-12 px-4 rounded border text-base text-text-primary bg-surface-sunken ${
                priceValid ? "border-border" : "border-danger"
              }`}
            />
            {!priceValid ? (
              <Text className="text-xs text-danger-text mt-1">
                Enter a price greater than zero.
              </Text>
            ) : null}

            <Text className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted mb-2 mt-5">
              Stock
            </Text>
            <TextInput
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={t.textMuted}
              accessibilityLabel="Stock on hand"
              className={`h-12 px-4 rounded border text-base text-text-primary bg-surface-sunken ${
                stockValid ? "border-border" : "border-danger"
              }`}
            />
            {!stockValid ? (
              <Text className="text-xs text-danger-text mt-1">
                Enter a whole number, zero or more.
              </Text>
            ) : null}

            {/* Live rather than "status": the seller's question is whether
                buyers can see it, not what the enum is called. */}
            <View className="flex-row items-center justify-between mt-6">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold text-text-primary">
                  Listed
                </Text>
                <Text className="text-xs text-text-secondary mt-0.5">
                  {active ? "Buyers can find and order this." : "Hidden from buyers."}
                </Text>
              </View>
              <Pressable
                onPress={() => setActive((v) => !v)}
                accessibilityRole="switch"
                accessibilityState={{ checked: active }}
                accessibilityLabel="Listed"
                className={`w-14 h-8 rounded-full px-1 justify-center ${
                  active ? "bg-primary-fill" : "bg-border-strong"
                }`}
              >
                <View
                  className="w-6 h-6 rounded-full bg-surface-overlay"
                  style={{ transform: [{ translateX: active ? 24 : 0 }] }}
                />
              </Pressable>
            </View>

    </InputSheet>
  );
}
