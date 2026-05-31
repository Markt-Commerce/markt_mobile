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
import { getSellerProducts } from "../services/sections/product";
import { PlaceholderProduct } from "../models/products";
import { uploadImage, attemptMultipleUpload } from "../services/sections/media";
import { MediaResponse } from "../models/media";
import { createPost } from "../services/sections/post";
import { createNichePost } from "../services/sections/niches";
import { useToast } from "./ToastProvider";
import { useTheme } from "./themeProvider";

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
    const { control, handleSubmit, formState: { errors } } = useForm<PostFormData>({
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

    const submitForm = async (data: PostFormData) => {
      try {
        setSending(true);
        data.products = postProducts.map((prod) => { return { product_id: prod.id }; });
        
        // If nicheId is provided, create a niche post instead
        if (nicheId) {
          await createNichePost(nicheId, data);
        } else {
          await createPost(data);
        }
        
        show({
          variant: "success",
          title: "Post Created",
          message: "Your post has been successfully created."
        });
        sheetRef.current?.close();
        
      } catch (error) {
        show({
          variant: "error",
          title: "Error creating post",
          message: "There was a problem creating the post. Please try again later."
        });
      }
    }


    const handleLocalSubmit = async (data: PostFormData) => {
    try {
      setSending(true);
      const ImageResponse = await attemptMultipleUpload(Imagevalue);

      const imageIds = ImageResponse.map((imgId)=>imgId.media.id)
      // ensure category_ids includes selectedCategories if not provided by form UI
      const category_ids = (data && (data as any).category_ids && (data as any).category_ids.length > 0)
        ? (data as any).category_ids
        : selectedCategories.map(c => c.id);

      // prepare payload: keep form data, add category_ids (if we generated them) and add images
      const payload = {
        ...data,
        category_ids,
        status: postStatus,
        products: currentProducts.map((val)=>{
          return {product_id:val}
        }),
        media_ids: imageIds ?? [],
      };

      // call parent-provided onSubmit
      submitForm(payload);
      setSending(false);
      show({
        variant: "success",
        title: "Post Created",
        message: "Your post has been created successfully."
      })
    } catch (err) {
      show({
        variant: "error",
        title: "Error creating post",
        message: "There was a problem creating the post. Please try again later."
      })
    }
  };

    React.useEffect(() => {
      async function fetchCategories() {
        try {
            const cats = await getAllCategories();
            setCategories(cats);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
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
          //work on this later. user_id is a string. Might bring up a Nan if we don't check properly
          const products = await getSellerProducts(Number(user?.user_id) || 0); //ensure user_id is a number
          setProductList(products);
        } catch (error) {
          console.error("Failed to fetch products:", error);
        }
      }
      if (productVisible) {
        fetchProducts();
      }
    }, [productVisible]);

    //media/images


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
        <Text className={`text-lg font-geist font-bold mb-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create Post</Text>

          {/* Caption */}
          <Input name="caption" className="" control={control} numberOfLines={10} placeholder="What's on your mind?"></Input>

          {/* Images */}
          <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Images</Text>
          {Array.isArray(Imagevalue) && Imagevalue.length > 0 && (
            <Text className={`text-xs font-inter mb-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Long press on each image to remove it</Text>
          )}
          {/* <<< IMPORTANT: pass value & onChange so we can receive images >>> */}
          <InstagramGrid value={Imagevalue} onChange={(imgs) => setImageValue(imgs)} emptyPlaceholdersCount={3} />
  

          {/* Categories */}
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

          {/* Products */}
          <Text className={`mb-2 text-xs font-geist font-bold uppercase tracking-[2px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Tag Products</Text>

          {/* Selected Products Section */}
          {currentProducts.length > 0 && (
            <View className="flex-row flex-wrap gap-3 mb-3">
              {productList
                .filter(p => currentProducts.includes(p.id))
                .map(product => (
                  <View
                    key={product.id}
                    className={`flex-row items-center border rounded px-3 py-1 ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
                  >
                    <Text className={`text-sm font-medium mr-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{product.name}</Text>
                    <TouchableOpacity onPress={() => setCurrentProducts(prev => prev.filter(pId => pId !== product.id))}>
                      <X size={16} color={isDark ? "#f0f1f2" : "#000000"} />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}
          <TouchableOpacity
            onPress={() => setProductVisible(true)}
            className={`border rounded px-4 py-2 justify-center items-center mb-3 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}
          >
            <Text className={`text-sm font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>+ Tag Products</Text>
          </TouchableOpacity>


          {/* Submit Button */}
          <TouchableOpacity className="bg-primary p-3 rounded" onPress={
              handleSubmit(handleLocalSubmit)
          } disabled={sending}>
            <Text className="text-white text-center font-geist font-bold">{sending ? "Sending..." : "Create Post"}</Text>
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
