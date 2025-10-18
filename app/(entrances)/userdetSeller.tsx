import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ArrowLeft, X } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "../../hooks/userContextProvider";
import { SignupStepTwo, register, useRegData } from "../../models/signupSteps";
import { getAllCategories } from "../../services/sections/categories";
import { Category } from "../../models/categories";
import { useRouter } from "expo-router";
import { CategoryAddition } from "../../components/categoryAddition";
import { registerUser } from "../../services/sections/auth";
import { Input } from "../../components/inputs";
import Button from "../../components/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider"; 

const schema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  userName: z.string().min(1, "Username is required"),
  shopDescription: z.string().min(1, "Shop description is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

const ShopInformationScreen = () => {
  const { setUser } = useUser();
  const { regData, setRegData } = useRegData();
  const router = useRouter();
  const { show } = useToast(); // <-- toast API

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);
  const [modalVisible, setModalVisible] = React.useState(false);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await getAllCategories();
        setCategories(cats);
      } catch (error: any) {
        console.error("Failed to fetch categories:", error);
        show({
          variant: "error",
          title: "Couldn’t load categories",
          message: "Please check your connection and try again.",
        });
      }
    }
    fetchCategories();
  }, [show]);

  const handleSubmitForm = async (data: z.infer<typeof schema>) => {
    const shopData: SignupStepTwo = {
      username: data.userName,
      phone_number: data.phoneNumber,
      seller_data: {
        policies: {}, // later
        description: data.shopDescription,
        shop_name: data.shopName,
        category_ids: selectedCategories.map((c) => c.id),
      },
    };

    const updatedRegData = register(regData, shopData);
    delete updatedRegData.buyer_data;
    setRegData(updatedRegData);

    try {
      const userRegResult = await registerUser(updatedRegData); // keep consistent with updated data
      setUser({
        email: userRegResult.email.toLowerCase(),
        account_type: userRegResult.account_type,
      });

      show({
        variant: "success",
        title: "Shop details saved",
        message: "We sent a verification code to your email.",
      });

      router.push("/emailVerification");
    } catch (error: any) {
      console.error("Registration failed:", error);
      show({
        variant: "error",
        title: "Couldn’t complete signup",
        message: error?.message || "Please review your details and try again.",
      });
    }
  };

  const removeCategory = (id: Number) => {
    setSelectedCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // simple progress for “Step 2 of 3”
  const step = 2;
  const totalSteps = 3;
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center p-4 pb-2 justify-between border-b border-neutral-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft color="#181111" size={24} />
          </TouchableOpacity>
          <Text className="text-[#181111] text-lg font-extrabold text-center flex-1 pr-12">
            Shop Information
          </Text>
        </View>

        {/* Gamified progress / stepper */}
        <View className="px-4 pt-4">
          <View className="flex-row items-end justify-between">
            <Text className="text-[#171212] font-semibold">Setup Progress</Text>
            <Text className="text-[#171212] text-xs font-semibold">{pct}%</Text>
          </View>
          <View className="w-full h-2 bg-neutral-100 rounded-full mt-2 overflow-hidden">
            <View className="h-2 bg-[#e9242a] rounded-full" style={{ width: `${pct}%` }} />
          </View>
          <View className="flex-row gap-2 mt-2">
            <Text className="text-neutral-600 text-xs">Step {step} of {totalSteps}</Text>
            <Text className="text-neutral-400 text-xs">•</Text>
            <Text className="text-neutral-600 text-xs">Create your shop</Text>
          </View>
        </View>

        {/* Form Card */}
        <View className="px-4 mt-4">
          <View className="rounded-2xl border border-neutral-200 bg-white p-4">
            {/* Shop Name */}
            {errors.shopName && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.shopName.message as string}</Text>}
            <Input placeholder="Enter shop name" control={control} name="shopName" errors={errors} />

            {/* Username */}
            <View className="mt-4">
              {errors.userName && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.userName.message as string}</Text>}
              <Input placeholder="Enter username" control={control} name="userName" errors={errors} />
            </View>

            {/* Phone Number */}
            <View className="mt-4">
              {errors.phoneNumber && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.phoneNumber.message as string}</Text>}
              <Input placeholder="Enter phone number" control={control} name="phoneNumber" errors={errors} keyboardType="phone-pad" />
            </View>

            {/* Shop Description */}
            <View className="mt-4">
              {errors.shopDescription && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.shopDescription.message as string}</Text>}
              <Input placeholder="Enter shop description" control={control} name="shopDescription" errors={errors} multiline />
            </View>
          </View>
        </View>

        {/* Categories */}
        <View className="px-4 mt-5">
          <Text className="text-[#181111] text-base font-bold mb-2">Product Categories</Text>

          <View className="rounded-2xl border border-neutral-200 bg-white p-3">
            <View className="flex-row flex-wrap gap-3">
              {selectedCategories.map((cat) => (
                <View key={cat.id.toString()} className="flex-row items-center bg-neutral-100 rounded-full px-3 py-1 border border-neutral-200">
                  <Text className="text-[#181111] text-xs font-medium mr-2">{cat.name}</Text>
                  <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                    <X size={14} color="#181111" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-[#e9242a] rounded-full px-4 py-2 justify-center items-center"
              >
                <Text className="text-white text-xs font-bold">+ Add Categories</Text>
              </TouchableOpacity>
            </View>

            {/* Tiny tip to “gamify” the task */}
            <View className="mt-3">
              <Text className="text-neutral-500 text-xs">Tip: Add 3+ categories to unlock better discovery </Text>
            </View>
          </View>
        </View>

        {/* Save / Next */}
        <View className="px-4 mt-6">
          <Button onPress={handleSubmit(handleSubmitForm)} disabled={!isValid} text="Next" />
        </View>

        {/* Modal */}
        <CategoryAddition
          visible={modalVisible}
          categories={categories}
          parentSelectedCategories={selectedCategories}
          onClose={() => setModalVisible(false)}
          onConfirm={(selected) => {
            setSelectedCategories(selected);
            setModalVisible(false);
            show({
              variant: "success",
              title: "Categories updated",
              message: `${selected.length} selected`,
            });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShopInformationScreen;
