import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { ArrowLeft, X, Camera, Check } from "lucide-react-native";
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
import { useTheme } from "../../components/themeProvider";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";
  const mutedIconColor = isDark ? "#c6c5cf" : "#A1A1AA";

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

    const removeCategory = (id: number) => {
    setSelectedCategories(prev => prev.filter(c => c.id !== id));
  };

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

  const Label = ({ children }: { children: React.ReactNode }) => (
    <Text className={`mb-2 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>{children}</Text>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#2f3132]" : "bg-white"}`}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between pb-8 pt-4 px-6">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className={`h-10 w-10 items-center justify-center rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
          >
            <ArrowLeft size={20} color={iconColor} />
          </TouchableOpacity>
          <Text className={`text-xl font-geist font-bold text-center flex-1 pr-10 ${isDark ? "text-[#f0f1f2]" : "text-[#000000]"}`}>
            Shop setup
          </Text>
        </View>

        {/* Progress hint */}
        <View className="flex-row gap-2 items-center justify-center mb-10 px-8">
          <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#f0f1f2]" : "bg-secondary"}`} />
          <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#f0f1f2]" : "bg-secondary"}`} />
          <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`} />
        </View>

        {/* Card */}
        <View className="mx-4">
          <View className={`rounded border px-6 py-8 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            {/* Avatar placeholder with image picker */}
            <View className="items-center mb-10">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={changeProfilePicture}
                className={`h-24 w-24 rounded border-2 border-dashed items-center justify-center overflow-hidden ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
              >
                {profilePictureUri ? (
                  <Image source={{ uri: profilePictureUri }} className="w-full h-full" />
                ) : (
                  <View className="items-center">
                    <Camera size={32} color={mutedIconColor} />
                    <Text className={`text-[10px] font-geist font-bold mt-1 text-center px-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>ADD SHOP LOGO</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Shop Name */}
            <View className="mb-6">
              <Label>Shop Name</Label>
              <Input placeholder="e.g. Vintage Market" control={control} name="shopName" errors={errors} />
            </View>

            {/* Username — debounced check */}
            <View className="mb-6">
              <Label>Shop Username</Label>
              <Input placeholder="markt_handle" control={control} name="userName" errors={errors} autoCapitalize="none" />
              <View className="mt-2 h-4">
                {usernameStatus === "taken" ? (
                  <Text className="text-xs text-error font-inter">{usernameMessage}</Text>
                ) : usernameStatus === "available" ? (
                  <View className="flex-row items-center gap-1">
                    <Check size={12} color="#178b1f" />
                    <Text className="text-xs text-success font-inter">Handle is available</Text>
                  </View>
                ) : usernameStatus === "checking" ? (
                  <Text className="text-xs text-tertiary font-inter italic">Checking...</Text>
                ) : null}
              </View>
            </View>

            {/* Phone Number */}
            <View className="mb-6">
              <Label>Contact Number</Label>
              <Input placeholder="+1 (555) 000-0000" control={control} name="phoneNumber" errors={errors} keyboardType="phone-pad" />
            </View>

            {/* Shop Description */}
            <View className="mb-10">
              <Label>Shop Description</Label>
              <Input placeholder="Tell us what you sell..." control={control} name="shopDescription" errors={errors} multiline />
            </View>

            {/* Categories */}
            <View className="mb-10">
              <Text className={`mb-4 text-sm font-geist font-bold uppercase tracking-widest ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Niches & Categories</Text>
              <View className="flex-row flex-wrap gap-3">
                {selectedCategories.map((cat) => (
                  <View key={cat.id.toString()} className={`flex-row items-center rounded px-4 py-2 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
                    <Text className={`text-xs font-geist font-bold mr-2 ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>{cat.name}</Text>
                    <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                      <X size={14} color={mutedIconColor} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  className={`border-2 border-dashed rounded px-4 py-2 justify-center items-center ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}
                >
                  <Text className={`text-xs font-geist font-bold ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>+ Add Categories</Text>
                </TouchableOpacity>
              </View>
              {selectedCategories.length < 3 && (
                <Text className={`text-[10px] font-inter mt-3 italic ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  Tip: Add 3+ categories for better visibility.
                </Text>
              )}
            </View>

            {/* Save / Next */}
            <Button 
              onPress={handleSubmit(handleSubmitForm)} 
              disabled={!isValid || usernameStatus === "taken" || usernameStatus === "checking"} 
              text="Next" 
              variant="conversion"
            />
          </View>
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
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShopInformationScreen;
