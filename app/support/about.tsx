import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../components/themeProvider";

const visionSections = [
  {
    title: "The Human Connection",
    description: "Traditional e-commerce has become a sterile, transactional experience. We're rebuilding it from the ground up to focus on the relationships between creators, curators, and customers. On Markt, you don't just buy a product; you discover the story and the person behind it."
  },
  {
    title: "Trust through Interaction",
    description: "We believe trust isn't built through anonymous reviews, but through direct engagement. Our platform facilitates real-time conversations, live demonstrations, and transparent social feeds that allow you to verify quality and authenticity before you ever hit 'Buy'."
  },
  {
    title: "Empowering Creators",
    description: "Markt provides a stage for the next generation of entrepreneurs. Whether you're a boutique maker or a curated reseller, our tools are designed to amplify your personality, not just your inventory. We give you the control to build a brand, not just a storefront."
  }
];

export default function AboutScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top", "bottom"]}>
      <ScreenHeader title="About Markt" onBack={() => router.back()} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <View className={`w-12 h-1 mb-6 rounded-full bg-primary`} />
          <Text className={`font-geist font-bold text-4xl tracking-tighter mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Not just products.{"\n"}
            <Text className="text-primary">People.</Text>
          </Text>
          <Text className={`font-inter text-xl leading-8 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            We're humanizing the digital marketplace by bringing back the soul of traditional commerce.
          </Text>
        </View>

        {visionSections.map((section, idx) => (
          <View key={idx} className={`px-6 py-10 ${idx % 2 === 1 ? (isDark ? "bg-[#2f3132]/30" : "bg-surface/30") : ""}`}>
            <Text className={`font-geist font-bold text-2xl tracking-tighter mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              {section.title}
            </Text>
            <Text className={`font-inter text-base leading-7 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              {section.description}
            </Text>
          </View>
        ))}

        <View className="px-6 py-12">
          <View className={`p-8 rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            <Text className={`font-geist font-bold text-lg mb-6 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              Our Values
            </Text>
            
            <View className="mb-6">
              <Text className={`font-geist font-bold text-sm uppercase tracking-widest mb-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                Transparency
              </Text>
              <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                No hidden fees, no obscured interactions. Everything is out in the open.
              </Text>
            </View>

            <View className="mb-6">
              <Text className={`font-geist font-bold text-sm uppercase tracking-widest mb-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                Control
              </Text>
              <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Sellers own their audience; buyers own their experience.
              </Text>
            </View>

            <View>
              <Text className={`font-geist font-bold text-sm uppercase tracking-widest mb-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                Innovation
              </Text>
              <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Pushing the boundaries of what's possible in real-time social selling.
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 pb-12 items-center">
          <Text className={`font-geist font-bold text-[10px] uppercase tracking-[4px] ${isDark ? "text-[#46464e]" : "text-surface-dim"}`}>
            Markt Commerce © 2026
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
