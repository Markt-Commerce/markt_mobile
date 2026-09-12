// screens/AccountInfoScreen.tsx
import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, MapPin } from 'lucide-react-native';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
import { getUserProfile, uploadShopBanner, updateUserAddress, updateSellerProfile } from '../../services/sections/profile';
import { CategoryAddition } from '../../components/categoryAddition';
import { getAllCategories } from '../../services/sections/categories';
import type { Category } from '../../models/categories';
import * as Location from 'expo-location';
import { UserProfile } from '../../models/profile';
import { attemptMultipleUpload } from '../../services/sections/media';
import { isArray } from 'lodash';
import logger from '../../utils/logger';
import { friendlyErrorMessage } from '../../utils/errorMessages';
import { useTokens } from '../../theme/useTokens';
import { useKeyboardOverlap, keyboardScrollPadding } from '../../hooks/useKeyboardOverlap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  profile_picture: z.string().min(10).optional(),
  // Registration mints one when the client does not send it, and until now
  // there was no way to change it — the handle you were given at signup was
  // the handle you kept.
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(20, "Max 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only")
    .optional(),
});

export default function AccountInfoScreen() {
  const { user, role, profile: sharedProfile, setProfile: setSharedProfile } = useUser();
  const t = useTokens();
  const [profileData, setProfileData] = useState<UserProfile | null>(sharedProfile);
  const { show } = useToast();
  const [currentProfilePic, setCurrentProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const nav = useRouter();
  const insets = useSafeAreaInsets();

  /**
   * Where the account is, and — for a seller — where the shop is.
   *
   * Neither was editable anywhere in the app. Skipping the address during
   * signup meant never being able to add one, and a seller who skipped it
   * had no shop coordinates at all, which is what keeps a shop out of every
   * proximity search. The API has accepted both the whole time.
   */
  const [addressSaving, setAddressSaving] = useState(false);
  const [shopLocSaving, setShopLocSaving] = useState(false);
  const [addressLabel, setAddressLabel] = useState<string | null>(null);
  const [shopLocLabel, setShopLocLabel] = useState<string | null>(null);
  const keyboardOverlap = useKeyboardOverlap();

  const {
    control: generalControl,
    handleSubmit: generalHandleSubmit,
    formState: { errors: generalErrors, isValid: isGeneralValid },
    reset: resetGeneral,
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(GeneralSchema),
    defaultValues: { phone_number: '', username: '' },
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
            setBannerUrl(profile.seller_account?.banner_url || null);
            const shopCats = (profile.seller_account?.categories ?? []) as Category[];
            setShopCategories(shopCats);
            // Kept separately so "has anything changed" compares against what
            // the server actually holds, not against the picker's own state.
            setOriginalCategoryIds(
              shopCats.map((c) => Number(c.id)).sort()
            );
          }
          resetGeneral({
            phone_number: profile.phone_number || '',
            username: profile.username || '',
          });
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


  /**
   * The shop's cover image, which is what makes a shop card a card rather
   * than a row. Separate from the profile picture: that one is the shop's
   * avatar and sits *on top of* this.
   */
  const changeBanner = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // Wide, because that is the shape it is displayed in — cropping here
      // beats cropping in a card the seller never sees.
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled) return;

    try {
      setBannerLoading(true);
      const media = await uploadShopBanner(result.assets[0].uri);
      const url = media?.urls?.original;
      // Cache-bust: the CDN reuses the URL, so the old image would stick.
      setBannerUrl(url ? `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}` : null);
      show({
        variant: "success",
        title: "Cover updated",
        message: "Shoppers will see this behind your shop name.",
      });
    } catch (err: any) {
      show({
        variant: "error",
        title: "Could not update cover",
        message: friendlyErrorMessage(err, "Please try another image."),
      });
    } finally {
      setBannerLoading(false);
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
    handleSave('/users/profile', {
      phone_number: data.phone_number?.trim(),
      username: data.username?.trim(),
    });
  });

  const onBuyerSubmit = buyerHandleSubmit((data) => {
    handleSave('/users/profile/buyer', { buyername: data.buyername?.trim() });
  });

  /** Reads the device's location once and hands back a usable address. */
  const readCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      show({
        variant: "error",
        title: "Location permission needed",
        message: "Allow location access to use your current position.",
      });
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    let label: string | null = null;
    try {
      const [addr] = await Location.reverseGeocodeAsync(pos.coords);
      label = [addr?.street ?? addr?.name, addr?.city ?? addr?.subregion, addr?.region]
        .filter(Boolean)
        .join(", ") || null;
    } catch {
      // A coordinate without a street name is still a coordinate.
    }
    return { coords: pos.coords, label };
  };

  const saveDeliveryAddress = async () => {
    if (addressSaving) return;
    setAddressSaving(true);
    try {
      const fix = await readCurrentLocation();
      if (!fix) return;
      await updateUserAddress({
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        ...(fix.label ? { street: fix.label } : {}),
      });
      setAddressLabel(fix.label ?? "Current location saved");
      show({ variant: "success", title: "Address updated", message: fix.label ?? "Saved." });
    } catch (e) {
      show({
        variant: "error",
        title: "Could not save your address",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setAddressSaving(false);
    }
  };

  const saveShopLocation = async () => {
    if (shopLocSaving) return;
    setShopLocSaving(true);
    try {
      const fix = await readCurrentLocation();
      if (!fix) return;
      // Sent as a pair — the server refuses a lone coordinate, and (0, 0) is
      // what a failed geocode looks like rather than a shop in the Atlantic.
      await updateSellerProfile({
        shop_latitude: fix.coords.latitude,
        shop_longitude: fix.coords.longitude,
        ...(fix.label ? { shop_address: { street: fix.label } } : {}),
      });
      setShopLocLabel(fix.label ?? "Shop location saved");
      show({
        variant: "success",
        title: "Shop location updated",
        message: "Your shop can now be found by distance.",
      });
    } catch (e) {
      show({
        variant: "error",
        title: "Could not save your shop location",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setShopLocSaving(false);
    }
  };

  const onSellerSubmit = sellerHandleSubmit((data) => {
    handleSave('/users/profile/seller', {
      shop_name: data.shop_name?.trim(),
      description: data.description?.trim(),
      // Only when they actually changed: sending the list every time would
      // rewrite the rows (and the primary-category ordering) on a save that
      // only touched the shop name.
      ...(categoriesChanged
        ? { category_ids: shopCategories.map((c) => Number(c.id)) }
        : {}),
    });
  });

  // Shop categories describe the *shop*, not its products: each product
  // carries its own category_ids, and changing what the shop is filed under
  // deliberately leaves them alone. That is also what the server does -- it
  // only rewrites SellerCategory rows -- so nothing gets re-filed behind the
  // seller's back.
  const [categories, setCategories] = useState<Category[]>([]);
  const [shopCategories, setShopCategories] = useState<Category[]>([]);
  const [originalCategoryIds, setOriginalCategoryIds] = useState<number[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  useEffect(() => {
    getAllCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const currentPhone = (generalValues?.phone_number ?? '').trim();
  const originalPhone = (profileData?.phone_number ?? '').trim();
  const currentUsername = (generalValues?.username ?? '').trim();
  const originalUsername = (profileData?.username ?? '').trim();
  const generalHasChanges =
    currentPhone !== originalPhone || currentUsername !== originalUsername;

  const currentBuyerName = (buyerValues?.buyername ?? '').trim();
  const originalBuyerName = (profileData?.buyer_account?.buyername ?? '').trim();
  const buyerHasChanges = currentBuyerName !== originalBuyerName;

  const currentShopName = (sellerValues?.shop_name ?? '').trim();
  const currentDescription = (sellerValues?.description ?? '').trim();
  const originalShopName = (profileData?.seller_account?.shop_name ?? '').trim();
  const originalDescription = (profileData?.seller_account?.description ?? '').trim();
  const currentCategoryIds = shopCategories.map((c) => Number(c.id)).sort();
  const categoriesChanged =
    currentCategoryIds.length !== originalCategoryIds.length ||
    currentCategoryIds.some((id, i) => id !== originalCategoryIds[i]);
  const sellerHasChanges =
    currentShopName !== originalShopName ||
    currentDescription !== originalDescription ||
    categoriesChanged;

  const isGeneralDisabled = !isGeneralValid || loading || imageLoading || !generalHasChanges;
  const isBuyerDisabled = !isBuyerValid || loading || imageLoading || !buyerHasChanges;
  const isSellerDisabled = !isSellerValid || loading || imageLoading || !sellerHasChanges;

  /** A one-tap "set this from where I am" row. */
  const LocationRow = ({
    title,
    hint,
    saved,
    busy,
    onPress,
  }: {
    title: string;
    hint: string;
    saved: string | null;
    busy: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy }}
      className="flex-row items-center gap-3 rounded-xl px-4 py-3.5 bg-surface-sunken"
    >
      <MapPin size={18} color={t.primaryText} strokeWidth={2} />
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-text-primary">{title}</Text>
        <Text className="text-[12px] mt-0.5 text-text-secondary" numberOfLines={1}>
          {busy ? "Reading your location…" : saved ?? hint}
        </Text>
      </View>
      {busy ? <ActivityIndicator size="small" color={t.textSecondary} /> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      {/* The sheets learned about the keyboard; this screen never did, so
          the shop description sat behind it while you typed into it. */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        className={"flex-1 bg-surface-page"}
        contentContainerStyle={{
          paddingBottom: keyboardScrollPadding(keyboardOverlap, insets.bottom, 32),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Account Info" onBack={() => nav.back()} />

        <View className="px-6 pt-6">
          <TouchableOpacity
            className="flex-row items-center gap-3 rounded p-4 border bg-surface-sunken border-border"
            onPress={changeImage}
            disabled={imageLoading}
            activeOpacity={0.85}
          >
            {currentProfilePic ? (
              <Image source={{ uri: currentProfilePic }} className="w-12 h-12 rounded-full border bg-surface-raised border-border" />
            ) : (
              <View className="w-12 h-12 rounded-full items-center justify-center border bg-surface-raised border-border">
                <Camera size={18} color={t.textPrimary} strokeWidth={1.7} />
              </View>
            )}
            <View className="flex-1">
              <Text className="font-bold text-[15px] text-text-primary">Profile photo</Text>
              <Text className="text-[13px] mt-1 text-text-secondary">
                {imageLoading ? "Uploading and saving…" : "Tap to choose a new profile image."}
              </Text>
            </View>
            {imageLoading && <ActivityIndicator size="small" color={t.primaryText} />}
          </TouchableOpacity>

          <View className="mt-8">
            <Text className="font-bold text-[11px] tracking-[2px] uppercase mb-3 text-text-secondary">
              General
            </Text>
            <View className="rounded p-4 border bg-surface-raised border-border">
              <Input
                label="Username"
                placeholder="amaka_obi"
                control={generalControl}
                errors={generalErrors}
                name="username"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label="Phone number"
                placeholder="0801 234 5678"
                control={generalControl}
                errors={generalErrors}
                name="phone_number"
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                className={`mt-4 h-12 rounded bg-primary-fill items-center justify-center ${
                  isGeneralDisabled ? "opacity-50" : ""
                }`}
                onPress={onGeneralSubmit}
                disabled={isGeneralDisabled}
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
                  {loading ? 'Saving...' : 'Save General Info'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {role === 'buyer' && (
            <View className="mt-8">
              <Text className="font-bold text-[11px] tracking-[2px] uppercase mb-3 text-text-secondary">
                Buyer information
              </Text>
              <View className="rounded p-4 border bg-surface-raised border-border">
                <Input
                  placeholder="Buyer Name"
                  control={buyerControl}
                  errors={buyerErrors}
                  name="buyername"
                />
                <TouchableOpacity
                  className={`mt-4 h-12 rounded bg-primary-fill items-center justify-center ${
                    isBuyerDisabled ? "opacity-50" : ""
                  }`}
                  onPress={onBuyerSubmit}
                  disabled={isBuyerDisabled}
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
                    {loading ? 'Saving...' : 'Save Buyer Info'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Where things get delivered. Skipping this during signup used to
              mean never being able to add it. */}
          <View className="mt-8">
            <Text className="font-bold text-[11px] tracking-[2px] uppercase mb-3 text-text-secondary">
              Delivery address
            </Text>
            <View className="rounded p-4 border bg-surface-raised border-border">
              <LocationRow
                title="Use my current location"
                hint="We'll use this for delivery and to show you what's nearby."
                saved={addressLabel}
                busy={addressSaving}
                onPress={saveDeliveryAddress}
              />
            </View>
          </View>

          {role === 'seller' && (
            <View className="mt-8">
              <Text className="font-bold text-[11px] tracking-[2px] uppercase mb-3 text-text-secondary">
                Seller information
              </Text>
              <View className="rounded p-4 border bg-surface-raised border-border">
                {/* Cover image */}
                <TouchableOpacity
                  onPress={changeBanner}
                  disabled={bannerLoading}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Change shop cover image"
                  className="mb-4 h-28 w-full overflow-hidden rounded-xl bg-primary-muted items-center justify-center"
                >
                  {bannerUrl ? (
                    <>
                      <Image
                        source={{ uri: bannerUrl }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                      {/* The profile photo row says "tap to choose a new
                          one"; the cover said nothing, so once it was set it
                          looked like a picture rather than a control. */}
                      {!bannerLoading ? (
                        <View className="absolute bottom-2 right-2 rounded-full px-3 py-1.5 bg-scrim">
                          <Text className="text-[11px] font-semibold text-white">
                            Change cover
                          </Text>
                        </View>
                      ) : null}
                    </>
                  ) : null}
                  {bannerLoading ? (
                    <View className="absolute inset-0 items-center justify-center">
                      <ActivityIndicator color={t.textOnPrimary} />
                    </View>
                  ) : !bannerUrl ? (
                    <View className="items-center">
                      <ImageIcon size={22} color={t.primaryText} strokeWidth={1.8} />
                      <Text className="mt-1.5 text-[12px] font-semibold text-primary-text">
                        Add a cover image
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>

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
                {/* Where the shop is. Without it the shop never appears in a
                    proximity search at all — it only shows on the widest
                    rungs — and there was no way to set it after signup. */}
                <View className="mt-4">
                  <LocationRow
                    title="Shop location"
                    hint="Set this so buyers nearby can find you."
                    saved={shopLocLabel}
                    busy={shopLocSaving}
                    onPress={saveShopLocation}
                  />
                </View>

                <View className="mt-4">
                  <Text className="mb-2 text-[13px] font-semibold text-text-secondary">
                    What your shop sells
                  </Text>
                  <Text className="mb-2 text-[12px] leading-4 text-text-muted">
                    How buyers find your shop when browsing. Your products keep
                    their own categories — changing these does not move them.
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {shopCategories.map((cat) => (
                      <View
                        key={String(cat.id)}
                        className="flex-row items-center rounded border border-border bg-surface-sunken px-3 py-1"
                      >
                        <Text className="mr-2 text-sm text-text-primary">{cat.name}</Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${cat.name}`}
                          onPress={() =>
                            setShopCategories((prev) =>
                              prev.filter((c) => c.id !== cat.id)
                            )
                          }
                        >
                          <Text className="text-sm text-text-secondary">×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => setCategoryModalOpen(true)}
                      className="rounded border border-border bg-surface-raised px-4 py-2"
                    >
                      <Text className="text-sm font-bold text-text-primary">
                        {shopCategories.length ? '+ Edit' : '+ Add categories'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <CategoryAddition
                  visible={categoryModalOpen}
                  categories={categories}
                  parentSelectedCategories={shopCategories}
                  onClose={() => setCategoryModalOpen(false)}
                  onConfirm={(selected) => setShopCategories(selected)}
                />

                <TouchableOpacity
                  className={`mt-4 h-12 rounded bg-primary-fill items-center justify-center ${
                    isSellerDisabled ? "opacity-50" : ""
                  }`}
                  onPress={onSellerSubmit}
                  disabled={isSellerDisabled}
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
                    {loading ? 'Saving...' : 'Save Seller Info'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
