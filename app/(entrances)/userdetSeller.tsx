import React from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../models/userContextProvider";
import { AccountType } from "../../models/auth";
import { router, useRouter } from "expo-router";
import { register,useRegData } from "../../models/signupSteps";

const ShopInformationScreen = () => {
    const router = useRouter();

    const { setUser, setRole, role } = useUser();
    const { regData, setRegData } = useRegData();

    const schema = z.object({
        shopName: z.string().min(1, "Shop name is required"),
        shopDescription: z.string().min(1, "Shop description is required"),
        directions: z.string().min(1, "Directions are required"),
    });

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(schema),
        mode: "onChange"
    });
    return (
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ justifyContent: "space-between" }}>
        {/* Header */}
        <View className="flex-row items-center bg-white p-4 pb-2 justify-between">
            <ArrowLeft color="#181111" size={24} onPress={router.back}/>
            <Text className="text-[#181111] text-lg font-bold text-center flex-1 pr-12">
            Shop Information
            </Text>
        </View>

        {/* Form Fields */}
        <View className="px-4 py-3 flex flex-wrap max-w-[480px]">
            {/* Shop Name */}
            <View className="flex-1 flex-col min-w-[160px] mb-4">
            <Text className="text-[#181111] text-base font-medium pb-2">Shop Name</Text>
            <TextInput
                className="bg-[#f4f0f0] rounded-xl p-4 text-[#181111] text-base"
                placeholder="Enter shop name"
                placeholderTextColor="#886364"
            />
            </View>

            {/* Shop Description */}
            <View className="flex-1 flex-col min-w-[160px] mb-4">
            <Text className="text-[#181111] text-base font-medium pb-2">Shop Description</Text>
            <TextInput
                className="bg-[#f4f0f0] rounded-xl p-4 text-[#181111] text-base min-h-[144px]"
                placeholder="Enter shop description"
                placeholderTextColor="#886364"
                multiline
            />
            </View>

            {/* Product Categories */}
            <Text className="text-[#181111] text-lg font-bold px-4 pb-2 pt-4">Product Categories</Text>
            <View className="flex-row flex-wrap gap-3 p-3 pr-4">
            {["Jewelry", "Home Decor", "Accessories", "Art", "Gifts"].map((cat) => (
                <View key={cat} className="flex-row items-center justify-center h-8 rounded-full bg-[#f4f0f0] px-4">
                <Text className="text-[#181111] text-sm font-medium">{cat}</Text>
                </View>
            ))}
            </View>

            {/* How to Get to Our Shop */}
            <View className="flex-1 flex-col min-w-[160px] mb-4">
            <Text className="text-[#181111] text-base font-medium pb-2">How to Get to Our Shop</Text>
            <TextInput
                className="bg-[#f4f0f0] rounded-xl p-4 text-[#181111] text-base min-h-[144px]"
                placeholder="Directions to shop"
                placeholderTextColor="#886364"
                multiline
            />
            </View>
        </View>

        {/* Save Button */}
        <View className="px-4 py-3">
            <TouchableOpacity className="bg-[#e9242a] rounded-full h-12 px-5 flex-1 justify-center items-center">
            <Text className="text-white text-base font-bold tracking-[0.015em]">Save Changes</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    );
};

export default ShopInformationScreen;
