import React, { useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../hooks/userContextProvider";
import { AccountType } from "../../models/auth";
import { useRouter } from "expo-router";
import { register, useRegData } from "../../models/signupSteps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider";
import * as Location from 'expo-location';
import { registerUser } from "../../services/sections/auth";

export default function AddAddressScreen() {
  const { show } = useToast();
  const router = useRouter();
  const { setUser } = useUser();
  const { regData, setRegData } = useRegData();
  const [location, setLocation] = React.useState<Location.LocationObject | null>(null);

  const locationSchema = z.object({
    street: z.string().min(1, "Street Address is required"),
    house_number: z.string().min(1, "House Number is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    postal_code: z.string().min(1, "Postal Code is required")
  });

  type LocationFormData = z.infer<typeof locationSchema>;

  const { register, control, handleSubmit, formState: { errors, isSubmitting}} =  useForm<LocationFormData>({
    resolver: zodResolver(locationSchema)
  });

  useEffect(() => {
    async function getCurrentLocation() {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        show({
          variant: "error",
          message: "Permission to access location was denied.",
          title: "Location Permission Denied"
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  const useCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      show({
        variant: "error",
        message: "Permission to access location was denied.",
        title: "Location Permission Denied"
      });
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
  }

  const onSkip = async () => {
    try {
      const userRegResult = await registerUser(regData); // keep consistent with updated data
      setUser({
        email: userRegResult.email.toLowerCase(),
        account_type: userRegResult.account_type,
      });
      show({
        variant: "success",
        title: "Location details saved",
        message: "We sent a verification code to your email.",
      });
      router.push("/emailVerification");
    } catch (error) {
      show({
        variant: "error",
        message: "Failed to move to the next step. Please try again.",
        title: "Error"
      });
    }
  }

  const onSubmit = async (data: LocationFormData) => {
    try {
      const updatedRegData = { ...regData, address: data };
      setRegData(updatedRegData);
      const userRegResult = await registerUser(updatedRegData); // keep consistent with updated data
      setUser({
        email: userRegResult.email.toLowerCase(),
        account_type: userRegResult.account_type,
      });
      show({
        variant: "success",
        title: "Location details saved",
        message: "We sent a verification code to your email.",
      });
      router.push("/emailVerification");
    } catch (error) {
      show({
        variant: "error",
        message: "Failed to save address. Please try again.",
        title: "Error"
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-white px-4" contentContainerStyle={{ justifyContent: 'space-between', flexGrow: 1 }}>
        <View className="w-full max-w-[480px] mx-auto">
          <View className="flex-row items-center justify-between pb-2 pt-4">
            <View className="size-12 justify-center">
              <ArrowLeft color="#171212" size={24} />
            </View>
            <Text className="text-[#171212] text-lg font-bold text-center pr-12 flex-1">
              Add Address
            </Text>
          </View>

          <Text className="text-[#171212] text-[22px] font-bold leading-tight text-left pb-3 pt-5">
            Where are you located?
          </Text>

          <TouchableOpacity className="min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#f4f1f1] text-[#171212] text-sm font-bold mb-4"
            onPress={useCurrentLocation}>
            <Text className="truncate">Use Current Location</Text>
          </TouchableOpacity>

          <View className="gap-4">
            <View>
              <Text className="text-[#171212] text-base font-medium pb-2">Street Address</Text>
              <Input placeholder="Street Address" control={control} name="streetAddress" errors={errors} />
              {errors.street && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.street.message as string}</Text>}
              {location && (<Text className="text-sm text-gray-500 mt-1">Detected: {location?.coords.latitude}, {location?.coords.longitude}</Text>
              )}
            </View>

            <View>
              <Text className="text-[#171212] text-base font-medium pb-2">House Number</Text>
              <Input placeholder="House Number" control={control} name="houseNumber" errors={errors} />
              {errors.house_number && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.house_number.message as string}</Text>}
            </View>

            <View>
              <Text className="text-[#171212] text-base font-medium pb-2">City</Text>
              <Input placeholder="City" control={control} name="city" errors={errors} />
              {errors.city && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.city.message as string}</Text>}
            </View>

            <View>
              <Text className="text-[#171212] text-base font-medium pb-2">State</Text>
              <Input placeholder="State" control={control} name="state" errors={errors} />
              {errors.state && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.state.message as string}</Text>}
            </View>

            <View>
              <Text className="text-[#171212] text-base font-medium pb-2">Country</Text>
              <Input placeholder="Country" control={control} name="country" errors={errors} />
              {errors.country && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.country.message as string}</Text>}
            </View>

            <View>
              <Text className="text-[#171212] text-base font-medium pb-2">Postal Code</Text>
              <Input placeholder="Postal Code" control={control} name="postalCode" errors={errors} />
            </View>
          </View>
        </View>

        <View className="w-full max-w-[480px] mx-auto py-4">
          <TouchableOpacity className="min-w-[84px] items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-[#e9b8ba] text-[#171212] text-base font-bold"
            onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
            <Text className="truncate">Save</Text>
          </TouchableOpacity>
          <TouchableOpacity className="min-w-[84px] items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-[#e9b8ba] text-[#171212] text-base font-bold"
            onPress={onSkip}>
            <Text>Skip</Text>
          </TouchableOpacity>
          <View className="h-5 bg-white" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
