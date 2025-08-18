import React from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { ArrowLeft, X } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "../../models/userContextProvider";
import { useRegData } from "../../models/signupSteps";
import { getAllCategories } from "../../services/sections/categories";
import { Category } from "../../models/categories";
import { useRouter } from "expo-router";
import { CategoryAddition }  from "../../components/categoryAddition";

const ShopInformationScreen = () => {
  const { setUser, setRole, role } = useUser();
  const { regData, setRegData } = useRegData();

  const router = useRouter();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);
  const [modalVisible, setModalVisible] = React.useState(false);

  const schema = z.object({
    shopName: z.string().min(1, "Shop name is required"),
    userName: z.string().min(1, "Username is required"),
    shopDescription: z.string().min(1, "Shop description is required"),
    directions: z.string().min(1, "Directions are required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
  });

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  React.useEffect(() => {
    async function fetchCategories() {
        try {
            const cats = await getAllCategories();
            setCategories(cats);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            // Handle error appropriately, e.g., show a message to the user in the UI 
        }
    }
    fetchCategories();
  }, []);

  const removeCategory = (id: Number) => {
    setSelectedCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center bg-white p-4 pb-2 justify-between">
        <ArrowLeft color="#181111" size={24} onPress={() => router.back()} />
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

        {/* Username */}
        <View className="flex-1 flex-col min-w-[160px] mb-4">
          <Text className="text-[#181111] text-base font-medium pb-2">Username</Text>
          <TextInput
            className="bg-[#f4f0f0] rounded-xl p-4 text-[#181111] text-base"
            placeholder="Enter username"
            placeholderTextColor="#886364"
          />
        </View>

        {/* Phone Number */}
        <View className="flex-1 flex-col min-w-[160px] mb-4">
          <Text className="text-[#181111] text-base font-medium pb-2">Phone Number</Text>
          <TextInput
            className="bg-[#f4f0f0] rounded-xl p-4 text-[#181111] text-base"
            placeholder="Enter phone number"
            placeholderTextColor="#886364"
            keyboardType="phone-pad"
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
          {selectedCategories.map(cat => (
            <View key={cat.id.toString()} className="flex-row items-center bg-[#f4f0f0] rounded-full px-3 py-1">
              <Text className="text-[#181111] text-sm font-medium mr-2">{cat.name}</Text>
              <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                <X size={16} color="#181111" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="bg-[#e9242a] rounded-full px-4 py-2 justify-center items-center"
          >
            <Text className="text-white text-sm font-bold">+ Add Categories</Text>
          </TouchableOpacity>
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
        <TouchableOpacity className="bg-[#e9242a] rounded-full h-12 px-5 flex-1 justify-center items-center" 
        disabled={!isValid}
        style={{
            backgroundColor: isValid ? '#e9242a' : '#f4f1f1',
          }}
          >
          <Text  className="text-white text-base font-bold tracking-[0.015em]"
          style={{
            color: isValid ? '#ffffff' : '#886364',
          }}
          >Next</Text>
        </TouchableOpacity>
      </View>

      <CategoryAddition
        visible={modalVisible}
        categories={categories}
        parentSelectedCategories={selectedCategories}
        onClose={() => setModalVisible(false)}
        onConfirm={(selected) => setSelectedCategories(selected)}
        />

    </ScrollView>
  );
};

export default ShopInformationScreen;
