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

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginScreen() {
  const router = useRouter();
  const { role, setRole, setUser } = useUser();
  const { setRegData } = useRegData();
  const { show } = useToast();

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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Panel */}
          <View className="w-full max-w-[480px] rounded-2xl bg-white border border-[#f0e9e7] px-5 py-6">
            {/* Header */}
            <View className="mb-4 items-center">
              <Text className="text-[#171212] text-[14px] opacity-60">Welcome back</Text>
              <Text className="text-[#171212] text-[24px] font-extrabold leading-tight">
                Sign in to your account
              </Text>
            </View>

            {/* Error banner */}
            {error ? (
              <View className="mb-4 rounded-xl bg-error-bg px-4 py-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View className="mb-4">
              <Text className="mb-1 text-[13px] text-text-secondary">Email</Text>
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
              <Text className="mb-1 text-[13px] text-text-secondary">Password</Text>
              <PasswordInput
                placeholder="Enter your password"
                control={control}
                name="password"
                errors={errors}
              />
            </View>

            {/* Forgot password */}
            <View className="items-end">
              <Link href="/forgotPassword">
                <Text className="text-[#826869] text-sm underline">Forgot Password?</Text>
              </Link>
            </View>

            {/* Role toggle */}
            <View className="mt-6">
              <Text className="mb-2 text-[13px] text-text-secondary">Continue as</Text>
              <View className="flex-row items-center rounded-full bg-bg-muted p-1">
                <TouchableOpacity
                  onPress={() => setRole("buyer")}
                  accessibilityRole="button"
                  accessibilityState={{ selected: role === "buyer" }}
                  className={`flex-1 rounded-button py-2.5 items-center ${role === "buyer" ? "bg-primary" : ""}`}
                >
                  <Text className={`font-medium ${role === "buyer" ? "text-white" : "text-text-primary"}`}>
                    Buyer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRole("seller")}
                  accessibilityRole="button"
                  accessibilityState={{ selected: role === "seller" }}
                  className={`flex-1 rounded-button py-2.5 items-center ${role === "seller" ? "bg-primary" : ""}`}
                >
                  <Text className={`font-medium ${role === "seller" ? "text-white" : "text-text-primary"}`}>
                    Seller
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <View className="mt-6">
              <Button
                onPress={handleSubmit(onsubmit)}
                disabled={!isValid || isLoading}
                loading={isLoading}
                text="Sign in"
              />
            </View>

            {/* Sign up */}
            <View className="mt-5 items-center">
              <Text
                className="text-[#171212] text-sm"
                onPress={() => router.navigate("/signup")}
              >
                Don’t have an account?{" "}
                <Text className="text-primary underline">Sign up</Text>
              </Text>
            </View>
          </View>

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
