// screens/AccountInfoScreen.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useUser } from '../../hooks/userContextProvider';
import { request } from "../../services/api";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useToast } from '../../components/ToastProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '../../components/inputs';
import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { getUserProfile } from '../../services/sections/profile';
import { UserProfile } from '../../models/profile';
import { attemptMultipleUpload } from '../../services/sections/media';
import { isArray } from 'lodash';

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
  const { user, setUser, role } = useUser();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const { show } = useToast();
  const [phone, setPhone] = useState('');
  const [buyername, setBuyername] = useState('');
  const [shipping_address, setShippingAddress] = useState('');
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [currentProfilePic, setCurrentProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useRouter();

  const { control: generalControl, handleSubmit: generalHandleSubmit, formState: { errors: generalErrors, isValid: isGeneralValid } } = useForm({
    mode: 'onChange',
    resolver: zodResolver(GeneralSchema)
  });

  const {control: buyerControl, handleSubmit: buyerHandleSubmit, formState: { errors: buyerErrors, isValid: isBuyerValid }} = useForm({
    mode: 'onChange',
    resolver: zodResolver(BuyerSchema)
  });

  const {control: sellerControl, handleSubmit: sellerHandleSubmit, formState: { errors: sellerErrors, isValid: isSellerValid }} = useForm({
    mode: 'onChange',
    resolver: zodResolver(SellerSchema)
  });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const profile = await getUserProfile();
          setProfileData(profile);
          setPhone(profile.phone_number || '');
          if (role === 'buyer') {
            setBuyername(profile.buyer_account.buyername || '');
            //setShippingAddress(profile.buyer_account.shipping_address || '');
          } else if (role === 'seller') {
            setShopName(profile.seller_account.shop_name || '');
            setDescription(profile.seller_account.description || '');
          }
          return profile;
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const uploadAndSaveProfileImage = async (uri: string) => {
    try {
      setLoading(true);

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

      // PATCH profile with image URL
      await handleSave("/users/profile", {
        profile_picture: imageUrl,
      });

      setCurrentProfilePic(imageUrl);
    } catch (err: any) {
      show({
        variant: "error",
        title: "Image upload failed",
        message: err.message || "Could not update profile picture.",
      });
    } finally {
      setLoading(false);
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
      setCurrentProfilePic(uri); // instant UI feedback
      await uploadAndSaveProfileImage(uri);
    }
  };


  const handleSave = async (url: string, payload: any) => {

    try {
      setLoading(true);
      const updated = await request(url, { method: 'PATCH', body: JSON.stringify(payload) });
      setUser(updated); // update context
      show({ variant: 'success', title: 'Profile updated successfully', message: 'Your profile information has been saved.' });
    } catch (err: any) {
      show({ variant: 'error', title: 'Error updating profile', message: err.message || 'Please try again later.' });
    } finally {
      setLoading(false);
    }
  };


  const onGeneralSubmit = generalHandleSubmit((data) => {
    handleSave('/users/profile', { phone_number: data.phone_number });
  });

  const onBuyerSubmit = buyerHandleSubmit((data) => {
    handleSave('/users/profile/buyer', { buyername: data.buyername });
  });

  const onSellerSubmit = sellerHandleSubmit((data) => {
    handleSave('/users/profile/seller', { shop_name: data.shop_name, description: data.description });
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
    <ScrollView className="flex-1 bg-white p-4">
      <TouchableOpacity onPress={() => nav.back()} className="mb-4">
        <ArrowLeft />
      </TouchableOpacity>
      <Text className="text-2xl font-bold mb-2 ">General</Text>
        <TouchableOpacity className="flex-row items-center mb-4" onPress={changeImage}>
          {currentProfilePic ? (
            <Image source={{ uri: currentProfilePic }} className="w-12 h-12 rounded-full" />
          ) : (
            <Camera />
          )} 
          <Text className="ml-2">Change Profile Picture</Text>
        </TouchableOpacity>
      <Input
        placeholder="Phone Number"
        className="border border-gray-200 rounded p-3 mb-4"
        control={generalControl}
        errors={generalErrors}
        name='phone_number'
      />
      {generalErrors.phone_number && (<Text className="text-red-500 mb-2">{generalErrors.phone_number.message}</Text>
      )}
      <TouchableOpacity
        className="bg-[#e26136] rounded h-12 items-center justify-center mb-6"
        onPress={onGeneralSubmit}
        disabled={!isGeneralValid || loading || profileData?.phone_number === phone}
      >
        <Text className="text-white font-bold">{loading ? 'Saving...' : 'Save General Info'}</Text>
      </TouchableOpacity>

      {role === 'buyer' && (
        <>
      <Text className="text-lg font-bold mb-2">Buyer Information</Text>
      {/* <Input
        placeholder="Shipping Address"
        className="border border-gray-200 rounded p-3 mb-4"
        control={buyerControl}
      />
      {buyerErrors.shipping_address && (<Text className="text-red-500 mb-2">{buyerErrors.shipping_address.message}</Text>
      )} */}
      <Input
        placeholder="Buyer Name"
        className="border border-gray-200 rounded p-3 mb-4"
        control={buyerControl}
        errors={buyerErrors}
        name='buyername'
      />
      {buyerErrors.buyername && (<Text className="text-red-500 mb-2">{buyerErrors.buyername.message}</Text>
      )}
      <TouchableOpacity
        className="bg-[#e26136] rounded h-12 items-center justify-center mb-6"
        onPress={onBuyerSubmit}
        disabled={!isBuyerValid || loading || profileData?.buyer_account.buyername === buyername}>
        <Text className="text-white font-bold">{loading ? 'Saving...' : 'Save Buyer Info'}</Text>
      </TouchableOpacity>
      </>
      )}

      {role === 'seller' && (
        <>
          <Text className="text-lg font-bold mb-2">Seller Information</Text>
          <Input
        placeholder="Shop Name"
        className="border border-gray-200 rounded p-3 mb-4"
        control={sellerControl}
        errors={sellerErrors}
        name='shop_name'
      />
      {sellerErrors.shop_name && (<Text className="text-red-500 mb-2">{sellerErrors.shop_name.message}</Text>
      )}
      <Input
        placeholder="Description"
        className="border border-gray-200 rounded p-3 mb-4"
        control={sellerControl}
        name='description'
      />
      {sellerErrors.description && (<Text className="text-red-500 mb-2">{sellerErrors.description.message}</Text>
      )}
      <TouchableOpacity
        className="bg-[#e26136] rounded h-12 items-center justify-center mb-6"
        onPress={onSellerSubmit}
        disabled={!isSellerValid || loading || profileData?.seller_account.shop_name === shopName && profileData?.seller_account.description === description}
      >
        <Text className="text-white font-bold">{loading ? 'Saving...' : 'Save Seller Info'}</Text>
      </TouchableOpacity>
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}
