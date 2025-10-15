import React, { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { sendVerificationEmail, verifyEmail } from "../../services/sections/auth";
import { useRegData } from "../../models/signupSteps";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../components/inputs";
import { useToast } from "../../components/ToastProvider"; // <-- toast

const schema = z.object({
  code: z
    .string()
    .min(6, "Verification code must be 6 characters long")
    .max(6, "Verification code must be 6 characters long"),
});
type FormData = z.infer<typeof schema>;

const EmailVerification = () => {
  const router = useRouter();
  const { regData } = useRegData();
  const { show } = useToast(); // <-- toast API

  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const handleSendVerificationCode = async () => {
    try {
      if (!regData?.email) {
        show({
          variant: "error",
          title: "Email missing",
          message: "We couldn’t find your email. Please go back and enter it.",
        });
        return;
      }
      setSending(true);
      await sendVerificationEmail(regData.email);
      setVerificationCodeSent(true);
      show({
        variant: "success",
        title: "Code sent",
        message: `We sent a 6-digit code to ${regData.email}.`,
      });
    } catch (error: any) {
      console.error("Failed to send verification code:", error);
      show({
        variant: "error",
        title: "Couldn’t send code",
        message: error?.message || "Please check your connection and try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSubmitCode = async (data: FormData) => {
    try {
      if (!regData?.email) {
        show({
          variant: "error",
          title: "Email missing",
          message: "We couldn’t find your email. Please go back and enter it.",
        });
        return;
      }
      setVerifying(true);
      const result = await Promise.resolve(verifyEmail(regData.email, data.code));
      if (!result) throw new Error("Verification failed");

      show({
        variant: "success",
        title: "Verified",
        message: "Your email has been verified.",
      });
      router.push("/"); // continue
    } catch (error: any) {
      console.error("Email verification failed:", error);
      show({
        variant: "error",
        title: "Invalid or expired code",
        message: "Double-check the 6-digit code and try again.",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center p-4 pb-2 justify-between border-b border-neutral-200">
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft color="#181111" size={24} />
            </TouchableOpacity>
            <Text className="text-[#181111] text-lg font-extrabold text-center flex-1 pr-12">Email Verification</Text>
          </View>

          {/* Body */}
          <View className="flex-1 px-4">
            <View className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
              {!verificationCodeSent ? (
                <>
                  <Text className="text-[#171212] text-[24px] font-extrabold leading-tight">
                    Verify your email
                  </Text>
                  <Text className="text-neutral-700 mt-2">
                    We’ll send a one-time 6-digit code to your email address.
                  </Text>

                  <TouchableOpacity
                    className={`mt-5 h-12 rounded-full items-center justify-center ${sending ? "bg-[#e9242a]/60" : "bg-[#e9242a]"}`}
                    onPress={handleSendVerificationCode}
                    disabled={sending}
                    activeOpacity={0.9}
                  >
                    <Text className="text-white font-bold">{sending ? "Sending…" : "Send verification code"}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text className="text-[#171212] text-[22px] font-extrabold leading-tight">
                    Enter verification code
                  </Text>
                  <Text className="text-neutral-700 mt-2">
                    We sent a 6-digit code to <Text className="font-semibold">{regData?.email}</Text>.
                  </Text>

                  {/* Code input */}
                  <View className="mt-4">
                    <Input placeholder="6-digit code" control={control} name="code" errors={errors} />
                    {errors.code && (
                      <Text className="text-[#e9242a] text-xs mt-1">{errors.code.message as string}</Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View className="mt-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={handleSendVerificationCode} className="active:opacity-80">
                      <Text className="text-[#e9242a] font-semibold">Resend code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`h-11 px-6 rounded-full items-center justify-center ${isValid ? "bg-[#181111]" : "bg-neutral-200"}`}
                      onPress={handleSubmit(handleSubmitCode)}
                      disabled={!isValid || verifying}
                      activeOpacity={0.9}
                    >
                      <Text className={`font-semibold ${isValid ? "text-white" : "text-neutral-500"}`}>
                        {verifying ? "Verifying…" : "Submit"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tiny helper under actions */}
                  <View className="mt-3">
                    <Text className="text-neutral-500 text-xs">
                      Didn’t get it? Check spam or resend. Your code expires shortly.
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* subtle footer space */}
            <View className="h-8" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailVerification;
