import 'react-native-reanimated';
import React, { useRef, useMemo, forwardRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm } from 'react-hook-form';
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './inputs';
import { Category } from '../models/categories';
import { CategoryAddition } from './categoryAddition';
import { getAllCategories } from '../services/sections/categories';
import { X } from 'lucide-react-native';
import InstagramGrid, { InstagramGridProps } from './imagePicker';
import { uploadImage, attemptMultipleUpload } from '../services/sections/media';
import { MediaResponse } from '../models/media';
import { createPost } from '../services/sections/post';
import { CreateProductRequest } from '../models/products';
import { createProduct } from '../services/sections/product';
import { useToast } from './ToastProvider';
import { friendlyErrorMessage } from '../utils/errorMessages';
import { useTheme } from './themeProvider';
import logger from '../utils/logger';


// Zod Schema for Validation
// Mirrors the backend ProductCreateSchema limits (name 2–100 chars, price ≥ 0.01)
// so validation fails fast client-side instead of after a full image upload.
const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(100, "Product name must be at most 100 characters"),
  price: z.preprocess((val) => Number(val), z.number().min(0.01, "Price must be at least ₦0.01")),
  stock: z.preprocess((val) => Number(val), z.number().min(0, "Stock must be non-negative")),
  description: z.string().max(2000).optional(),
  category_ids: z.array(z.number()).optional(),
  media_ids: z.array(z.number()).optional(),
  barcode: z.string().max(100).optional(),
  weight: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().min(0).optional()).default(0.01),
  variants: z.array(z.object({
    name: z.string().min(1, "Variant name is required")
  })).optional(),
  sku: z.string().max(100).optional(),
  compare_at_price: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().min(0).optional()).default(0.01),
  cost_per_item: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().min(0).optional()).default(0.01),
  status: z.enum(['active', 'inactive']).optional(),
  tag_ids: z.array(z.number()).optional(),
})

type ProductFormData = z.infer<typeof productSchema>;

interface Props {
  onClose?: () => void;
  productCategories?: Category[];
  productImages?: string[];
}

const ProductFormBottomSheet = forwardRef<BottomSheet | null, Props>(
  (props, ref) => {

    const sheetRef = React.useRef<BottomSheet | null>(null);
    React.useImperativeHandle(ref, () => sheetRef.current!, [sheetRef.current]);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    productSchema.refine(()=> selectedCategories?.length ?? 0 > 0,{
      path: ["category_ids"]
    });

  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const { show } = useToast();


  const [modalVisible, setModalVisible] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);

    //for create product
    const [productCategories, setProductCategories] = useState<Category[]>([]);
    const [productImages, setProductImages] = useState<string[]>([]);

  // images state: store PickedImage[] from InstagramGrid
  const [Imagevalue, setImageValue] = React.useState<InstagramGridProps["value"]>(productImages ? productImages.map((uri, index) => ({ id: index.toString(), uri })) : []);
  // Submission stage drives the slow-network UI protection: while not idle the
  // button is locked (no double-submit), the sheet can't be swiped closed, and
  // the form is non-interactive.
  const [stage, setStage] = useState<"idle" | "uploading" | "creating">("idle");
  const sending = stage !== "idle";

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
  });

  React.useEffect(() => {
      async function fetchCategories() {
          try {
              const cats = await getAllCategories();
              setCategories(cats);
          } catch (error) {
              logger.error("Failed to fetch categories:", error);
          }
      }
      fetchCategories();
    }, []);

    const removeCategory = (id: Number) => {
    setSelectedCategories(prev => prev.filter(c => c.id !== id));
  };

  // Single submit path: upload images, build the payload, create the product,
  // and only on success clear the form and close. try/finally guarantees the
  // button leaves its "Sending..." state even when creation fails (previously
  // an error left `sending` stuck true forever).
  const onSubmit = async (data: ProductFormData) => {
    if (sending) return;
    try {
      setStage("uploading");

      // upload images first
      const ImageResponse = await attemptMultipleUpload(Imagevalue);
      const imageIds = ImageResponse
        .filter((img) => img && img.media && img.media.id)
        .map((imgId) => imgId.media.id);

      // ensure category_ids includes selectedCategories if not provided by form UI
      const category_ids = (data && (data as any).category_ids && (data as any).category_ids.length > 0)
        ? (data as any).category_ids
        : selectedCategories.map(c => c.id);

      //server requires cost_per_item and compare_at_price to be equal or greater than 0.01
      data.compare_at_price = data.compare_at_price ?? 0.01;
      data.cost_per_item = data.cost_per_item ?? 0.01;

      const payload: CreateProductRequest = {
        ...data,
        category_ids,
        media_ids: imageIds ?? [],
      };

      setStage("creating");
      await createProduct(payload);

      show({
        variant: "success",
        title: "Product Created",
        message: "Your product has been created successfully."
      });

      // Clear the form + local state, then close the sheet.
      reset();
      setImageValue([]);
      setSelectedCategories([]);
      sheetRef.current?.close();
    } catch (error) {
      logger.error("Create product failed:", error);
      show({
        variant: "error",
        title: "Error creating product",
        message: friendlyErrorMessage(error, "There was a problem creating the product. Please try again later.")
      });
    } finally {
      setStage("idle");
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={!sending}
      enableContentPanningGesture={!sending}
      backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "white" }}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#46464e" : "#E4E4E7" }}
    >
      <BottomSheetScrollView className="p-4">
        <Text className={`text-lg font-bold mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create Product</Text>

        {/* In-flight banner — visible while a slow network keeps us waiting */}
        {sending && (
          <View className={`flex-row items-center gap-3 rounded border px-4 py-3 mb-4 ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
            <Text className={`flex-1 text-xs leading-5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              {stage === "uploading"
                ? "Uploading images… please keep this sheet open."
                : "Creating your product… almost done."}
            </Text>
          </View>
        )}

        <View pointerEvents={sending ? "none" : "auto"}>

        {/* Product Name */}
        <Input name='name' label='Product Name' placeholder='e.g. Wireless headphones' control={control} errors={errors} />

        {/* Price */}
        <Input name='price' label='Price (₦)' placeholder='e.g. 15000' control={control} keyboardType='numeric' errors={errors} />

        {/* Stock */}
        <Input name='stock' label='Stock' placeholder='How many are available?' control={control} keyboardType='numeric' errors={errors} />

        {/* Description */}
        <Input name='description' label='Description' placeholder='Describe your product…' control={control} multiline errors={errors} />

        {/* Category IDs */}
        <Text className={`mb-2 text-xs font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Categories</Text>
        <View className="flex-row flex-wrap gap-3 p-3 pr-4">
          {selectedCategories.map(cat => (
            <View key={cat.id.toString()} className={`flex-row items-center border rounded px-3 py-1 ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
              <Text className={`text-sm font-medium mr-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{cat.name}</Text>
              <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                <X size={16} color={isDark ? "#f0f1f2" : "#000000"} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className={`border rounded px-4 py-2 justify-center items-center ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}
          >
            <Text className={`text-sm font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>+ Add Categories</Text>
          </TouchableOpacity>
        </View>
        {errors.category_ids && <Text className="text-error text-xs mt-1">{errors.category_ids.message}</Text>}

        {/* Product Images */}
        <Text className={`mb-2 text-xs font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Product Images</Text>
        {Array.isArray(Imagevalue) && Imagevalue.length > 0 && (
          <Text className={`text-xs mb-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Long press on each image to remove it</Text>
        )}
        {/* <<< IMPORTANT: pass value & onChange so we can receive images >>> */}
        <InstagramGrid value={Imagevalue} onChange={(imgs) => setImageValue(imgs)} emptyPlaceholdersCount={3} />

        {/* Optional forms*/}
        <Text className={`text-xs font-bold uppercase tracking-[2px] mt-6 mb-3 ${isDark ? "text-[#f0f1f2]" : "text-tertiary"}`}>Optional Details</Text>

        {/* Barcode */}
        <Input name='barcode' label='Barcode' placeholder='Scan or enter a barcode' control={control} errors={errors} />

        {/* Weight */}
        <Input name='weight' label='Weight (grams)' placeholder='e.g. 500' control={control} keyboardType='numeric' errors={errors} />

        {/* SKU */}
        <Input name='sku' label='SKU' placeholder='Your stock-keeping code' control={control} errors={errors} />

        {/* Compare at Price */}
        <Input name='compare_at_price' label='Compare at Price (₦)' placeholder='Original price, if discounted' control={control} keyboardType='numeric' errors={errors} />

        {/* Cost per Item */}
        <Input name='cost_per_item' label='Cost per Item (₦)' placeholder='What it costs you' control={control} keyboardType='numeric' errors={errors} />
        

        {/* Submit Button */}
        <TouchableOpacity
          disabled={sending}
          onPress={handleSubmit(onSubmit)} // call our merged submit handler
          className={`bg-primary p-3 rounded mt-4 flex-row items-center justify-center gap-2 ${sending ? "opacity-70" : ""}`}
        >
          {sending && <ActivityIndicator size="small" color="white" />}
          <Text className="text-white text-center font-bold">
            {stage === "uploading"
              ? "Uploading images…"
              : stage === "creating"
                ? "Creating product…"
                : "Create Product"}
          </Text>
        </TouchableOpacity>
        </View>


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
}
);

export default ProductFormBottomSheet;
