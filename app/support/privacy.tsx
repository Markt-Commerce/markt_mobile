import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../components/themeProvider";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top", "bottom"]}>
      <ScreenHeader title="Privacy Policy" onBack={() => router.back()} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <Text className={`font-geist font-bold text-2xl tracking-tighter mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Privacy Policy
          </Text>
          <Text className={`font-inter text-xs uppercase tracking-widest mb-8 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Last Updated: May 04, 2026
          </Text>

          <Text className={`font-inter text-sm leading-6 mb-6 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            This Privacy Notice for Markt Commerce ('we', 'us', or 'our'), describes how and why we might access, collect, store, use, and/or share ('process') your personal information when you use our services ('Services'), including when you:
          </Text>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              1. WHAT INFORMATION DO WE COLLECT?
            </Text>
            <Text className={`font-geist font-bold text-[15px] mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              Personal information you disclose to us
            </Text>
            <Text className={`font-inter text-sm leading-6 mb-4 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              The personal information we collect may include: names, phone numbers, email addresses, usernames, passwords, billing addresses, debit/credit card numbers, and contact preferences.
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              2. HOW DO WE PROCESS YOUR INFORMATION?
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services.
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              5. HOW DO WE KEEP YOUR INFORMATION SAFE?
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process.
            </Text>
          </View>

          <View className="mb-12">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              6. CONTACT US
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              If you have questions or comments about this notice, you may email us at marktcommerce2020@gmail.com.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
