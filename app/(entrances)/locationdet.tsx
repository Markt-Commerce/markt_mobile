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
import Button from "../../components/button";
import { useTheme } from "../../components/themeProvider";

export default function AddAddressScreen() {
  const { show } = useToast();
  const router = useRouter();
  const { setUser, setRole } = useUser();
  const { regData, setRegData } = useRegData();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";
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

  const Label = ({ children }: { children: React.ReactNode }) => (
    <Text className={`mb-2 text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>{children}</Text>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#2f3132]" : "bg-white"}`}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[480px] mx-auto">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-8 pt-4 px-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className={`h-10 w-10 items-center justify-center rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
            >
              <ArrowLeft color={iconColor} size={20} />
            </TouchableOpacity>
            <Text className={`text-xl font-geist font-bold text-center flex-1 pr-10 ${isDark ? "text-[#f0f1f2]" : "text-[#000000]"}`}>
              Your location
            </Text>
          </View>

          {/* Progress hint */}
          <View className="flex-row gap-2 items-center justify-center mb-10 px-10">
            <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#f0f1f2]" : "bg-secondary"}`} />
            <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#f0f1f2]" : "bg-secondary"}`} />
            <View className={`h-1.5 flex-1 rounded ${isDark ? "bg-[#f0f1f2]" : "bg-secondary"}`} />
          </View>

          <View className="px-4">
            <View className={`rounded border px-6 py-8 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
              <Text className={`text-[24px] font-geist font-bold leading-tight mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                Where are you based?
              </Text>
              <Text className={`font-inter text-sm mb-8 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                This helps us show you relevant products and calculate shipping.
              </Text>

              <TouchableOpacity
                className={`flex-row items-center justify-center rounded h-11 px-6 border mb-8 ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
                onPress={useCurrentLocation}
                disabled={geocoding}
              >
                {geocoding ? <ActivityIndicator size="small" color={iconColor} /> : <Text className={`font-geist font-bold text-xs tracking-widest uppercase ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}>Use Current Location</Text>}
              </TouchableOpacity>

              <View className="gap-6">
                <View>
                  <Label>Street Address</Label>
                  <Input placeholder="123 Main St" control={control} name="street" errors={errors} />
                  {location && !geocoding && (
                    <Text className={`text-[10px] font-inter mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Detected near you</Text>
                  )}
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Label>House No.</Label>
                    <Input placeholder="A-1" control={control} name="house_number" errors={errors} />
                  </View>
                  <View className="flex-[2]">
                    <Label>Postal Code</Label>
                    <Input placeholder="10001" control={control} name="postal_code" errors={errors} />
                  </View>
                </View>

                <View>
                  <Label>City</Label>
                  <Input placeholder="New York" control={control} name="city" errors={errors} />
                </View>

                <View>
                  <Label>State / Region</Label>
                  <Input placeholder="NY" control={control} name="state" errors={errors} />
                </View>

                <View className="mb-4">
                  <Label>Country</Label>
                  <Input placeholder="United States" control={control} name="country" errors={errors} />
                </View>
              </View>

              <View className="mt-6 gap-3">
                <Button
                  onPress={handleSubmit(onSubmit)}
                  disabled={isFormSubmitting || isSubmitting}
                  text="Save & Finish"
                  variant="conversion"
                />
                <TouchableOpacity
                  className="h-12 items-center justify-center"
                  onPress={onSkip}
                  disabled={isSubmitting}
                >
                  <Text className={`font-inter text-sm underline ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
