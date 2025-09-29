import { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../hooks/userContextProvider";
import { sendVerificationEmail, verifyEmail } from "../../services/sections/auth";
import { register,useRegData } from "../../models/signupSteps";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../components/inputs";


const EmailVerification = () => {
  
  const router = useRouter();
  const { regData, setRegData } = useRegData();

  const [verificationCodeSent, setVerificationCodeSent] = useState(false);

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
      router.push("/"); // Navigate to home or another appropriate screen after verification
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
    <View className="flex-1 bg-white px-4">
      {/* Header */}
      <View className="flex flex-row items-center bg-white p-4 pb-2 justify-between">
        <ArrowLeft color="#181111" size={24} onPress={() => router.back()} />
        <Text className="text-[#181111] text-lg font-bold text-center flex-1 pr-12">
          Email Verification
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center">
        {!verificationCodeSent ? (
          <>
            <Text className="text-[#171212] text-[28px] font-bold leading-tight text-center pb-3 pt-5">
              Verify Your Email
            </Text>
            <Text className="text-[#171212] text-base text-center pb-6">
              Send a verification code to your email address to verify your account.
            </Text>
            <TouchableOpacity
              className="bg-[#e9242a] rounded-full px-5 py-3"
              onPress={handleSendVerificationCode}
            >
              <Text className="text-white text-base font-bold">
                Send Verification Code
              </Text>
            </TouchableOpacity>
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
          </>
        )}
      </View>
    </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailVerification;