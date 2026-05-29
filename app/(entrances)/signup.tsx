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
import Button from "../../components/button";
import { Check, Circle } from "lucide-react-native";
import { useTheme } from "../../components/themeProvider";

// --- Validation schema ---
const schema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        "Must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string().min(8, "Please confirm your password"),
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
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";
  const mutedIconColor = isDark ? "#c6c5cf" : "#A1A1AA";

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });
  const strength = getPasswordStrength(password);
  const setUserRole = (r: AccountType) => setRole(r);

  const onSubmit = async (data: FormValues) => {
    try {
      setRegData(
        register(regData, {
          email: data.email,
          password: data.password,
          account_type: role || "buyer",
        })
      );

      show({
        variant: "success",
        title: "Account details saved",
        message: role === "seller" ? "Let’s set up your seller profile." : "Let’s set up your buyer profile.",
      });

      if (role === "seller") router.navigate("/userdetSeller");
      else router.navigate("/userdetBuyer");
    } catch (error: any) {
      show({
        variant: "error",
        title: "Sign up failed",
        message: "Please check your details and try again.",
      });
    }
  };

  const RoleToggle = () => (
    <View className={`flex-row items-center rounded p-1 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
      <TouchableOpacity
        onPress={() => setUserRole("buyer")}
        className={`flex-1 py-2.5 rounded items-center ${
          role === "buyer" ? "bg-primary shadow-sm" : ""
        }`}
      >
        <Text className={`font-geist font-bold text-sm ${role === "buyer" ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
          Buyer
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setUserRole("seller")}
        className={`flex-1 py-2.5 rounded items-center ${
          role === "seller" ? "bg-primary shadow-sm" : ""
        }`}
      >
        <Text className={`font-geist font-bold text-sm ${role === "seller" ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
          Seller
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#2f3132]" : "bg-white"}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-4 pb-8">
            {/* Header */}
            <View className="flex-row items-center mb-8">
              <TouchableOpacity
                onPress={() => router.back()}
                className={`h-10 w-10 items-center justify-center rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color={iconColor} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View className="mb-8">
              <Text className={`text-[32px] font-geist font-bold leading-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                Create{"\n"}account
              </Text>
              <Text className={`font-inter text-base mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Join Markt to start shopping or selling.
              </Text>
            </View>

            {/* Panel */}
            <View className={`rounded border px-5 py-8 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
              {/* Role selection */}
              <View className="mb-8">
                <Text className={`mb-3 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>I want to be a</Text>
                <RoleToggle />
              </View>

              {/* Email */}
              <View className="mb-6">
                <Text className={`mb-2 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Email Address</Text>
                <Input
                  placeholder="you@example.com"
                  control={control}
                  name="email"
                  errors={errors}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className={`mb-2 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Password</Text>
                <PasswordInput
                  placeholder="Min. 8 characters"
                  control={control}
                  name="password"
                  errors={errors}
                />

                {/* Strength Indicator */}
                <View className="flex-row gap-1 mt-3">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className={`flex-1 h-1 rounded ${
                        i < strength.level
                          ? strength.level <= 1
                            ? "bg-error"
                            : strength.level <= 2
                              ? "bg-tertiary"
                              : strength.level <= 3
                                ? "bg-secondary"
                                : "bg-success"
                          : isDark ? "bg-[#2f3132]" : "bg-surface"
                      }`}
                    />
                  ))}
                </View>
                <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-2">
                  <View className="flex-row items-center gap-1">
                    {strength.checks.length ? <Check size={12} color="#178b1f" /> : <Circle size={12} color={mutedIconColor} />}
                    <Text className={`text-[11px] font-inter ${strength.checks.length ? "text-success" : "text-tertiary"}`}>
                      8+ chars
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {strength.checks.digit ? <Check size={12} color="#178b1f" /> : <Circle size={12} color={mutedIconColor} />}
                    <Text className={`text-[11px] font-inter ${strength.checks.digit ? "text-success" : "text-tertiary"}`}>
                      1 digit
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {strength.checks.lowercase ? <Check size={12} color="#178b1f" /> : <Circle size={12} color={mutedIconColor} />}
                    <Text className={`text-[11px] font-inter ${strength.checks.lowercase ? "text-success" : "text-tertiary"}`}>
                      1 lower
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {strength.checks.uppercase ? <Check size={12} color="#178b1f" /> : <Circle size={12} color={mutedIconColor} />}
                    <Text className={`text-[11px] font-inter ${strength.checks.uppercase ? "text-success" : "text-tertiary"}`}>
                      1 upper
                    </Text>
                  </View>
                </View>
              </View>

              {/* Confirm Password */}
              <View className="mb-8">
                <Text className={`mb-2 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Confirm Password</Text>
                <PasswordInput
                  placeholder="Repeat password"
                  control={control}
                  name="confirmPassword"
                  errors={errors}
                />
              </View>

              {/* CTA */}
              <Button
                text="Next"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid}
                variant="primary"
              />

              {/* Alt nav */}
              <TouchableOpacity 
                onPress={() => router.push("/login")}
                className="mt-8 items-center"
              >
                <Text className={`font-inter text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  Already have an account? <Text className={`font-geist font-bold underline ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
