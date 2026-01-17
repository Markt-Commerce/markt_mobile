import React from "react";
import { View, Text, ScrollView, ImageBackground, Image, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

type FeedItem = {
  id: string;
  category: string;
  image: string;
  avatar: string;
  name: string;
  text: string;
};

const FEED: FeedItem[] = [
  {
    id: "1",
    category: "Handmade",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1S1LO1Bax8AEWnapObB0BHZ85B25-7vfzt79eqRku9m6hScIJq5RDKoh5nIxK9cUfmdOpvNO0_z7n0h2GUCbhXID1yvHpwWmWH9VQ9RAkdaCdfFBauOZk1jHGkqh0xM134_xVcz7qbcCG0qZAYg1Nw7pBvmUlgRUzW_wmaT0wZxuWnn3vErpTEhJCotkeJudpg4ufEQJZkpF_L6TKQQKhZ8tUfJSISptdpHpR4KpbaUzDcRUe2zAkLxu-B7Oub2lCk3ggsZbP0A",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkTa8K8ktStRVyxZa24yGEgPSkycMgGE_ahAcmwDuC3A-ZzV3FPd1m3n0bgU2pR1JPYpoeg5CtWV_c1Un5Jf2xUt076hBgwWLz2VUi5Nbzf_bmyQogmrPgbJWvMsoC_f1cjB-W9veowSRktc94xaQ_TMvFR2tnRs06vp5212LAc6rjgFTSbZQ7q8HB0moryEZG7hJ2a_QuUNKZIr6E8WMHBcK1U8w4DHt3p2DuV3jQG1_OqXuWKodkbPZc4NNI6uave4SPNDPkng",
    name: "Luna Crafts",
    text: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: "2",
    category: "Fine Art",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBj9Q3Yc2anNzQ8vZXiQW86Ci_Yx39QKpsBkhDPyNW-RFDB2IMSp1_4Ogql4c1rkh6152eTzPrR_A2ufB35-nU1MaVe95xmnT5HtRonhyEunCgyv1AgeA9D9nnLi_tsmac3BC3qY6HWGTZXMKuOUv3gcBtREY4uujdwV_kwl_35bLjh7M1JjgzLFRt8-3s1JhqakajQrmxCV1B_qYgZA_XNeO_AyYjaWmES2NmO2XGLi1hRYM9kKyIt5umL32Gg4TNXoFmPasfO9g",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYBXugIRCHXDBemQOT9VP9GZFAiO7gi0sj3FDPRBlLSarUkK1GS4k6JIZBhlZrFnKNLeoyQtF9_txuVz203x8S-gw2Y8nFGDL-RBoHfytMfOxoey2n9NIExouL_CKV252OGiz7vVbwWKNXRJMGFgKOf_dzT_AlEe_3V3VcrfZaBP_R4JVPNoNykGe2DStVA-su9M6YL7ZmkvzVZjqRmAetPtP1Gjt41NFiCYZBP7KtvZk2j9_inDeVBo_UHOd4fbIR_wKkIlvhKg",
    name: "Artistic Souls",
    text: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: "3",
    category: "Leathercraft",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBmdEsLpW21oGUnrxGyb3kNKt9qkBRwSYuf-LgMpGUjVh9i7uLfKeRlCaEnX0B53Y5fYbJ1EbNr8RrK6oGpihoctZz6BNbHtQWW4CieAa4jUHgKQBlzO7V6cmx2kq5rkamqEKIVrP_KC_C2WBMOly3zqA5Rx9INvXY-aVWk-WNvTb8kOzGYSuq_PC-p4JxDdQPjUWclnptr53zQQPEB-RNELqtGmpQ23w-A_Jkio8jgIwzo-Vx9_u5hI7eDosH6ntFVo-ea9tOK4A",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxdqdQJO2kd3MZAVznrlgZfJm6WzSZacN3PCltczXN2jZVL7n2f1tGhIcmX4gyEORmeNZ-pvSu1kbLwrN4SakIga2vH6vNciTAg_fVajvsffuHOnT6nJ2ALKgIfLiK9tQR9yqjm3V-ZKFO9_i-8qsbqWyOlu4sHakpWVRbzE4GZXGqo27t-q3MrwiW4u6Fgkqd8D68OdYr_jpW2HRGSoMSZpqKFyZo_4u3mPkRD_ajQhqJRRUwwB0E2ER0d6AELD-XT_fGuHxpCw",
    name: "Urban Leather",
    text: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];

export default function NicheFeed() {
  return (
    <View className="py-2">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-5">
        <Text className="text-[#171312] text-[20px] font-bold tracking-[-0.015em]">
          Niche Feed
        </Text>

        <Pressable className="flex-row items-center gap-1">
          <Text className="text-[#826f68] text-sm font-semibold">View all</Text>
          <ChevronRight size={16} color="#826f68" />
        </Pressable>
      </View>

      {/* Horizontal Feed */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {FEED.map((item) => (
          <View key={item.id} className="w-[280px] gap-3">
            {/* Card Image */}
            <View className="relative overflow-hidden rounded-2xl shadow-sm">
              <ImageBackground
                source={{ uri: item.image }}
                className="w-full aspect-[4/5]"
              >
                <View className="absolute top-3 left-3 rounded-lg bg-white/90 px-2 py-1">
                  <Text className="text-[#171312] text-[11px] font-bold uppercase tracking-wider">
                    {item.category}
                  </Text>
                </View>
              </ImageBackground>
            </View>

            {/* Description */}
            <View>
                <Text className="text-[#171312] text-sm">{item.text}</Text>
            </View>

            {/* Seller */}
            <View className="flex-row items-center gap-2">
              <Image
                source={{ uri: item.avatar }}
                className="h-6 w-6 rounded-full"
              />
              <Text className="text-[#171312] text-sm font-semibold">
                {item.name}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
