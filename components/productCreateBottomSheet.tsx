import 'react-native-reanimated';
import React, { useCallback, useRef, useMemo, forwardRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetFooter,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import SheetBusyOverlay from './SheetBusyOverlay';
import { useKeyboardOverlap, keyboardScrollPadding } from '../hooks/useKeyboardOverlap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import logger from '../utils/logger';
import { useTokens } from "../theme/useTokens";


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
  compare_at_price: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().min(0).optional()),
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
    const t = useTokens();

    productSchema.refine(()=> selectedCategories?.length ?? 0 > 0,{
      path: ["category_ids"]
    });

  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
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

      // Both are optional on the server; it only validates them when present
      // (>= 0.01). Defaulting them to 0.01 recorded "this used to cost one
      // kobo" on every product where the seller left the field blank, which
      // is why the discount UI had to compare the two numbers rather than
      // simply check whether a compare-at price exists. Omitted now.
      if (!data.compare_at_price) delete (data as any).compare_at_price;
      if (!data.cost_per_item) delete (data as any).cost_per_item;

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

  /**
   * The action bar, docked rather than scrolled to.
   *
   * `BottomSheetFooter` renders outside the scroll view and sits above the
   * keyboard, so "Create Product" is reachable from any field instead of
   * being the very last thing in a long form — which meant scrolling past
   * every optional detail to submit, with the keyboard still up.
   *
   * Shape borrowed from fieldgrid-mobile's input sheet: a hairline rule, the
   * sheet's own background so it reads as part of the sheet rather than a
   * floating bar, and the action sitting right.
   */
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View
          className="flex-row items-center gap-3 px-4 pt-2.5 bg-surface-page border-t border-border"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <Text className="flex-1 text-[12px] text-text-muted" numberOfLines={1}>
            {stage === "uploading"
              ? "Uploading images…"
              : stage === "creating"
                ? "Creating…"
                : `${selectedCategories.length} categor${selectedCategories.length === 1 ? "y" : "ies"}`}
          </Text>
          <TouchableOpacity
            disabled={sending}
            onPress={handleSubmit(onSubmit)}
            accessibilityRole="button"
            accessibilityState={{ disabled: sending, busy: sending }}
            className={`min-h-[44px] flex-row items-center justify-center gap-2 rounded-xl px-5 ${
              sending ? "bg-surface-sunken" : "bg-primary-fill"
            }`}
          >
            {sending ? <ActivityIndicator size="small" color={t.textSecondary} /> : null}
            <Text
              className={`text-[15px] font-bold ${
                sending ? "text-text-muted" : "text-text-on-primary"
              }`}
            >
              {sending ? "Working…" : "Create Product"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ),
    [sending, stage, insets.bottom, selectedCategories.length, handleSubmit, onSubmit, t]
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={!sending}
      enableContentPanningGesture={!sending}
      backgroundStyle={{ backgroundColor: t.surfacePage }}
      handleIndicatorStyle={{ backgroundColor: t.borderStrong }}
      // `extend` rather than `interactive`. Interactive works by moving the
      // sheet up, and this one opens at 90% — there is nowhere left to move,
      // so the bottom of the form stayed under the keyboard however the sheet
      // behaved. Extending pins it at its largest snap point and the padding
      // below does the actual work.
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      footerComponent={renderFooter}
    >
      <BottomSheetScrollView
        className="p-4"
        // Measured, not a guess. A fixed 120px is smaller than any real
        // keyboard, so the last few fields could never be scrolled clear of
        // it — which is exactly what a numeric keypad over "Compare at Price"
        // looked like. See hooks/useKeyboardOverlap.
        contentContainerStyle={{
          paddingBottom: keyboardScrollPadding(keyboardOverlap, insets.bottom, 32),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <Text className="text-lg font-bold mb-4 text-text-primary">Create Product</Text>

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
        <Text className="mb-2 text-xs font-bold uppercase tracking-[2px] text-text-secondary">Categories</Text>
        <View className="flex-row flex-wrap gap-3 p-3 pr-4">
          {selectedCategories.map(cat => (
            <View key={cat.id.toString()} className="flex-row items-center border rounded px-3 py-1 bg-surface-sunken border-border">
              <Text className="text-sm font-medium mr-2 text-text-primary">{cat.name}</Text>
              <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                <X size={16} color={t.textPrimary} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="border rounded px-4 py-2 justify-center items-center bg-surface-raised border-border"
          >
            <Text className="text-sm font-bold text-text-primary">+ Add Categories</Text>
          </TouchableOpacity>
        </View>
        {errors.category_ids && <Text className="text-danger-text text-xs mt-1">{errors.category_ids.message}</Text>}

        {/* Product Images */}
        <Text className="mb-2 text-xs font-bold uppercase tracking-[2px] text-text-secondary">Product Images</Text>
        {Array.isArray(Imagevalue) && Imagevalue.length > 0 && (
          <Text className="text-xs mb-2 text-text-secondary">Long press on each image to remove it</Text>
        )}
        {/* <<< IMPORTANT: pass value & onChange so we can receive images >>> */}
        <InstagramGrid value={Imagevalue} onChange={(imgs) => setImageValue(imgs)} emptyPlaceholdersCount={3} />

        {/* Optional forms*/}
        <Text className="text-xs font-bold uppercase tracking-[2px] mt-6 mb-3 text-text-primary">Optional Details</Text>

        {/* Barcode */}
        <Input name='barcode' label='Barcode' placeholder='Scan or enter a barcode' control={control} errors={errors} />

        {/* Weight */}
        <Input name='weight' label='Weight (grams)' placeholder='e.g. 500' control={control} keyboardType='numeric' errors={errors} />

        {/* SKU */}
        <Input name='sku' label='SKU' placeholder='Your stock-keeping code' control={control} errors={errors} />

        {/* Compare at Price */}
        <Input name='compare_at_price' label='Compare at Price (₦)' placeholder='Leave blank if not on sale' control={control} keyboardType='numeric' errors={errors} />

        {/* Cost per Item */}
        <Input name='cost_per_item' label='Cost per Item (₦)' placeholder='What it costs you' control={control} keyboardType='numeric' errors={errors} />
        

        </View>


        <CategoryAddition
          visible={modalVisible}
          categories={categories}
          parentSelectedCategories={selectedCategories}
          onClose={() => setModalVisible(false)}
          onConfirm={(selected) => setSelectedCategories(selected)}
          />
      </BottomSheetScrollView>

      <SheetBusyOverlay
        visible={sending}
        title={stage === "uploading" ? "Uploading images" : "Creating your product"}
        subtitle={
          stage === "uploading"
            ? "Keep this sheet open until it finishes."
            : "Almost done."
        }
      />
    </BottomSheet>
  );
}
);

export default ProductFormBottomSheet;
