import React from "react";
import { useRouter, Link } from "expo-router";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser } from "../../services/sections/auth";
import { AccountType } from "../../models/auth"; 
import { useUser } from "../../models/userContextProvider";
import { Input } from "../../components/inputs";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginScreen() {

  const router = useRouter();
  const { role, setRole, setUser } = useUser();

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onsubmit = async (data: z.infer<typeof schema>) => {
    try {
      const userData = await loginUser({
        email: data.email,
        password: data.password,
        account_type: role || "buyer", // default to Buyer if not set
      })
      setError(null); // clear any previous errors
      console.log("Login successful:", userData);//remember to clear this later
      setUser({
        id: userData.id,
        name: userData.username,
        email: userData.email,
      }); //store user data in context
    }
    catch (error) {
      console.error("Login failed:", error);
      setError("Login failed." + (error instanceof Error ? ` ${error.message}` : ""));
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

        { error && <Text className="text-[#e9242a] text-sm font-normal text-center">{error}</Text> }

        <View className="flex gap-4 py-3">
        {errors.email && <Text className="text-[#e9242a] text-sm font-normal">{errors.email.message}</Text>}
          <Input placeholder="Email" control={control} name="email" errors={errors} />
        </View>

        <View className="flex gap-4 py-3">
        {errors.password && <Text className="text-[#e9242a] text-sm font-normal">{errors.password.message}</Text>}
        <Input placeholder="Password" control={control} name="password" errors={errors} secureTextEntry={true} />
        </View>

        <Link href={
          "/forgotPassword"
        }>
          <Text className="text-[#826869] text-sm font-normal text-center underline pb-3 pt-1">
            Forgot Password?
          </Text>
        </Link>


        <View className="flex-row bg-gray-200 rounded-full p-1">
          <TouchableOpacity
            onPress={() => setRole("buyer")}
            style={{
              flex: 1,
              backgroundColor: role === "buyer" ? '#e9242a' : 'transparent',
              borderTopLeftRadius: 25,
              borderBottomLeftRadius: 25,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: role === "buyer" ? '#fff' : '#171212',
                fontWeight: role === "buyer" ? 'bold' : 'normal',
              }}
            >
              Buyer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRole("seller")}
            style={{
              flex: 1,
              backgroundColor: role === "seller" ? '#e9242a' : 'transparent',
              borderTopRightRadius: 25,
              borderBottomRightRadius: 25,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: role === "seller" ? '#fff' : '#171212',
                fontWeight: role === "seller" ? 'bold' : 'normal',
              }}
            >
              Seller
            </Text>
          </TouchableOpacity>
        </View>


        <TouchableOpacity className="w-full h-12 bg-[#e9242a] rounded-full justify-center items-center" 
        onPress={handleSubmit(onsubmit)} 
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? '#e9242a' : '#f4f1f1',
        }}
        >
          <Text className="text-[white] text-base font-bold tracking-[0.015em]">
            Login
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-white" />
    </View>
  );
}
