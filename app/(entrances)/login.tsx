import React from "react";
import { useRouter, Link } from "expo-router";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser } from "../../services/sections/auth";
import { useUser } from "../../hooks/userContextProvider";
import { Input } from "../../components/inputs";
import Button from "../../components/button";
//import * as SecureStore from 'expo-secure-store';

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
        email: userData.email.toLowerCase(),
        account_type: userData.account_type,
      }); //store user data in context
      //navigate to the home page

      //store user in secure store
      /* await SecureStore.setItemAsync('user', JSON.stringify({
        email: data.email,
        password: data.password,
        userType: role || "buyer",
      })); */
      
      router.push("/");
    }
    catch (error) {
      console.error("Login failed:", error);
      setError("Login failed." + (error instanceof Error ? ` ${error.message}` : ""));
      //work on adding cleanup for failed login attempts
      //SecureStore.deleteItemAsync('user');
      setUser(null);
      //router.push("/"); // redirect to login page on error
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
              backgroundColor: role === "buyer" ? '#E94C2A' : 'transparent',
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
              backgroundColor: role === "seller" ? '#E94C2A' : 'transparent',
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

        {/* Save button */}
      <Button onPress={handleSubmit(onsubmit)} disabled={!isValid} text="Login"/>
      </View>

      <Text className="text-[#E94C2A] text-sm font-normal text-center underline pb-3 pt-1" onPress={() => router.navigate("/signup")}>
          Don't have an account? Sign up
      </Text>
    </View>
  );
}
