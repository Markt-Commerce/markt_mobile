import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ArrowLeft, Image as ImageIcon } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../hooks/userContextProvider";
// import { registerUser } from "../../services/sections/auth"; // <-- keep this import when you’re ready to call the API
import { useRouter } from "expo-router";
import { SignupStepTwo, register, useRegData } from "../../models/signupSteps";
import Button from "../../components/button";
import { SafeAreaView } from "react-native-safe-area-context";

const schema = z.object({
  Buyername: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  phone_number: z.string().min(1, "Phone number is required"),
});

export default function UserInfoScreen() {
  const { setUser } = useUser();
  const { regData, setRegData } = useRegData();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  // Change this to the actual next screen in your flow if different
  const NEXT_ROUTE = "/emailVerification";

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

    console.log("Submitting user data:", regData);
    try {
      const userRegResult = await registerUser(regData)
      //store user in secure store
      /* await SecureStore.setItemAsync('user', JSON.stringify({
        email: regData.email,
        password: regData.password,
        userType: regData.account_type,
      })); */
      setUser({
        email: userRegResult.email.toLowerCase(),
        account_type: userRegResult.account_type,
      }); //store user data in context
      console.log("Registration successful:", userRegResult);
      router.push("/emailVerification");
    } catch (error) {
        console.error("Registration failed:", error);
    }
  }

    // ─────────────────────────────────────────────────────────────────────────
    // REAL API (commented until your backend step is ready)
    // Tiny logic note: send `updatedRegData` (fresh) instead of stale `regData`.
    //
    // try {
    //   const userRegResult = await registerUser(updatedRegData);
    //   setUser({
    //     email: userRegResult.email.toLowerCase(),
    //     account_type: userRegResult.account_type,
    //   });
    //   // If you prefer to navigate only after success, move `router.push(NEXT_ROUTE)` here.
    // } catch (error) {
    //   console.error("Registration failed:", error);
    //   // Optionally show a toast and keep the user on this page to correct inputs.
    // }
    // ─────────────────────────────────────────────────────────────────────────
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <Text className="mb-1 text-[13px] text-[#5f4f4f]">{children}</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
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
            <View className="flex-row items-center justify-between pb-2">
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="size-12 justify-center items-start"
              >
                <ArrowLeft size={24} color="#181111" />
              </TouchableOpacity>
              <Text className="text-[#181111] text-lg font-bold text-center flex-1 pr-12">
                Your info
              </Text>
            </View>

            {/* Progress hint */}
            <View className="flex-row gap-1 items-center justify-center mb-2 px-2">
              <View className="h-1.5 flex-1 rounded-full bg-[#E94C2A]" />
              <View className="h-1.5 flex-1 rounded-full bg-[#f0e9e7]" />
              <View className="h-1.5 flex-1 rounded-full bg-[#f0e9e7]" />
            </View>

            {/* Card */}
            <View className="rounded-2xl border border-[#efe9e7] bg-white px-5 py-6">
              {/* Avatar placeholder (UI only) */}
              <View className="items-end mb-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="flex-row items-center gap-2 rounded-full border border-[#e5dedc] bg-white px-3 h-9"
                >
                  <ImageIcon size={16} color="#876d64" />
                  <Text className="text-[#171311] text-xs font-medium">
                    Add profile photo
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View className="mb-4">
                <Label>Name</Label>
                {errors.Buyername ? (
                  <Text className="mb-1 text-xs text-[#e9242a]">
                    {errors.Buyername.message as string}
                  </Text>
                ) : null}
                <Input
                  placeholder="Full name"
                  control={control}
                  name="Buyername"
                  errors={errors}
                  autoCapitalize="words"
                />
              </View>

              {/* Username */}
              <View className="mb-4">
                <Label>Username</Label>
                {errors.username ? (
                  <Text className="mb-1 text-xs text-[#e9242a]">
                    {errors.username.message as string}
                  </Text>
                ) : (
                  <Text className="mb-1 text-xs text-[#8e7a74]">
                    This will be visible to other users.
                  </Text>
                )}
                <Input
                  placeholder="Enter username"
                  control={control}
                  name="username"
                  errors={errors}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Phone Number */}
              <View className="mb-1">
                <Label>Phone number</Label>
                {errors.phone_number ? (
                  <Text className="mb-1 text-xs text-[#e9242a]">
                    {errors.phone_number.message as string}
                  </Text>
                ) : (
                  <Text className="mb-1 text-xs text-[#8e7a74]">
                    We’ll use this for order updates.
                  </Text>
                )}
                <Input
                  placeholder="Enter phone number"
                  control={control}
                  name="phone_number"
                  errors={errors}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                />
              </View>

              {/* CTA */}
              <View className="mt-6">
                <Button
                  onPress={handleSubmit(handleSubmitForm)}
                  disabled={!isValid}
                  text="Next"
                />
              </View>
            </View>

            {/* Bottom spacer */}
            <View className="h-6" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
