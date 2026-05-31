import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronUp, Mail } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../components/themeProvider";

const faqCategories = [
  {
    id: "general",
    name: "General",
    items: [
      {
        question: "What makes Markt different from other marketplaces?",
        answer: "Unlike traditional platforms that focus solely on the transaction, Markt is built on social interaction. We prioritize the relationship between buyers and sellers, using live video, social feeds, and direct messaging to make online shopping feel more human and trustworthy."
      },
      {
        question: "Is Markt free to use?",
        answer: "Yes, downloading the app and browsing is completely free for everyone. We only charge a small transaction fee when a sale is successfully completed."
      },
      {
        question: "Where is Markt available?",
        answer: "Currently, we are focusing on our primary launch markets. You can check app store availability in your region or sign up for our waitlist to be notified when we expand to your area."
      }
    ]
  },
  {
    id: "buying",
    name: "For Buyers",
    items: [
      {
        question: "How do I know I can trust a seller?",
        answer: "Trust is central to Markt. You can view a seller's full history, see their interactions in live sessions, and see who else follows them. Additionally, our buyer protection ensures your funds are held securely until the item is delivered as described."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We support all major credit cards, Apple Pay, and Google Pay through our secure, native checkout system."
      },
      {
        question: "Can I return an item?",
        answer: "Yes. Every seller on Markt follows our standardized return policy, though some individual storefronts may offer even more flexible terms. You can initiate a return directly through the 'Orders' section of the app."
      }
    ]
  },
  {
    id: "selling",
    name: "For Sellers",
    items: [
      {
        question: "How do I start selling on Markt?",
        answer: "Simply download the app, create a profile, and apply for a seller account. Once verified, you can start listing products and hosting live sessions immediately."
      },
      {
        question: "What is live selling and how does it work?",
        answer: "Live selling allows you to broadcast video to your followers in real-time. You can showcase products, answer questions live, and viewers can purchase items instantly through an on-screen checkout button without leaving the stream."
      },
      {
        question: "What are the selling fees?",
        answer: "We keep our fee structure simple: a flat percentage per successful transaction. There are no monthly subscription fees or listing costs to get started."
      }
    ]
  },
  {
    id: "security",
    name: "Security & Trust",
    items: [
      {
        question: "How is my data protected?",
        answer: "We use industry-standard encryption for all data and never share your personal information with third parties without your explicit consent."
      },
      {
        question: "What happens if my order doesn't arrive?",
        answer: "Our 'Markt Guarantee' covers all purchases. If an item isn't shipped or doesn't arrive, we provide a full refund through our integrated dispute resolution system."
      },
      {
        question: "How do you verify sellers?",
        answer: "All sellers undergo a verification process that includes identity checks and, for certain categories, business documentation to ensure a safe environment for all users."
      }
    ]
  }
];

function AccordionItem({ question, answer, isDark }: { question: string; answer: string; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className={`border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between py-4"
        activeOpacity={0.7}
      >
        <Text className={`flex-1 font-geist font-bold text-[15px] pr-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          {question}
        </Text>
        {expanded ? (
          <ChevronUp size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
        ) : (
          <ChevronDown size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View className="pb-4">
          <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].id);

  const currentCategory = faqCategories.find((c) => c.id === activeCategory) || faqCategories[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top", "bottom"]}>
      <ScreenHeader title="Help Center" onBack={() => router.back()} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-8">
          <Text className={`font-geist font-bold text-[11px] tracking-[2px] uppercase mb-2 ${isDark ? "text-primary" : "text-primary"}`}>
            Support Center
          </Text>
          <Text className={`text-4xl font-geist font-bold tracking-tighter ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Common Questions
          </Text>
          <Text className={`font-inter text-base mt-4 leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Everything you need to know about getting started, buying, and selling on Markt.
          </Text>
        </View>

        {/* Category Tabs */}
        <View className="mt-8">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          >
            {faqCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                className={`px-6 py-3 rounded border ${
                  activeCategory === cat.id
                    ? (isDark ? "bg-[#f0f1f2] border-[#f0f1f2]" : "bg-black border-black")
                    : (isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border")
                }`}
              >
                <Text
                  className={`font-geist font-bold text-xs uppercase tracking-widest ${
                    activeCategory === cat.id
                      ? (isDark ? "text-black" : "text-white")
                      : (isDark ? "text-[#c6c5cf]" : "text-tertiary")
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQ Items */}
        <View className="px-6 mt-8">
          <View className={`rounded p-6 border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            {currentCategory.items.map((item, idx) => (
              <AccordionItem key={idx} question={item.question} answer={item.answer} isDark={isDark} />
            ))}
          </View>
        </View>

        {/* Contact Support CTA */}
        <View className="px-6 mt-12 mb-12">
          <View className={`rounded p-8 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            <Text className={`font-geist font-bold text-lg ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              Still need help?
            </Text>
            <Text className={`font-inter text-sm mt-2 leading-5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              Our support team is available 24/7 to assist you with any inquiries.
            </Text>
            <TouchableOpacity
              className="mt-6 h-14 rounded bg-primary flex-row items-center justify-center gap-3"
              activeOpacity={0.85}
            >
              <Mail size={20} color="white" strokeWidth={2} />
              <Text className="text-white font-geist font-bold text-xs uppercase tracking-[2px]">
                Contact Support
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
