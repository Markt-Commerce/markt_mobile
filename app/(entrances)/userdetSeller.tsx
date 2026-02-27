import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { ArrowLeft, X, Camera } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "../../hooks/userContextProvider";
import { SignupStepTwo, register, useRegData } from "../../models/signupSteps";
import { getAllCategories } from "../../services/sections/categories";
import { Category } from "../../models/categories";
import { useRouter } from "expo-router";
import { CategoryAddition } from "../../components/categoryAddition";
import { checkUsername } from "../../services/sections/auth";
import { Input } from "../../components/inputs";
import Button from "../../components/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider";
import * as ImagePicker from "expo-image-picker";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useWatch } from "react-hook-form"; 

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const schema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  userName: z.string().min(3, "At least 3 characters").max(20, "Max 20 characters").regex(USERNAME_REGEX, "Letters, numbers, underscores only"),
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
  const [profilePictureUri, setProfilePictureUri] = React.useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = React.useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameMessage, setUsernameMessage] = React.useState("");

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const username = useWatch({ control, name: "userName", defaultValue: "" });
  const checkUsernameDebounced = useDebouncedCallback(async (value: string) => {
    if (value.length < 3 || !USERNAME_REGEX.test(value)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await checkUsername(value);
      setUsernameStatus(res.available ? "available" : "taken");
      setUsernameMessage(res.message ?? "");
    } catch {
      setUsernameStatus("idle");
    }
  }, 500);

  React.useEffect(() => {
    checkUsernameDebounced(username);
  }, [username]);

  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await getAllCategories();
        setCategories(cats);
      } catch (error: any) {
        show({
          variant: "error",
          title: "Could not load categories",
          message: "Please check your connection and try again.",
        });
      }
    }
    fetchCategories();
  }, [show]);

  const changeProfilePicture = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePictureUri(uri); // Store local URI in state
    }
  };

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
    
    // Store local image URI if selected (will be uploaded in locationdet)
    if (profilePictureUri) {
      (updatedRegData as any).profile_picture_local = profilePictureUri;
    }
    
    setRegData(updatedRegData);

    try {
      show({
        variant: "success",
        title: "Shop details saved",
        message: "Well done! Your shop information has been saved.",
      });

      router.push("/locationdet");
    } catch (error: any) {
      show({
        variant: "error",
        title: "Could not complete signup",
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

        {/* Profile Picture Picker */}
        <View className="px-4 pt-4">
          <TouchableOpacity className="flex-row items-center mb-4" onPress={changeProfilePicture}>
            {profilePictureUri ? (
              <Image source={{ uri: profilePictureUri }} className="w-12 h-12 rounded-full mr-2" />
            ) : (
              <Camera size={20} color="#181111" className="mr-2" />
            )}
            <Text className="text-[#181111]">{profilePictureUri ? "Change profile photo" : "Add profile photo (optional)"}</Text>
          </TouchableOpacity>
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

            {/* Username — debounced check */}
            <View className="mt-4">
              {errors.userName && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.userName.message as string}</Text>}
              {usernameStatus === "taken" && !errors.userName && <Text className="text-[#e9242a] text-xs font-medium mb-1">{usernameMessage}</Text>}
              {usernameStatus === "available" && <Text className="text-green-600 text-xs font-medium mb-1">✓ Available</Text>}
              {usernameStatus === "checking" && <Text className="text-[#8e7a74] text-xs mb-1">Checking…</Text>}
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
          <Button onPress={handleSubmit(handleSubmitForm)} disabled={!isValid || usernameStatus === "taken" || usernameStatus === "checking"} text="Next" />
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
