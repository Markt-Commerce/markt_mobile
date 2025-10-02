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

//temporary date parser to create an expiry date. This default expiry date would be seven days from when the request was first placed
function getDateSevenDaysFromNow() {
  const today = new Date(Date.now());

  const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const day = String(futureDate.getDate()).padStart(2, '0');
  const month = String(futureDate.getMonth() + 1).padStart(2, '0');
  const year = String(futureDate.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
}

const requestSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required").max(2000),
  budget: z.preprocess((val) => Number(val), z.number().min(0, "Budget must be positive")),
  category_ids: z.array(z.number()).optional(),
  media_ids: z.array(z.number()).optional(),
  expires_at: z.string().default(getDateSevenDaysFromNow()).optional(),
});

export type RequestFormData = z.infer<typeof requestSchema>;

const BuyerRequestFormBottomSheet = React.forwardRef<BottomSheet, { onSubmit: (data: RequestFormData) => void, requestImages:string[] }>(
  ({ onSubmit, requestImages }, ref) => {
    const snapPoints = React.useMemo(() => ["50%", "85%"], []);

    requestSchema.refine(()=> selectedCategories?.length ?? 0 > 0,{
      path: ["category_ids"]
    });

    const { control, handleSubmit, formState: { errors } } = useForm<RequestFormData>({
      resolver: zodResolver(requestSchema) as any // todo: remember to solve later
    });
    
    // images state: store PickedImage[] from InstagramGrid
    const [Imagevalue, setImageValue] = React.useState<InstagramGridProps["value"]>(requestImages ? requestImages.map((uri, index) => ({ id: index.toString(), uri })) : []);

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


    const handleLocalSubmit = async (data: RequestFormData) => {
      console.log("sending request")
        try {
          // ensure category_ids includes selectedCategories if not provided by form UI
          const category_ids = (data && (data as any).category_ids && (data as any).category_ids.length > 0)
            ? (data as any).category_ids
            : selectedCategories.map(c => c.id);
    
          // prepare payload: keep form data, add category_ids (if we generated them) and add images
          const payload = {
            ...data,
            category_ids,
            // include raw image objects for parent to handle upload or attach to request body
            //remember to work on this later
            //images: Imagevalue ?? [],
          };
    
          // call parent-provided onSubmit
          await onSubmit(payload);
          console.log("all done, created request successfully")
        } catch (err) {
          console.error("Create product failed:", err);
          // optionally: show UI feedback here
        }
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
          {Imagevalue?.length && Imagevalue.length > 0 && <Text className="text-neutral-500 mb-2">Long press on each image to remove it</Text>}
          {/* <<< IMPORTANT: pass value & onChange so we can receive images >>> */}
          <InstagramGrid value={Imagevalue} onChange={(imgs) => setImageValue(imgs)} emptyPlaceholdersCount={3} />

          <TouchableOpacity className="bg-[#E94C2A] p-3 rounded" onPress={handleSubmit(handleLocalSubmit)}>
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
