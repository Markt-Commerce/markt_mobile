import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, Image as ImageIcon, Save } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import { SettingsSection, SettingsSwitchRow } from "../../components/SettingsList";
import { useTheme } from "../../components/themeProvider";
import { useToast } from "../../components/ToastProvider";
import { getMyNiches, getNicheById, updateNiche } from "../../services/sections/niches";
import { attemptMultipleUpload } from "../../services/sections/media";
import type { Niches, NicheVisibility, UpdateNicheRequest } from "../../models/niches";
import { friendlyErrorMessage } from "../../utils/errorMessages";

export default function NicheSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { show } = useToast();
  const isDark = resolvedTheme === "dark";
  const [niche, setNiche] = useState<Niches | null>(null);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<NicheVisibility>("public");
  const [allowBuyerPosts, setAllowBuyerPosts] = useState(true);
  const [allowSellerPosts, setAllowSellerPosts] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [tags, setTags] = useState("");
  const [rules, setRules] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([getNicheById(id), getMyNiches(1, 100)]).then(([value, memberships]) => {
      if (!memberships.items.some((membership) => membership.niche_id === id && membership.role === "owner")) {
        show({ variant: "error", title: "Owner access required", message: "Only the community owner can change these settings." });
        router.back();
        return;
      }
      setNiche(value);
      setName(value.name ?? "");
      setDescription(value.description ?? "");
      setVisibility((value.visibility as NicheVisibility) ?? "public");
      setAllowBuyerPosts(value.allow_buyer_posts);
      setAllowSellerPosts(value.allow_seller_posts);
      setRequireApproval(value.require_approval);
      setTags((value.tags ?? []).join(", "));
      setRules((value.rules ?? []).join("\n"));
      setOwnerChecked(true);
    }).catch(() => show({ variant: "error", title: "Could not load settings", message: "Please try again." }));
  }, [id, router, show]);

  const save = async (extra: UpdateNicheRequest = {}) => {
    if (!id || saving) return;
    setSaving(true);
    try {
      const updated = await updateNiche(id, {
        name: name.trim(),
        description: description.trim(),
        visibility,
        allow_buyer_posts: allowBuyerPosts,
        allow_seller_posts: allowSellerPosts,
        require_approval: requireApproval,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        rules: rules.split("\n").map((rule) => rule.trim()).filter(Boolean),
        ...extra,
      });
      setNiche(updated);
      show({ variant: "success", title: "Community updated", message: "Your changes have been saved." });
    } catch (error) {
      show({ variant: "error", title: "Could not save changes", message: friendlyErrorMessage(error, "Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  const changeImage = async (field: "image_id" | "banner_id") => {
    if (!id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo access to update the community image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    try {
      setSaving(true);
      const uploaded = await attemptMultipleUpload([{ uri: result.assets[0].uri, fileName: "community.jpg", type: "image/jpeg" } as any]);
      const mediaId = uploaded[0]?.media?.id;
      if (!mediaId) throw new Error("Image upload failed");
      const updated = await updateNiche(id, { [field]: mediaId });
      setNiche(updated);
      show({ variant: "success", title: "Image updated", message: "Your community image is now visible." });
    } catch (error) {
      show({ variant: "error", title: "Image upload failed", message: friendlyErrorMessage(error, "Could not update the community image.") });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `rounded border px-4 py-3 text-base ${isDark ? "bg-[#1a1c1d] border-[#46464e] text-[#f0f1f2]" : "bg-white border-border text-black"}`;
  const muted = isDark ? "text-[#8f9195]" : "text-tertiary";

  if (!niche || !ownerChecked) {
    return <View className={`flex-1 items-center justify-center ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}><ActivityIndicator /></View>;
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
      <ScreenHeader title="Community settings" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SettingsSection title="Community identity" dark={isDark}>
          <View className="p-4">
            <Text className={`text-xs font-bold uppercase tracking-[2px] mb-2 ${muted}`}>Name</Text>
            <TextInput value={name} onChangeText={setName} className={`${inputClass} mb-4`} placeholder="Community name" placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"} />
            <Text className={`text-xs font-bold uppercase tracking-[2px] mb-2 ${muted}`}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" className={`${inputClass} min-h-[110px]`} placeholder="What is this community about?" placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"} />
          </View>
        </SettingsSection>

        <SettingsSection title="Images" dark={isDark}>
          <TouchableOpacity onPress={() => changeImage("image_id")} className="flex-row items-center px-4 py-3 min-h-[72px]">
            {niche.image_url ? <Image source={{ uri: niche.image_url }} className="w-12 h-12 rounded-xl" /> : <Camera size={22} color={isDark ? "#c6c5cf" : "#3F3F46"} />}
            <View className="flex-1 ml-4"><Text className={`text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Community profile picture</Text><Text className={`text-[13px] mt-0.5 ${muted}`}>Shown beside the community name</Text></View><ImageIcon size={18} color={isDark ? "#8f9195" : "#A1A1AA"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeImage("banner_id")} className="flex-row items-center px-4 py-3 min-h-[72px] border-t border-[#EFEFF1]">
            {niche.banner_url ? <Image source={{ uri: niche.banner_url }} className="w-12 h-12 rounded-xl" /> : <ImageIcon size={22} color={isDark ? "#c6c5cf" : "#3F3F46"} />}
            <View className="flex-1 ml-4"><Text className={`text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Community banner</Text><Text className={`text-[13px] mt-0.5 ${muted}`}>Shown at the top of the community</Text></View><ImageIcon size={18} color={isDark ? "#8f9195" : "#A1A1AA"} />
          </TouchableOpacity>
        </SettingsSection>

        <SettingsSection title="Posting & privacy" dark={isDark}>
          <View className="px-4 py-4"><Text className={`text-xs font-bold uppercase tracking-[2px] mb-3 ${muted}`}>Visibility</Text><View className="flex-row gap-2">{(["public", "private", "restricted"] as NicheVisibility[]).map((option) => <TouchableOpacity key={option} onPress={() => setVisibility(option)} className={`px-4 py-2 rounded-full border ${visibility === option ? "bg-primary border-primary" : isDark ? "border-[#46464e]" : "border-border"}`}><Text className={`text-sm capitalize ${visibility === option ? "text-white font-bold" : isDark ? "text-[#c6c5cf]" : "text-secondary"}`}>{option}</Text></TouchableOpacity>)}</View></View>
          <SettingsSwitchRow icon={Camera} title="Allow buyer posts" value={allowBuyerPosts} onValueChange={setAllowBuyerPosts} dark={isDark} />
          <SettingsSwitchRow icon={Camera} title="Allow seller posts" value={allowSellerPosts} onValueChange={setAllowSellerPosts} dark={isDark} />
          <SettingsSwitchRow icon={Save} title="Approve posts before publishing" subtitle="Review new posts before members can see them." value={requireApproval} onValueChange={setRequireApproval} dark={isDark} last />
        </SettingsSection>

        <SettingsSection title="Community details" dark={isDark}>
          <View className="p-4"><Text className={`text-xs font-bold uppercase tracking-[2px] mb-2 ${muted}`}>Tags, separated by commas</Text><TextInput value={tags} onChangeText={setTags} className={`${inputClass} mb-4`} placeholder="fashion, tech, food" placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"} /><Text className={`text-xs font-bold uppercase tracking-[2px] mb-2 ${muted}`}>Rules, one per line</Text><TextInput value={rules} onChangeText={setRules} multiline className={`${inputClass} min-h-[100px]`} placeholder="Be respectful\nKeep posts relevant" placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"} /></View>
        </SettingsSection>
        <TouchableOpacity disabled={saving} onPress={() => save()} className="mx-4 mt-6 h-12 rounded bg-primary flex-row items-center justify-center"><Save size={18} color="#fff" /><Text className="text-white font-bold ml-2">{saving ? "Saving…" : "Save changes"}</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}
