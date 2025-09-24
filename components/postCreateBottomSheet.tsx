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

const postSchema = z.object({
  caption: z.string().max(1000, "Caption too long").optional(),
  tags: z.array(z.string()).optional(),
  category_ids: z.array(z.number()).min(1, "Select at least one category"),
  media_ids: z.array(z.number()).optional(),
  products: z.array(z.object({ product_id: z.string() })).optional(),
});

export type PostFormData = z.infer<typeof postSchema>;

const PostFormBottomSheet = forwardRef<BottomSheet, { onSubmit: (data: PostFormData) => void, products:PlaceholderProduct[], productCategories:Category[]}>(
  ({ onSubmit }, ref) => {

    //user
    const { user } = useUser();

    const snapPoints = useMemo(() => ["50%", "85%"], []);
    const { control, handleSubmit, formState: { errors } } = useForm<PostFormData>({
      resolver: zodResolver(postSchema),
      defaultValues: {
        caption: "",
        tags: [],
        category_ids: [],
        media_ids: [],
        products: [],
      },
    });

    //categories
    const [modalVisible, setModalVisible] = React.useState(false);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);

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
          const products = await getSellerProducts(user?.user_id || 0); //assuming user_id is available in user context
          setProductList(products);
        } catch (error) {
          console.error("Failed to fetch products:", error);
        }
      }
      if (productVisible) {
        fetchProducts();
      }
    }, [productVisible, productList]);

    //media/images


    return (
      <BottomSheet ref={ref} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetScrollView className="p-4">
          <Text className="text-lg font-bold mb-3">Create Post</Text>

          {/* Caption */}
          <Input name="caption" className="" control={control} numberOfLines={10} placeholder="What's on your mind?"></Input>

          {/* Images */}
          <InstagramGrid emptyPlaceholdersCount={3}/>

          {/* Categories */}
        <Text className="mb-1">Categories</Text>
        <View className="flex-row flex-wrap gap-3 p-3 pr-4">
          {selectedCategories.map(cat => (
            <View key={cat.id.toString()} className="flex-row items-center bg-[#f4f0f0] rounded-full px-3 py-1">
              <Text className="text-[#181111] text-sm font-medium mr-2">{cat.name}</Text>
              <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                <X size={16} color="#181111" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="bg-[#e9242a] rounded-full px-4 py-2 justify-center items-center"
          >
            <Text className="text-white text-sm font-bold">+ Add Categories</Text>
          </TouchableOpacity>
        </View>

          {/* Products */}
          <Text className="mb-1">Tag Products</Text>
          <ProductPicker 
            visible={productVisible} 
            products={productList}
            selectedProducts={productList.filter(p => currentProducts.includes(p.id))}
            onClose={() => setProductVisible(false)} 
            onSelect={(product: { id: string; name: string; price: number; image?: string }) => {
              //add product to form state
              const isAlreadyAdded = currentProducts.find(pId => pId === product.id);
              if (!isAlreadyAdded) {
                setCurrentProducts(prev => [...prev, product.id]);
              }
            }}
            onRemove={(product: { id: string; name: string; price: number; image?: string }) => {
              //remove product from form state
              setCurrentProducts(prev => prev.filter(pId => pId !== product.id));
            }}
          />


          {/* Submit Button */}
          <TouchableOpacity className="bg-[#E94C2A] p-3 rounded" onPress={handleSubmit(onSubmit)}>
            <Text className="text-white text-center">Create Post</Text>
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

export default PostFormBottomSheet;
