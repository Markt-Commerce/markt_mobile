import React from "react";
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, StyleSheet } from "react-native";



const posts = () => {

    const examplePosts = [
        {
          id: 1,
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs_Y_KIddPgQe4Nk_i7fudsbqIOUU2BcdioQBIYaUDpNBF7oJeCFZ_fCxZqt0SZFClDZEFzzYOAZVoQtdghYSQ851ML45qpRjDWVS9lx0S5a78TQq3E-eLBxoiNEx0gyqf6wV6mMbenPQfPSycwR0BsLP3msa5r42SAYlM_lnlXhn7PPzYGBuUYxVn8HpFIhw7mSIvQdo_pAiAyQKhDEmEL2QnijsamZYZ7C-6WJq6YHs0SZbK4HQU0NKqTrYjojRCjOCuNuxUSw",
          text: "New arrivals! Check out our latest collection of handmade jewelry.",
          timestamp: "Posted 2 days ago",
          stats: "23 likes · 5 comments",
        },
        {
          id: 2,
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJg1p4lnLemvidcIsM7_z-0AY6qmM7W0-G87X6-wpXnhGF1KrTJ5O-_Q8eD5T_s9igezyUgZHTF5b83i91njemUIa1XTbrnEbnkTGpz97l_RIE1C0hs_9K4MLATiTUy4P_6V65UWaXXHyhOgtHb1SoMsCBH3Ml11oBWMrKY71cgGRgb0um3OZDIVteEZGEvvDxe6yuaHNwc4nrDEGn8tvGYq3yBih5oRt22foVb5phQ_viSzoifTOynY9_vAbT58Ec-6rl91hYTA",
          text: "Flash sale on all summer dresses! Limited time offer.",
          timestamp: "Posted 1 week ago",
          stats: "15 likes · 2 comments",
        },
        {
          id: 3,
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJni0sfcEJ6uOcWPfKLH3Aq4gC8Gr_6q6lzkAhD6rkdKgWv56C-fq_5We6Een_sh8NZsJ0SsWopDMVJYJgLFq3ztNDxr91WGL9OBKhDYPXrAtO0zQBhA8qgeMyAmgTc_-wUb5ZCRI_G8yQpNmoDA9zp4Moy7p6MFMD_7c3ggkFZP5Ss0M8dLwVYg-60usMWH6nPvwbCO9mal-A_FnlRgF2F7e-hvb3ROUb1YtAq7Gaj-yUHQaC0225wYh2Dn__b2zNy9_ckse0CA",
          text: "Behind the scenes: Watch how we craft our signature candles.",
          timestamp: "Posted 2 weeks ago",
          stats: "32 likes · 10 comments",
        },
      ];

    return (
        <ScrollView className="flex-1 bg-white px-4 pt-4">
          <Text className="text-[#171312] text-lg font-bold">Create a Post</Text>
    
          <View className="flex-row mt-4 gap-3">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCZiQKhrlBZsDeX-1f8h2RpYwhKVYlqwXQVsdKrrC-ou_bY7XnQG-7rT7NAj19K5p46CXaW60SbZCXmUyb0rtPofVp8t1Rm61UBd3R4wliNdMWGXQnoagfKDnrpR30D0_Uw4z5Eeuve0xY6_4evjQQnd929IVpf4PCVE71xDuooXzEEkMwduZ1R-MWHBJcq9bkCYanWZIDhcKvihRBkxyk6vlrbERpOmiH2eOw5nRpQP7tEA92_urWGAPvFb7Nfh8vd-s-Y9bMyA",
              }}
              className="rounded-full w-10 h-10 bg-gray-200"
            />
            <View className="flex-1 border border-[#e4dfdd] rounded-xl overflow-hidden">
              <TextInput
                multiline
                placeholder="Share a new update, promotion, or product highlight"
                placeholderTextColor="#cbc1be"
                className="p-4 text-base text-[#171312]"
                style={{ minHeight: 80 }}
              />
              <View className="flex-row justify-end items-center border-t border-[#e4dfdd] px-4 py-2">
                {/* Placeholder icons */}
                <Text className="text-[#826f68] text-sm mr-4">📷</Text>
                <Text className="text-[#826f68] text-sm">🏷️</Text>
              </View>
            </View>
          </View>
    
          <Text className="text-[#171312] text-lg font-bold mt-6 mb-2">Existing Posts</Text>
    
          {examplePosts.map((post) => (
            <View key={post.id} className="flex-row gap-4 bg-white py-3">
              <Image
                source={{ uri: post.image }}
                className="rounded-lg w-[70px] h-[70px] bg-gray-100"
              />
              <View className="flex-1 justify-center">
                <Text className="text-[#171312] text-base font-medium">{post.text}</Text>
                <Text className="text-[#826f68] text-sm mt-1">{post.timestamp}</Text>
                <Text className="text-[#826f68] text-sm">{post.stats}</Text>
              </View>
            </View>
          ))}
    
          <View className="flex justify-end items-end mt-8 mb-5">
            <TouchableOpacity className="flex-row items-center gap-2 px-6 py-3 rounded-full bg-[#e2ad9c]">
              <Text className="text-[#171312] text-base font-bold">+</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
}

export default posts

const styles = StyleSheet.create({})