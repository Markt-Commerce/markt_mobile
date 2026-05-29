import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { ArrowLeft, Image as ImageIcon, Check } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../hooks/userContextProvider";
import { checkUsername } from "../../services/sections/auth";
import { useRouter } from "expo-router";
import { SignupStepTwo, register, useRegData } from "../../models/signupSteps";
import Button from "../../components/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider";
import * as ImagePicker from "expo-image-picker";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useWatch } from "react-hook-form";
import { useTheme } from "../../components/themeProvider";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const schema = z.object({
  Buyername: z.string().min(1, "Name is required"),
  username: z.string().min(3, "At least 3 characters").max(20, "Max 20 characters").regex(USERNAME_REGEX, "Letters, numbers, underscores only"),
  phone_number: z.string().min(1, "Phone number is required"),
});

export default function UserInfoScreen() {
  const { setUser } = useUser();
  const { regData, setRegData } = useRegData();
  const router = useRouter();
  const { show } =  useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";
  const mutedIconColor = isDark ? "#c6c5cf" : "#A1A1AA";
  const [profilePictureUri, setProfilePictureUri] = React.useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = React.useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameMessage, setUsernameMessage] = React.useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const username = useWatch({ control, name: "username", defaultValue: "" });
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

  // Change this to the actual next screen in your flow if different
  const NEXT_ROUTE = "/emailVerification";

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
    const userData: SignupStepTwo = {
      buyer_data: {
        buyername: data.Buyername,
        shipping_address: {}, // will be collected in a later step
      },
      username: data.username,
      phone_number: data.phone_number,
    };

    // Merge step data into the registration payload
    const updatedRegData = register(regData, userData);
    delete updatedRegData.seller_data; // ensure we’re on the buyer path
    setRegData(updatedRegData);

    // send the user data to the backend here
    // may move this later to a another signup step
    try {
      //store user in secure store
      /* await SecureStore.setItemAsync('user', JSON.stringify({
        email: regData.email,
        password: regData.password,
        userType: regData.account_type,
      })); */
      show({
        variant: "success",
        title: "Registration Successful",
        message: "Well done! Your information has been saved.",
      })
      router.push("/locationdet");
    } catch (error) {
      show({
        variant: "error",
        title: "Registration Failed",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
  }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <Text className={`mb-2 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>{children}</Text>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#2f3132]" : "bg-white"}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[520px]">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-8 pt-4">
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className={`h-10 w-10 items-center justify-center rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
              >
                <ArrowLeft size={20} color={iconColor} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View className="mb-8">
              <Text className={`text-[32px] font-geist font-bold leading-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                Your{"\n"}profile
              </Text>
              <Text className={`font-inter text-base mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Let's get to know you better.
              </Text>
            </View>

            {/* Progress hint */}
            <View className="flex-row gap-2 items-center justify-center mb-10 px-2">
              <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#f0f1f2]" : "bg-secondary"}`} />
              <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`} />
              <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`} />
            </View>

            {/* Card */}
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
                      <ImageIcon size={32} color={mutedIconColor} />
                      <Text className={`text-[10px] font-geist font-bold mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>ADD PHOTO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View className="mb-6">
                <Label>Full Name</Label>
                <Input
                  placeholder="e.g. John Doe"
                  control={control}
                  name="Buyername"
                  errors={errors}
                  autoCapitalize="words"
                />
              </View>

              {/* Username — debounced check per REGISTRATION_LOGIN_API §2.2 */}
              <View className="mb-6">
                <Label>Username</Label>
                <Input
                  placeholder="choose_a_unique_id"
                  control={control}
                  name="username"
                  errors={errors}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View className="mt-2 h-4">
                  {usernameStatus === "taken" ? (
                    <Text className="text-xs text-error font-inter">{usernameMessage || "Username is already taken"}</Text>
                  ) : usernameStatus === "available" ? (
                    <View className="flex-row items-center gap-1">
                      <Check size={12} color="#178b1f" strokeWidth={3} />
                      <Text className="text-xs text-success font-inter">Username is available</Text>
                    </View>
                  ) : usernameStatus === "checking" ? (
                    <Text className={`text-xs font-inter italic ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Checking availability...</Text>
                  ) : (
                    <Text className={`text-xs font-inter ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>This will be your unique identifier.</Text>
                  )}
                </View>
              </View>

              {/* Phone Number */}
              <View className="mb-10">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  control={control}
                  name="phone_number"
                  errors={errors}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                />
              </View>

              {/* CTA — disable if username taken */}
              <Button
                onPress={handleSubmit(handleSubmitForm)}
                disabled={!isValid || usernameStatus === "taken" || usernameStatus === "checking"}
                text="Continue"
                variant="primary"
              />
            </View>

            {/* Bottom spacer */}
            <View className="h-10" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
