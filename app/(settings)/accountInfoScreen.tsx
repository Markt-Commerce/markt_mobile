// screens/AccountInfoScreen.tsx
import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react-native';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useUser } from '../../hooks/userContextProvider';
import { request } from "../../services/api";
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '../../components/ToastProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../components/ScreenHeader';
import { Input } from '../../components/inputs';
import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { getUserProfile } from '../../services/sections/profile';
import { UserProfile } from '../../models/profile';
import { attemptMultipleUpload } from '../../services/sections/media';
import { isArray } from 'lodash';
import { useTheme } from '../../components/themeProvider';
import logger from '../../utils/logger';
import { friendlyErrorMessage } from '../../utils/errorMessages';

const BuyerSchema = z.object({
  buyername: z.string().min(2).max(60).optional(),
  //shipping_address: z.string().min(2).max(100).optional()
});

const SellerSchema = z.object({
  shop_name: z.string().min(2).optional(),
  description: z.string().optional(),
  category_ids: z.array(z.number()).optional(),
});

const GeneralSchema = z.object({
  phone_number: z.string().min(10).max(15).optional(),
  profile_picture: z.string().min(10).optional()
});

export default function AccountInfoScreen() {
  const { user, role, profile: sharedProfile, setProfile: setSharedProfile } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [profileData, setProfileData] = useState<UserProfile | null>(sharedProfile);
  const { show } = useToast();
  const [currentProfilePic, setCurrentProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const nav = useRouter();

  const {
    control: generalControl,
    handleSubmit: generalHandleSubmit,
    formState: { errors: generalErrors, isValid: isGeneralValid },
    reset: resetGeneral,
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(GeneralSchema),
    defaultValues: { phone_number: '' },
  });

  const {
    control: buyerControl,
    handleSubmit: buyerHandleSubmit,
    formState: { errors: buyerErrors, isValid: isBuyerValid },
    reset: resetBuyer,
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(BuyerSchema),
    defaultValues: { buyername: '' },
  });

  const {
    control: sellerControl,
    handleSubmit: sellerHandleSubmit,
    formState: { errors: sellerErrors, isValid: isSellerValid },
    reset: resetSeller,
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(SellerSchema),
    defaultValues: { shop_name: '', description: '' },
  });

  const generalValues = useWatch({ control: generalControl });
  const buyerValues = useWatch({ control: buyerControl });
  const sellerValues = useWatch({ control: sellerControl });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const profile = sharedProfile ?? await getUserProfile();
          setProfileData(profile);
          setCurrentProfilePic(profile.profile_picture_url || profile.profile_picture || null);
          if (role === 'buyer') {
            resetBuyer({ buyername: profile.buyer_account?.buyername || '' });
            //setShippingAddress(profile.buyer_account.shipping_address || '');
          } else if (role === 'seller') {
            resetSeller({
              shop_name: profile.seller_account?.shop_name || '',
              description: profile.seller_account?.description || '',
            });
          }
          resetGeneral({ phone_number: profile.phone_number || '' });
          return profile;
        } catch (err) {
          logger.error("Error fetching profile:", err);
        }
      };
      fetchProfile();
    }
  }, [user, role, sharedProfile, resetGeneral, resetBuyer, resetSeller]);

  const uploadAndSaveProfileImage = async (uri: string) => {
    try {
      setImageLoading(true);
      show({
        variant: "info",
        title: "Updating profile photo",
        message: "Uploading and saving your new picture…",
        duration: 3000,
      });

      const uploadResult = await attemptMultipleUpload([
        {
          uri,
          fileName: "profile.jpg",
          type: "image/jpeg",
        } as any,
      ]);

      const media = isArray(uploadResult) ? uploadResult[0] : uploadResult;

      if (!media || !media.urls.original) {
        throw new Error("Image upload failed");
      }

      const imageUrl = media.urls.original;

      const updated = await request<UserProfile>("/users/profile", {
        method: "PATCH",
        body: JSON.stringify({
          profile_picture: imageUrl,
        }),
      });

      // Force native image caches to reload even if the CDN reuses its URL.
      const separator = imageUrl.includes("?") ? "&" : "?";
      const freshImageUrl = `${imageUrl}${separator}v=${Date.now()}`;
      const freshProfile = {
        ...(sharedProfile ?? profileData ?? updated),
        ...updated,
        profile_picture: imageUrl,
        profile_picture_url: freshImageUrl,
      };
      setCurrentProfilePic(freshImageUrl);
      setProfileData(freshProfile);
      setSharedProfile(freshProfile);
      show({
        variant: "success",
        title: "Profile photo updated",
        message: "Your new photo is now visible across Markt.",
      });
    } catch (err: any) {
      show({
        variant: "error",
        title: "Image upload failed",
        message: friendlyErrorMessage(err, "Could not update your profile picture."),
      });
    } finally {
      setImageLoading(false);
    }
  };


  const changeImage = async () => {
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
      await uploadAndSaveProfileImage(uri);
    }
  };


  const handleSave = async (url: string, payload: any) => {

    try {
      setLoading(true);
      const updated = await request(url, { method: 'PATCH', body: JSON.stringify(payload) });
      setProfileData((current) => ({ ...(current ?? {}), ...updated } as UserProfile));
      setSharedProfile((current) => ({ ...(current ?? {}), ...updated } as UserProfile));
      show({ variant: 'success', title: 'Profile updated', message: 'Your profile information has been saved.' });
    } catch (err: any) {
      show({ variant: 'error', title: 'Error updating profile', message: friendlyErrorMessage(err, 'Could not save your profile. Please try again later.') });
    } finally {
      setLoading(false);
    }
  };


  const onGeneralSubmit = generalHandleSubmit((data) => {
    handleSave('/users/profile', { phone_number: data.phone_number?.trim() });
  });

  const onBuyerSubmit = buyerHandleSubmit((data) => {
    handleSave('/users/profile/buyer', { buyername: data.buyername?.trim() });
  });

  const onSellerSubmit = sellerHandleSubmit((data) => {
    handleSave('/users/profile/seller', {
      shop_name: data.shop_name?.trim(),
      description: data.description?.trim(),
    });
  });

  const currentPhone = (generalValues?.phone_number ?? '').trim();
  const originalPhone = (profileData?.phone_number ?? '').trim();
  const generalHasChanges = currentPhone !== originalPhone;

  const currentBuyerName = (buyerValues?.buyername ?? '').trim();
  const originalBuyerName = (profileData?.buyer_account?.buyername ?? '').trim();
  const buyerHasChanges = currentBuyerName !== originalBuyerName;

  const currentShopName = (sellerValues?.shop_name ?? '').trim();
  const currentDescription = (sellerValues?.description ?? '').trim();
  const originalShopName = (profileData?.seller_account?.shop_name ?? '').trim();
  const originalDescription = (profileData?.seller_account?.description ?? '').trim();
  const sellerHasChanges = currentShopName !== originalShopName || currentDescription !== originalDescription;

  const isGeneralDisabled = !isGeneralValid || loading || imageLoading || !generalHasChanges;
  const isBuyerDisabled = !isBuyerValid || loading || imageLoading || !buyerHasChanges;
  const isSellerDisabled = !isSellerValid || loading || imageLoading || !sellerHasChanges;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`} edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        className={isDark ? "flex-1 bg-[#1a1c1d]" : "flex-1 bg-white"}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Account Info" onBack={() => nav.back()} />

        <View className="px-6 pt-6">
          <TouchableOpacity
            className={`flex-row items-center gap-3 rounded p-4 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
            onPress={changeImage}
            disabled={imageLoading}
            activeOpacity={0.85}
          >
            {currentProfilePic ? (
              <Image source={{ uri: currentProfilePic }} className={`w-12 h-12 rounded-full border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`} />
            ) : (
              <View className={`w-12 h-12 rounded-full items-center justify-center border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
                <Camera size={18} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.7} />
              </View>
            )}
            <View className="flex-1">
              <Text className={`font-geist font-bold text-[15px] ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Profile photo</Text>
              <Text className={`font-inter text-[13px] mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                {imageLoading ? "Uploading and saving…" : "Tap to choose a new profile image."}
              </Text>
            </View>
            {imageLoading && <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#E94C2A"} />}
          </TouchableOpacity>

          <View className="mt-8">
            <Text className={`font-geist font-bold text-[11px] tracking-[2px] uppercase mb-3 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              General
            </Text>
            <View className={`rounded p-4 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
              <Input
                placeholder="Phone Number"
                control={generalControl}
                errors={generalErrors}
                name="phone_number"
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                className={`mt-4 h-12 rounded bg-primary items-center justify-center ${
                  isGeneralDisabled ? "opacity-50" : ""
                }`}
                onPress={onGeneralSubmit}
                disabled={isGeneralDisabled}
                activeOpacity={0.85}
              >
                <Text className="text-white font-geist font-bold text-xs tracking-[2px] uppercase">
                  {loading ? 'Saving...' : 'Save General Info'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {role === 'buyer' && (
            <View className="mt-8">
              <Text className={`font-geist font-bold text-[11px] tracking-[2px] uppercase mb-3 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Buyer information
              </Text>
              <View className={`rounded p-4 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
                <Input
                  placeholder="Buyer Name"
                  control={buyerControl}
                  errors={buyerErrors}
                  name="buyername"
                />
                <TouchableOpacity
                  className={`mt-4 h-12 rounded bg-primary items-center justify-center ${
                    isBuyerDisabled ? "opacity-50" : ""
                  }`}
                  onPress={onBuyerSubmit}
                  disabled={isBuyerDisabled}
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-geist font-bold text-xs tracking-[2px] uppercase">
                    {loading ? 'Saving...' : 'Save Buyer Info'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {role === 'seller' && (
            <View className="mt-8">
              <Text className={`font-geist font-bold text-[11px] tracking-[2px] uppercase mb-3 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Seller information
              </Text>
              <View className={`rounded p-4 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
                <Input
                  placeholder="Shop Name"
                  control={sellerControl}
                  errors={sellerErrors}
                  name="shop_name"
                />
                <View className="mt-4">
                  <Input
                    placeholder="Description"
                    control={sellerControl}
                    errors={sellerErrors}
                    name="description"
                    multiline
                  />
                </View>
                <TouchableOpacity
                  className={`mt-4 h-12 rounded bg-primary items-center justify-center ${
                    isSellerDisabled ? "opacity-50" : ""
                  }`}
                  onPress={onSellerSubmit}
                  disabled={isSellerDisabled}
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-geist font-bold text-xs tracking-[2px] uppercase">
                    {loading ? 'Saving...' : 'Save Seller Info'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
