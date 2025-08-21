import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { ArrowLeft, Image as ImageIcon } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../models/userContextProvider";
import { AccountType } from "../../models/auth";
import { registerUser } from "../../services/sections/auth";
import { useRouter } from "expo-router";
import { SignupStepTwo, register,useRegData } from "../../models/signupSteps";
import  Button  from "../../components/button"
const schema = z.object({
  Buyername: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  phone_number: z.string().min(1, "Phone number is required")
});

export default function UserInfoScreen() {

  const { setUser, setRole, role } = useUser();
  const { regData, setRegData } = useRegData();
  
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  const handleSubmitForm = async (data: z.infer<typeof schema>) => {
    const userData:SignupStepTwo = {
      buyer_data: {
        buyername: data.Buyername,
        shipping_address:{} //would be determined later
      },
      username: data.username,
      phone_number: data.phone_number,
    };

    // Update regData with the new user information
    setRegData(register(regData, userData));

    // send the user data to the backend here
    // may move this later to a another signup step

    console.log("Submitting user data:", regData);
    try {
      const userRegResult = await registerUser(regData)
      console.log("Registration successful:", userRegResult);
      router.push("/index");
    } catch (error) {
        console.error("Registration failed:", error);
    }
  }


  return (
    <ScrollView className="flex-1 bg-white">
      <View>
        {/* Header */}
        <View className="flex flex-row items-center bg-white p-4 pb-2 justify-between">
          <ArrowLeft size={24} color="#181111" />
          <Text className="text-[#181111] text-lg font-bold text-center flex-1 pr-12">
            Your info
          </Text>
        </View>

        {/* Name input */}
        {errors.Buyername && <Text className="text-[#e9242a] text-sm font-normal">{errors.Buyername.message}</Text>}
        <Input placeholder="Name" control={control} name="Buyername" errors={errors}> </Input>

         {/* Username */}
        {errors.username && <Text className="text-[#e9242a] text-sm font-normal">{errors.username.message}</Text>}
        <Input placeholder="Enter username" control={control} name="username" errors={errors}> </Input>

        {/* Phone Number */}
        {errors.phone_number && <Text className="text-[#e9242a] text-sm font-normal">{errors.phone_number.message}</Text>}
        <Input placeholder="Enter phone number" control={control} name="phone_number" errors={errors} keyboardType="phone-pad"> </Input>

      {/* Save button */}
      <Button onPress={handleSubmit(handleSubmitForm)} disabled={!isValid} />
      </View>
    </ScrollView>
  );
}
