import React from "react";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
    const { control, handleSubmit } = useForm<RequestFormData>({
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

    return (
      <BottomSheet ref={ref} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetScrollView>
        <Text className="text-lg font-bold mb-3">Create Buyer Request</Text>

          {/* Title */}
          <Text className="mb-1">Title</Text>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextInput
                className="border rounded p-2 mb-3"
                placeholder="Request title"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          {/* Description */}
          <Text className="mb-1">Description</Text>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextInput
                className="border rounded p-2 mb-3"
                placeholder="Request description"
                multiline
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          {/* Budget */}
          <Text className="mb-1">Budget</Text>
          <Controller
            name="budget"
            control={control}
            render={({ field }) => (
              <TextInput
                className="border rounded p-2 mb-3"
                placeholder="Budget"
                keyboardType="numeric"
                value={field.value?.toString()}
                onChangeText={(text) => field.onChange(Number(text))}
              />
            )}
          />

          <TouchableOpacity className="bg-[#E94C2A] p-3 rounded" onPress={handleSubmit(onSubmit)}>
            <Text className="text-white text-center">Create Request</Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

export default BuyerRequestFormBottomSheet;
