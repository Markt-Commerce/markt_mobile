/**
 * New procurement request: what, how much, specifications, where and when.
 * Posted as a buyer request from a business account, so it reaches
 * suppliers as a procurement request.
 */
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import Button from "../../components/button";
import { Field, OptionPicker, SpecificationEditor, parseOptionalNumber, rowsToSpecs } from "../../components/business/ui";
import { useBusiness } from "../../hooks/businessContext";
import { useUser } from "../../hooks/userContextProvider";
import { createBuyerRequest } from "../../services/sections/request";
import { friendlyErrorMessage } from "../../utils/errorMessages";

/** DD/MM/YYYY (how people here write dates) → YYYY-MM-DD, or null. */
function parseDay(text: string): string | null | "invalid" {
  const s = text.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return "invalid";
  const [, d, mo, y] = m;
  const iso = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date.getDate() !== Number(d)) return "invalid";
  return iso;
}

export default function NewProcurementScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const { config, myBusiness } = useBusiness();
  const business = myBusiness?.profile;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<string[]>([]);
  const [specs, setSpecs] = useState([{ key: "", value: "" }]);
  const [location, setLocation] = useState([business?.city, business?.state].filter(Boolean).join(", "));
  const [neededBy, setNeededBy] = useState("");
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const qty = parseOptionalNumber(quantity);
    const money = parseOptionalNumber(budget);
    const date = parseDay(neededBy);
    if (!title.trim()) return setError("Say what you need.");
    if (description.trim().length < 10) return setError("Add a description of at least 10 characters.");
    if (Number.isNaN(qty) || Number.isNaN(money)) return setError("Quantity and budget must be numbers.");
    if (date === "invalid") return setError("Enter the date as DD/MM/YYYY.");
    if (!myBusiness?.is_business) return setError("Set up your business profile before posting procurement requests.");

    setSaving(true);
    try {
      const created = await createBuyerRequest({
        title: title.trim(),
        description: description.trim(),
        ...(money !== null ? { budget: money } : {}),
        quantity: qty,
        unit: unit[0] ?? null,
        specifications: rowsToSpecs(specs),
        delivery_location: location.trim() || null,
        required_delivery_date: date,
      });
      router.replace(`/requestDetails/${created.id}`);
    } catch (e) {
      setError(friendlyErrorMessage(e, "Could not post the request."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="New procurement request" fallback="/business/procurement" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {!profile?.is_buyer ? (
            <View className="p-4 rounded-2xl bg-surface-sunken">
              <Text className="text-sm leading-5 text-text-secondary">
                Posting procurement requests needs a buyer account. Add one from your Profile — it uses the same login.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-4 text-[14px] leading-5 text-text-secondary">
                Suppliers see this and respond with offers. Nothing becomes an order until you accept an offer and agree
                the terms.
              </Text>
              <Field label="Product or material" value={title} onChangeText={setTitle} maxLength={100} placeholder="e.g. Fresh cassava roots" />
              <Field
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={2000}
                placeholder="What it's for, quality expectations, how often you need it."
              />
              <Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
              <OptionPicker label="Unit" options={config.units} selected={unit} onToggle={(k) => setUnit((cur) => (cur[0] === k ? [] : [k]))} />
              <SpecificationEditor rows={specs} onChange={setSpecs} />
              <Field label="Delivery location" value={location} onChangeText={setLocation} maxLength={255} />
              <Field label="Needed by (optional)" value={neededBy} onChangeText={setNeededBy} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" />
              <Field label="Budget in ₦ (optional)" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" hint="Leave blank to let suppliers quote." />
              {error ? <Text className="mb-3 text-sm text-danger-text">{error}</Text> : null}
              <Button text="Post request" loading={saving} onPress={submit} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
