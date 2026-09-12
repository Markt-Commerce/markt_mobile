import React from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardOverlap, keyboardScrollPadding } from '../../hooks/useKeyboardOverlap';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { ArrowLeft, Image as ImageIcon, Check } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../hooks/userContextProvider";
import { checkUsername } from "../../services/sections/auth";
import { useRouter } from "expo-router";
import { updateUserProfile, updateBuyerProfile } from "../../services/sections/profile";
import { uploadProfilePicture } from "../../services/sections/auth";
import { logger } from "../../utils/logger";
import Button from "../../components/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../components/ToastProvider";
import * as ImagePicker from "expo-image-picker";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useWatch } from "react-hook-form";
import { useTokens } from "../../theme/useTokens";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import StepProgress from "../../components/auth/StepProgress";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const schema = z.object({
  Buyername: z.string().min(1, "Name is required"),
  username: z.string().min(3, "At least 3 characters").max(20, "Max 20 characters").regex(USERNAME_REGEX, "Letters, numbers, underscores only"),
  phone_number: z.string().min(1, "Phone number is required"),
});

export default function UserInfoScreen() {
  const { setUser, refreshProfile } = useUser();
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const router = useRouter();
  const { show } =  useToast();
  const t = useTokens();
  const iconColor = t.textPrimary;
  const mutedIconColor = t.textSecondary;
  const [profilePictureUri, setProfilePictureUri] = React.useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = React.useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameMessage, setUsernameMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const username = useWatch({ control, name: "username", defaultValue: "" });
  const checkUsernameDebounced = useDebouncedCallback(async (value: string) => {
    if (value.length < 3 || !USERNAME_REGEX.test(value)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await checkUsername(value);
      setUsernameStatus(res.available ? "available" : "taken");
      setUsernameMessage(res.message ?? "");
    } catch {
      setUsernameStatus("idle");
    }
  }, 500);

  React.useEffect(() => {
    checkUsernameDebounced(username);
  }, [username]);

  const changeProfilePicture = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePictureUri(uri); // Store local URI in state
    }
  };

  /**
   * Saves to the account, which exists by the time this screen opens.
   *
   * It used to merge into an in-memory context that was POSTed two screens
   * later, so an app kill here lost everything typed — and a failure two
   * screens later reported as "registration failed" with no clue which field
   * caused it.
   */
  const handleSubmitForm = async (data: z.infer<typeof schema>) => {
    if (saving) return;
    setSaving(true);
    try {
      // Two calls because they are two resources: the handle lives on the
      // user, the display name on the buyer profile. The handle goes first —
      // it is the one that can be refused, and being told "that's taken"
      // after the rest has saved is worse than before.
      if (data.username) {
        await updateUserProfile({
          username: data.username,
          phone_number: data.phone_number,
        });
      }
      await updateBuyerProfile({ buyername: data.Buyername });

      if (profilePictureUri) {
        // Best-effort: a photo is optional, and failing it must not block
        // someone at the end of signup.
        try {
          await uploadProfilePicture(profilePictureUri, "profile.jpg");
        } catch (e) {
          logger.warn("signup: could not upload profile picture", e);
        }
      }

      // Pull everything just saved into context, for everyone — not only the
      // people who added a photo.
      //
      // This used to sit inside the `if (profilePictureUri)` branch, so
      // skipping the photo meant nothing told the app about the name,
      // username or phone number it had just written. The tabs rendered the
      // profile as it was before the form, and the only way to see your own
      // details was to sign out and back in.
      await refreshProfile();

      show({
        variant: "success",
        title: "Profile saved",
        message: "Where should we show you things from?",
      });
      router.push("/locationdet");
    } catch (error: any) {
      const taken = error?.status === 409;
      show({
        variant: "error",
        title: taken ? "That username is taken" : "Could not save your details",
        message: taken
          ? "Pick another one and try again."
          : friendlyErrorMessage(
              error,
              "Could not save your information. Please review it and try again."
            ),
      });
    } finally {
      setSaving(false);
    }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <Text className="mb-2 text-sm font-bold text-text-primary">{children}</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            // Measured: a KeyboardAvoidingView shifts the screen, but a form
            // taller than the screen still needs somewhere to scroll to, and
            // the phone number is the last field.
            paddingBottom: keyboardScrollPadding(keyboardOverlap, insets.bottom, 32),
            // Not `center`: these forms are taller than the screen, so
            // centring pushed the first field below the fold and left a gap
            // above the header that looked like a rendering fault.
            alignItems: "center",
            paddingHorizontal: 16,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[520px]">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-4 pt-2">
              {/* The step before this one is verification, which a verified
                  account cannot re-enter — it would only 400 with "already
                  verified". Shown only when there is somewhere real to go. */}
              {router.canGoBack() ? (
                <TouchableOpacity
                  onPress={() => router.back()}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="h-10 w-10 items-center justify-center rounded border bg-surface-sunken border-border"
                >
                  <ArrowLeft size={20} color={iconColor} />
                </TouchableOpacity>
              ) : (
                <View className="h-10 w-10" />
              )}
            </View>

            {/* Title */}
            <View className="mb-5">
              <Text className="text-[28px] font-bold leading-9 text-text-primary">
                Your profile
              </Text>
              <Text className="text-[15px] mt-1.5 text-text-secondary">
                Let's get to know you better.
              </Text>
            </View>

            <StepProgress step={1} total={2} label="About you" className="mb-6" />

            {/* No card: a bordered panel inside a screen that is already a panel
                adds an edge without adding meaning. Spacing does the work. */}
            <View>
              {/* Avatar placeholder with image picker */}
              <View className="items-center mb-8">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={changeProfilePicture}
                  className="h-24 w-24 rounded-full border items-center justify-center overflow-hidden bg-surface-sunken border-border"
                >
                  {profilePictureUri ? (
                    <Image source={{ uri: profilePictureUri }} className="w-full h-full" />
                  ) : (
                    <View className="items-center">
                      <ImageIcon size={32} color={mutedIconColor} />
                      <Text className="text-[12px] font-semibold mt-1.5 text-text-secondary">Add photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View className="mb-6">
                <Label>Full Name</Label>
                <Input
                  placeholder="e.g. Amaka Obi"
                  control={control}
                  name="Buyername"
                  errors={errors}
                  autoCapitalize="words"
                />
              </View>

              {/* Username — debounced check per REGISTRATION_LOGIN_API §2.2 */}
              <View className="mb-6">
                <Label>Username</Label>
                <Input
                  placeholder="amaka_obi"
                  control={control}
                  name="username"
                  errors={errors}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View className="mt-2 h-4">
                  {usernameStatus === "taken" ? (
                    <Text className="text-xs text-danger-text ">{usernameMessage || "Username is already taken"}</Text>
                  ) : usernameStatus === "available" ? (
                    <View className="flex-row items-center gap-1">
                      <Check size={12} color={t.successText} strokeWidth={3} />
                      <Text className="text-xs text-success ">Username is available</Text>
                    </View>
                  ) : usernameStatus === "checking" ? (
                    <Text className="text-xs italic text-text-secondary">Checking availability...</Text>
                  ) : (
                    <Text className="text-xs text-text-secondary">This will be your unique identifier.</Text>
                  )}
                </View>
              </View>

              {/* Phone Number */}
              <View className="mb-10">
                <Label>Phone Number</Label>
                <Input
                  placeholder="0801 234 5678"
                  control={control}
                  name="phone_number"
                  errors={errors}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                />
              </View>

              {/* CTA — disable if username taken */}
              <Button
                onPress={handleSubmit(handleSubmitForm)}
                disabled={!isValid || saving || usernameStatus === "taken" || usernameStatus === "checking"}
              loading={saving}
                text="Continue"
                variant="primary"
              />
            </View>

            {/* Bottom spacer */}
            <View className="h-10" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
