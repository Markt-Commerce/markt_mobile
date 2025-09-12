import React, { useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Zod Schema for Validation
const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  price: z.number().positive('Price must be greater than 0'),
  stock: z.number().min(0, 'Stock cannot be negative'),
  description: z.string().max(1000, 'Description too long').optional(),
  category_ids: z.array(z.number()).optional(),
  media_ids: z.array(z.number()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Props {
  onSubmit: (data: ProductFormData) => Promise<void>;
  onClose?: () => void;
}

const ProductFormBottomSheet: React.FC<Props> = ({ onSubmit, onClose }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  const { control, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      stock: 0,
      description: '',
      category_ids: [],
      media_ids: [],
    },
  });

  const submitForm = async (data: ProductFormData) => {
    await onSubmit(data);
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints} enablePanDownToClose onClose={onClose}>
      <ScrollView className="p-4">
        <Text className="text-lg font-bold mb-4">Create Product</Text>

        {/* Name */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Product Name"
              value={value}
              onChangeText={onChange}
              className="border border-gray-300 rounded p-2 mb-2"
            />
          )}
        />
        {errors.name && <Text className="text-red-500">{errors.name.message}</Text>}

        {/* Price */}
        <Controller
          control={control}
          name="price"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Price"
              keyboardType="numeric"
              value={value ? String(value) : ''}
              onChangeText={(val) => onChange(Number(val))}
              className="border border-gray-300 rounded p-2 mb-2"
            />
          )}
        />
        {errors.price && <Text className="text-red-500">{errors.price.message}</Text>}

        {/* Stock */}
        <Controller
          control={control}
          name="stock"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Stock"
              keyboardType="numeric"
              value={value ? String(value) : ''}
              onChangeText={(val) => onChange(Number(val))}
              className="border border-gray-300 rounded p-2 mb-2"
            />
          )}
        />
        {errors.stock && <Text className="text-red-500">{errors.stock.message}</Text>}

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Description"
              value={value}
              onChangeText={onChange}
              multiline
              className="border border-gray-300 rounded p-2 mb-2 min-h-[100px]"
            />
          )}
        />
        {errors.description && <Text className="text-red-500">{errors.description.message}</Text>}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(submitForm)}
          className="bg-blue-600 p-3 rounded mt-4"
        >
          <Text className="text-white text-center font-bold">Create Product</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
};

export default ProductFormBottomSheet;
