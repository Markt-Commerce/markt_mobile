import React from "react";
import { useRouter, Link } from "expo-router";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser } from "../../services/sections/auth";
import { AccountType } from "../../models/auth"; 
import { useUser } from "../../models/userContextProvider";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginScreen() {

  const onsubmit = async (data: z.infer<typeof schema>) => {
    try {
      const userData = await loginUser({
        email: data.email,
        password: data.password,
        account_type: useUser().role || "buyer", // default to Buyer if not set
      })
      console.log("Login successful:", userData);
      useUser().setUser({
        id: userData.id,
        name: userData.username,
        email: userData.email,
      }); //store user data in context
    }
    catch (error) {
      console.error("Login failed:", error);
    }

  }

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  return (
    <View className="flex-1 bg-white justify-center items-center px-4">
      <View className="w-full max-w-[480px]">
        <Text className="text-[#171212] text-[28px] font-bold leading-tight text-center pb-3 pt-5">
          Welcome back
        </Text>

        <View className="flex flex-wrap items-end gap-4 py-3">
        {errors.email && <Text className="text-[#e9242a] text-sm font-normal">{errors.email.message}</Text>}
          <Controller control={control} name="email" render={({ field: { onChange, onBlur, value }})=>{
            return (
              <TextInput
                onChange={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="Email"
                placeholderTextColor="#826869"
                className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
              />
            );
          }} />
        </View>

        <View className="flex flex-wrap items-end gap-4 py-3">
        {errors.password && <Text className="text-[#e9242a] text-sm font-normal">{errors.password.message}</Text>}
          <Controller control={control} name="password" render={({ field: { onChange, onBlur, value }})=>{
            return (
              <TextInput
                onChange={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="Password"
                placeholderTextColor="#826869"
                secureTextEntry
                className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
              />
            );
          }} />
        </View>

        <Link href={
          "/forgotPassword"
        }>
          <Text className="text-[#826869] text-sm font-normal text-center underline pb-3 pt-1">
            Forgot Password?
          </Text>
        </Link>


        <View className="flex flex-row justify-between items-center py-3">
          <TouchableOpacity onPress={() => useUser().setRole("buyer")}>
            <Text className={`text-[#171212] text-sm font-normal ${useUser().role === "buyer" ? "font-bold" : ""}`}>
              Buyer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => useUser().setRole("buyer")}>
            <Text className={`text-[#171212] text-sm font-normal ${useUser().role === "seller" ? "font-bold" : ""}`}>
              Seller
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="w-full h-12 bg-[#e9b8ba] rounded-full justify-center items-center" 
        onPress={handleSubmit(onsubmit)} 
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? '#e9b8ba' : '#f4f1f1',
        }}
        >
          <Text className="text-[#171212] text-base font-bold tracking-[0.015em]">
            Login
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-white" />
    </View>
  );
}
