import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import InputSheet, { type InputSheetHandle } from "./InputSheet";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAllCategories } from "../services/sections/categories";
import { Category } from "../models/categories";
import CategoryAddition from "./categoryAddition";
import { createBuyer, createSeller } from "../services/sections/auth";
import { useToast } from "./ToastProvider";
import { friendlyErrorMessage } from "../utils/errorMessages";
import { useTokens } from "../theme/useTokens";

type Mode = "buyer" | "seller" | null;

const buyerSchema = z.object({
  buyername: z.string().min(1, "Name is required"),
});

const sellerSchema = z.object({
  shop_name: z.string().min(1, "Shop name is required"),
  description: z.string().min(1, "Description is required"),
  //category_ids: z.array(z.number()).min(1, "Select at least one category"),
});

type BuyerForm = z.infer<typeof buyerSchema>;
type SellerForm = z.infer<typeof sellerSchema>;

interface Props {
  mode: Mode;
  onClose?: () => void;
  onCreated?: (role: "buyer" | "seller") => void; 
}

const CreateRoleBottomSheet = forwardRef<InputSheetHandle | null, Props>(({ mode, onClose, onCreated }, ref) => {
  const t = useTokens();
  const sheetRef = useRef<InputSheetHandle | null>(null);
  React.useImperativeHandle(ref, () => sheetRef.current as InputSheetHandle, []);
  const { show } = useToast();
  const [sending, setSending] = useState(false);

  // categories (for seller)
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const cats = await getAllCategories();
        setCategories(cats || []);
      } catch (err) {
        // ignore silently; user can still input
      }
    }
    load();
  }, []);

  // react-hook-form instances for buyer & seller
  const {
    control: buyerControl,
    handleSubmit: handleSubmitBuyer,
    reset: resetBuyer,
    formState: { errors: buyerErrors },
  } = useForm<BuyerForm>({ resolver: zodResolver(buyerSchema) as any });

  const {
    control: sellerControl,
    handleSubmit: handleSubmitSeller,
    reset: resetSeller,
    formState: { errors: sellerErrors },
  } = useForm<SellerForm>({ resolver: zodResolver(sellerSchema) as any });

  useEffect(() => {
    // When mode closes, reset forms
    if (!mode) {
      resetBuyer();
      resetSeller();
      setSelectedCategories([]);
    }
  }, [mode, resetBuyer, resetSeller]);

  const closeSheet = () => {
    sheetRef.current?.close?.();
    onClose?.();
  };

  const submitBuyer = async (data: BuyerForm) => {
    if (sending) return;
    try {
      setSending(true);
      await createBuyer({
        buyername: data.buyername,
        shipping_address: {},
      } as any);
      show({ variant: "success", title: "Buyer created", message: "Buyer account created." });
      resetBuyer();
      onCreated?.("buyer");
      closeSheet();
    } catch (err) {
      show({
        variant: "error",
        title: "Create failed",
        message: friendlyErrorMessage(err, "Could not create the buyer account. Please try again."),
      });
    } finally {
      setSending(false);
    }
  };

  const submitSeller = async (data: SellerForm) => {
    if (sending) return;
    // ensure at least one category selected via the UI
    if (!selectedCategories || selectedCategories.length === 0) {
      show({ variant: "error", title: "Validation", message: "Select at least one category." });
      return;
    }
    try {
      setSending(true);
      const payload = {
        shop_name: data.shop_name,
        description: data.description,
        category_ids: selectedCategories.map((c) => c.id),
        policies: {},
      };
      await createSeller(payload as any);
      show({ variant: "success", title: "Seller created", message: "Seller account created." });
      resetSeller();
      setSelectedCategories([]);
      onCreated?.("seller");
      closeSheet();
    } catch (err) {
      show({
        variant: "error",
        title: "Create failed",
        message: friendlyErrorMessage(err, "Could not create the seller account. Please try again."),
      });
    } finally {
      setSending(false);
    }
  };

  // One sheet, two forms — so the action bar has to know which one it is
  // submitting. Both write through the same `sending` flag.
  const footer = (
    <>
      <Text className="flex-1 text-[12px] text-text-muted" numberOfLines={1}>
        {sending
          ? "Creating…"
          : mode === "seller"
            ? `${selectedCategories.length} categor${selectedCategories.length === 1 ? "y" : "ies"}`
            : ""}
      </Text>
      <TouchableOpacity
        disabled={sending || !mode}
        onPress={
          mode === "seller"
            ? handleSubmitSeller(submitSeller)
            : handleSubmitBuyer(submitBuyer)
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: sending || !mode, busy: sending }}
        className={`min-h-[44px] flex-row items-center justify-center gap-2 rounded-xl px-5 ${
          sending || !mode ? "bg-surface-sunken" : "bg-primary-fill"
        }`}
      >
        {sending ? <ActivityIndicator size="small" color={t.textSecondary} /> : null}
        <Text
          className={`text-[15px] font-bold ${
            sending || !mode ? "text-text-muted" : "text-text-on-primary"
          }`}
        >
          {sending ? "Creating…" : mode === "seller" ? "Create shop" : "Create account"}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <InputSheet
      ref={sheetRef}
      title={mode === "buyer" ? "Create Buyer Account" : mode === "seller" ? "Create Seller Account" : "Create Account"}
      busy={sending}
      onClose={onClose}
      footer={footer}
    >

          {mode === "buyer" && (
            <View>
              <Text style={{ marginBottom: 6 }}>Name</Text>
              <Controller
                control={buyerControl}
                name="buyername"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Full name"
                    value={value}
                    onChangeText={onChange}
                    style={{
                      borderWidth: 1,
                      borderColor: t.border,
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  />
                )}
              />
              {buyerErrors.buyername && <Text style={{ color: t.dangerText, marginBottom: 6 }}>{buyerErrors.buyername.message}</Text>}
            </View>
          )}

          {mode === "seller" && (
            <View>
              <Text style={{ marginBottom: 6 }}>Shop name</Text>
              <Controller
                control={sellerControl}
                name="shop_name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Shop name"
                    value={value}
                    onChangeText={onChange}
                    style={{
                      borderWidth: 1,
                      borderColor: t.border,
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  />
                )}
              />
              {sellerErrors.shop_name && <Text style={{ color: t.dangerText, marginBottom: 6 }}>{sellerErrors.shop_name.message}</Text>}

              <Text style={{ marginBottom: 6 }}>Description</Text>
              <Controller
                control={sellerControl}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Short description of your shop"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    style={{
                      borderWidth: 1,
                      borderColor: t.border,
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                      minHeight: 80,
                      textAlignVertical: "top",
                    }}
                  />
                )}
              />
              {sellerErrors.description && <Text style={{ color: t.dangerText, marginBottom: 6 }}>{sellerErrors.description.message}</Text>}

              <Text style={{ marginBottom: 6 }}>Categories</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {selectedCategories.map((c) => (
                  <View key={c.id} style={{ backgroundColor: t.surfaceSunken, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8 }}>
                    <Text>{c.name}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setCategoryModalVisible(true)}
                style={{ borderWidth: 1, borderColor: t.border, padding: 10, borderRadius: 8, marginBottom: 12 }}
              >
                <Text>Select categories</Text>
              </TouchableOpacity>

              <CategoryAddition
                visible={categoryModalVisible}
                categories={categories}
                parentSelectedCategories={selectedCategories}
                onClose={() => setCategoryModalVisible(false)}
                onConfirm={(sel) => {
                  setSelectedCategories(sel);
                  setCategoryModalVisible(false);
                }}
              />
            </View>
          )}
    </InputSheet>
  );
});

export default CreateRoleBottomSheet;