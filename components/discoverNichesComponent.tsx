import React from "react";
import { View, Text, ScrollView, Pressable, ImageBackground } from "react-native";

type Niche = {
  title: string;
  image: string;
  followed?: boolean;
};

const niches: Niche[] = [
  {
    title: "Jewelry",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1S1LO1Bax8AEWnapObB0BHZ85B25-7vfzt79eqRku9m6hScIJq5RDKoh5nIxK9cUfmdOpvNO0_z7n0h2GUCbhXID1yvHpwWmWH9VQ9RAkdaCdfFBauOZk1jHGkqh0xM134_xVcz7qbcCG0qZAYg1Nw7pBvmUlgRUzW_wmaT0wZxuWnn3vErpTEhJCotkeJudpg4ufEQJZkpF_L6TKQQKhZ8tUfJSISptdpHpR4KpbaUzDcRUe2zAkLxu-B7Oub2lCk3ggsZbP0A",
    followed: true,
  },
  {
    title: "Painting",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBj9Q3Yc2anNzQ8vZXiQW86Ci_Yx39QKpsBkhDPyNW-RFDB2IMSp1_4Ogql4c1rkh6152eTzPrR_A2ufB35-nU1MaVe95xmnT5HtRonhyEunCgyv1AgeA9D9nnLi_tsmac3BC3qY6HWGTZXMKuOUv3gcBtREY4uujdwV_kwl_35bLjh7M1JjgzLFRt8-3s1JhqakajQrmxCV1B_qYgZA_XNeO_AyYjaWmES2NmO2XGLi1hRYM9kKyIt5umL32Gg4TNXoFmPasfO9g",
  },
  {
    title: "Leather",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBmdEsLpW21oGUnrxGyb3kNKt9qkBRwSYuf-LgMpGUjVh9i7uLfKeRlCaEnX0B53Y5fYbJ1EbNr8RrK6oGpihoctZz6BNbHtQWW4CieAa4jUHgKQBlzO7V6cmx2kq5rkamqEKIVrP_KC_C2WBMOly3zqA5Rx9INvXY-aVWk-WNvTb8kOzGYSuq_PC-p4JxDdQPjUWclnptr53zQQPEB-RNELqtGmpQ23w-A_Jkio8jgIwzo-Vx9_u5hI7eDosH6ntFVo-ea9tOK4A",
  },
  {
    title: "Pottery",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkTa8K8ktStRVyxZa24yGEgPSkycMgGE_ahAcmwDuC3A-ZzV3FPd1m3n0bgU2pR1JPYpoeg5CtWV_c1Un5Jf2xUt076hBgwWLz2VUi5Nbzf_bmyQogmrPgbJWvMsoC_f1cjB-W9veowSRktc94xaQ_TMvFR2tnRs06vp5212LAc6rjgFTSbZQ7q8HB0moryEZG7hJ2a_QuUNKZIr6E8WMHBcK1U8w4DHt3p2DuV3jQG1_OqXuWKodkbPZc4NNI6uave4SPNDPkng",
  },
];

export default function DiscoverNiches() {
  return (
    <View className="my-4 border-y border-[#f4f2f1] bg-[#faf9f9] py-6">
      <Text className="px-4 pb-4 text-[20px] font-bold tracking-[-0.015em] text-[#171312]">
        Discover Niches
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-6 px-4"
      >
        {niches.map((niche) => (
          <View
            key={niche.title}
            className="min-w-[100px] items-center gap-3"
          >
            <View className="h-20 w-20 overflow-hidden rounded-full border border-[#f4f2f1] bg-white shadow-sm">
              <ImageBackground
                source={{ uri: niche.image }}
                resizeMode="cover"
                className="h-full w-full"
              />
            </View>

            <Text className="text-sm font-bold text-[#171312]">
              {niche.title}
            </Text>

            <Pressable
              className={`w-full rounded-full px-4 py-1.5 ${
                niche.followed
                  ? "bg-[#171312]"
                  : "bg-[#f4f2f1]"
              }`}
            >
              <Text
                className={`text-center text-[12px] font-bold ${
                  niche.followed
                    ? "text-white"
                    : "text-[#171312]"
                }`}
              >
                Follow
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
