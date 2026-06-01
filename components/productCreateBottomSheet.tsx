import 'react-native-reanimated';
import React, { useRef, useMemo, forwardRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
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
import { useTheme } from './themeProvider';


// Zod Schema for Validation
const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  price: z.preprocess((val) => Number(val), z.number().min(0, "Price must be non-negative")),
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
  const [sending, setSending] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
  });

  React.useEffect(() => {
      async function fetchCategories() {
          try {
              const cats = await getAllCategories();
              setCategories(cats);
          } catch (error) {
              console.error("Failed to fetch categories:", error);
          }
      }
      fetchCategories();
    }, []);

    const removeCategory = (id: Number) => {
    setSelectedCategories(prev => prev.filter(c => c.id !== id));
  };

  const submitProduct = async (product: CreateProductRequest) => {
        try {
          setSending(true);
          const newProduct = await createProduct(product);
          show({
            variant: "success",
            title: "Product Created",
            message: "Your product has been successfully created."
          });
          setSending(false);
          sheetRef?.current?.close();
        } catch (error) {
          show({
            variant: "error",
            title: "Error creating product",
            message: "There was a problem creating the product. Please try again later."
          });
        }
      }


  const handleLocalSubmit = async (data: ProductFormData) => {
    try {
      //upload images first
      const ImageResponse = await attemptMultipleUpload(Imagevalue);

      const imageIds = ImageResponse.map((imgId)=>imgId.media.id)

      // ensure category_ids includes selectedCategories if not provided by form UI
      const category_ids = (data && (data as any).category_ids && (data as any).category_ids.length > 0)
        ? (data as any).category_ids
        : selectedCategories.map(c => c.id);

      //server requires cost_per_item and compare_at_price to be equal or greater than 0.01
      data.compare_at_price = data.compare_at_price ?? 0.01;
      data.cost_per_item = data.cost_per_item ?? 0.01;

      // prepare payload: keep form data, add category_ids (if we generated them) and add images
      const payload: CreateProductRequest = {
        ...data,
        category_ids,
        media_ids: imageIds ?? [],
      };

      // call parent-provided onSubmit
      await submitProduct(payload);
      console.log("completed... all good")
    } catch (err) {
      console.error("Create product failed:", err);
      // optionally: show UI feedback here
    }
  };

  return (
    <BottomSheet 
      ref={ref} 
      index={-1} 
      snapPoints={snapPoints} 
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "white" }}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#46464e" : "#E4E4E7" }}
    >
      <BottomSheetScrollView className="p-4">
        <Text className={`text-lg font-geist font-bold mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create Product</Text>

        {/* Product Name */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Product Name</Text>
        <Input name='name' placeholder='Product Name' control={control}></Input>
        {errors.name && <Text className="text-error text-xs font-geist mt-1">{errors.name.message}</Text>}

        {/* Price */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Price</Text>
        <Input name='price' placeholder='Price' control={control} keyboardType='numeric'></Input>
        {errors.price && <Text className="text-error text-xs font-geist mt-1">{errors.price.message}</Text>}

        {/* Stock */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Stock</Text>
        <Input name='stock' placeholder='Stock' control={control} keyboardType='numeric'></Input>
        {errors.stock && <Text className="text-error text-xs font-geist mt-1">{errors.stock.message}</Text>}

        {/* Description */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Description</Text>
        <Input name='description' placeholder='Description' control={control} multiline></Input>
        {errors.description && <Text className="text-error text-xs font-geist mt-1">{errors.description.message}</Text>}

        {/* Category IDs */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Categories</Text>
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
        {errors.category_ids && <Text className="text-error text-xs font-geist mt-1">{errors.category_ids.message}</Text>}

        {/* Product Images */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Product Images</Text>
        {Array.isArray(Imagevalue) && Imagevalue.length > 0 && (
          <Text className={`text-xs font-inter mb-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Long press on each image to remove it</Text>
        )}
        {/* <<< IMPORTANT: pass value & onChange so we can receive images >>> */}
        <InstagramGrid value={Imagevalue} onChange={(imgs) => setImageValue(imgs)} emptyPlaceholdersCount={3} />

        {/* Optional forms*/}
        <Text className={`text-xs font-geist font-bold uppercase tracking-[2px] mt-6 mb-3 ${isDark ? "text-[#f0f1f2]" : "text-tertiary"}`}>Optional Details</Text>

        {/* Barcode */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Barcode</Text>
        <Input name='barcode' placeholder='Barcode' control={control}></Input>
        {errors.barcode && <Text className="text-error text-xs font-geist mt-1">{errors.barcode.message}</Text>}

        {/* Weight */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Weight (in grams)</Text>
        <Input name='weight' placeholder='Weight' control={control} keyboardType='numeric' value='0'></Input>
        {errors.weight && <Text className="text-error text-xs font-geist mt-1">{errors.weight.message}</Text>}

        {/* SKU */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>SKU</Text>
        <Input name='sku' placeholder='SKU' control={control}></Input>
        {errors.sku && <Text className="text-error text-xs font-geist mt-1">{errors.sku.message}</Text>}

        {/* Compare at Price */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Compare at Price</Text>
        <Input name='compare_at_price' placeholder='Compare at Price' control={control} keyboardType='numeric' value='0'></Input>
        {errors.compare_at_price && <Text className="text-error text-xs font-geist mt-1">{errors.compare_at_price.message}</Text>}

        {/* Cost per Item */}
        <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Cost per Item</Text>
        <Input name='cost_per_item' placeholder='Cost per Item' control={control} keyboardType='numeric' value='0'></Input>
        {errors.cost_per_item && <Text className="text-error text-xs font-geist mt-1">{errors.cost_per_item.message}</Text>}
        

        {/* Submit Button */}
        <TouchableOpacity
          disabled={sending}
          onPress={handleSubmit(handleLocalSubmit)} // call our merged submit handler
          className="bg-primary p-3 rounded mt-4"
        >
          <Text className="text-white text-center font-geist font-bold">{sending ? "Sending..." : "Create Product"}</Text>
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
}
);

export default ProductFormBottomSheet;
