import { StyleSheet, Text, View, TextInput, ScrollView, ImageBackground, FlatList, TouchableOpacity, } from 'react-native'
import React from 'react'
import { ArrowLeft, Home, Boxes, Search, ShoppingCart, User } from "lucide-react-native";


const featuredNiches = [
    { id: 1, name: "Fashion", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs_Y_KIddPgQe4Nk_i7fudsbqIOUU2BcdioQBIYaUDpNBF7oJeCFZ_fCxZqt0SZFClDZEFzzYOAZVoQtdghYSQ851ML45qpRjDWVS9lx0S5a78TQq3E-eLBxoiNEx0gyqf6wV6mMbenPQfPSycwR0BsLP3msa5r42SAYlM_lnlXhn7PPzYGBuUYxVn8HpFIhw7mSIvQdo_pAiAyQKhDEmEL2QnijsamZYZ7C-6WJq6YHs0SZbK4HQU0NKqTrYjojRCjOCuNuxUSw" },
    { id: 2, name: "Tech", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs_Y_KIddPgQe4Nk_i7fudsbqIOUU2BcdioQBIYaUDpNBF7oJeCFZ_fCxZqt0SZFClDZEFzzYOAZVoQtdghYSQ851ML45qpRjDWVS9lx0S5a78TQq3E-eLBxoiNEx0gyqf6wV6mMbenPQfPSycwR0BsLP3msa5r42SAYlM_lnlXhn7PPzYGBuUYxVn8HpFIhw7mSIvQdo_pAiAyQKhDEmEL2QnijsamZYZ7C-6WJq6YHs0SZbK4HQU0NKqTrYjojRCjOCuNuxUSw" },
    { id: 3, name: "Beauty", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs_Y_KIddPgQe4Nk_i7fudsbqIOUU2BcdioQBIYaUDpNBF7oJeCFZ_fCxZqt0SZFClDZEFzzYOAZVoQtdghYSQ851ML45qpRjDWVS9lx0S5a78TQq3E-eLBxoiNEx0gyqf6wV6mMbenPQfPSycwR0BsLP3msa5r42SAYlM_lnlXhn7PPzYGBuUYxVn8HpFIhw7mSIvQdo_pAiAyQKhDEmEL2QnijsamZYZ7C-6WJq6YHs0SZbK4HQU0NKqTrYjojRCjOCuNuxUSw" },
  ];

const profile = () => {
    return (
        <View className="flex-1 bg-white">
          {/* Top Bar */}
          <View className="flex-row items-center justify-between p-4 pb-2">
            <ArrowLeft color="#171312" size={24} />
            <Text className="flex-1 text-center text-lg font-bold text-[#171312] pr-6">
              Niches
            </Text>
          </View>
    
          {/* Search Box */}
          <View className="flex-row items-center bg-[#f4f2f1] rounded-xl mx-4 px-3 h-12">
            <Search color="#826f68" size={24} />
            <TextInput
              className="flex-1 text-base ml-2 text-[#171312]"
              placeholder="Search niches"
              placeholderTextColor="#826f68"
            />
          </View>
    
          {/* Featured Section */}
          <Text className="text-[22px] font-bold text-[#171312] mt-5 mb-2 mx-4">
            Featured
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="pl-4 space-x-3"
          >
            {featuredNiches.map((item) => (
              <View key={item.id} className="w-32">
                <ImageBackground
                  source={{ uri: item.image }}
                  className="w-full aspect-square rounded-xl overflow-hidden"
                  imageStyle={{ borderRadius: 12 }}
                />
                <Text className="mt-2 text-base font-medium text-[#171312]">
                  {item.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )
}

export default profile

const styles = StyleSheet.create({})
