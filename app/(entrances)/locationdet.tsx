import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../hooks/userContextProvider";
import { AccountType } from "../../models/auth";
import { useRouter } from "expo-router";
import { useRegData } from "../../models/signupSteps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider";
import * as Location from 'expo-location';
import { registerUser } from "../../services/sections/auth";

export default function AddAddressScreen() {
  const { show } = useToast();
  const router = useRouter();
  const { setUser, setRole } = useUser();
  const { regData, setRegData } = useRegData();
  const [location, setLocation] = React.useState<Location.LocationObject | null>(null);
  const [geocoding, setGeocoding] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const locationSchema = z.object({
    street: z.string().min(1, "Street Address is required"),
    house_number: z.string().min(1, "House Number is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    postal_code: z.string().min(1, "Postal Code is required")
  });

  type LocationFormData = z.infer<typeof locationSchema>;

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting: isFormSubmitting } } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  const reverseGeocodeAndAutofill = async (loc: Location.LocationObject) => {
    setGeocoding(true);
    try {
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (addr) {
        const a = addr as { street?: string; streetNumber?: string; city?: string; region?: string; country?: string; postalCode?: string; name?: string; district?: string; subregion?: string };
        setValue("street", a.street ?? a.name ?? "", { shouldValidate: false });
        setValue("house_number", a.streetNumber ?? a.district ?? "", { shouldValidate: false });
        setValue("city", a.city ?? a.subregion ?? "", { shouldValidate: false });
        setValue("state", a.region ?? "", { shouldValidate: false });
        setValue("country", a.country ?? "", { shouldValidate: false });
        setValue("postal_code", a.postalCode ?? "", { shouldValidate: false });
      }
    } catch {
      show({ variant: "error", title: "Address lookup", message: "Could not resolve address. Please type manually." });
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (!location) return;
    reverseGeocodeAndAutofill(location);
  }, [location?.coords?.latitude, location?.coords?.longitude]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      show({ variant: "error", title: "Permission denied", message: "Permission to access location was denied." });
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  };

  const onSkip = async () => {
    try {
      setIsSubmitting(true);
      const userRegResult = await registerUser(regData);
      const accountType = (userRegResult.current_role ?? userRegResult.account_type) as "buyer" | "seller";
      setUser({
        email: userRegResult.email.toLowerCase(),
        account_type: accountType,
        user_id: userRegResult.id,
      });
      setRole(accountType);
      show({ variant: "success", title: "Registration complete", message: "Add your profile picture (optional)." });
      router.push("/addProfilePicture");
    } catch (error) {
      show({
        variant: "error",
        message: "Failed to complete registration. Please try again.",
        title: "Error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: LocationFormData) => {
    try {
      setIsSubmitting(true);

      const finalRegData = { ...regData, address: data };
      const userRegResult = await registerUser(finalRegData);
      const accountType = (userRegResult.current_role ?? userRegResult.account_type) as "buyer" | "seller";
      setUser({
        email: userRegResult.email.toLowerCase(),
        account_type: accountType,
        user_id: userRegResult.id,
      });
      setRole(accountType);
      show({ variant: "success", title: "Registration complete", message: "Add your profile picture (optional)." });
      router.push("/addProfilePicture");
    } catch (error) {
      show({
        variant: "error",
        message: "Failed to save address and complete registration. Please try again.",
        title: "Error"
      });
    } finally {
      setIsSubmitting(false);
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

          <TouchableOpacity
            className="min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#f4f1f1] text-[#171212] text-sm font-bold mb-4"
            onPress={useCurrentLocation}
            disabled={geocoding}
          >
            {geocoding ? <ActivityIndicator size="small" color="#171212" /> : <Text className="truncate">Use Current Location</Text>}
          </TouchableOpacity>

          <View className="gap-4">
            <View>
              <Text className="text-[#171212] text-base font-medium pb-2">Street Address</Text>
              <Input placeholder="Street Address" control={control} name="street" errors={errors} />
              {errors.street && <Text className="text-[#e9242a] text-xs font-medium mb-1">{errors.street.message as string}</Text>}
              {location && !geocoding && (
                <Text className="text-sm text-gray-500 mt-1">Detected: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}</Text>
              )}
            </View>

            <View>
              <Text className="text-[#171212] text-base font-medium pb-2">House Number</Text>
              <Input placeholder="House Number" control={control} name="house_number" errors={errors} />
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
              <Input placeholder="Postal Code" control={control} name="postal_code" errors={errors} />
            </View>
          </View>
        </View>

        <View className="w-full max-w-[480px] mx-auto py-4 gap-3">
          <TouchableOpacity
            className="min-w-[84px] items-center justify-center rounded-full h-12 px-5 bg-primary"
            onPress={handleSubmit(onSubmit)}
            disabled={isFormSubmitting || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Save address"
          >
            <Text className="text-white text-base font-bold">{isSubmitting ? "Saving…" : "Save"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="min-w-[84px] items-center justify-center rounded-full h-12 px-5 bg-bg-muted"
            onPress={onSkip}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Skip and continue without address"
          >
            <Text className="text-text-primary text-base font-semibold">{isSubmitting ? "Processing…" : "Skip"}</Text>
          </TouchableOpacity>
          <View className="h-5" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
