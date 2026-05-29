import React from "react";
import { useRouter, Link } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser } from "../../services/sections/auth";
import { useUser } from "../../hooks/userContextProvider";
import { Input, PasswordInput } from "../../components/inputs";
import Button from "../../components/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegData } from "../../models/signupSteps";
import { useToast } from "../../components/ToastProvider";
import { navigateToAppHome } from "../../utils/authNavigation"; 
import { useTheme } from "../../components/themeProvider";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginScreen() {
  const router = useRouter();
  const { role, setRole, setUser } = useUser();
  const { setRegData } = useRegData();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onsubmit = async (data: z.infer<typeof schema>) => {
    try {
      setIsLoading(true);
      const userData = await loginUser({
        email: data.email,
        password: data.password,
        account_type: role || "buyer",
      });

      setError(null);
      const accountType = (userData.current_role ?? userData.account_type) as "buyer" | "seller";
      setUser({
        email: userData.email.toLowerCase(),
        account_type: accountType,
        user_id: userData.id,
      });
      setRole(accountType);

      show({
        variant: "success",
        title: "Welcome back",
        message: `Signed in as ${userData.email.toLowerCase()}`,
      });

      navigateToAppHome();
    } catch (error: any) {
      const errMsg =
        typeof error === "object" && error?.message
          ? String(error.message)
          : "Please try again.";

      // If backend asks for email verification, route + info toast
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as any).message === "string" &&
        (error as any).message.toLowerCase().includes("verify") &&
        (error as any).message.toLowerCase().includes("email")
      ) {
        setRegData({
          email: data.email,
          password: data.password,
          account_type: role || "buyer",
          username: "",
          phone_number: "",
        });

        show({
          variant: "info",
          title: "Verify your email",
          message: "We need to verify your email before you can sign in.",
        });

        router.push("/emailVerification");
        return;
      }

      setError("Login failed. " + errMsg);
      setUser(null);

      show({
        variant: "error",
        title: "Login failed",
        message: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#2f3132]" : "bg-white"}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
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
                Welcome{"\n"}back
              </Text>
              <Text className={`font-inter text-base mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Sign in to continue your journey.
              </Text>
            </View>

            {/* Panel */}
            <View className={`rounded border px-5 py-8 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
              {/* Error banner */}
              {error ? (
                <View className="mb-6 rounded bg-error-bg px-4 py-3 border border-error/10">
                  <Text className="font-inter text-error text-sm">{error}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View className="mb-6">
                <Text className={`mb-2 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Email Address</Text>
                <Input
                  placeholder="Enter your email"
                  control={control}
                  name="email"
                  errors={errors}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>

              {/* Password — eye toggle */}
              <View className="mb-2">
                <Text className={`mb-2 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Password</Text>
                <PasswordInput
                  placeholder="Enter your password"
                  control={control}
                  name="password"
                  errors={errors}
                />
              </View>

              {/* Forgot password */}
              <View className="items-end mb-8">
                <Link href="/forgotPassword">
                  <Text className={`font-inter text-sm underline ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Forgot Password?</Text>
                </Link>
              </View>

              {/* Role toggle */}
              <View className="mb-10">
                <Text className={`mb-3 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Continue as</Text>
                <View className={`flex-row items-center rounded p-1 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
                  <TouchableOpacity
                    onPress={() => setRole("buyer")}
                    accessibilityRole="button"
                    accessibilityState={{ selected: role === "buyer" }}
                    className={`flex-1 rounded py-2.5 items-center ${role === "buyer" ? "bg-primary shadow-sm" : ""}`}
                  >
                    <Text className={`font-geist font-bold text-sm ${role === "buyer" ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                      Buyer
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRole("seller")}
                    accessibilityRole="button"
                    accessibilityState={{ selected: role === "seller" }}
                    className={`flex-1 rounded py-2.5 items-center ${role === "seller" ? "bg-primary shadow-sm" : ""}`}
                  >
                    <Text className={`font-geist font-bold text-sm ${role === "seller" ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                      Seller
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit */}
              <Button
                onPress={handleSubmit(onsubmit)}
                disabled={!isValid || isLoading}
                loading={isLoading}
                text="Sign in"
                variant="conversion"
              />

              {/* Sign up */}
              <View className="mt-8 items-center">
                <Text
                  className={`font-inter text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
                >
                  Don’t have an account?{" "}
                  <Text 
                    className={`font-geist font-bold underline ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}
                    onPress={() => router.navigate("/signup")}
                  >
                    Sign up
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
