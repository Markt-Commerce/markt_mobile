import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../components/themeProvider";

export default function TermsOfUseScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top", "bottom"]}>
      <ScreenHeader title="Terms of Use" onBack={() => router.back()} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <Text className={`font-geist font-bold text-2xl tracking-tighter mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Terms of Use
          </Text>
          <Text className={`font-inter text-xs uppercase tracking-widest mb-8 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Last Updated: April 28, 2026
          </Text>

          <Text className={`font-inter text-sm leading-6 mb-8 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and Markt Commerce, concerning your access to and use of the Services.
          </Text>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              1. AGREEMENT TO OUR LEGAL TERMS
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              We operate the website https://marktcommerce.com (the 'Site'), the mobile application Markt Commerce (the 'App'), as well as any other related products and services that refer or link to these legal terms (the 'Legal Terms').
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              2. INTELLECTUAL PROPERTY RIGHTS
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the 'Content'), as well as the trademarks, service marks, and logos contained therein (the 'Marks').
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              3. USER REPRESENTATIONS
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not under the age of 13.
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              4. PROHIBITED ACTIVITIES
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavours except those that are specifically endorsed or approved by us.
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              5. TERM AND TERMINATION
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES.
            </Text>
          </View>

          <View className="mb-12">
            <Text className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              6. CONTACT US
            </Text>
            <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at marktcommerce2020@gmail.com.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
