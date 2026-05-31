/**
 * Step 4: Profile picture (post-registration)
 * After successful registration, before entering the main app.
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadProfilePicture } from "../../services/sections/auth";
import { useToast } from "../../components/ToastProvider";
import Button from "../../components/button";
import { useTheme } from "../../components/themeProvider";

export default function AddProfilePictureScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#c6c5cf" : "#A1A1AA";
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Permission to access photos is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (!imageUri) {
      pickImage();
      return;
    }
    setUploading(true);
    try {
      await uploadProfilePicture(imageUri, "profile.jpg");
      show({ variant: "success", title: "Photo added", message: "Your profile picture has been updated." });
    } catch {
      show({ variant: "error", title: "Upload failed", message: "You can add a profile picture later in settings." });
    } finally {
      setUploading(false);
      router.replace("/emailVerification");
    }
  };

  const handleSkip = () => {
    router.replace("/emailVerification");
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#2f3132]" : "bg-white"}`}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className={`text-[32px] font-geist font-bold text-center leading-tight mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          Profile picture
        </Text>
        <Text className={`font-inter text-sm text-center mb-12 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
          Help others recognize you on Markt.{"\n"}You can change this later in settings.
        </Text>

        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.85}
          className={`w-48 h-48 rounded border-2 border-dashed items-center justify-center mb-12 overflow-hidden shadow-sm ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center">
              <Camera size={48} color={iconColor} strokeWidth={1.5} />
              <Text className={`text-[10px] font-geist font-bold mt-2 tracking-widest ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>TAP TO UPLOAD</Text>
            </View>
          )}
        </TouchableOpacity>

        <View className="w-full max-w-[320px] gap-4">
          <Button
            text={imageUri ? "Continue" : "Choose photo"}
            onPress={handleContinue}
            loading={uploading}
            variant="conversion"
          />
          
          <TouchableOpacity
            onPress={handleSkip}
            disabled={uploading}
            className="h-12 items-center justify-center"
          >
            <Text className={`font-inter font-semibold text-sm underline ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
