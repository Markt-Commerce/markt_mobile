import React from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { ArrowLeft, X } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "../../hooks/userContextProvider";
import { SignupStepTwo, register, useRegData } from "../../models/signupSteps";
import { getAllCategories } from "../../services/sections/categories";
import { Category } from "../../models/categories";
import { useRouter } from "expo-router";
import { CategoryAddition }  from "../../components/categoryAddition";
import { registerUser } from "../../services/sections/auth";
import { Input } from "../../components/inputs";
import Button from "../../components/button";
//import * as SecureStore from 'expo-secure-store';

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
            //Todo: handle error appropriately, e.g., show a message to the user in the UI 
        }
    }
    fetchCategories();
+ ++++++++ }, []);

  const handleSubmitForm = async (data: z.infer<typeof schema>) => {
    const shopData:SignupStepTwo = {
      username: data.userName,
      phone_number: data.phoneNumber,
      seller_data: {
      policies:{},// would be determined later
      description: data.shopDescription,
      shop_name: data.shopName,
      category_ids: selectedCategories.map(c => c.id),
    }
    };

    //update regData with the new shop information
    const updatedRegData = register(regData, shopData);
    //remove any fields related to buyer data
    delete updatedRegData.buyer_data;
    setRegData(updatedRegData);

    console.log("Submitting user data:", regData);

    // send the user data to the backend here
    // may move this later to a another signup step
    try {
        const userRegResult = await registerUser(regData)
        //store user in secure store
        /* await SecureStore.setItemAsync('user', JSON.stringify({
          email: regData.email,
          password: regData.password,
          userType: regData.account_type,
        })); */
        setUser({
          email: userRegResult.email.toLowerCase(),
          account_type: userRegResult.account_type,
        });
        router.push("/");
    } catch (error) {
        console.error("Registration failed:", error);
    }
  }

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
        {errors.shopName && <Text className="text-[#e9242a] text-sm font-normal">{errors.shopName.message}</Text>}
        <Input placeholder="Enter shop name" control={control} name="shopName" errors={errors}> </Input>

        {/* Username */}
        {errors.userName && <Text className="text-[#e9242a] text-sm font-normal">{errors.userName.message}</Text>}
        <Input placeholder="Enter username" control={control} name="userName" errors={errors}> </Input>

        {/* Phone Number */}
        {errors.phoneNumber && <Text className="text-[#e9242a] text-sm font-normal">{errors.phoneNumber.message}</Text>}
        <Input placeholder="Enter phone number" control={control} name="phoneNumber" errors={errors}> </Input>

        {/* Shop Description */}
        {errors.shopDescription && <Text className="text-[#e9242a] text-sm font-normal">{errors.shopDescription.message}</Text>}
        <Input placeholder="Enter shop description" control={control} name="shopDescription" errors={errors} multiline> </Input>

        {/* Product Categories */}
        <Text className="text-[#181111] text-lg font-bold px-4 pb-2 pt-4">Product Categories</Text>

        {/* Note/Todo: This should probably be added to a separate component, since it could be reused */}
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
      </View>

      {/* Save button */}
      <Button onPress={handleSubmit(handleSubmitForm)} disabled={!isValid} text="Next"/>

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
