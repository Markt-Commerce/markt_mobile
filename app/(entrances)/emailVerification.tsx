// app/emailVerification.tsx (or your chosen route path)
import React from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../hooks/userContextProvider";
import { useRegData } from "../../models/signupSteps";
import { sendVerificationEmail, verifyEmail } from "../../services/sections/auth";
import { register,useRegData } from "../../models/signupSteps";
import React from "react";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../components/inputs";
const EmailVerification = () => {

  const router = useRouter();
  const { setUser } = useUser();
  const { regData } = useRegData();

  const [code, setCode] = React.useState("");

  const schema = z.object({
    code: z.string().min(6, "Verification code must be 6 characters long").max(6, "Verification code must be 6 characters long"),
  });

  type FormData = z.infer<typeof schema>;

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  const handleSendVerificationCode = async () => {
    try {
      if (!regData?.email) {
        console.error("User email is not available.");
        return;
      }
      await sendVerificationEmail(regData.email);
      setVerificationCodeSent(true);
    } catch (error) {
      console.error("Failed to send verification code:", error);
    }
  };

  const handleSubmitCode = (data: FormData) => {
    // Handle code submission and verification here
    try{
      if (!regData?.email) {
        console.error("User email is not available.");
        return;
      }
      const verificationResult = verifyEmail(regData.email, data.code);
      if(!verificationResult) throw new Error("Verification failed");
      console.log("Email verified successfully:", verificationResult);
      router.replace("/"); // Navigate to home or another appropriate screen after verification
    }
    catch(error){
      console.error("Email verification failed:", error);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View className="flex-row items-center p-4 pb-2 justify-between">
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={24} color="#171311" />
          </TouchableOpacity>
          <Text className="flex-1 text-center pr-12 text-lg font-bold text-[#171311]">Verify Email</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full max-w-[420px] rounded-2xl border border-[#efe9e7] bg-white px-5 py-6">
            <Text className="text-base text-[#171311] font-semibold">Enter 4-digit code</Text>
            <Text className="text-xs text-[#8e7a74] mt-1">
              We sent a code to {regData?.email || "your email"}.
            </Text>

            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              className="mt-4 text-center text-[28px] tracking-[12px] h-14 rounded-xl bg-[#f5f2f1] text-[#171311]"
              placeholder="••••"
              placeholderTextColor="#b8aca8"
            />

            <TouchableOpacity
              disabled={!canContinue}
              onPress={handleVerify}
              className="mt-6 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: canContinue ? "#E94C2A" : "#f0e9e7" }}
              activeOpacity={0.9}
            >
              <Text className="text-base font-bold" style={{ color: canContinue ? "#fff" : "#9a8a85" }}>
                Continue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {/* resend handler later */}}
              className="mt-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-sm text-[#E94C2A] underline">Resend code</Text>
          </>
        ) : (
          <>
            <Text className="text-[#171212] text-[28px] font-bold leading-tight text-center pb-3 pt-5">
              Verification Code Sent
            </Text>
            <Text className="text-[#171212] text-base text-center pb-6">
              A verification code has been sent to your email address. Please
              check your inbox and enter the code below.
            </Text>
            <Input placeholder="Verification Code" control={control} name="code" errors={errors} />
            {errors.code && <Text className="text-[#e9242a] text-sm font-normal">{errors.code.message}</Text>}
            <TouchableOpacity
              className="bg-[#e9242a] rounded-full px-5 py-3"
              onPress={handleSubmit(handleSubmitCode)}
            >
              <Text className="text-white text-base font-bold">
                Submit Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-6" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
