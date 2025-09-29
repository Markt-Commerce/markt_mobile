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
import { Input } from "../../components/inputs";
import Button from "../../components/button";
import { SafeAreaView } from "react-native-safe-area-context";
//import * as SecureStore from 'expo-secure-store';
import { useRegData } from "../../models/signupSteps";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginScreen() {
  const router = useRouter();
  const { role, setRole, setUser } = useUser();
  const { setRegData } = useRegData();

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
      setUser({
        email: userData.email.toLowerCase(),
        account_type: userData.account_type,
      });
      router.push("/");
    }
    catch (error) {
      //console.error("Login failed:", error);
      setError("Login failed." + (error instanceof Error ? ` ${error.message}` : ""));
      console.log("Error type:", typeof error);
      if (typeof error === "object" && error !== null && 'message' in error && typeof error.message === 'string') {
        if (error.message.toLowerCase().includes("verify") && error.message.toLowerCase().includes("email")) {
          //set regData with email and password
          //this is not a very clean way of doing this but it works for now
          //todo: I would talk to the backend team to see if we can get a code to determine the error type
          //additionally I would set another state that could be used by email verification page to determine if the user just registered or is coming from login
          setRegData({
            email: data.email,
            password: data.password,
            account_type: role || "buyer",
            username: "",
            phone_number: "",
          });
          //navigate to email verification page
          router.push("/emailVerification");
          return;
        }
      }
      //work on adding cleanup for failed login attempts
      //SecureStore.deleteItemAsync('user');
      setUser(null);
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
              <Text className="text-[#171212] text-[14px] opacity-60">
                Welcome back
              </Text>
              <Text className="text-[#171212] text-[24px] font-extrabold leading-tight">
                Sign in to your account
              </Text>
            </View>

            {/* Error banner */}
            {error ? (
              <View className="mb-4 rounded-xl bg-[#ffe8e9] px-3 py-3">
                <Text className="text-[#b0161a] text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View className="mb-4">
              <Text className="mb-1 text-[13px] text-[#5f4f4f]">Email</Text>
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
              {errors.email ? (
                <Text className="mt-1 text-xs text-[#e9242a]">
                  {errors.email.message as string}
                </Text>
              ) : null}
            </View>

            {/* Password */}
            <View className="mb-2">
              <Text className="mb-1 text-[13px] text-[#5f4f4f]">Password</Text>
              <Input
                placeholder="Enter your password"
                control={control}
                name="password"
                errors={errors}
                secureTextEntry
                textContentType="password"
              />
              {errors.password ? (
                <Text className="mt-1 text-xs text-[#e9242a]">
                  {errors.password.message as string}
                </Text>
              ) : null}
            </View>

            {/* Forgot password */}
            <View className="items-end">
              <Link href="/forgotPassword">
                <Text className="text-[#826869] text-sm underline">
                  Forgot Password?
                </Text>
              </Link>
            </View>

            {/* Role toggle */}
            <View className="mt-6">
              <Text className="mb-2 text-[13px] text-[#5f4f4f]">Continue as</Text>
              <View className="flex-row items-center rounded-full bg-[#f2efee] p-1">
                <TouchableOpacity
                  onPress={() => setRole("buyer")}
                  accessibilityRole="button"
                  accessibilityState={{ selected: role === "buyer" }}
                  style={{
                    flex: 1,
                    backgroundColor: role === "buyer" ? "#E94C2A" : "transparent",
                    borderRadius: 999,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: role === "buyer" ? "#fff" : "#171212",
                      fontWeight: role === "buyer" ? "700" : "500",
                    }}
                  >
                    Buyer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRole("seller")}
                  accessibilityRole="button"
                  accessibilityState={{ selected: role === "seller" }}
                  style={{
                    flex: 1,
                    backgroundColor: role === "seller" ? "#E94C2A" : "transparent",
                    borderRadius: 999,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: role === "seller" ? "#fff" : "#171212",
                      fontWeight: role === "seller" ? "700" : "500",
                    }}
                  >
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
                text={isLoading ? "Signing in..." : "Login"}
              />
            </View>

            {/* Sign up */}
            <View className="mt-5 items-center">
              <Text
                className="text-[#171212] text-sm"
                onPress={() => router.navigate("/signup")}
              >
                Don’t have an account?{" "}
                <Text className="text-[#E94C2A] underline">Sign up</Text>
              </Text>
            </View>
          </View>

          {/* Small bottom spacer so the centered panel never kisses the home indicator */}
          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
