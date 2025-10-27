import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../hooks/userContextProvider";
import { AccountType } from "../../models/auth";
import { useRouter } from "expo-router";
import { register, useRegData } from "../../models/signupSteps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider"; // toaster

// --- Validation schema (fixed: standard refine; removed invalid 'when' option) ---
const schema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password is required and should be 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(8, "Please re-enter your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const { setRole, role } = useUser();
  const { regData, setRegData } = useRegData();
  const { show } = useToast(); // toast api

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  // ---- UI-only enhancements (don’t affect your data flow) ----
  const [showPwd, setShowPwd] = React.useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = React.useState(false);

  const setUserRole = (r: AccountType) => setRole(r);

  const onSubmit = async (data: FormValues) => {
    try {
      // Persist signup details
      setRegData(
        register(regData, {
          email: data.email,
          password: data.password,
          account_type: role || "buyer", // default Buyer if not set
        })
      );

      // Success toast
      show({
        variant: "success",
        title: "Account details saved",
        message: role === "seller" ? "Let’s set up your seller profile." : "Let’s set up your buyer profile.",
      });

      // Navigate to next step
      if (role === "seller") router.navigate("/userdetSeller");
      else router.navigate("/userdetBuyer");
      // router.navigate("/emailVerification"); // (use when flow is finalized)
    } catch (error: any) {
      // Error toast
      show({
        variant: "error",
        title: "Sign up failed",
        message: error?.message || "Please check your details and try again.",
      });
    }
  };

  // Segmented role pill
  const RoleToggle = () => (
    <View className="flex-row items-center rounded-full bg-[#f2efee] p-1">
      <TouchableOpacity
        onPress={() => setUserRole("buyer")}
        accessibilityRole="button"
        accessibilityState={{ selected: role === "buyer" }}
        activeOpacity={0.85}
        style={{ flex: 1 }}
        className={`py-2 rounded-full items-center ${
          role === "buyer" ? "bg-[#E94C2A]" : ""
        }`}
      >
        <Text className={role === "buyer" ? "text-white font-semibold" : "text-[#171212] font-medium"}>
          Buyer
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setUserRole("seller")}
        accessibilityRole="button"
        accessibilityState={{ selected: role === "seller" }}
        activeOpacity={0.85}
        style={{ flex: 1 }}
        className={`py-2 rounded-full items-center ${
          role === "seller" ? "bg-[#E94C2A]" : ""
        }`}
      >
        <Text className={role === "seller" ? "text-white font-semibold" : "text-[#171212] font-medium"}>
          Seller
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[480px]">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-2">
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="size-12 justify-center items-start"
              >
                <ArrowLeft color="#171212" size={24} />
              </TouchableOpacity>
              <Text className="text-[#171212] text-lg font-bold text-center pr-12 flex-1">Sign up</Text>
            </View>

            {/* Form */}
            <View className="rounded-2xl border border-[#efe9e7] bg-white px-5 py-6 mt-2">
              {/* Email */}
              <View className="mb-4">
                <Text className="mb-1 text-[13px] text-[#5f4f4f]">Email</Text>
                {errors.email ? (
                  <Text className="mb-1 text-xs text-[#E94C2A]">{errors.email.message as string}</Text>
                ) : null}
                <Input
                  placeholder="you@example.com"
                  control={control}
                  name="email"
                  errors={errors}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>

              {/* Password */}
              <View className="mb-4">
                <Text className="mb-1 text-[13px] text-[#5f4f4f]">Password</Text>
                {errors.password ? (
                  <Text className="mb-1 text-xs text-[#E94C2A]">{errors.password.message as string}</Text>
                ) : null}
                <Input
                  placeholder="Enter your password"
                  control={control}
                  name="password"
                  errors={errors}
                  secureTextEntry={!showPwd}
                  textContentType="password"
                />
                {/* Show/Hide toggle (kept outside Input to avoid changing your component’s API) */}
                <TouchableOpacity
                  onPress={() => setShowPwd((v) => !v)}
                  className="self-end mt-2 flex-row items-center"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {showPwd ? <EyeOff size={16} color="#876d64" /> : <Eye size={16} color="#876d64" />}
                  <Text className="ml-1 text-xs text-[#876d64]">{showPwd ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View className="mb-2">
                <Text className="mb-1 text-[13px] text-[#5f4f4f]">Confirm Password</Text>
                {errors.confirmPassword ? (
                  <Text className="mb-1 text-xs text-[#E94C2A]">
                    {errors.confirmPassword.message as string}
                  </Text>
                ) : null}
                <Input
                  placeholder="Re-enter your password"
                  control={control}
                  name="confirmPassword"
                  errors={errors}
                  secureTextEntry={!showConfirmPwd}
                  textContentType="password"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPwd((v) => !v)}
                  className="self-end mt-2 flex-row items-center"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {showConfirmPwd ? <EyeOff size={16} color="#876d64" /> : <Eye size={16} color="#876d64" />}
                  <Text className="ml-1 text-xs text-[#876d64]">{showConfirmPwd ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>

              {/* Role selection */}
              <View className="mt-6">
                <Text className="mb-2 text-[13px] text-[#5f4f4f]">Create account as</Text>
                <RoleToggle />
              </View>

              {/* CTA */}
              <View className="mt-6">
                <TouchableOpacity
                  className="w-full h-12 rounded-full justify-center items-center"
                  disabled={!isValid}
                  style={{
                    backgroundColor: isValid ? "#E94C2A" : "#f4f1f1",
                  }}
                  onPress={handleSubmit(onSubmit)}
                >
                  <Text
                    className="text-base font-bold tracking-[0.015em]"
                    style={{ color: isValid ? "#ffffff" : "#b0a7a7" }}
                  >
                    Sign up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Alt nav */}
              <View className="mt-5 items-center">
                <Text className="text-[#171212] text-sm" onPress={() => router.navigate("/login")}>
                  Already have an account? <Text className="text-[#E94C2A] underline">Log in</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* extra bottom space so the button never hugs the home indicator */}
          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
