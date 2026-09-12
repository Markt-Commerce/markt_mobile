/**
 * A seller offering this buyer a discount, from inside the chat.
 *
 * The backend has had this endpoint all along and nothing in the app called
 * it — the attach sheet only ever listed offers, so a seller could see
 * discounts but never make one.
 *
 * Deliberately small: type, amount, how long it lasts, and an optional note.
 * Everything else the endpoint accepts (usage limits, codes, caps) is
 * shopkeeping that does not belong in the middle of a conversation.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { useKeyboardOverlap } from "../../hooks/useKeyboardOverlap";

type DiscountType = "percentage" | "fixed_amount";

const DURATIONS: { label: string; hours: number }[] = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Resolves when the offer has been sent. */
  onSubmit: (offer: {
    discount_type: DiscountType;
    discount_value: number;
    expires_at: string;
    discount_message?: string;
  }) => Promise<void>;
  /** The product this room is about, so the seller can see what they are
   *  discounting. Informational only. */
  productName?: string | null;
}

export default function DiscountOfferSheet({
  visible,
  onClose,
  onSubmit,
  productName,
}: Props) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap(visible);
  const [type, setType] = useState<DiscountType>("percentage");
  const [value, setValue] = useState("");
  const [hours, setHours] = useState(24);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numeric = Number(value);
  // A percentage over 100 would take the basket below zero. The server clamps
  // it anyway; saying so here beats letting them send it and wondering.
  const valid =
    Number.isFinite(numeric) &&
    numeric > 0 &&
    (type === "fixed_amount" || numeric <= 100);

  const reset = () => {
    setValue("");
    setNote("");
    setType("percentage");
    setHours(24);
    setError(null);
  };

  const send = async () => {
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit({
        discount_type: type,
        discount_value: numeric,
        expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
        discount_message: note.trim() || undefined,
      });
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Couldn't send that offer. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* The same shape QuickChatBottomSheet settled on: the layout lifts the
          sheet, nothing measures it. Padding the sheet by the measured
          keyboard height instead double-counted on Android -- the modal
          window had already resized -- and pushed all but one field off the
          top of the screen. The measurement is still useful for exactly one
          thing: dropping the home-indicator inset once the keyboard has
          taken that space. */}
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/40"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <View
          className="rounded-t-2xl bg-surface-raised px-5 pt-4"
          style={{
            paddingBottom: (keyboardOverlap > 0 ? 0 : Math.max(insets.bottom, 12)) + 12,
            // So a long form scrolls inside the sheet rather than growing the
            // sheet until the chat behind it disappears.
            maxHeight: "85%",
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[17px] font-bold text-text-primary">
              Offer a discount
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <X size={20} color={t.textSecondary} />
            </TouchableOpacity>
          </View>
          {productName ? (
            <Text
              className="mt-1 text-[13px] text-text-secondary"
              numberOfLines={1}
            >
              On {productName}
            </Text>
          ) : null}

          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="mt-4 flex-row gap-2">
              {(
                [
                  ["percentage", "Percentage"],
                  ["fixed_amount", "Fixed amount"],
                ] as [DiscountType, string][]
              ).map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  onPress={() => setType(id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: type === id }}
                  className={`flex-1 items-center rounded-xl border py-3 ${
                    type === id
                      ? "border-primary-fill bg-surface-sunken"
                      : "border-border bg-surface-sunken"
                  }`}
                >
                  <Text
                    className={`text-[14px] font-semibold ${
                      type === id ? "text-primary-text" : "text-text-secondary"
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="mt-4 flex-row items-center rounded-xl border border-border bg-surface-sunken px-4">
              <Text className="text-[16px] text-text-secondary">
                {type === "percentage" ? "%" : "₦"}
              </Text>
              <TextInput
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                placeholder={type === "percentage" ? "10" : "500"}
                placeholderTextColor={t.textMuted}
                accessibilityLabel={
                  type === "percentage"
                    ? "Percentage off"
                    : "Amount off in naira"
                }
                className="ml-2 h-14 flex-1 text-[16px] text-text-primary"
              />
            </View>
            {type === "percentage" && numeric > 100 ? (
              <Text className="mt-1 text-[12px] text-danger-text">
                A percentage can't be more than 100.
              </Text>
            ) : null}

            <Text className="mt-5 text-[13px] font-semibold text-text-secondary">
              Expires in
            </Text>
            <View className="mt-2 flex-row gap-2">
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.hours}
                  onPress={() => setHours(d.hours)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: hours === d.hours }}
                  className={`flex-1 items-center rounded-xl border py-2.5 ${
                    hours === d.hours
                      ? "border-primary-fill bg-surface-sunken"
                      : "border-border bg-surface-sunken"
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      hours === d.hours
                        ? "text-primary-text"
                        : "text-text-secondary"
                    }`}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={t.textMuted}
              accessibilityLabel="Note with the offer"
              className="mt-4 h-14 rounded-xl border border-border bg-surface-sunken px-4 text-[15px] text-text-primary"
            />

            {error ? (
              <Text className="mt-3 text-[13px] text-danger-text">{error}</Text>
            ) : null}

            <TouchableOpacity
              onPress={send}
              disabled={!valid || sending}
              accessibilityRole="button"
              accessibilityState={{ disabled: !valid || sending, busy: sending }}
              className={`mt-5 flex-row items-center justify-center gap-2 rounded-xl py-4 ${
                !valid || sending ? "bg-surface-sunken" : "bg-primary-fill"
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color={t.textSecondary} />
              ) : null}
              <Text
                className={`text-[15px] font-bold ${
                  !valid || sending ? "text-text-muted" : "text-text-on-primary"
                }`}
              >
                {sending ? "Sending…" : "Send offer"}
              </Text>
            </TouchableOpacity>

            <Text className="mt-3 text-[12px] leading-[18px] text-text-muted">
              They'll see it in this chat and can use it at checkout. It only
              applies to your shop, and only once.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
