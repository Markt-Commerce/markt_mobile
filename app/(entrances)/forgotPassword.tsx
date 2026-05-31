import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react-native';

import { Input, PasswordInput, OTPInput } from '../../components/inputs';
import Button from '../../components/button';
import { useToast } from '../../components/ToastProvider';
import { sendPasswordResetEmail, resetPassword } from '../../services/sections/auth';
import { useTheme } from "../../components/themeProvider";

// Step 1: Email Schema
const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

// Step 2: Reset Schema
const resetSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"]
});

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // Step 1 Form
  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isValid: isEmailValid },
  } = useForm({
    resolver: zodResolver(emailSchema),
    mode: "onChange"
  });

  // Step 3 Form
  const passwordSchema = z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"]
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isValid: isPasswordValid },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onChange"
  });

  const onSendCode = async (data: z.infer<typeof emailSchema>) => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(data.email);
      setEmail(data.email);
      show({
        variant: "success",
        title: "Code Sent",
        message: "Please check your email for the verification code.",
      });
      setStep(2);
    } catch (error) {
      show({
        variant: "error",
        title: "Request Failed",
        message: error instanceof Error ? error.message : "Could not send reset code",
      });
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setLoading(true);
      const success = await resetPassword(email, code, data.newPassword);
      if (success) {
        show({
          variant: "success",
          title: "Success",
          message: "Your password has been reset. Please log in.",
        });
        router.push("/login");
      }
    } catch (error) {
      show({
        variant: "error",
        title: "Reset Failed",
        message: error instanceof Error ? error.message : "Could not reset password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) router.back();
    else if (step === 2) setStep(1);
    else setStep(2);
  };

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
          <View className="flex-1 px-6 pt-6">
            {/* Header */}
            <TouchableOpacity
              onPress={handleBack}
              className={`h-10 w-10 items-center justify-center rounded border mb-8 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color={iconColor} />
            </TouchableOpacity>

            <View className="mb-8">
              <Text className={`text-[32px] font-geist font-bold leading-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                {step === 1 && "Forgot\npassword?"}
                {step === 2 && "Enter\ncode"}
                {step === 3 && "New\npassword"}
              </Text>
              <Text className={`font-inter text-base mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                {step === 1 && "Don't worry, it happens. Enter your email below to receive a reset code."}
                {step === 2 && `We've sent a 6-digit code to ${email}. Enter it below.`}
                {step === 3 && "Set a strong password to protect your account."}
              </Text>
            </View>

            {step === 1 && (
              <View className="space-y-6">
                <View>
                  <Text className={`text-sm font-geist font-bold mb-2 ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Email Address</Text>
                  <Input
                    placeholder="Enter your email"
                    control={emailControl}
                    name="email"
                    errors={emailErrors}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View className="pt-4">
                  <Button
                    text="Send Reset Code"
                    onPress={handleEmailSubmit(onSendCode)}
                    disabled={!isEmailValid || loading}
                    loading={loading}
                    variant="conversion"
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View className="space-y-6">
                <View>
                  <Text className={`text-sm font-geist font-bold mb-4 ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Verification Code</Text>
                  <OTPInput 
                    value={code} 
                    onChange={setCode} 
                  />
                </View>

                <View className="pt-8">
                  <Button
                    text="Continue"
                    onPress={() => setStep(3)}
                    disabled={code.length !== 6}
                    variant="conversion"
                  />
                </View>

                <TouchableOpacity 
                  onPress={() => onSendCode({ email })}
                  className="items-center mt-4"
                >
                  <Text className={`font-inter text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                    Didn't receive the code? <Text className={`font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Resend</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View className="space-y-6">
                <View>
                  <Text className={`text-sm font-geist font-bold mb-2 ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>New Password</Text>
                  <PasswordInput
                    placeholder="Minimum 8 characters"
                    control={passwordControl}
                    name="newPassword"
                    errors={passwordErrors}
                  />
                </View>

                <View className="mt-4">
                  <Text className={`text-sm font-geist font-bold mb-2 ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Confirm Password</Text>
                  <PasswordInput
                    placeholder="Re-enter new password"
                    control={passwordControl}
                    name="confirmNewPassword"
                    errors={passwordErrors}
                  />
                </View>

                <View className="pt-6">
                  <Button
                    text="Reset Password"
                    onPress={handlePasswordSubmit(onResetPassword)}
                    disabled={!isPasswordValid || loading}
                    loading={loading}
                    variant="conversion"
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;