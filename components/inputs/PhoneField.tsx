import React, { useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View, FlatList } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";

/**
 * One phone field for the whole app.
 *
 * Two screens had `+1 (555) 000-0000` as the placeholder — a US number, in a
 * Nigeria-first marketplace. It defaults to **+234** now, formats the local
 * part the way Nigerians write it (`0801 234 5678`), and validates against the
 * chosen country rather than accepting anything.
 *
 * The country list is short on purpose: Nigeria plus the diaspora corridors
 * that actually appear in this market. A 200-row picker to find the country
 * 95% of users are already on is friction, not completeness.
 */

export interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  /** Digits expected after the trunk zero and any dial prefix are stripped. */
  nsn: number;
}

export const COUNTRIES: Country[] = [
  { code: "NG", dial: "+234", flag: "🇳🇬", name: "Nigeria", nsn: 10 },
  { code: "GH", dial: "+233", flag: "🇬🇭", name: "Ghana", nsn: 9 },
  { code: "KE", dial: "+254", flag: "🇰🇪", name: "Kenya", nsn: 9 },
  { code: "ZA", dial: "+27", flag: "🇿🇦", name: "South Africa", nsn: 9 },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "United Kingdom", nsn: 10 },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "United States", nsn: 10 },
  { code: "CA", dial: "+1", flag: "🇨🇦", name: "Canada", nsn: 10 },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

/**
 * Reduce whatever was typed or pasted to the national number.
 *
 * Handles three shapes people actually enter: `08012345678` (how it is written
 * here), `8012345678`, and `+2348012345678` — pasting from Contacts or
 * WhatsApp gives the last one, and rejecting it would look like a bug.
 */
export function normalisePhone(local: string, country: Country): string {
  let digits = local.replace(/\D/g, "");
  const dial = country.dial.replace("+", "");

  // A pasted international number: strip the country code, but only when what
  // remains is the right length — otherwise "234..." might be the number.
  if (digits.startsWith(dial) && digits.length - dial.length >= country.nsn) {
    digits = digits.slice(dial.length);
  }
  if (country.code === "NG" && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isValidPhone(local: string, country: Country): boolean {
  return normalisePhone(local, country).length === country.nsn;
}

/** E.164, which is what the backend should store. */
export function toE164(local: string, country: Country): string {
  return `${country.dial}${normalisePhone(local, country)}`;
}

/** Groups as `0801 234 5678` — how the number is spoken and written here. */
function formatNG(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

export default function PhoneField({
  value,
  onChangeText,
  country,
  onChangeCountry,
  label = "Phone number",
  error,
  autoFocus,
}: {
  value: string;
  onChangeText: (v: string) => void;
  country: Country;
  onChangeCountry: (c: Country) => void;
  label?: string;
  error?: string | null;
  autoFocus?: boolean;
}) {
  const t = useTokens();
  const [picking, setPicking] = useState(false);

  const display = useMemo(
    () => (country.code === "NG" ? formatNG(value) : value),
    [value, country.code]
  );

  return (
    <View>
      <Text className="text-[13px] font-semibold mb-2 text-text-secondary">
        {label}
      </Text>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setPicking(true)}
          accessibilityRole="button"
          accessibilityLabel={`Country: ${country.name}. Change`}
          className="h-14 px-3 rounded-xl flex-row items-center gap-1.5 bg-surface-sunken"
        >
          <Text className="text-[20px]">{country.flag}</Text>
          <ChevronDown size={16} color={t.textSecondary} />
        </Pressable>

        <View
          className={`flex-1 h-14 px-4 rounded-xl flex-row items-center bg-surface-sunken ${
            error ? "border border-danger" : ""
          }`}
        >
          <Text className="text-[16px] font-semibold text-text-primary mr-2">
            {country.dial}
          </Text>
          <TextInput
            value={display}
            onChangeText={(v) => onChangeText(v.replace(/\D/g, ""))}
            placeholder={country.code === "NG" ? "0801 234 5678" : "Phone number"}
            placeholderTextColor={t.textMuted}
            keyboardType="phone-pad"
            autoFocus={autoFocus}
            accessibilityLabel={label}
            className="flex-1 text-[16px] text-text-primary"
          />
        </View>
      </View>

      {error ? (
        <Text
          className="text-xs mt-1.5 text-danger-text"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}

      <Modal
        visible={picking}
        transparent
        animationType="slide"
        onRequestClose={() => setPicking(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setPicking(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="rounded-t-3xl bg-surface-overlay pt-5 pb-8">
              <Text className="text-[17px] font-bold px-5 mb-3 text-text-primary">
                Country
              </Text>
              <FlatList
                data={COUNTRIES}
                keyExtractor={(c) => `${c.code}${c.dial}`}
                renderItem={({ item }) => {
                  const on = item.code === country.code;
                  return (
                    <Pressable
                      onPress={() => {
                        onChangeCountry(item);
                        setPicking(false);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      className="flex-row items-center gap-3 px-5 h-14"
                    >
                      <Text className="text-[22px]">{item.flag}</Text>
                      <Text className="flex-1 text-[16px] text-text-primary">
                        {item.name}
                      </Text>
                      <Text className="text-[15px] text-text-secondary">
                        {item.dial}
                      </Text>
                      {on ? <Check size={18} color={t.primaryText} /> : null}
                    </Pressable>
                  );
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
