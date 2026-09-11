import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { sendVerificationEmail, verifyEmail } from "../../services/sections/auth";
import { useRegData } from "../../models/signupSteps";
import { useUser } from "../../hooks/userContextProvider";
import { getUserProfile } from "../../services/sections/profile";
import { logger } from "../../utils/logger";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OTPInput } from "../../components/inputs";
import { useToast } from "../../components/ToastProvider"; // <-- toast
import Button from "../../components/button";
import { useTokens } from "../../theme/useTokens";
import { friendlyErrorMessage } from "../../utils/errorMessages";

const schema = z.object({
  code: z
    .string()
    .min(6, "Verification code must be 6 characters long")
    .max(6, "Verification code must be 6 characters long"),
});
type FormData = z.infer<typeof schema>;

/** Matches RESEND_COOLDOWN_SECONDS in app/users/verification.py. */
const RESEND_COOLDOWN_SECONDS = 60;

const EmailVerification = () => {
  const router = useRouter();
  const { regData } = useRegData();
  const { role } = useUser();
  const { show } = useToast(); // <-- toast API
  const t = useTokens();
  const iconColor = t.textPrimary;

  // Two ways in, and they differ in one thing only: whether a code is
  // already on its way. Registration sends one, so that path opens straight
  // into the input with the resend clock already running. Someone who signed
  // in months later and was bounced here has no code in flight, so this
  // requests one on arrival — otherwise they would stare at a 60-second
  // "Resend in 59s" for a code that was never sent.
  const { sent } = useLocalSearchParams<{ sent?: string }>();
  const codeAlreadySent = sent === "1";

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(
    codeAlreadySent ? RESEND_COOLDOWN_SECONDS : 0
  );

  const requestedOnMount = React.useRef(false);
  useEffect(() => {
    if (codeAlreadySent || requestedOnMount.current || !regData?.email) return;
    requestedOnMount.current = true;
    handleSendVerificationCode();
  }, [codeAlreadySent, regData?.email]);

  // The backend refuses a resend inside 60 seconds, so the button says how
  // long rather than letting the user tap into a 429.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const handleSendVerificationCode = async () => {
    try {
      if (!regData?.email) {
        show({
          variant: "error",
          title: "Email missing",
          message: "We couldn’t find your email. Please go back and enter it.",
        });
        return;
      }
      setSending(true);
      await sendVerificationEmail(regData.email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      show({
        variant: "success",
        title: "Code sent",
        message: `We sent a 6-digit code to ${regData.email}.`,
      });
    } catch (error: any) {
      show({
        variant: "error",
        title: "Couldn’t send code",
        message: friendlyErrorMessage(error, "Could not send the code. Please check your connection and try again."),
      });
    } finally {
      setSending(false);
    }
  };

  const handleSubmitCode = async (data: FormData) => {
    try {
      if (!regData?.email) {
        show({
          variant: "error",
          title: "Email missing",
          message: "We couldn’t find your email. Please go back and enter it.",
        });
        return;
      }
      setVerifying(true);
      const result = await Promise.resolve(verifyEmail(regData.email, data.code));
      if (!result) throw new Error("Verification failed");

      // Where to go next is the server's answer, not a guess from the role.
      // Someone who finished their profile months ago and only now verified
      // must land in the app, not back at a form they already filled in.
      let next: string | null = role === "seller" ? "seller_profile" : "buyer_profile";
      try {
        const profile = await getUserProfile();
        next = profile.onboarding?.next_step ?? null;
      } catch (e) {
        // Fall back to the role-based guess rather than stranding anyone on
        // a screen with nowhere to go.
        logger.warn("verification: could not read onboarding state", e);
      }

      show({
        variant: "success",
        title: "Verified",
        message:
          next === "seller_profile"
            ? "Now let’s set up your shop."
            : next === "buyer_profile"
              ? "Now let’s finish your profile."
              : "Welcome to Markt.",
      });
      // `replace`, not `push`: a verified account must not be able to swipe
      // back into the code screen, which would only 400 with "already
      // verified".
      router.replace(
        next === "seller_profile"
          ? "/userdetSeller"
          : next === "buyer_profile"
            ? "/userdetBuyer"
            : "/(tabs)"
      );
    } catch (error: any) {
      show({
        variant: "error",
        title: "Invalid or expired code",
        message: "Double-check the 6-digit code and try again.",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View className="flex-1 bg-surface-raised">
          {/* Header */}
          <View className="flex-row items-center p-4 pb-2 justify-between">
            {/* Only when there is somewhere to go.
                Arriving here from sign-up, there is not: creating the account
                unmounts the `(entrances)` group behind it, so `back()` would
                be a no-op on a screen whose only other exit is the code. The
                login bounce does have a stack, and keeps its arrow. */}
            {router.canGoBack() ? (
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded border bg-surface-sunken border-border"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft color={iconColor} size={20} />
              </TouchableOpacity>
            ) : (
              <View className="h-10 w-10" />
            )}
            <Text className="text-xl font-bold text-center flex-1 pr-10 text-text-primary">Verification</Text>
          </View>

          {/* Body */}
          <View className="flex-1 px-4 justify-center">
            <View>
              <Text className="text-[32px] font-bold leading-tight mb-2 text-center text-text-primary">
                Enter code
              </Text>
              <Text className="text-center mb-10 text-text-secondary">
                We sent a 6-digit code to{"\n"}
                <Text className="font-bold text-text-primary">{regData?.email}</Text>
              </Text>

              {/* Code input */}
              <View className="mb-10">
                <Controller
                  control={control}
                  name="code"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <OTPInput
                      value={value || ""}
                      onChange={onChange}
                      error={error?.message}
                    />
                  )}
                />
              </View>

              {/* Actions */}
              <Button
                text={verifying ? "Verifying…" : "Verify"}
                onPress={handleSubmit(handleSubmitCode)}
                disabled={!isValid || verifying}
                variant="conversion"
              />

              <View className="mt-8 items-center gap-4">
                <TouchableOpacity
                  onPress={handleSendVerificationCode}
                  disabled={sending || cooldown > 0}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: sending || cooldown > 0 }}
                >
                  <Text
                    className={`font-bold text-sm underline uppercase tracking-widest ${
                      cooldown > 0 || sending ? "text-text-muted" : "text-text-primary"
                    }`}
                  >
                    {sending
                      ? "Sending…"
                      : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : "Resend code"}
                  </Text>
                </TouchableOpacity>

                <Text className="text-xs text-center px-4 text-text-secondary">
                  Didn’t get it? Check your spam folder or try resending.
                </Text>
              </View>
            </View>

            {/* subtle footer space */}
            <View className="h-10" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailVerification;
