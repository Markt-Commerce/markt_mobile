import React, { forwardRef, useMemo } from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const postSchema = z.object({
  caption: z.string().max(1000, "Caption too long").optional(),
  tags: z.array(z.string()).optional(),
  category_ids: z.array(z.number()).min(1, "Select at least one category"),
  media_ids: z.array(z.number()).optional(),
  products: z.array(z.object({ product_id: z.string() })).optional(),
});

export type PostFormData = z.infer<typeof postSchema>;

const PostFormBottomSheet = forwardRef<BottomSheet, { onSubmit: (data: PostFormData) => void }>(
  ({ onSubmit }, ref) => {
    const snapPoints = useMemo(() => ["50%", "85%"], []);
    const { control, handleSubmit } = useForm<PostFormData>({
      resolver: zodResolver(postSchema),
      defaultValues: {
        caption: "",
        tags: [],
        category_ids: [],
        media_ids: [],
        products: [],
      },
    });

    return (
      <BottomSheet ref={ref} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <ScrollView className="p-4">
          <Text className="text-lg font-bold mb-3">Create Post</Text>

          {/* Caption */}
          <Text className="mb-1">Caption</Text>
          <Controller
            name="caption"
            control={control}
            render={({ field }) => (
              <TextInput
                className="border rounded p-2 mb-3"
                placeholder="Write a caption..."
                value={field.value}
                onChangeText={field.onChange}
                multiline
              />
            )}
          />

          {/* Category IDs */}
          <Text className="mb-1">Categories</Text>
          <Controller
            name="category_ids"
            control={control}
            render={({ field }) => (
              <TextInput
                className="border rounded p-2 mb-3"
                placeholder="Enter category IDs (comma separated)"
                onChangeText={(text) => field.onChange(text.split(",").map(Number))}
              />
            )}
          />

          <TouchableOpacity className="bg-[#e26136] p-3 rounded" onPress={handleSubmit(onSubmit)}>
            <Text className="text-white text-center">Create Post</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>
    );
  }
);

export default PostFormBottomSheet;
