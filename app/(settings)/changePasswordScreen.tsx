// screens/ChangePasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { useRouter } from 'expo-router';
import { usePasswordResetConfirm } from '../../hooks/useAuth';
import { useTheme } from '../../components/themeProvider';

export default function ChangePasswordScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const reset = usePasswordResetConfirm();
  const nav = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const onSubmit = async () => {
    try {
      const trimmedEmail = email.trim();
      const trimmedCode = code.trim();
      const trimmedPassword = newPassword.trim();
      if (!trimmedEmail || !trimmedCode || !trimmedPassword) {
        Alert.alert('Missing details', 'Please enter your email, reset code, and new password.');
        return;
      }
      await reset.mutateAsync({ code: trimmedCode, new_password: trimmedPassword, email: trimmedEmail });
      Alert.alert('Success', 'Password changed');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to change password');
    }
  };

  const isSubmitting = reset.isPending;
  const canSubmit = !!email.trim() && !!code.trim() && !!newPassword.trim() && !isSubmitting;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
      <ScrollView className={isDark ? "bg-[#1a1c1d]" : "bg-white"} contentContainerStyle={{ paddingBottom: 32 }}>
        <ScreenHeader title="Change Password" onBack={() => nav.back()} />
        <View className="px-6 pt-6">
          <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Enter the email tied to your account, the reset code you received, and a new password.
          </Text>

          <View className={`mt-6 border rounded p-4 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            <Text className={`text-sm font-geist font-bold mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              className={`border p-3 rounded mb-4 ${isDark ? "border-[#46464e] bg-[#2f3132] text-[#f0f1f2]" : "border-border bg-surface text-black"}`}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={isDark ? "#8f8f98" : "#5b5b64"}
            />

            <Text className={`text-sm font-geist font-bold mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Reset Code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              className={`border p-3 rounded mb-4 ${isDark ? "border-[#46464e] bg-[#2f3132] text-[#f0f1f2]" : "border-border bg-surface text-black"}`}
              keyboardType="number-pad"
              autoCapitalize="none"
              placeholderTextColor={isDark ? "#8f8f98" : "#5b5b64"}
            />

            <Text className={`text-sm font-geist font-bold mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>New Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              className={`border p-3 rounded ${isDark ? "border-[#46464e] bg-[#2f3132] text-[#f0f1f2]" : "border-border bg-surface text-black"}`}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={isDark ? "#8f8f98" : "#5b5b64"}
            />
          </View>

          <TouchableOpacity
            className={`mt-6 h-12 rounded items-center justify-center bg-primary ${canSubmit ? "" : "opacity-50"}`}
            onPress={onSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            <Text className="text-white font-geist font-bold text-xs tracking-[2px] uppercase">
              {isSubmitting ? "Updating..." : "Change Password"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
