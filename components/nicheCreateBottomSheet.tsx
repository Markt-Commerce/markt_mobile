import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import InputSheet, { type InputSheetHandle } from "./InputSheet";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAllCategories } from "../services/sections/categories";
import { Category } from "../models/categories";
import CategoryAddition from "./categoryAddition";
import { createNiche } from "../services/sections/niches";
import { useToast } from "./ToastProvider";
import { useTokens } from "../theme/useTokens";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  visibility: z.enum(["public", "private"]).default("public"),
  allow_buyer_posts: z.boolean().default(true),
  allow_seller_posts: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onClose?: () => void;
  onCreated?: () => void;
}

const CreateNicheBottomSheet = forwardRef<InputSheetHandle | null, Props>(({ onClose, onCreated }, ref) => {
  const sheetRef = useRef<InputSheetHandle | null>(null);
  React.useImperativeHandle(ref, () => sheetRef.current as InputSheetHandle, []);
  const { show } = useToast();
  const t = useTokens();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cats = await getAllCategories();
        setCategories(cats || []);
      } catch {
        // ignore; categories optional
      }
    })();
  }, []);

  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      description: "",
      visibility: "public",
      allow_buyer_posts: true,
      allow_seller_posts: true,
    },
  });

  const close = () => {
    sheetRef.current?.close?.();
    onClose?.();
    reset();
    setSelectedCategories([]);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      // required payload with defaults as requested
      const payload = {
        name: values.name,
        description: values.description,
        visibility: values.visibility ?? "public",
        max_members: 10000,
        category_ids: selectedCategories.map((c) => c.id) ?? [],
        tags: [],
        allow_buyer_posts: typeof values.allow_buyer_posts === "boolean" ? values.allow_buyer_posts : true,
        allow_seller_posts: typeof values.allow_seller_posts === "boolean" ? values.allow_seller_posts : true,
        rules: [],
        settings: {
        },
        require_approval: false,
      };

      await createNiche(payload);
      show({ variant: "success", title: "Niche created", message: "Community created successfully." });
      onCreated?.();
      close();
    } catch (err) {
      show({ variant: "error", title: "Create failed", message: "Could not create community." });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Text className="flex-1 text-[12px] text-text-muted" numberOfLines={1}>
        {submitting ? "Creating…" : `${selectedCategories.length} categor${selectedCategories.length === 1 ? "y" : "ies"}`}
      </Text>
      <TouchableOpacity
        disabled={submitting}
        onPress={handleSubmit(onSubmit)}
        accessibilityRole="button"
        accessibilityState={{ disabled: submitting, busy: submitting }}
        className={`min-h-[44px] flex-row items-center justify-center gap-2 rounded-xl px-5 ${
          submitting ? "bg-surface-sunken" : "bg-primary-fill"
        }`}
      >
        {submitting ? <ActivityIndicator size="small" color={t.textSecondary} /> : null}
        <Text className={`text-[15px] font-bold ${submitting ? "text-text-muted" : "text-text-on-primary"}`}>
          {submitting ? "Creating…" : "Create Community"}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <InputSheet
      ref={sheetRef}
      title="Create Community"
      busy={submitting}
      onClose={onClose}
      footer={footer}
    >

          <Text style={{ marginBottom: 6, color: t.textPrimary }}>Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Community name"
                placeholderTextColor={t.textSecondary}
                value={value}
                onChangeText={onChange}
                style={{
                  borderWidth: 1,
                  borderColor: t.borderStrong,
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 6,
                  color: t.textPrimary,
                  backgroundColor: t.surfaceSunken,
                }}
              />
            )}
          />
          {formState.errors.name && <Text style={{ color: t.dangerText, marginBottom: 6 }}>{String(formState.errors.name.message)}</Text>}

          <Text style={{ marginBottom: 6, color: t.textPrimary }}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Short description"
                placeholderTextColor={t.textSecondary}
                value={value}
                onChangeText={onChange}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: t.borderStrong,
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 6,
                  minHeight: 80,
                  textAlignVertical: "top",
                  color: t.textPrimary,
                  backgroundColor: t.surfaceSunken,
                }}
              />
            )}
          />
          {formState.errors.description && <Text style={{ color: t.dangerText, marginBottom: 6 }}>{String(formState.errors.description.message)}</Text>}

          <Text style={{ marginBottom: 6, color: t.textPrimary }}>Visibility</Text>
          <Controller
            control={control}
            name="visibility"
            render={({ field: { onChange, value } }) => (
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => onChange("public")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: value === "public" ? (t.textPrimary) : (t.borderStrong),
                    backgroundColor: value === "public" ? t.primaryMuted : t.surfaceSunken,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: t.textPrimary }}>Public</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onChange("private")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: value === "private" ? (t.textPrimary) : (t.borderStrong),
                    backgroundColor: value === "private" ? t.primaryMuted : t.surfaceSunken,
                  }}
                >
                  <Text style={{ color: t.textPrimary }}>Private</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ marginBottom: 6, color: t.textPrimary }}>Allow buyer posts</Text>
            </View>
            <Controller
              control={control}
              name="allow_buyer_posts"
              render={({ field: { onChange, value } }) => (
                <Switch 
                  value={!!value} 
                  onValueChange={onChange} 
                  trackColor={{ false: t.borderStrong, true: t.primaryText }}
                  thumbColor={t.textPrimary}
                />
              )}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ marginBottom: 6, color: t.textPrimary }}>Allow seller posts</Text>
            </View>
            <Controller
              control={control}
              name="allow_seller_posts"
              render={({ field: { onChange, value } }) => (
                <Switch 
                  value={!!value} 
                  onValueChange={onChange} 
                  trackColor={{ false: t.borderStrong, true: t.primaryText }}
                  thumbColor={t.textPrimary}
                />
              )}
            />
          </View>

          <Text style={{ marginBottom: 6, color: t.textPrimary }}>Categories</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
            {selectedCategories.map((c) => (
              <View key={c.id} style={{ backgroundColor: t.surfaceSunken, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.textPrimary }}>{c.name}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setCategoryModalVisible(true)}
            style={{ 
              borderWidth: 1, 
              borderColor: t.borderStrong, 
              padding: 10, 
              borderRadius: 8, 
              marginBottom: 12,
              backgroundColor: t.surfaceSunken
            }}
          >
            <Text style={{ color: t.textPrimary }}>Select categories</Text>
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
    </InputSheet>
  );
});

export default CreateNicheBottomSheet;
