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