import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAllCategories } from "../services/sections/categories";
import { Category } from "../models/categories";
import CategoryAddition from "./categoryAddition";
import { createBuyer, createSeller } from "../services/sections/auth";
import { useToast } from "./ToastProvider";

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

const CreateRoleBottomSheet = forwardRef<BottomSheetMethods | null, Props>(({ mode, onClose, onCreated }, ref) => {
  const sheetRef = useRef<BottomSheetMethods | null>(null);
  React.useImperativeHandle(ref, () => sheetRef.current as BottomSheetMethods, []);

  const snapPoints = useMemo(() => ["45%", "80%"], []);
  const { show } = useToast();

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
    try {
      await createBuyer({
        buyername: data.buyername,
        shipping_address: {},
      } as any);
      show({ variant: "success", title: "Buyer created", message: "Buyer account created." });
      onCreated?.("buyer");
      closeSheet();
    } catch (err) {
      show({ variant: "error", title: "Create failed", message: "Could not create buyer account." });
    }
  };

  const submitSeller = async (data: SellerForm) => {
    try {
      // ensure at least one category selected via the UI
      if (!selectedCategories || selectedCategories.length === 0) {
        show({ variant: "error", title: "Validation", message: "Select at least one category." });
        return;
      }

      const payload = {
        shop_name: data.shop_name,
        description: data.description,
        category_ids: selectedCategories.map((c) => c.id),
        policies: {},
      };
      const resultdata = await createSeller(payload as any);
      console.log("Seller created:", resultdata);
      show({ variant: "success", title: "Seller created", message: "Seller account created." });
      onCreated?.("seller");
      closeSheet();
    } catch (err) {
      show({ variant: "error", title: "Create failed", message: "Could not create seller account." });
    }
  };

  return (
    <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose onClose={onClose}>
      <BottomSheetScrollView contentContainerStyle={{ padding: 16 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
            {mode === "buyer" ? "Create Buyer Account" : mode === "seller" ? "Create Seller Account" : "Create Account"}
          </Text>

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
                      borderColor: "#e5dedc",
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  />
                )}
              />
              {buyerErrors.buyername && <Text style={{ color: "#e9242a", marginBottom: 6 }}>{buyerErrors.buyername.message}</Text>}
              <TouchableOpacity
                onPress={handleSubmitBuyer(submitBuyer)}
                style={{ backgroundColor: "#e26136", padding: 12, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Create Buyer Account</Text>
              </TouchableOpacity>
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
                      borderColor: "#e5dedc",
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  />
                )}
              />
              {sellerErrors.shop_name && <Text style={{ color: "#e9242a", marginBottom: 6 }}>{sellerErrors.shop_name.message}</Text>}

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
                      borderColor: "#e5dedc",
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                      minHeight: 80,
                      textAlignVertical: "top",
                    }}
                  />
                )}
              />
              {sellerErrors.description && <Text style={{ color: "#e9242a", marginBottom: 6 }}>{sellerErrors.description.message}</Text>}

              <Text style={{ marginBottom: 6 }}>Categories</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {selectedCategories.map((c) => (
                  <View key={c.id} style={{ backgroundColor: "#f4f1f0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
                    <Text>{c.name}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setCategoryModalVisible(true)}
                style={{ borderWidth: 1, borderColor: "#e5dedc", padding: 10, borderRadius: 8, marginBottom: 12 }}
              >
                <Text>Select categories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitSeller(submitSeller)}
                style={{ backgroundColor: "#e26136", padding: 12, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Create Seller Account</Text>
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
        </KeyboardAvoidingView>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default CreateRoleBottomSheet;