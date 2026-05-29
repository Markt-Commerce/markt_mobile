import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAllCategories } from "../services/sections/categories";
import { Category } from "../models/categories";
import CategoryAddition from "./categoryAddition";
import { createNiche } from "../services/sections/niches";
import { useToast } from "./ToastProvider";
import { useTheme } from "./themeProvider";

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

const CreateNicheBottomSheet = forwardRef<BottomSheetMethods | null, Props>(({ onClose, onCreated }, ref) => {
  const sheetRef = useRef<BottomSheetMethods | null>(null);
  React.useImperativeHandle(ref, () => sheetRef.current as BottomSheetMethods, []);

  const snapPoints = useMemo(() => ["50%", "80%"], []);
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

  return (
    <BottomSheet 
      ref={sheetRef} 
      index={-1} 
      snapPoints={snapPoints} 
      enablePanDownToClose 
      onClose={onClose}
      backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "white" }}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#46464e" : "#E4E4E7" }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 16 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: isDark ? "#f0f1f2" : "#000000" }}>Create Niche</Text>

          <Text style={{ marginBottom: 6, color: isDark ? "#f0f1f2" : "#000000" }}>Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Community name"
                placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
                value={value}
                onChangeText={onChange}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#46464e" : "#E4E4E7",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 6,
                  color: isDark ? "#f0f1f2" : "#000000",
                  backgroundColor: isDark ? "#2f3132" : "#FFFFFF",
                }}
              />
            )}
          />
          {formState.errors.name && <Text style={{ color: "#ba1a1a", marginBottom: 6 }}>{String(formState.errors.name.message)}</Text>}

          <Text style={{ marginBottom: 6, color: isDark ? "#f0f1f2" : "#000000" }}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Short description"
                placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
                value={value}
                onChangeText={onChange}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#46464e" : "#E4E4E7",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 6,
                  minHeight: 80,
                  textAlignVertical: "top",
                  color: isDark ? "#f0f1f2" : "#000000",
                  backgroundColor: isDark ? "#2f3132" : "#FFFFFF",
                }}
              />
            )}
          />
          {formState.errors.description && <Text style={{ color: "#ba1a1a", marginBottom: 6 }}>{String(formState.errors.description.message)}</Text>}

          <Text style={{ marginBottom: 6, color: isDark ? "#f0f1f2" : "#000000" }}>Visibility</Text>
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
                    borderColor: value === "public" ? (isDark ? "#f0f1f2" : "#000000") : (isDark ? "#46464e" : "#E4E4E7"),
                    backgroundColor: value === "public" ? (isDark ? "#46464e" : "#F4F4F5") : (isDark ? "#2f3132" : "#FFFFFF"),
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: isDark ? "#f0f1f2" : "#000000" }}>Public</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onChange("private")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: value === "private" ? (isDark ? "#f0f1f2" : "#000000") : (isDark ? "#46464e" : "#E4E4E7"),
                    backgroundColor: value === "private" ? (isDark ? "#46464e" : "#F4F4F5") : (isDark ? "#2f3132" : "#FFFFFF"),
                  }}
                >
                  <Text style={{ color: isDark ? "#f0f1f2" : "#000000" }}>Private</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ marginBottom: 6, color: isDark ? "#f0f1f2" : "#000000" }}>Allow buyer posts</Text>
            </View>
            <Controller
              control={control}
              name="allow_buyer_posts"
              render={({ field: { onChange, value } }) => (
                <Switch 
                  value={!!value} 
                  onValueChange={onChange} 
                  trackColor={{ false: isDark ? "#46464e" : "#E4E4E7", true: "#E94C2A" }}
                  thumbColor={isDark ? "#f0f1f2" : "#FFFFFF"}
                />
              )}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ marginBottom: 6, color: isDark ? "#f0f1f2" : "#000000" }}>Allow seller posts</Text>
            </View>
            <Controller
              control={control}
              name="allow_seller_posts"
              render={({ field: { onChange, value } }) => (
                <Switch 
                  value={!!value} 
                  onValueChange={onChange} 
                  trackColor={{ false: isDark ? "#46464e" : "#E4E4E7", true: "#E94C2A" }}
                  thumbColor={isDark ? "#f0f1f2" : "#FFFFFF"}
                />
              )}
            />
          </View>

          <Text style={{ marginBottom: 6, color: isDark ? "#f0f1f2" : "#000000" }}>Categories</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
            {selectedCategories.map((c) => (
              <View key={c.id} style={{ backgroundColor: isDark ? "#2f3132" : "#F4F4F5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: isDark ? "#46464e" : "transparent" }}>
                <Text style={{ color: isDark ? "#f0f1f2" : "#000000" }}>{c.name}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setCategoryModalVisible(true)}
            style={{ 
              borderWidth: 1, 
              borderColor: isDark ? "#46464e" : "#E4E4E7", 
              padding: 10, 
              borderRadius: 8, 
              marginBottom: 12,
              backgroundColor: isDark ? "#2f3132" : "#FFFFFF"
            }}
          >
            <Text style={{ color: isDark ? "#f0f1f2" : "#000000" }}>Select categories</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            style={{ backgroundColor: isDark ? "#f0f1f2" : "#000000", padding: 12, borderRadius: 8, alignItems: "center", opacity: submitting ? 0.7 : 1 }}
            disabled={submitting}
          >
            <Text style={{ color: isDark ? "#000000" : "#fff", fontWeight: "700" }}>{submitting ? "Creating..." : "Create Niche"}</Text>
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
        </KeyboardAvoidingView>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default CreateNicheBottomSheet;
