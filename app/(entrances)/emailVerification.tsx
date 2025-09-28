// app/emailVerification.tsx (or your chosen route path)
import React from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../hooks/userContextProvider";
import { useRegData } from "../../models/signupSteps";
// import { verifyEmailCode, registerUser } from "../services/sections/auth"; // <- when backend is ready

export default function EmailVerification() {
  const router = useRouter();
  const { setUser } = useUser();
  const { regData } = useRegData();

  const [code, setCode] = React.useState("");

  const canContinue = code.length === 4; // any 4 digits for now
  const NEXT_ROUTE = "/"; // change if your next screen differs

  const handleVerify = async () => {
    if (!canContinue) return;


    // Navigate immediately
    router.replace(NEXT_ROUTE);

    // ─────────────────────────────────────────────────────────────────────────
    // REAL VERIFY (commented until backend is ready)
    // NOTE: prefer sending the fresh `regData` from memory; do NOT rely on stale copies.
    //
    // try {
    //   // 1) Verify the code
    //   await verifyEmailCode({ email: regData.email, code });
    //
    //   // 2) Optionally finalize registration if your API needs it
    //   // const userRegResult = await registerUser(regData);
    //   // setUser({
    //   //   email: userRegResult.email.toLowerCase(),
    //   //   account_type: userRegResult.account_type,
    //   //   username: userRegResult.username,
    //   //   full_name: userRegResult.full_name,
    //   //   profile_picture_url: userRegResult.profile_picture_url,
    //   //   created_at: userRegResult.created_at,
    //   // });
    //   // router.replace(NEXT_ROUTE);
    // } catch (err) {
    //   // If verification fails, show a message and keep user here
    //   console.error("Verification failed:", err);
    // }
    // ─────────────────────────────────────────────────────────────────────────
  };

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
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-6" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
