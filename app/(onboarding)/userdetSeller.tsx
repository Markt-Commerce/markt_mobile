import React from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardOverlap, keyboardScrollPadding } from '../../hooks/useKeyboardOverlap';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowLeft, X, Camera, Check } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "../../hooks/userContextProvider";
import { updateUserProfile, updateSellerProfile } from "../../services/sections/profile";
import { uploadProfilePicture } from "../../services/sections/auth";
import { logger } from "../../utils/logger";
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
import { useTokens } from "../../theme/useTokens";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import StepProgress from "../../components/auth/StepProgress";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const schema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  userName: z.string().min(3, "At least 3 characters").max(20, "Max 20 characters").regex(USERNAME_REGEX, "Letters, numbers, underscores only"),
  shopDescription: z.string().min(1, "Shop description is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

const ShopInformationScreen = () => {
  const { setUser, refreshProfile } = useUser();
  const router = useRouter();
  const { show } = useToast(); // <-- toast API
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const iconColor = t.textPrimary;
  const mutedIconColor = t.textSecondary;

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [profilePictureUri, setProfilePictureUri] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
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

  /**
   * Saves to the account, which exists by the time this screen opens.
   *
   * Previously this merged into an in-memory context POSTed on the location
   * screen, so a shop's whole description could be lost to a backgrounded app.
   */
  const handleSubmitForm = async (data: z.infer<typeof schema>) => {
    if (saving) return;
    setSaving(true);
    try {
      // The handle first: it is the one the server can refuse, and being told
      // "that's taken" after the shop has saved is worse than before it.
      if (data.userName) {
        await updateUserProfile({
          username: data.userName,
          phone_number: data.phoneNumber,
        });
      }
      await updateSellerProfile({
        shop_name: data.shopName,
        description: data.shopDescription,
        category_ids: selectedCategories.map((c) => c.id),
      });

      if (profilePictureUri) {
        try {
          await uploadProfilePicture(profilePictureUri, "profile.jpg");
        } catch (e) {
          logger.warn("signup: could not upload profile picture", e);
        }
      }

      // Pull everything just saved into context, for everyone — not only the
      // people who added a photo.
      //
      // This used to sit inside the `if (profilePictureUri)` branch, so
      // skipping the photo meant nothing told the app about the name,
      // username or phone number it had just written. The tabs rendered the
      // profile as it was before the form, and the only way to see your own
      // details was to sign out and back in.
      await refreshProfile();

      show({
        variant: "success",
        title: "Shop saved",
        message: "Now, where is your shop?",
      });
      router.push("/locationdet");
    } catch (error: any) {
      const taken = error?.status === 409;
      show({
        variant: "error",
        title: taken ? "That username is taken" : "Could not save your shop",
        message: taken
          ? "Pick another one and try again."
          : friendlyErrorMessage(
              error,
              "Could not save your shop details. Please review them and try again."
            ),
      });
    } finally {
      setSaving(false);
    }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <Text className="mb-2 text-sm font-bold text-text-primary">{children}</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        className="flex-1"
          // Measured, and the screen lifts with the keyboard: these forms
          // are taller than the screen, so the last fields were simply behind
          // it with nowhere to scroll to.
        contentContainerStyle={{
          paddingBottom: keyboardScrollPadding(keyboardOverlap, insets.bottom, 32),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between pb-4 pt-2 px-4">
          {/* The step before this one is verification, which a verified
              account cannot re-enter — it would only 400 with "already
              verified". Shown only when there is somewhere real to go. */}
          {router.canGoBack() ? (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="h-10 w-10 items-center justify-center rounded border bg-surface-sunken border-border"
            >
              <ArrowLeft size={20} color={iconColor} />
            </TouchableOpacity>
          ) : (
            <View className="h-10 w-10" />
          )}
          <Text className="text-xl font-bold text-center flex-1 pr-10 text-text-primary">
            Shop setup
          </Text>
        </View>

        <StepProgress step={1} total={2} label="About your shop" className="mx-4 mb-6" />

        {/* Card */}
        <View className="mx-4">
          <View>
            {/* Avatar placeholder with image picker */}
            <View className="items-center mb-8">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={changeProfilePicture}
                className="h-24 w-24 rounded-full border items-center justify-center overflow-hidden bg-surface-sunken border-border"
              >
                {profilePictureUri ? (
                  <Image source={{ uri: profilePictureUri }} className="w-full h-full" />
                ) : (
                  <View className="items-center">
                    <Camera size={32} color={mutedIconColor} />
                    <Text className="text-[10px] font-bold mt-1 text-center px-2 text-text-secondary">ADD SHOP LOGO</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Shop Name */}
            <View className="mb-6">
              <Label>Shop Name</Label>
              <Input placeholder="e.g. Amaka Fabrics" control={control} name="shopName" errors={errors} />
            </View>

            {/* Username — debounced check */}
            <View className="mb-6">
              <Label>Shop Username</Label>
              <Input placeholder="amaka_fabrics" control={control} name="userName" errors={errors} autoCapitalize="none" />
              <View className="mt-2 h-4">
                {usernameStatus === "taken" ? (
                  <Text className="text-xs text-danger-text ">{usernameMessage}</Text>
                ) : usernameStatus === "available" ? (
                  <View className="flex-row items-center gap-1">
                    <Check size={12} color={t.successText} />
                    <Text className="text-xs text-success ">Handle is available</Text>
                  </View>
                ) : usernameStatus === "checking" ? (
                  <Text className="text-xs text-text-muted italic">Checking...</Text>
                ) : null}
              </View>
            </View>

            {/* Phone Number */}
            <View className="mb-6">
              <Label>Contact Number</Label>
              <Input placeholder="0801 234 5678" control={control} name="phoneNumber" errors={errors} keyboardType="phone-pad" />
            </View>

            {/* Shop Description */}
            <View className="mb-10">
              <Label>Shop Description</Label>
              <Input placeholder="e.g. Ankara, lace and aso-oke, cut to order." control={control} name="shopDescription" errors={errors} multiline />
            </View>

            {/* Categories */}
            <View className="mb-10">
              <Text className="mb-2 text-[13px] font-semibold text-text-secondary">What do you sell?</Text>
              <View className="flex-row flex-wrap gap-3">
                {selectedCategories.map((cat) => (
                  <View key={cat.id.toString()} className="flex-row items-center rounded px-4 py-2 border bg-surface-sunken border-border">
                    <Text className="text-xs font-bold mr-2 text-text-primary">{cat.name}</Text>
                    <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                      <X size={14} color={mutedIconColor} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  className="border-2 border-dashed rounded px-4 py-2 justify-center items-center bg-surface-raised border-border"
                >
                  <Text className="text-xs font-bold text-text-secondary">+ Add Categories</Text>
                </TouchableOpacity>
              </View>
              {selectedCategories.length < 3 && (
                <Text className="text-[10px] mt-3 italic text-text-secondary">
                  Tip: Add 3+ categories for better visibility.
                </Text>
              )}
            </View>

            {/* Save / Next */}
            <Button 
              onPress={handleSubmit(handleSubmitForm)} 
              disabled={!isValid || saving || usernameStatus === "taken" || usernameStatus === "checking"}
              loading={saving} 
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ShopInformationScreen;
