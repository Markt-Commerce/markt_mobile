import React from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";
import { useTokens } from "../theme/useTokens";

/**
 * The app's search input, in one place.
 *
 * There were nine of these, hand-rolled per screen, and no two matched: 48px
 * and 56px tall, bordered and not, 8px and 12px radius, semibold and regular
 * text, icon at 20px and 19px. Discover Shops was the one that looked right,
 * so this is that one.
 *
 * The soft fill carries the shape — a border on a filled field reads as an
 * error state everywhere else in this app, so search should not be the one
 * place it means nothing.
 */
export default function SearchField({
  value,
  onChangeText,
  placeholder,
  busy = false,
  onSubmit,
  autoFocus = false,
  className = "",
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  /** Shows a spinner in place of the clear button while a query is in flight. */
  busy?: boolean;
  onSubmit?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const t = useTokens();

  return (
    <View
      className={`h-12 flex-row items-center rounded-xl px-4 bg-surface-sunken ${className}`}
    >
      <Search size={19} color={t.textSecondary} />
      <TextInput
        className="ml-3 flex-1 text-[15px] text-text-primary"
        placeholder={placeholder}
        placeholderTextColor={t.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        selectionColor={t.primaryText}
      />
      {busy ? (
        <ActivityIndicator size="small" color={t.textSecondary} />
      ) : value.length > 0 ? (
        // Clearing a query by holding backspace is the kind of small tax that
        // makes people stop searching.
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <X size={17} color={t.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
