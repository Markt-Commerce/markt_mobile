/**
 * Help centre.
 *
 * The previous version described an app that doesn't exist: live video selling,
 * broadcasting to followers, on-stream checkout, Apple Pay and Google Pay, a
 * waitlist. None of it is in the codebase — payment is card, bank transfer,
 * mobile money and the Markt wallet, and there is no live video anywhere.
 *
 * A support page that promises features we don't have is worse than no support
 * page: it generates the exact tickets it exists to prevent, and it costs
 * trust at the moment someone is already stuck. Every answer below was checked
 * against the actual behaviour — escrow and the settlement hold, POD-confirmed
 * delivery, purchase-gated reviews, the returns endpoints, role switching.
 */
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronDown, Mail, Search } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../components/themeProvider";
import { SettingsSection } from "../../components/SettingsList";

const SUPPORT_EMAIL = "support@marktcommerce.com";

type Faq = { q: string; a: string };
type Group = { id: string; name: string; items: Faq[] };

const GROUPS: Group[] = [
  {
    id: "orders",
    name: "Orders & delivery",
    items: [
      {
        q: "When is my money actually taken?",
        a: "At checkout. It is then held rather than paid straight to the seller — the seller only receives it after the item is delivered and a short settlement window has passed. If the order is cancelled before that, the money comes back to you.",
      },
      {
        q: "Who confirms that an order was delivered?",
        a: "You or the delivery partner, using the delivery code on the order. A seller cannot mark their own order delivered, because confirming delivery is what releases their payment.",
      },
      {
        q: "What do the order statuses mean?",
        a: "Awaiting payment — the order exists but hasn't been paid for. Processing — the seller has accepted it and is preparing it. Shipped — it's on the way. Delivered — you or the delivery partner confirmed it arrived.",
      },
      {
        q: "A seller declined my order. What happens?",
        a: "The item is cancelled and you're refunded. You don't need to chase it.",
      },
      {
        q: "Can I return something?",
        a: "Yes. Open the order and request a return. The seller reviews it and either approves or declines, and you'll be notified either way.",
      },
    ],
  },
  {
    id: "paying",
    name: "Paying",
    items: [
      {
        q: "How can I pay?",
        a: "Card or bank transfer through Paystack, or your Markt wallet balance. Card and transfer both complete on Paystack's secure page — we never see your card details.",
      },
      {
        q: "What is the Markt wallet for?",
        a: "Somewhere to keep a balance so checkout is one tap, and where refunds land. You can move money out to your bank whenever you like.",
      },
      {
        q: "I paid but the app showed an error. Did it go through?",
        a: "Check your wallet or the order — payment is confirmed by Paystack directly to us, so it can complete even if the screen you were on failed to load. If the order still shows as awaiting payment after a few minutes, contact us.",
      },
      {
        q: "How long do withdrawals take?",
        a: "They're sent to your bank as soon as they're approved. Arrival depends on your bank, and is usually the same day.",
      },
    ],
  },
  {
    id: "selling",
    name: "Selling",
    items: [
      {
        q: "How do I start selling?",
        a: "Create a seller account from your profile — you can hold both a buyer and a seller account on the same login and switch between them at any time. Once you have one, you can list products.",
      },
      {
        q: "Why can't I see an order a buyer just placed?",
        a: "Orders appear in your queue once they're paid for. Before that there's nothing to commit stock against.",
      },
      {
        q: "How do I fulfil an order?",
        a: "Open it from Orders, accept it, and mark it shipped when it's on its way. Delivery itself is confirmed by the buyer or the delivery partner.",
      },
      {
        q: "When do I get paid?",
        a: "After the item is delivered and the settlement window has passed. It then lands in your Markt wallet, and you can withdraw it to your bank.",
      },
    ],
  },
  {
    id: "community",
    name: "Community & safety",
    items: [
      {
        q: "Who can leave a review?",
        a: "Only someone who bought the item and received it. That's why every review carries a verified mark — there is no way to post one without a delivered order behind it.",
      },
      {
        q: "Someone is behaving badly. What can I do?",
        a: "Use the … menu on any post or product to report it, or block the person. Blocking hides everything of theirs from your feed immediately, and they aren't told.",
      },
      {
        q: "What are communities?",
        a: "Groups around a shared interest, where members post and find each other. You can browse them, join the ones you like, and leave whenever.",
      },
      {
        q: "How do I delete my account?",
        a: "Settings → Delete account. It's permanent. If you have money in your wallet or orders in flight, settle those first — we'll tell you if anything is blocking it.",
      },
    ],
  },
];

function Accordion({
  item,
  isDark,
  open,
  onToggle,
}: {
  item: Faq;
  isDark: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={item.q}
        className="px-4 py-4 flex-row items-start"
      >
        <Text
          className={`flex-1 text-[15px] leading-[21px] pr-3 ${
            isDark ? "text-[#f0f1f2]" : "text-black"
          }`}
        >
          {item.q}
        </Text>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }], marginTop: 2 }}>
          <ChevronDown size={18} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
        </View>
      </TouchableOpacity>
      {open ? (
        <View className="px-4 pb-4 -mt-1">
          <Text
            className={`text-[14px] leading-[21px] ${
              isDark ? "text-[#c6c5cf]" : "text-[#52525B]"
            }`}
          >
            {item.a}
          </Text>
        </View>
      ) : null}
      <View className={`h-px ml-4 ${isDark ? "bg-[#2f3132]" : "bg-[#EFEFF1]"}`} />
    </>
  );
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Searching questions *and* answers: people describe their problem in the
  // words of the answer ("refund", "delivery code") as often as the question.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const strong = isDark ? "text-[#f0f1f2]" : "text-black";
  const muted = isDark ? "text-[#8f9195]" : "text-tertiary";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "#FFFFFF" }}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Help" onBack={() => router.back()} />

        <View className="px-4 pt-2 pb-4">
          <Text className={`text-[26px] font-bold tracking-tight ${strong}`}>
            How can we help?
          </Text>
          <View
            className={`flex-row items-center h-11 px-3 rounded-xl mt-3 ${
              isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"
            }`}
          >
            <Search size={17} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search help"
              placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"}
              className={`flex-1 ml-2 text-[15px] ${strong}`}
              returnKeyType="search"
              accessibilityLabel="Search help topics"
            />
          </View>
        </View>

        {groups.length === 0 ? (
          <View className="px-8 py-12 items-center">
            <Text className={`text-[15px] font-semibold ${strong}`}>
              Nothing matches “{query.trim()}”
            </Text>
            <Text className={`text-[13px] mt-1 text-center ${muted}`}>
              Try a different word, or email us below and a person will answer.
            </Text>
          </View>
        ) : (
          groups.map((g) => (
            <SettingsSection key={g.id} title={g.name} dark={isDark}>
              {g.items.map((item, idx) => {
                const key = `${g.id}:${idx}`;
                return (
                  <Accordion
                    key={key}
                    item={item}
                    isDark={isDark}
                    open={openKey === key}
                    onToggle={() => setOpenKey(openKey === key ? null : key)}
                  />
                );
              })}
            </SettingsSection>
          ))
        )}

        <View className="px-4 pt-8">
          <Text className={`text-[15px] font-semibold ${strong}`}>Still stuck?</Text>
          <Text className={`text-[14px] mt-1 leading-[20px] ${muted}`}>
            Email us with your order number and we'll pick it up.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Email support at ${SUPPORT_EMAIL}`}
            className="mt-4 h-12 rounded-xl bg-primary items-center justify-center flex-row"
          >
            <Mail size={17} color="#FFFFFF" strokeWidth={2.2} />
            <Text className="text-white font-semibold text-[15px] ml-2">
              Email support
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
