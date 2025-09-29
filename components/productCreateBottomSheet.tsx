import React, { useRef, useMemo, forwardRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './inputs';
import { Category } from '../models/categories';
import { CategoryAddition } from './categoryAddition';
import { getAllCategories } from '../services/sections/categories';
import { X } from 'lucide-react-native';
import InstagramGrid, { InstagramGridProps } from './imagePicker';



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
    name: z.string().min(1, "Variant name is required"),
  })).optional(),
  sku: z.string().max(100).optional(),
  compare_at_price: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().min(0).optional()).default(0.01),
  cost_per_item: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().min(0).optional()).default(0.01),
  status: z.enum(['active', 'inactive']).optional(),
  tag_ids: z.array(z.number()).optional(),
})

type ProductFormData = z.infer<typeof productSchema>;

interface Props {
  onSubmit: (data: ProductFormData | any) => Promise<void>; // allow extra fields (images) in payload
  onClose?: () => void;
  productCategories?: Category[];
  productImages?: string[];
}

const ProductFormBottomSheet = forwardRef<BottomSheet, Props>(
  ({ onSubmit, onClose, productCategories, productImages }, ref) => {

    productSchema.refine(()=> selectedCategories?.length ?? 0 > 0,{
      path: ["category_ids"]
    });


  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);


  const [modalVisible, setModalVisible] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);

  // images state: store PickedImage[] from InstagramGrid
  const [Imagevalue, setImageValue] = React.useState<InstagramGridProps["value"]>(productImages ? productImages.map((uri, index) => ({ id: index.toString(), uri })) : []);

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


  const handleLocalSubmit = async (data: ProductFormData) => {
    try {
      //upload images first

      // ensure category_ids includes selectedCategories if not provided by form UI
      const category_ids = (data && (data as any).category_ids && (data as any).category_ids.length > 0)
        ? (data as any).category_ids
        : selectedCategories.map(c => c.id);

      //server requires cost_per_item and compare_at_price to be equal or greater than 0.01
      data.compare_at_price = data.compare_at_price ?? 0.01;
      data.cost_per_item = data.cost_per_item ?? 0.01;

      // prepare payload: keep form data, add category_ids (if we generated them) and add images
      const payload = {
        ...data,
        category_ids,
        // include raw image objects for parent to handle upload or attach to request body
        // todo: remember to ask backend dev about this. It is a bit confusing
        //media_ids: Imagevalue ?? [],
      };

      // call parent-provided onSubmit
      await onSubmit(payload);
      console.log("completed... all good")
    } catch (err) {
      console.error("Create product failed:", err);
      // optionally: show UI feedback here
    }
  };

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={snapPoints} enablePanDownToClose>
      <BottomSheetScrollView className="p-4">
        <Text className="text-lg font-bold mb-4">Create Product</Text>

        {/* Product Name */}
        <Text className="mb-1">Product Name</Text>
        <Input name='name' placeholder='Product Name' control={control}></Input>
        {errors.name && <Text className="text-red-500 mb-2">{errors.name.message}</Text>}

        {/* Price */}
        <Text className="mb-1">Price</Text>
        <Input name='price' placeholder='Price' control={control} keyboardType='numeric'></Input>
        {errors.price && <Text className="text-red-500 mb-2">{errors.price.message}</Text>}

        {/* Stock */}
        <Text className="mb-1">Stock</Text>
        <Input name='stock' placeholder='Stock' control={control} keyboardType='numeric'></Input>
        {errors.stock && <Text className="text-red-500 mb-2">{errors.stock.message}</Text>}

        {/* Description */}
        <Text className="mb-1">Description</Text>
        <Input name='description' placeholder='Description' control={control} multiline></Input>
        {errors.description && <Text className="text-red-500 mb-2">{errors.description.message}</Text>}

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
        {errors.category_ids && <Text className="text-red-500 mb-2">{errors.category_ids.message}</Text>}

        {/* Product Images */}
        <Text className="mb-1">Product Images</Text>
        {Imagevalue?.length && Imagevalue.length > 0 && <Text className="text-neutral-500 mb-2">Long press on each image to remove it</Text>}
        {/* <<< IMPORTANT: pass value & onChange so we can receive images >>> */}
        <InstagramGrid value={Imagevalue} onChange={(imgs) => setImageValue(imgs)} emptyPlaceholdersCount={3} />

        {/* Optional forms*/}
        <Text className='text-md font-bold mt-4 mb-2'>Optional Details</Text>

        {/* Barcode */}
        <Text className="mb-1">Barcode</Text>
        <Input name='barcode' placeholder='Barcode' control={control}></Input>
        {errors.barcode && <Text className="text-red-500 mb-2">{errors.barcode.message}</Text>}

        {/* Weight */}
        <Text className="mb-1">Weight (in grams)</Text>
        <Input name='weight' placeholder='Weight' control={control} keyboardType='numeric' value='0'></Input>
        {errors.weight && <Text className="text-red-500 mb-2">{errors.weight.message}</Text>}

        {/* SKU */}
        <Text className="mb-1">SKU</Text>
        <Input name='sku' placeholder='SKU' control={control}></Input>
        {errors.sku && <Text className="text-red-500 mb-2">{errors.sku.message}</Text>}

        {/* Compare at Price */}
        <Text className="mb-1">Compare at Price</Text>
        <Input name='compare_at_price' placeholder='Compare at Price' control={control} keyboardType='numeric' value='0'></Input>
        {errors.compare_at_price && <Text className="text-red-500 mb-2">{errors.compare_at_price.message}</Text>}

        {/* Cost per Item */}
        <Text className="mb-1">Cost per Item</Text>
        <Input name='cost_per_item' placeholder='Cost per Item' control={control} keyboardType='numeric' value='0'></Input>
        {errors.cost_per_item && <Text className="text-red-500 mb-2">{errors.cost_per_item.message}</Text>}
        

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(handleLocalSubmit)} // call our merged submit handler
          className="bg-[#e94c2a] p-3 rounded mt-4"
        >
          <Text className="text-white text-center font-bold">Create Product</Text>
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
