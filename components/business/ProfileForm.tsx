/**
 * The business profile form, for onboarding and for editing.
 *
 * On onboarding it also asks whether the business buys, sells or both, and
 * sets up whichever Markt buyer/seller account is missing — procurement
 * requests hang off the buyer account and product listings off the seller one.
 */
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Check } from "lucide-react-native";
import Button from "../button";
import { Card, Field, OptionPicker } from "./ui";
import { useTokens } from "../../theme/useTokens";
import { useUser } from "../../hooks/userContextProvider";
import { useBusiness } from "../../hooks/businessContext";
import { saveBusinessProfile } from "../../services/sections/business";
import { ensureBuyerRole, ensureSellerRole } from "../../services/sections/roles";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import type { BusinessProfile, MyBusiness } from "../../models/business";

function Choice({ title, text, on, locked, onPress }: { title: string; text: string; on: boolean; locked: boolean; onPress: () => void }) {
  const t = useTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={locked}
      activeOpacity={0.85}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on, disabled: locked }}
      className={`flex-row gap-3 p-4 rounded-2xl border ${on ? "border-primary bg-primary-muted" : "border-border bg-surface-sunken"}`}
    >
      <View className={`w-6 h-6 rounded-md items-center justify-center ${on ? "bg-primary-fill" : "bg-surface-raised border border-border-strong"}`}>
        {on ? <Check size={15} color={t.textOnPrimary} strokeWidth={3} /> : null}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-text-primary">{title}</Text>
        <Text className="mt-0.5 text-[13px] leading-5 text-text-secondary">{text}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function BusinessProfileForm({
  profile,
  onboarding = false,
  onSaved,
}: {
  profile: BusinessProfile | null;
  onboarding?: boolean;
  onSaved: (saved: MyBusiness) => void;
}) {
  const { config, refreshMyBusiness } = useBusiness();
  const { profile: userProfile, setProfile, refreshProfile } = useUser();
  const isBuyer = !!userProfile?.is_buyer;
  const isSeller = !!userProfile?.is_seller;

  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [types, setTypes] = useState<string[]>(profile?.business_types ?? []);
  const [industry, setIndustry] = useState<string[]>(profile?.industry ? [profile.industry] : []);
  const [address, setAddress] = useState(profile?.address ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [stateName, setStateName] = useState(profile?.state ?? "");
  const [email, setEmail] = useState(profile?.contact_email ?? "");
  const [phone, setPhone] = useState(profile?.contact_phone ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [registration, setRegistration] = useState(profile?.registration_number ?? "");
  const [buys, setBuys] = useState(isBuyer);
  const [sells, setSells] = useState(isSeller);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (config.business_types.length === 0) {
    return (
      <Card className="mx-4">
        <Text className="text-sm text-text-secondary">Business settings couldn't be loaded. Check your connection and try again.</Text>
      </Card>
    );
  }

  const toggleType = (key: string) =>
    setTypes((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : cur.length >= 5 ? cur : [...cur, key]));

  const save = async () => {
    setError(null);
    if (name.trim().length < 2) return setError("Enter your business name.");
    if (types.length === 0) return setError("Choose at least one business type.");
    if (onboarding && !buys && !sells) return setError("Choose whether your business buys, sells, or both.");

    const site = website.trim();
    setSaving(true);
    try {
      const saved = await saveBusinessProfile({
        name: name.trim(),
        description: description.trim() || null,
        business_types: types,
        industry: industry[0] ?? null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: stateName.trim() || null,
        country: profile?.country ?? "Nigeria",
        contact_email: email.trim() || null,
        contact_phone: phone.trim() || null,
        // People type "example.com"; the backend wants a full URL.
        website: site ? (/^https?:\/\//i.test(site) ? site : `https://${site}`) : null,
        registration_number: registration.trim() || null,
      });

      let latest = userProfile;
      if (buys && !isBuyer) latest = (await ensureBuyerRole(latest, { buyername: name.trim() })) ?? latest;
      if (sells && !isSeller) {
        latest =
          (await ensureSellerRole(latest, { shop_name: name.trim(), description: description.trim() || name.trim() })) ?? latest;
      }
      if (latest !== userProfile) {
        setProfile(latest);
        void refreshProfile();
      }
      await refreshMyBusiness();
      onSaved(saved);
    } catch (e) {
      setError(friendlyErrorMessage(e, "Could not save your business profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="px-4">
      {onboarding ? (
        <View className="mb-6 gap-3">
          <Text className="text-[15px] font-bold text-text-primary">What does your business do on Markt?</Text>
          <Choice
            title="We buy"
            text={`Source raw materials, packaging or equipment and post procurement requests.${isBuyer ? " Your buyer account is already set up." : ""}`}
            on={buys}
            locked={isBuyer}
            onPress={() => setBuys((v) => !v)}
          />
          <Choice
            title="We sell"
            text={`List what you produce or supply and respond to procurement requests.${isSeller ? " Your seller account is already set up." : ""}`}
            on={sells}
            locked={isSeller}
            onPress={() => setSells((v) => !v)}
          />
        </View>
      ) : null}

      <Text className="mb-3 text-[15px] font-bold text-text-primary">About the business</Text>
      <Field label="Business name" value={name} onChangeText={setName} maxLength={150} />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
        placeholder="What you produce, buy or supply, and for whom."
      />
      <OptionPicker label="Business type" hint="Choose all that apply (up to 5)." options={config.business_types} selected={types} onToggle={toggleType} />
      <OptionPicker
        label="Industry"
        options={config.industries}
        selected={industry}
        onToggle={(key) => setIndustry((cur) => (cur[0] === key ? [] : [key]))}
      />

      <Text className="mt-2 mb-3 text-[15px] font-bold text-text-primary">Location</Text>
      <Field label="Address" value={address} onChangeText={setAddress} maxLength={255} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="City / town" value={city} onChangeText={setCity} maxLength={100} />
        </View>
        <View className="flex-1">
          <Field label="State" value={stateName} onChangeText={setStateName} maxLength={100} />
        </View>
      </View>

      <Text className="mt-2 mb-3 text-[15px] font-bold text-text-primary">Contact and registration</Text>
      <Field label="Business email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="Business phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={20} />
      <Field label="Website (optional)" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" placeholder="example.com" />
      <Field
        label="Registration number (optional)"
        value={registration}
        onChangeText={setRegistration}
        maxLength={50}
        placeholder="e.g. CAC RC number"
        hint="Only you can see this. Adding it doesn't verify your business."
      />

      {error ? <Text className="mb-3 text-sm text-danger-text">{error}</Text> : null}
      <Button text={onboarding ? "Create business profile" : "Save changes"} loading={saving} onPress={save} />
    </View>
  );
}
