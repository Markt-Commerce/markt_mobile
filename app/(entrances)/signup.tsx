import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, PasswordInput } from "../../components/inputs";
import { useUser } from "../../hooks/userContextProvider";
import { AccountType } from "../../models/auth";
import { useRouter } from "expo-router";
import { register, useRegData } from "../../models/signupSteps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider";
import { useWatch } from "react-hook-form";
import { getPasswordStrength } from "../../utils/passwordStrength";

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
  const password = useWatch({ control, name: "password", defaultValue: "" });
  const strength = getPasswordStrength(password);
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
                <PasswordInput
                  placeholder="Min 8 chars, 1 digit, 1 upper, 1 lower"
                  control={control}
                  name="password"
                  errors={errors}
                />
                {/* Show/Hide toggle (kept outside Input to avoid changing your component’s API) */}
                <View className="flex-row gap-1 mt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className={`flex-1 h-1 rounded-full ${i < strength.level ? (strength.level <= 1 ? "bg-red-500" : strength.level <= 2 ? "bg-orange-500" : strength.level <= 3 ? "bg-yellow-500" : "bg-green-500") : "bg-[#e5dedc]"}`}
                    />
                  ))}
                </View>
                <View className="flex-row flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                  <Text className={`text-[11px] ${strength.checks.length ? "text-green-600" : "text-[#8e7a74]"}`}>{strength.checks.length ? "✓" : "○"} 8+ chars</Text>
                  <Text className={`text-[11px] ${strength.checks.digit ? "text-green-600" : "text-[#8e7a74]"}`}>{strength.checks.digit ? "✓" : "○"} 1 digit</Text>
                  <Text className={`text-[11px] ${strength.checks.lowercase ? "text-green-600" : "text-[#8e7a74]"}`}>{strength.checks.lowercase ? "✓" : "○"} 1 lower</Text>
                  <Text className={`text-[11px] ${strength.checks.uppercase ? "text-green-600" : "text-[#8e7a74]"}`}>{strength.checks.uppercase ? "✓" : "○"} 1 upper</Text>
                </View>
              </View>

              {/* Confirm Password */}
              <View className="mb-2">
                <Text className="mb-1 text-[13px] text-[#5f4f4f]">Confirm Password</Text>
                {errors.confirmPassword ? (
                  <Text className="mb-1 text-xs text-[#E94C2A]">
                    {errors.confirmPassword.message as string}
                  </Text>
                ) : null}
                <PasswordInput
                  placeholder="Re-enter your password"
                  control={control}
                  name="confirmPassword"
                  errors={errors}
                />
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
