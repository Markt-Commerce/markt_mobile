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
import { useTokens } from "../../theme/useTokens";

export default function AddAddressScreen() {
  const { show } = useToast();
  const router = useRouter();
  const { setUser, setRole } = useUser();
  const { regData, setRegData } = useRegData();
  const t = useTokens();
  const iconColor = t.textPrimary;
  const [location, setLocation] = React.useState<Location.LocationObject | null>(null);
  const [geocoding, setGeocoding] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const locationSchema = z.object({
    street: z.string().min(1, "Street Address is required"),
    house_number: z.string().min(1, "House Number is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    postal_code: z.string().optional()
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

        // Each field is filled from *its own* component, and a token is never
        // written to more than one.
        //
        // The bug this replaces: `street` fell back to `a.name` and `city` to
        // `a.subregion`. In peri-urban Nigeria expo-location returns null for
        // street and city and the LGA ("Lagelu") for both name and subregion,
        // so the two chains converged and Street and City showed the same
        // word. A field left blank is honest; the same token in two fields is
        // not.
        const used = new Set<string>();
        const take = (...candidates: (string | undefined)[]) => {
          for (const c of candidates) {
            const v = (c ?? "").trim();
            if (v && !used.has(v.toLowerCase())) {
              used.add(v.toLowerCase());
              return v;
            }
          }
          return "";
        };

        // Order matters. Unambiguous components are claimed first, then the
        // administrative ones, and only then does `street` fall back to
        // `a.name` — which in Nigeria is usually the LGA, not a street. Letting
        // street take it first put "Lagelu" in the Street box, which is wrong
        // in a different way from the original bug.
        setValue("house_number", take(a.streetNumber), { shouldValidate: false });
        const street = take(a.street);
        setValue("city", take(a.city, a.subregion, a.district), { shouldValidate: false });
        setValue("state", take(a.region), { shouldValidate: false });
        // Only if nothing more specific claimed it.
        setValue("street", street || take(a.name), { shouldValidate: false });
        setValue("country", a.country ?? "Nigeria", { shouldValidate: false });
        // NIPOST codes exist but almost nobody knows theirs, so this is a
        // convenience when the geocoder supplies one and blank otherwise.
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
    <Text className="mb-2 text-sm font-bold text-text-primary">{children}</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
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
              className="h-10 w-10 items-center justify-center rounded border bg-surface-sunken border-border"
            >
              <ArrowLeft color={iconColor} size={20} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-center flex-1 pr-10 text-text-primary">
              Your location
            </Text>
          </View>

          {/* Progress hint */}
          <View className="flex-row gap-2 items-center justify-center mb-10 px-10">
            <View className="h-1.5 flex-1 rounded bg-text-primary" />
            <View className="h-1.5 flex-1 rounded bg-text-primary" />
            <View className="h-1.5 flex-1 rounded bg-text-primary" />
          </View>

          <View className="px-4">
            <View className="rounded border px-6 py-8 bg-surface-raised border-border">
              <Text className="text-[24px] font-bold leading-tight mb-2 text-text-primary">
                Where are you based?
              </Text>
              <Text className="text-sm mb-8 text-text-secondary">
                This helps us show you relevant products and calculate shipping.
              </Text>

              <TouchableOpacity
                className="flex-row items-center justify-center rounded h-11 px-6 border mb-8 bg-surface-sunken border-border"
                onPress={useCurrentLocation}
                disabled={geocoding}
              >
                {geocoding ? <ActivityIndicator size="small" color={iconColor} /> : <Text className="font-bold text-xs tracking-widest uppercase text-text-primary">Use Current Location</Text>}
              </TouchableOpacity>

              <View className="gap-6">
                <View>
                  <Label>Street Address</Label>
                  <Input placeholder="123 Main St" control={control} name="street" errors={errors} />
                  {location && !geocoding && (
                    <Text className="text-[10px] mt-1 text-text-secondary">Detected near you</Text>
                  )}
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Label>House No.</Label>
                    <Input placeholder="A-1" control={control} name="house_number" errors={errors} />
                  </View>
                  <View className="flex-[2]">
                    <Label>Postal Code</Label>
                    <Input placeholder="Optional" control={control} name="postal_code" errors={errors} />
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
                  <Text className="text-sm underline text-text-secondary">Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
