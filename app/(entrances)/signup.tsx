import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, PasswordInput } from "../../components/inputs";
import { useUser } from "../../hooks/userContextProvider";
import { AccountType } from "../../models/auth";
import { useRouter } from "expo-router";
import { register, useRegData } from "../../models/signupSteps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider";
import { useWatch } from "react-hook-form";
import { getPasswordStrength } from "../../utils/passwordStrength";
import Button from "../../components/button";
import RoleToggle from "../../components/auth/RoleToggle";
import { Check, Circle } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import * as haptics from "../../utils/haptics";

// --- Validation schema ---
// No "confirm password". The field exists to catch a typo you cannot see —
// but this form already shows the password on demand and grades it live
// against four rules, which catches the same typo without asking anyone to
// type a password twice. Two inputs to solve a problem one input already
// solved is just friction.
const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "Must contain uppercase, lowercase, and a number"
    ),
});

type FormValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const { setRole, role } = useUser();
  const { regData, setRegData } = useRegData();
  const { show } = useToast();
  const t = useTokens();
  const iconColor = t.textPrimary;
  const mutedIconColor = t.textSecondary;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });
  const strength = getPasswordStrength(password);
  const setUserRole = (r: AccountType) => setRole(r);

  const onSubmit = async (data: FormValues) => {
    haptics.tick();
    try {
      setRegData(
        register(regData, {
          email: data.email,
          password: data.password,
          account_type: role || "buyer",
        })
      );

      show({
        variant: "success",
        title: "Account details saved",
        message: role === "seller" ? "Let’s set up your seller profile." : "Let’s set up your buyer profile.",
      });

      if (role === "seller") router.navigate("/userdetSeller");
      else router.navigate("/userdetBuyer");
    } catch (error: any) {
      show({
        variant: "error",
        title: "Sign up failed",
        message: "Please check your details and try again.",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-4 pb-8">
            {/* Header */}
            <View className="flex-row items-center mb-8">
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded border bg-surface-sunken border-border"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color={iconColor} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View className="mb-8">
              <Text className="text-[32px] font-bold leading-tight text-text-primary">
                Create{"\n"}account
              </Text>
              <Text className="text-base mt-2 text-text-secondary">
                Join Markt to start shopping or selling.
              </Text>
            </View>

            {/* Panel */}
            <View>
              {/* Role selection */}
              <View className="mb-8">
                <Text className="mb-2 text-[13px] font-semibold text-text-secondary">
                  I’m here for
                </Text>
                <RoleToggle value={role} onChange={setUserRole} />
              </View>

              {/* Email */}
              <View className="mb-6">
                <Text className="mb-2 text-[13px] font-semibold text-text-secondary">Email Address</Text>
                <Input
                  placeholder="you@example.com"
                  control={control}
                  name="email"
                  errors={errors}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="mb-2 text-[13px] font-semibold text-text-secondary">Password</Text>
                <PasswordInput
                  placeholder="Min. 8 characters"
                  control={control}
                  name="password"
                  errors={errors}
                />

                {/* Strength Indicator */}
                <View className="flex-row gap-1 mt-3">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className={`flex-1 h-1 rounded ${
                        i < strength.level
                          ? strength.level <= 1
                            ? "bg-danger"
                            : strength.level <= 2
                              ? "bg-warning"
                              : strength.level <= 3
                                ? "bg-primary"
                                : "bg-success"
                          : "bg-surface-sunken"
                      }`}
                    />
                  ))}
                </View>
                <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-2">
                  <View className="flex-row items-center gap-1">
                    {strength.checks.length ? <Check size={12} color={t.successText} /> : <Circle size={12} color={mutedIconColor} />}
                    <Text className={`text-[11px] ${strength.checks.length ? "text-success" : "text-text-muted"}`}>
                      8+ chars
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {strength.checks.digit ? <Check size={12} color={t.successText} /> : <Circle size={12} color={mutedIconColor} />}
                    <Text className={`text-[11px] ${strength.checks.digit ? "text-success" : "text-text-muted"}`}>
                      1 digit
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {strength.checks.lowercase ? <Check size={12} color={t.successText} /> : <Circle size={12} color={mutedIconColor} />}
                    <Text className={`text-[11px] ${strength.checks.lowercase ? "text-success" : "text-text-muted"}`}>
                      1 lower
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {strength.checks.uppercase ? <Check size={12} color={t.successText} /> : <Circle size={12} color={mutedIconColor} />}
                    <Text className={`text-[11px] ${strength.checks.uppercase ? "text-success" : "text-text-muted"}`}>
                      1 upper
                    </Text>
                  </View>
                </View>
              </View>

              {/* CTA */}
              <Button
                text="Next"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid}
                variant="primary"
              />

              {/* Alt nav */}
              <TouchableOpacity 
                onPress={() => router.push("/login")}
                className="mt-8 items-center"
              >
                <Text className="text-sm text-text-secondary">
                  Already have an account? <Text className="font-bold underline text-text-primary">Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
