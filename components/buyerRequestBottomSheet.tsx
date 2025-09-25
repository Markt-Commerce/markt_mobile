import React from "react";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
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

const requestSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required").max(2000),
  budget: z.number().min(1, "Budget must be positive"),
  category_ids: z.array(z.number()).min(1, "Select at least one category"),
  media_ids: z.array(z.number()).optional(),
  expires_at: z.string().min(1, "Deadline required"),
});

export type RequestFormData = z.infer<typeof requestSchema>;

const BuyerRequestFormBottomSheet = React.forwardRef<BottomSheet, { onSubmit: (data: RequestFormData) => void }>(
  ({ onSubmit }, ref) => {
    const snapPoints = React.useMemo(() => ["50%", "85%"], []);

    const { control, handleSubmit, formState: { errors } } = useForm<RequestFormData>({
      resolver: zodResolver(requestSchema),
      defaultValues: {
        title: "",
        description: "",
        budget: 0,
        category_ids: [],
        media_ids: [],
        expires_at: "",
      },
    });
    
    //images 
    const [images, setImages] = React.useState<PickedImage[]>([]);

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

    return (
      <BottomSheet ref={ref} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetScrollView>
        <Text className="text-lg font-bold mb-3">Create Buyer Request</Text>

          {/* Title */}
          <Input name="title" control={control} placeholder="Title"></Input>
          {errors && errors.title && <Text className="text-red-500">{errors.title.message}</Text>}

          {/* Description */}
          <Input name="description" control={control} placeholder="Description" multiline numberOfLines={4} style={{height: 100, textAlignVertical: 'top'}}></Input>
          {errors && errors.description && <Text className="text-red-500">{errors.description.message}</Text>}
          
          {/* Budget */}
          <Input name="budget" control={control} placeholder="Budget" keyboardType="numeric"></Input>
          {errors && errors.budget && <Text className="text-red-500">{errors.budget.message}</Text>}

          {/* Category IDs */}
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

          {/* Images Select */}
          <Text className="mb-1">Images</Text>
          <Text>{images.length} images Selected</Text>
          <InstagramGrid emptyLabel="No images selected" emptyPlaceholdersCount={3} onChange={(data)=> setImages((prev)=>{
            return [...prev, ...data.filter(d => !prev.find(p => p.id === d.id))];
          })}/>

          <TouchableOpacity className="bg-[#E94C2A] p-3 rounded" onPress={handleSubmit(onSubmit)}>
            <Text className="text-white text-center">Create Request</Text>
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

export default BuyerRequestFormBottomSheet;
