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
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="About Markt" onBack={() => router.back()} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <View className={`w-12 h-1 mb-6 rounded-full bg-primary`} />
          <Text className={`font-bold text-4xl tracking-tighter mb-4 text-text-primary`}>
            Not just products.{"\n"}
            <Text className="text-primary">People.</Text>
          </Text>
          <Text className={`text-xl leading-8 text-text-secondary`}>
            We're humanizing the digital marketplace by bringing back the soul of traditional commerce.
          </Text>
        </View>

        {visionSections.map((section, idx) => (
          <View key={idx} className={`px-6 py-10 ${idx % 2 === 1 ? (isDark ? "bg-surface-sunken/30" : "bg-surface/30") : ""}`}>
            <Text className={`font-bold text-2xl tracking-tighter mb-4 text-text-primary`}>
              {section.title}
            </Text>
            <Text className={`text-base leading-7 text-text-secondary`}>
              {section.description}
            </Text>
          </View>
        ))}

        <View className="px-6 py-12">
          <View className={`p-8 rounded border ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
            <Text className={`font-bold text-lg mb-6 text-text-primary`}>
              Our Values
            </Text>
            
            <View className="mb-6">
              <Text className={`font-bold text-sm uppercase tracking-widest mb-1 text-text-primary`}>
                Transparency
              </Text>
              <Text className={`text-sm leading-6 text-text-secondary`}>
                No hidden fees, no obscured interactions. Everything is out in the open.
              </Text>
            </View>

            <View className="mb-6">
              <Text className={`font-bold text-sm uppercase tracking-widest mb-1 text-text-primary`}>
                Control
              </Text>
              <Text className={`text-sm leading-6 text-text-secondary`}>
                Sellers own their audience; buyers own their experience.
              </Text>
            </View>

            <View>
              <Text className={`font-bold text-sm uppercase tracking-widest mb-1 text-text-primary`}>
                Innovation
              </Text>
              <Text className={`text-sm leading-6 text-text-secondary`}>
                Pushing the boundaries of what's possible in real-time social selling.
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 pb-12 items-center">
          <Text className={`font-bold text-[10px] uppercase tracking-[4px] ${isDark ? "text-[#46464e]" : "text-surface-dim"}`}>
            Markt Commerce © 2026
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
