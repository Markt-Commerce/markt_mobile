import React, { Ref, useState } from "react";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./inputs";
import { Category } from "../models/categories";
import { getAllCategories } from "../services/sections/categories";
import { X } from "lucide-react-native";
import CategoryAddition from "./categoryAddition";
import InstagramGrid, { InstagramGridProps, PickedImage } from "./imagePicker";
import { pickImage } from "../services/imageSelection";
import { uploadImage, attemptMultipleUpload } from "../services/sections/media";
import { MediaResponse } from "../models/media";
import { createBuyerRequest } from "../services/sections/request";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { CreateRequestPayload } from "../models/request";
import { useToast } from "./ToastProvider";
import { friendlyErrorMessage } from "../utils/errorMessages";
import { useTheme } from "./themeProvider";
import logger from "../utils/logger";

// Default expiry: seven days from when the request is placed. The backend
// expects an ISO datetime (marshmallow DateTime), so return ISO — a "DD/MM/YY"
// string would fail validation and the request would never be created.
function getDateSevenDaysFromNow() {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return futureDate.toISOString();
}

const requestSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required").max(2000),
  budget: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Budget must be positive"),
  ),
  category_ids: z.array(z.number()).optional(),
  media_ids: z.array(z.number()).optional(),
  expires_at: z.string().default(getDateSevenDaysFromNow()).optional(),
});

export type RequestFormData = z.infer<typeof requestSchema>;

const BuyerRequestFormBottomSheet = React.forwardRef<
  BottomSheetMethods | null,
  { onCreated?: () => void }
>(({ onCreated }, ref) => {
  const sheetRef = React.useRef<BottomSheetMethods | null>(null);
  React.useImperativeHandle(ref, () => sheetRef.current!, [sheetRef.current]);
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const snapPoints = React.useMemo(() => ["50%", "85%"], []);
  const [requestImages, setRequestImages] = useState<string[]>([]);

  requestSchema.refine(() => selectedCategories?.length ?? 0 > 0, {
    path: ["category_ids"],
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema) as any, // todo: remember to solve later
  });

  const [Imagevalue, setImageValue] = React.useState<
    InstagramGridProps["value"]
  >(
    requestImages
      ? requestImages.map((uri, index) => ({ id: index.toString(), uri }))
      : [],
  );

  //categories
  const [modalVisible, setModalVisible] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<
    Category[]
  >([]);

  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await getAllCategories();
        setCategories(cats);
      } catch (error) {
        logger.error("Failed to fetch categories:", error);
        //Todo: handle error appropriately, e.g., show a message to the user in the UI
      }
    }
    fetchCategories();
  }, []);

  const removeCategory = (id: Number) => {
    setSelectedCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Single submit path: upload images, build the payload, create the request,
  // and only on success clear the form and close. try/finally guarantees the
  // button leaves its "Sending…" state even when creation fails.
  const onSubmit = async (data: RequestFormData) => {
    if (sending) return;
    try {
      setSending(true);

      const ImageResponse = await attemptMultipleUpload(Imagevalue);
      const imageIds = ImageResponse.map((imgId) => imgId.media.id);

      // ensure category_ids includes selectedCategories if not provided by form UI
      const category_ids =
        data &&
        (data as any).category_ids &&
        (data as any).category_ids.length > 0
          ? (data as any).category_ids
          : selectedCategories.map((c) => c.id);

      // Backend expects media_ids (the old `images` key was silently dropped).
      const payload: CreateRequestPayload = {
        ...data,
        category_ids,
        media_ids: imageIds ?? [],
      };

      await createBuyerRequest(payload);

      show({
        variant: "success",
        title: "Request Created",
        message: "Your request has been successfully created.",
      });

      // Clear the form + local state, then close the sheet.
      reset();
      setImageValue([]);
      setSelectedCategories([]);
      sheetRef.current?.close();
      onCreated?.();
    } catch (error) {
      logger.error("Create buyer request failed:", error);
      show({
        variant: "error",
        title: "Error creating buyer request",
        message: friendlyErrorMessage(error, "There was a problem creating the buyer request. Please try again later."),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={!sending}
      backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#46464e" : "#E4E4E7" }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Text
          className={`text-lg font-geist font-bold mb-4 ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Create Buyer Request
        </Text>

        {/* Title */}
        <Input
          name="title"
          control={control}
          label="Title"
          placeholder="Give your request a short title"
          errors={errors}
        />

        {/* Description */}
        <Input
          name="description"
          control={control}
          label="What are you looking for?"
          placeholder="Describe the item, condition, quantity…"
          errors={errors}
          multiline
          numberOfLines={5}
        />

        {/* Budget */}
        <Input
          name="budget"
          control={control}
          label="Budget (₦)"
          placeholder="e.g. 15000"
          errors={errors}
          keyboardType="numeric"
        />

        {/* Category IDs */}
        <Text
          className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-dark-muted" : "text-tertiary"}`}
        >
          Categories
        </Text>
        <View className="flex-row flex-wrap gap-3 mb-4">
          {selectedCategories.map((cat) => (
            <View
              key={cat.id.toString()}
              className={`flex-row items-center border rounded px-3 py-1 ${isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"}`}
            >
              <Text
                className={`text-sm font-medium mr-2 ${isDark ? "text-dark-text" : "text-black"}`}
              >
                {cat.name}
              </Text>
              <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                <X size={16} color={isDark ? "#f5f5f5" : "#000000"} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className={`border rounded px-4 py-2 justify-center items-center ${isDark ? "bg-dark-surface border-dark-border-strong" : "bg-white border-border"}`}
          >
            <Text
              className={`text-sm font-bold ${isDark ? "text-dark-text" : "text-black"}`}
            >
              + Add Categories
            </Text>
          </TouchableOpacity>
        </View>

        {/* Images Select */}
        <Text
          className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-dark-muted" : "text-tertiary"}`}
        >
          Images
        </Text>
        {Array.isArray(Imagevalue) && Imagevalue.length > 0 && (
          <Text
            className={`text-xs mb-2 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
          >
            Long press on each image to remove it
          </Text>
        )}
        <View className="mb-6">
          <InstagramGrid
            value={Imagevalue}
            onChange={(imgs) => setImageValue(imgs)}
            emptyPlaceholdersCount={3}
            emptyLabel="No images yet"
          />
        </View>

        <TouchableOpacity
          disabled={sending}
          className="bg-primary py-4 rounded items-center justify-center"
          onPress={handleSubmit(onSubmit)}
        >
          <Text className="text-white font-geist font-semibold">
            {sending ? "Sending…" : "Create Request"}
          </Text>
        </TouchableOpacity>

        <CategoryAddition
          visible={modalVisible}
          categories={categories}
          parentSelectedCategories={selectedCategories}
          onClose={() => setModalVisible(false)}
          onConfirm={(selected) => setSelectedCategories(selected)}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default BuyerRequestFormBottomSheet;
