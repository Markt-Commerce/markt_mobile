import React, { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { sendVerificationEmail, verifyEmail } from "../../services/sections/auth";
import { useRegData } from "../../models/signupSteps";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OTPInput } from "../../components/inputs";
import { useToast } from "../../components/ToastProvider"; // <-- toast
import Button from "../../components/button";
import { useTheme } from "../../components/themeProvider";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";

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
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#2f3132]" : "bg-white"}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View className={`flex-1 ${isDark ? "bg-[#2f3132]" : "bg-white"}`}>
          {/* Header */}
          <View className="flex-row items-center p-4 pb-2 justify-between">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className={`h-10 w-10 items-center justify-center rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft color={iconColor} size={20} />
            </TouchableOpacity>
            <Text className={`text-xl font-geist font-bold text-center flex-1 pr-10 ${isDark ? "text-[#f0f1f2]" : "text-[#000000]"}`}>Verification</Text>
          </View>

          {/* Body */}
          <View className="flex-1 px-4 justify-center">
            <View className={`rounded border px-6 py-8 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
              {!verificationCodeSent ? (
                <>
                  <Text className={`text-[32px] font-geist font-bold leading-tight mb-2 text-center ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                    Check your email
                  </Text>
                  <Text className={`font-inter text-center mb-8 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                    We’ll send a one-time 6-digit code to your email address to secure your account.
                  </Text>

                  <Button
                    text={sending ? "Sending…" : "Send code"}
                    onPress={handleSendVerificationCode}
                    disabled={sending}
                    variant="conversion"
                  />
                </>
              ) : (
                <>
                  <Text className={`text-[32px] font-geist font-bold leading-tight mb-2 text-center ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                    Enter code
                  </Text>
                  <Text className={`font-inter text-center mb-10 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                    We sent a 6-digit code to{"\n"}
                    <Text className={`font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>{regData?.email}</Text>
                  </Text>

                  {/* Code input */}
                  <View className="mb-10">
                    <Controller
                      control={control}
                      name="code"
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <OTPInput 
                          value={value || ""} 
                          onChange={onChange} 
                          error={error?.message} 
                        />
                      )}
                    />
                  </View>

                  {/* Actions */}
                  <Button
                    text={verifying ? "Verifying…" : "Submit"}
                    onPress={handleSubmit(handleSubmitCode)}
                    disabled={!isValid || verifying}
                    variant="conversion"
                  />

                  <View className="mt-8 items-center gap-4">
                    <TouchableOpacity onPress={handleSendVerificationCode}>
                      <Text className={`font-geist font-bold text-sm underline uppercase tracking-widest ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Resend code</Text>
                    </TouchableOpacity>
                    
                    <Text className={`font-inter text-xs text-center px-4 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                      Didn’t get it? Check your spam folder or try resending.
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* subtle footer space */}
            <View className="h-10" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailVerification;
