import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../models/userContextProvider";
import { AccountType } from "../../models/auth";
import { useRouter } from "expo-router";
import { useRegData } from "../../models/signupSteps";

const schema = z.object({
  username: z.string().min(6, "Username is required"),
  password: z.string().min(8, "Password is required and should be 8 characters long").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  email: z.email("Invalid email address"),
});

export default function SignupScreen() {

  const { setUser, setRole, role } = useUser();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const setUserRole = (role: AccountType) => {
    setRole(role);
  }

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      //setUserRole();
      router.push("/entrances/userdet");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center px-4">
      <View className="w-full max-w-[480px]">
        <View className="flex-row items-center justify-between pb-2">
          <View className="size-12 justify-center">
            <ArrowLeft color="#171212" size={24} />
          </View>
          <Text className="text-[#171212] text-lg font-bold text-center pr-12 flex-1">
            Sign up
          </Text>
        </View>

        <View className="flex gap-4 py-3">
          {errors.email && <Text className="text-[#e9242a] text-sm font-normal">{errors.email.message}</Text>}
          <Input placeholder="Email" control={control} name="email" errors={errors}> </Input>
          {errors.username && <Text className="text-[#e9242a] text-sm font-normal">{errors.username.message}</Text>}
          <Input placeholder="Username" control={control} name="username" errors={errors}></Input>
          {errors.password && <Text className="text-[#e9242a] text-sm font-normal">{errors.password.message}</Text>}
          <Input placeholder="Password" control={control} name="password" errors={errors} secureTextEntry={true}></Input>
        </View>

        <View className="flex flex-row justify-between items-center py-3">
          <TouchableOpacity onPress={() => setRole("buyer")}>
            <Text className={`text-[#171212] text-sm font-normal ${role === "buyer" ? "font-bold" : ""}`}>
              Buyer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRole("buyer")}>
            <Text className={`text-[#171212] text-sm font-normal ${role === "seller" ? "font-bold" : ""}`}>
              Seller
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-[#826869] text-sm font-normal text-center underline pb-3 pt-1">
          Already have an account? Log in
        </Text>

        <TouchableOpacity className="w-full h-12 bg-[#e9b8ba] rounded-full justify-center items-center" disabled={!isValid}
        style={{
          backgroundColor: isValid ? '#e9b8ba' : '#f4f1f1',
        }} onPress={handleSubmit(onSubmit)}>
          <Text className="text-[#171212] text-base font-bold tracking-[0.015em]">
            Sign up
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-white" />
    </View>
  );
}