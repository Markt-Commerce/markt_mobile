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
    <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose onClose={onClose}>
      <BottomSheetScrollView contentContainerStyle={{ padding: 16 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Create Niche</Text>

          <Text style={{ marginBottom: 6 }}>Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Community name"
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
          {formState.errors.name && <Text style={{ color: "#e9242a", marginBottom: 6 }}>{String(formState.errors.name.message)}</Text>}

          <Text style={{ marginBottom: 6 }}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Short description"
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
          {formState.errors.description && <Text style={{ color: "#e9242a", marginBottom: 6 }}>{String(formState.errors.description.message)}</Text>}

          <Text style={{ marginBottom: 6 }}>Visibility</Text>
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
                    borderColor: value === "public" ? "#e26136" : "#e5dedc",
                    backgroundColor: value === "public" ? "#fff6f4" : "#fff",
                    marginRight: 8,
                  }}
                >
                  <Text>Public</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onChange("private")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: value === "private" ? "#e26136" : "#e5dedc",
                    backgroundColor: value === "private" ? "#fff6f4" : "#fff",
                  }}
                >
                  <Text>Private</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ marginBottom: 6 }}>Allow buyer posts</Text>
            </View>
            <Controller
              control={control}
              name="allow_buyer_posts"
              render={({ field: { onChange, value } }) => (
                <Switch value={!!value} onValueChange={onChange} />
              )}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ marginBottom: 6 }}>Allow seller posts</Text>
            </View>
            <Controller
              control={control}
              name="allow_seller_posts"
              render={({ field: { onChange, value } }) => (
                <Switch value={!!value} onValueChange={onChange} />
              )}
            />
          </View>

          <Text style={{ marginBottom: 6 }}>Categories</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
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
            onPress={handleSubmit(onSubmit)}
            style={{ backgroundColor: "#e26136", padding: 12, borderRadius: 8, alignItems: "center", opacity: submitting ? 0.7 : 1 }}
            disabled={submitting}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>{submitting ? "Creating..." : "Create Niche"}</Text>
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