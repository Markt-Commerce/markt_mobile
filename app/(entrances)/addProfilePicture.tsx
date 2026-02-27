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

export default function AddProfilePictureScreen() {
  const router = useRouter();
  const { show } = useToast();
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-[#171212] text-xl font-bold text-center mb-2">
          Add your profile picture
        </Text>
        <Text className="text-[#876d64] text-sm text-center mb-8">
          Help others recognize you. You can skip and add one later.
        </Text>

        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.85}
          className="w-36 h-36 rounded-full bg-bg-muted border-2 border-dashed border-[#d5cfcd] items-center justify-center mb-8"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-full rounded-full" resizeMode="cover" />
          ) : (
            <Camera size={48} color="#876d64" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={uploading}
          className="w-full max-w-[320px] h-12 rounded-full bg-primary items-center justify-center mb-3"
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">{imageUri ? "Continue" : "Choose photo"}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSkip}
          disabled={uploading}
          className="w-full max-w-[320px] h-12 rounded-full bg-bg-muted items-center justify-center"
        >
          <Text className="text-text-primary font-semibold text-base">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
