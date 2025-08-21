import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { Plus, Heart, Star, Send, MessageCircle, ShoppingBasket } from 'lucide-react-native'

const feed = () => {
  return (
    <View className="relative flex-1 bg-white justify-between">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex flex-row items-center bg-white p-4 pb-2 justify-between">
          <Text className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pl-12">Feed</Text>
          <View className="flex w-12 items-center justify-end">
            <TouchableOpacity className="flex max-w-[480px] items-center justify-center rounded-lg h-12 bg-transparent text-[#111418] gap-2 text-base font-bold min-w-0 p-0">
              <Plus size={24} color="#111418" />
              <ShoppingBasket size={24} color="#111418" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex flex-row gap-3 p-3">
          <View className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f5] pl-4 pr-4">
            <Text className="text-[#111418] text-sm font-medium leading-normal">Public</Text>
          </View>
          <View className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f5] pl-4 pr-4">
            <Text className="text-[#111418] text-sm font-medium leading-normal">Niche</Text>
          </View>
          {/* Add more filter items as needed */}
        </ScrollView>

        {/* Post 1 */}
        <View>
          <View className="flex flex-row items-center gap-4 bg-white px-4 min-h-[72px] py-2">
            <Image
              className="h-14 w-14 rounded-full"
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1gkEvNoDvqf_iGTxfcKhkkMQiLMoFz39s6IT2Q5nP95EKeVdOf6BgCDYAmTQFUeMOAfCHbnk_29m_zkaW7B362j_AkXH3TyfQKNqsHvziPUnckASjmM1yeI9ELrgxV-or3jwh347N_ZRBbiffCOg33WqzREe3706SZO_LZYnGa8xHB2ffJbyC14b9I9HFL4nCzyVVdZX7Ws5LRC4wF6-W_5gX-gkPM3E7xyVsyy5U1VQCfENl7F9-s8ypjoxYSTbVvlay1JPj6g" }}
            />
            <View className="flex flex-col justify-center">
              <Text className="text-[#111418] text-base font-medium leading-normal">Sophia Carter</Text>
              <Text className="text-[#60758a] text-sm font-normal leading-normal">2d</Text>
            </View>
          </View>
          <Text className="text-[#111418] text-base font-normal leading-normal pb-3 pt-1 px-4">
            Just launched my new collection of handmade jewelry! Check out the unique designs and let me know what you think.
          </Text>
          <View className="flex w-full bg-white py-3">
            <View className="flex flex-row flex-wrap w-full gap-1 overflow-hidden bg-white aspect-[3/2]">
                <Image
                    className="flex-1 rounded-none w-full h-full"
                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxJAeKwyphTq0fXACVZTdi9GqUL_GaK47ottyOAnk0BVKOXIaVLHWAjip7G7jFkP7-KjNU9GV1nRtRDomS7ws7bhC771C41cpkhIjZLbKFSPQqNsu_gkayn3oPPjg-U5tZAUSG-QXizxcwFNyavX-oLN55PLbybMkZ6WWkMFlF9-Tx9jaMODkjcT2-ym3-wJeVL48DaSaoCeHT0zIKJIi7cR7gRekLnmf-3Xfqapjspso-Gz4tka6Aby5uQXT1TOQBpy98lMeR0Q" }}
                    style={{ flexBasis: '66%' }} // Equivalent to 2fr
                />
                <View className="flex-col flex-1 gap-1" style={{ flexBasis: '33%' }}> {/* Container for 1fr and 1fr */}
                    <Image
                        className="flex-1 rounded-none w-full h-full"
                        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9PmSOBZxGbUWdT8G4hp25YC1R1QYgPmy4m1vPnFnuN9NZGk3lfS2iYQS4GICed71qka9r02x-zqUSCPwsN3ByQTK58LrW77fawm42y4fKPpQPXrKH-4raLVnNiV2nIS4lCc4CQIgZ18L37drr5ELUqfaKLWYOFphSMiYsC7t9RSXQOIJqcaX8C76afFBmD4tjq-xctLRQGwMpYhZTIUQwLWOZ8L9SQS4quLp36CjwdSoTXGdfQIAn9KuPKIVKkVPyu_lYLAtboA" }}
                    />
                    <Image
                        className="flex-1 rounded-none w-full h-full"
                        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuTPSySR-vQ19IswGrOv5-OM3cYSaEGgh8aHpKl_xStOj1yC_h7yOavJAW1iHnVUaGJFF30U2F-jgrky6oyz4Cofp3w1mdpXuZ52SwTS1dpAQ1ZAenXVrdMGn6OprYG5mhixPbUcEPbVoSB2OkCdyqE10KOIUNbH_9ukZv8fukBtC5hnSkVEc2kcrmRiTOuzM_nsw9mMfixjW-MTX7_JJvvg49KZ40wIk4pr2dPyYXfHCAAP8Ltt_40ZqhBN9l8NGCXulp_dZVjQ" }}
                    />
                </View>
            </View>
          </View>
          <View className="p-4">
            <View className="flex flex-row items-stretch justify-between gap-4 rounded-lg">
              <View className="flex flex-col flex-grow-0 flex-shrink-0 basis-[0px] gap-4" style={{ flexBasis: 0, flexGrow: 2, flexShrink: 2 }}>
                <View className="flex flex-col gap-1">
                  <Text className="text-[#60758a] text-sm font-normal leading-normal">New</Text>
                  <Text className="text-[#111418] text-base font-bold leading-tight">Handmade Beaded Necklace</Text>
                  <Text className="text-[#60758a] text-sm font-normal leading-normal">$25</Text>
                </View>
                <TouchableOpacity className="flex min-w-[84px] items-center justify-center rounded-lg h-8 px-4 flex-row-reverse bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal w-fit">
                  <Text className="truncate">Add to Cart</Text>
                </TouchableOpacity>
              </View>
              <Image
                className="w-full rounded-lg flex-1"
                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDJuEOekKnDeDd1UEn1_SU8Hg-GPh1QLkpxBOrNZ8dYPQBsIxPc4mibkHmznbGO0NrHHLKFEoHmDkMDX3iS16X5a6dPhm8kqLtuxeblh897RGXD9vcYZCmxahq_FmFcJ9AmyzotHMeUFC261_EEPgjZc4dw_olIBhFrVU2I3Umh_KDWkB_eo2DB5c6EDhxu2SFXhQXkRUsWwiI8UW01qYpKMrSpME1FsSOWiZvl2fcQxmNcqyauUfPJaj26axUSMlFTs6vqFp8IQ" }}
                style={{ aspectRatio: 16/9 }}
              />
            </View>
          </View>
          <View className="flex flex-row flex-wrap gap-4 px-4 py-2 justify-between">
            <View className="flex flex-row items-center justify-center gap-2 px-3 py-2">
              <Heart size={24} color="#60758a" />
              <Text className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">12</Text>
            </View>
            <View className="flex flex-row items-center justify-center gap-2 px-3 py-2">
              <MessageCircle size={24} color="#60758a" />
              <Text className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">3</Text>
            </View>
            <View className="flex flex-row items-center justify-center gap-2 px-3 py-2">
              <Send size={24} color="#60758a" />
              <Text className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">2</Text>
            </View>
            <View className="flex flex-row items-center justify-center gap-2 px-3 py-2">
              <Star size={24} color="#60758a" />
              <Text className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">4</Text>
            </View>
          </View>
        </View>

        {/* Post 2 */}
        <View>
          <View className="flex flex-row items-center gap-4 bg-white px-4 min-h-[72px] py-2">
            <Image
              className="h-14 w-14 rounded-full"
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBb1k5VXkLPyLzcjfliVfzjPnQF01k0c2YlX87Jl9IIGABik5fFXh9hTxUmiZ2RL5UigjThVjvRjIxwU6QMDYf2NdOC_gVcN7CndT_U7UUmcQCfh26yfeiKbEaqCKv7dr3XsL96Yt8GkgyDugIsrW1qPP0FtvOjnApPVywPHDWNj1NHzTotBHbEpOaPd_VWMFulq-xz4NxnVAMDJPUmVRZV5dgiiMxKvSFrTLF5SJyJDv5ghWf19MQJ0Yuu5cXc9CugDb87JHXCtA" }}
            />
            <View className="flex flex-col justify-center">
              <Text className="text-[#111418] text-base font-medium leading-normal">Ethan Bennett</Text>
              <Text className="text-[#60758a] text-sm font-normal leading-normal">1d</Text>
            </View>
          </View>
          <Text className="text-[#111418] text-base font-normal leading-normal pb-3 pt-1 px-4">
            Excited to share my latest vintage finds! These pieces are one-of-a-kind and perfect for adding a touch of nostalgia to your style.
          </Text>
          <View className="flex w-full bg-white py-3">
            <View className="flex flex-row flex-wrap w-full gap-1 overflow-hidden bg-white aspect-[3/2]">
                <Image
                    className="flex-1 rounded-none w-full h-full"
                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRVC5jdXtfqx2D1E_JCJN9_ls20eCn7M2dqtzhGL8Ftckn0qZZ4z_KIdrpmpn4NpRenCptU0gyT1VUp6O31kJoQWru4HC8JBW3do-sJBp4SlTwYv7YiJ1-Y7PHsq0l3z-fneehmMgyhQoI5QwYxqQu1Dl3wMLHIsAryBpFmIw5yyW9zc_gQambo5AdKBkWHBcAgoDc5Vh8I8L7exUAv-Dkv_MOsF7wirqZifqk1VOOLXq3W0Jon27Mdr-_mpry0NaXLJmHiZG1Fg" }}
                    style={{ flexBasis: '66%' }} // Equivalent to 2fr
                />
                <Image
                    className="flex-1 rounded-none w-full h-full"
                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD49EJMfdzRPm04a2NG-n-PRp74_jSlXJMAlqD5jK5Xl-iuke1MuyzBm3ARM9aN43sS0Jr2H1kjQONGG5orTZqlGmbWhoUPFzwaDTz6_jdQKlot8WmZY_28X1UVHB5k11nTLOljpK-ax30nP7MGr47PE02jWTRLZp4P-keVgp6E3z-Q7ClGfLPxIS7A2TYSMFe3LMxKarpPf3O7ZyWk1rz7tsKhFkgBUjRZzmE7Qwa5SCVKEFaXAZ3Ci_LaYm1yud0a5DfaX4JzXw" }}
                    style={{ flexBasis: '33%', aspectRatio: 1/2 }} // 1fr and row-span-2 combined. Aspect ratio adjusted for a vertical fill
                />
            </View>
          </View>
          <View className="p-4">
            <View className="flex flex-row items-stretch justify-between gap-4 rounded-lg">
              <View className="flex flex-col flex-grow-0 flex-shrink-0 basis-[0px] gap-4" style={{ flexBasis: 0, flexGrow: 2, flexShrink: 2 }}>
                <View className="flex flex-col gap-1">
                  <Text className="text-[#60758a] text-sm font-normal leading-normal">Vintage</Text>
                  <Text className="text-[#111418] text-base font-bold leading-tight">Retro Denim Jacket</Text>
                  <Text className="text-[#60758a] text-sm font-normal leading-normal">$60</Text>
                </View>
                <TouchableOpacity className="flex min-w-[84px] items-center justify-center rounded-lg h-8 px-4 flex-row-reverse bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal w-fit">
                  <Text className="truncate">Add to Cart</Text>
                </TouchableOpacity>
              </View>
              <Image
                className="w-full rounded-lg flex-1"
                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9bfBPsBLUSUoEn9MwdDgQQe6B6-5xRsCDlb_kRo1cm5FsIp9rjHTpc7z1K1CfupXF5cfXnjSXqembuilfnqJtb0jqn4BSEtp6b6QRUx3qDploDu-ljiDecqyFtnYCib-hZu2FKsoMPKLstANf4j-MTBDy03Pd49ywv3WKoAm-93hZjkvTO2Zwipoq81DoU6QEIS7hAciVQFZUgXLtyrKUA7aBX_Ijfucs5CIgJssybxJG4CE9BrV56DAtZGP0VZ_ztVp4Ov4Abg" }}
                style={{ aspectRatio: 16/9 }}
              />
            </View>
          </View>
          <View className="flex flex-row flex-wrap gap-4 px-4 py-2 justify-between">
            <View className="flex flex-row items-center justify-center gap-2 px-3 py-2">
              <Heart size={24} color="#60758a" />
              <Text className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">25</Text>
            </View>
            <View className="flex flex-row items-center justify-center gap-2 px-3 py-2">
              <MessageCircle size={24} color="#60758a" />
              <Text className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">5</Text>
            </View>
            <View className="flex flex-row items-center justify-center gap-2 px-3 py-2">
              <Send size={24} color="#60758a" />
              <Text className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">3</Text>
            </View>
            <View className="flex flex-row items-center justify-center gap-2 px-3 py-2">
              <Star size={24} color="#60758a" />
              <Text className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">4</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default feed

const styles = StyleSheet.create({})

/* 
import { View, Text, ImageBackground, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const categories = ['All', 'Clothing', 'Electronics', 'Home Decor'];

  const products = [
    {
      title: 'Vintage Leather Jacket',
      price: '$120 · 4.5 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBnC3bfEW7K0VgqJYARGrdV6xhz4-8KeE3srUvQonlPbG4jCYAVQkLQPL6KhZCETl1kQ_2MIUs1QYb8_pK2XDy0P-goLgGg_cdN2qgbGKbKPdNbGhFMAqr-mFU0Up21paSvsyKuykPXxockAm74V_5vemh_JOBgYEReYHZj2zFRKuotcdzKZVxmWuS_6oMFXatNZhn3z5RAZvKDNzFJXylpsrPHCO7GHhiT9qDzX7ovlizHmOmpYUC0W0wqhxdqF0LO62VsQ8wLpA',
    },
    {
      title: 'Wireless Noise-Canceling Headphones',
      price: '$150 · 4.8 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDrIcmp5SR5ldhHV3izWWLQpAxkm-V5A_axsUNWO37wTF8p9Ls8eSP0swqwvjgy9Pm87ciKzWMr4CQr5Guykkg7Isx0kBbujQNBMbHgxLZ0egtJipFVGZQLOeQtjbJiBfei1lcsniU-RODuu3wUdgWg8h3meelpd1JNKBrKaiJd-gdzAi_GUoTo8MPg7Q9-iFIboxcz_ITQ3POVYlT2uSJ6GWOvGaoXRHv0wN7OQfqZK3bG8-74iY0EVqx49GeD8r6O2JgRSWNpqQ',
    },
    {
      title: 'Minimalist Wall Art',
      price: '$45 · 4.2 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBSSdfjiTWO0Vva2yOzVeMHi9zVcgHhE6DZABLviv5B5oN0U-SoFJsVdK4bd1t7X-wr9wymGbS4TU0AWpw6wrvdJNX_kyq1c4kdGnnbSq-oacDsncb-0XD39aCkvdmwnEGzxX2wnV1ohGIRi8IZKZRipyXx5BEtFPkyGx7juYU13AlM1EubOpMumXgo8LsTzZxA0pYTUNLBLP991G656z63Nvvz_nbcB7dQfq8RIGPS16CNnT2FuiJ9_r1GBm6A8KJ8hd9oq56nWw',
    },
    {
      title: 'Organic Cotton T-Shirt',
      price: '$30 · 4.6 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC6psAH6ch1uzqDW2G48J7gasaA_pgP_basUhY5TiUsRuMbBPPG-gcsKRyGo7TvPTR-atNJYGU8Op17qU_YmetzUnysm5xK0Bbz18i6TZQWtO5cmbpt3t9gkc1dmRJsZ8Fjo-yeQYbsEvXe7eKM2OtJ_Z3fHjxX6Wcmb5P5SRO0Gb1wr_36X-vmwjTWrdMrEm3p2jOQcgCJEIjkthnkc60ESDd8LyZEd4J3RHxWU-NePUAoPkJAtmDOJP5tEJ35fViTX20WASHhSA',
    },
    {
      title: 'Smart Home Security Camera',
      price: '$200 · 4.7 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBoyTeLsJXHssWXFjunE4OBHFz0gOXReIM5umxrohERXSykWbTL_cX9Iubmt4qcrhK4dCIN9fZY74NInNlAYBYsfk11ATU3VrYDDuaqvjuTU6Hyd2hKhzBfZ_jxWETfraAyQ2jHNK5BE0KF18UFEWlPEEAusYb4WwjClID9XFIDUy_YRsxRUNQjcQnnyzJLGYZqVB1HOkjC1eQPLEbI4tytCWSMsU7U7WtWPyzI_eJseNu5AxGuJeAdMA3HLd3Fswmh18lnnivspg',
    },
    {
      title: 'Handcrafted Ceramic Vase',
      price: '$60 · 4.9 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA-at7zHhuH3h080HJciA6ZPPgYZwkg3rUZU3fdORc4ZVc-aO18oCaJPn6ll6XkQasa3AEfi7YReqj-Vm9HCHb5GNpKnq9eVfg9Ta9s5gZ7yWUOWc14IP8jOcJTT8NyLWP0-BieqaWXyjoQYhD4eT4OsDBg4Fnub8QJYy4UnbXrRVnqFq10wcFH-OQ0ptV-IU6QYC0kzJXfTt-M1Q89AGEZMVFkSRSMw05NpXiR4JdfmuK1LR3wp1jyTaJv_4NTXByX3lSW6ZCzmA',
    },
  ];

const _layout = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="p-4 pb-2 flex-row justify-between items-center">
        <Text className="flex-1 text-lg font-bold text-center text-[#171311] pl-12">Marketplace</Text>
        <TouchableOpacity className="w-12 h-12 justify-center items-end">
          <Search size={24} color="#171311" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal className="px-3 py-2" showsHorizontalScrollIndicator={false}>
        {categories.map((cat, index) => (
          <View
            key={index}
            className="h-8 px-4 mx-1 rounded-full bg-[#f4f1f0] justify-center items-center"
          >
            <Text className="text-sm font-medium text-[#171311]">{cat}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row flex-wrap justify-between gap-3">
          {products.map((item, idx) => (
            <View key={idx} className="w-[48%] pb-3">
              <ImageBackground
                source={{ uri: item.image }}
                className="aspect-square rounded-xl overflow-hidden"
                resizeMode="cover"
              />
              <Text className="text-base font-medium text-[#171311] mt-2">{item.title}</Text>
              <Text className="text-sm text-[#876d64]">{item.price}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default _layout

const styles = StyleSheet.create({})

*/