import React, { Ref, useState } from "react";
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
import { uploadImage, attemptMultipleUpload } from "../services/sections/media";
import { MediaResponse } from "../models/media";
import { createBuyerRequest } from "../services/sections/request";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { CreateRequestPayload } from "../models/request";
import { useToast } from "./ToastProvider";

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

const BuyerRequestFormBottomSheet = React.forwardRef<BottomSheetMethods | null, {}>(
  (props, ref) => {
    const sheetRef = React.useRef<BottomSheetMethods | null>(null);
    React.useImperativeHandle(ref, () => sheetRef.current!, [sheetRef.current]);
    const {show} = useToast();

    const snapPoints = React.useMemo(() => ["50%", "85%"], []);
    const [requestImages, setRequestImages] = useState<string[]>([]);

    requestSchema.refine(()=> selectedCategories?.length ?? 0 > 0,{
      path: ["category_ids"]
    });

    const { control, handleSubmit, formState: { errors } } = useForm<RequestFormData>({
      resolver: zodResolver(requestSchema) as any // todo: remember to solve later
    });
    
    const [Imagevalue, setImageValue] = React.useState<InstagramGridProps["value"]>(requestImages ? requestImages.map((uri, index) => ({ id: index.toString(), uri })) : []);

    //categories
    const [modalVisible, setModalVisible] = React.useState(false);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);

    const [sending, setSending] = React.useState(false);

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


    const createRequest = async(request: CreateRequestPayload) => {
        try {
          setSending(true);
          const newRequest = await createBuyerRequest(request);
          show({
            variant: "success",
            title: "Request Created",
            message: "Your request has been successfully created."
          });
          setSending(false);
          sheetRef.current?.close();
        } catch (error) {
          show({
            variant: "error",
            title: "Error creating buyer request",
            message: "There was a problem creating the buyer request. Please try again later."
          });
        }
      }

    const handleLocalSubmit = async (data: RequestFormData) => {
    try{
      console.log("sending request")
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
        // include raw image objects for parent to handle upload or attach to request body
        //remember to work on this later
        images: imageIds ?? [],
      };

      // call parent-provided onSubmit
      await createRequest(payload);
      console.log("all done, created request successfully")
    } catch (err) {
      console.error("Create product failed:", err);
      // optionally: show UI feedback here
    }
  }

    return (
      <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text className="text-lg font-geist font-bold text-black mb-4">Create Buyer Request</Text>

          {/* Title */}
          <Input name="title" control={control} placeholder="Title" errors={errors} />

          {/* Description */}
          <Input name="description" control={control} placeholder="Description" errors={errors} multiline numberOfLines={4} style={{height: 100, textAlignVertical: 'top'}} />

          {/* Budget */}
          <Input name="budget" control={control} placeholder="Budget" errors={errors} keyboardType="numeric" />

          {/* Category IDs */}
          <Text className="mb-2 text-xs font-geist font-bold text-tertiary uppercase tracking-[2px]">Categories</Text>
          <View className="flex-row flex-wrap gap-3 mb-4">
            {selectedCategories.map(cat => (
              <View key={cat.id.toString()} className="flex-row items-center bg-surface border border-border rounded px-3 py-1">
                <Text className="text-black text-sm font-medium mr-2">{cat.name}</Text>
                <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                  <X size={16} color="#000000" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-white border border-border rounded px-4 py-2 justify-center items-center"
            >
              <Text className="text-black text-sm font-bold">+ Add Categories</Text>
            </TouchableOpacity>
          </View>

          {/* Images Select */}
          <Text className="mb-2 text-xs font-geist font-bold text-tertiary uppercase tracking-[2px]">Images</Text>
          {Array.isArray(Imagevalue) && Imagevalue.length > 0 && (
            <Text className="text-tertiary text-xs mb-2">Long press on each image to remove it</Text>
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
            onPress={handleSubmit(handleLocalSubmit)}
          >
            <Text className="text-white font-geist font-semibold">{sending ? "Sending…" : "Create Request"}</Text>
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
