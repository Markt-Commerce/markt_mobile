import 'react-native-reanimated';
import React, { forwardRef, useMemo, useState } from "react";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./inputs";
import { useUser } from "../hooks/userContextProvider";
import { CategoryAddition } from "./categoryAddition"
import ProductPicker from "./productPicker";
import InstagramGrid, { InstagramGridProps } from "./imagePicker";
import { Category } from "../models/categories";
import { getAllCategories } from "../services/sections/categories";
import { X } from "lucide-react-native";
import { getMyProducts } from "../services/sections/product";
import { PlaceholderProduct } from "../models/products";
import { uploadImage, attemptMultipleUpload } from "../services/sections/media";
import { MediaResponse } from "../models/media";
import { createPost } from "../services/sections/post";
import { createNichePost } from "../services/sections/niches";
import { useToast } from "./ToastProvider";
import { friendlyErrorMessage } from "../utils/errorMessages";
import { useTheme } from "./themeProvider";
import logger from "../utils/logger";

const postSchema = z.object({
  caption: z.string().max(1000, "Caption too long").optional(),
  tags: z.array(z.string()).optional(),
  category_ids: z.array(z.number()).min(1, "Select at least one category").optional(),
  media_ids: z.array(z.number()).optional(),
  products: z.array(z.object({ product_id: z.string() })).optional(),
  status: z.string().default("active").optional()
});

export type PostFormData = z.infer<typeof postSchema>;

interface PostFormBottomSheetProps {
  nicheId?: string;
}

const PostFormBottomSheet = React.forwardRef<BottomSheet | null, PostFormBottomSheetProps>(
  ({ nicheId }, ref) => {

    const sheetRef = React.useRef<BottomSheet | null>(null);
    React.useImperativeHandle(ref, () => sheetRef.current!, [sheetRef.current]);
    //user
    const { user } = useUser();
    const { show } = useToast();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [postImages, setpostImages] = useState<string[]>([]);

    // images state: store PickedImage[] from InstagramGrid
    const [Imagevalue, setImageValue] = React.useState<InstagramGridProps["value"]>(postImages ? postImages.map((uri, index) => ({ id: index.toString(), uri })) : []);

    //draft or active
    const [postStatus, setPostStatus] = useState<"active" | "draft">("active")

    const snapPoints = useMemo(() => ["50%", "85%"], []);
    const { control, handleSubmit, reset, formState: { errors } } = useForm<PostFormData>({
      resolver: zodResolver(postSchema) as any
    });

    //categories
    const [modalVisible, setModalVisible] = React.useState(false);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);

    //for create post
    const [postCategories, setPostCategories] = useState<Category[]>([]);
    const [postProducts, setPostProducts] = useState<PlaceholderProduct[]>([]);

    const [sending, setSending] = React.useState(false);

    postSchema.refine(()=> selectedCategories?.length ?? 0 > 0,{
      path: ["category_ids"]
    });

    // Single submit path: upload images, build the payload, create the post,
    // and only on success clear the form and close. A single toast either way
    // (previously two functions each fired their own, so a failure showed both
    // an error AND a success).
    const onSubmit = async (data: PostFormData) => {
      if (sending) return;
      try {
        setSending(true);

        const ImageResponse = await attemptMultipleUpload(Imagevalue);
        const imageIds = ImageResponse.map((imgId) => imgId.media.id);

        // ensure category_ids includes selectedCategories if not provided by form UI
        const category_ids =
          (data as any)?.category_ids && (data as any).category_ids.length > 0
            ? (data as any).category_ids
            : selectedCategories.map((c) => c.id);

        const payload = {
          ...data,
          category_ids,
          status: postStatus,
          products: currentProducts.map((val) => ({ product_id: val })),
          media_ids: imageIds ?? [],
        };

        // If nicheId is provided, create a niche post instead
        if (nicheId) {
          await createNichePost(nicheId, payload);
        } else {
          await createPost(payload);
        }

        show({
          variant: "success",
          title: "Post Created",
          message: "Your post has been created successfully.",
        });

        // Clear the form + local state, then close the sheet.
        reset();
        setImageValue([]);
        setSelectedCategories([]);
        setCurrentProducts([]);
        sheetRef.current?.close();
      } catch (error) {
        logger.error("Failed to create post:", error);
        show({
          variant: "error",
          title: "Error creating post",
          message: friendlyErrorMessage(error, "There was a problem creating the post. Please try again later."),
        });
      } finally {
        setSending(false);
      }
    };

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
      setSelectedCategories(prev => prev.filter(c => c.id !== id));
    };


    //products
    const [productVisible, setProductVisible] = useState(false);
    const [productList, setProductList] = useState<PlaceholderProduct[]>([])
    const [currentProducts, setCurrentProducts] = useState<string[]>([]);
    React.useEffect(() => {
      async function fetchProducts() {
        try {
          // Use the dedicated "my products" route. The old getSellerProducts
          // path took a numeric seller_id, but user_id is a string ("USR_..."),
          // so Number() gave NaN -> 0 and it always fetched nothing.
          const products = await getMyProducts();
          setProductList(products);
        } catch (error) {
          logger.error("Failed to fetch products:", error);
        }
      }
      if (productVisible) {
        fetchProducts();
      }
    }, [productVisible]);

    //media/images


    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={!sending}
        backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "white" }}
        handleIndicatorStyle={{ backgroundColor: isDark ? "#46464e" : "#E4E4E7" }}
      >
        <BottomSheetScrollView className="p-4">
        <Text className={`text-lg font-bold mb-3 text-text-primary`}>Create Post</Text>

          {/* Caption */}
          <Input name="caption" control={control} label="Caption" placeholder="Share a product you're curious about…" multiline numberOfLines={6} />

          {/* Images */}
          <Text className={`mb-2 text-xs font-bold uppercase tracking-[2px] text-text-secondary`}>Images</Text>
          {Array.isArray(Imagevalue) && Imagevalue.length > 0 && (
            <Text className={`text-xs mb-2 text-text-secondary`}>Long press on each image to remove it</Text>
          )}
          {/* <<< IMPORTANT: pass value & onChange so we can receive images >>> */}
          <InstagramGrid value={Imagevalue} onChange={(imgs) => setImageValue(imgs)} emptyPlaceholdersCount={3} allowVideos />
  

          {/* Categories */}
        <Text className={`mb-2 text-xs font-bold uppercase tracking-[2px] text-text-secondary`}>Categories</Text>
        <View className="flex-row flex-wrap gap-3 p-3 pr-4">
          {selectedCategories.map(cat => (
            <View key={cat.id.toString()} className={`flex-row items-center border rounded px-3 py-1 ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}>
              <Text className={`text-sm font-medium mr-2 text-text-primary`}>{cat.name}</Text>
              <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                <X size={16} color={isDark ? "#f0f1f2" : "#000000"} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className={`border rounded px-4 py-2 justify-center items-center ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}
          >
            <Text className={`text-sm font-bold text-text-primary`}>+ Add Categories</Text>
          </TouchableOpacity>
        </View>
        {errors.category_ids && <Text className="text-error text-xs mt-1">{errors.category_ids.message}</Text>}

          {/* Products */}
          <Text className={`mb-2 text-xs font-bold uppercase tracking-[2px] text-text-secondary`}>Tag Products</Text>

          {/* Selected Products Section */}
          {currentProducts.length > 0 && (
            <View className="flex-row flex-wrap gap-3 mb-3">
              {productList
                .filter(p => currentProducts.includes(p.id))
                .map(product => (
                  <View
                    key={product.id}
                    className={`flex-row items-center border rounded px-3 py-1 ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
                  >
                    <Text className={`text-sm font-medium mr-2 text-text-primary`}>{product.name}</Text>
                    <TouchableOpacity onPress={() => setCurrentProducts(prev => prev.filter(pId => pId !== product.id))}>
                      <X size={16} color={isDark ? "#f0f1f2" : "#000000"} />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}
          <TouchableOpacity
            onPress={() => setProductVisible(true)}
            className={`border rounded px-4 py-2 justify-center items-center mb-3 ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}
          >
            <Text className={`text-sm font-bold text-text-primary`}>+ Tag Products</Text>
          </TouchableOpacity>


          {/* Submit Button */}
          <TouchableOpacity className="bg-primary p-3 rounded" onPress={
              handleSubmit(onSubmit)
          } disabled={sending}>
            <Text className="text-white text-center font-bold">{sending ? "Sending..." : "Create Post"}</Text>
          </TouchableOpacity>

          <CategoryAddition
            visible={modalVisible}
            categories={categories}
            parentSelectedCategories={selectedCategories}
            onClose={() => setModalVisible(false)}
            onConfirm={(selected) => setSelectedCategories(selected)}
          />
        </BottomSheetScrollView>

      {/* For Product Picker */}
      <ProductPicker 
        visible={productVisible} 
        products={productList}
        selectedProducts={productList.filter(p => currentProducts.includes(p.id))}
        onClose={() => setProductVisible(false)} 
        onSelect={(product) => {
          const isAlreadyAdded = currentProducts.find(pId => pId === product.id);
          if (!isAlreadyAdded) {
            setCurrentProducts(prev => [...prev, product.id]);
          }
        }}
        onRemove={(product) => {
          setCurrentProducts(prev => prev.filter(pId => pId !== product.id));
        }}
      />
      </BottomSheet>
    );
  }
);

export default PostFormBottomSheet;
