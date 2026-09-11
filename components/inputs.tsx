import { TextInput, View, Text, TouchableOpacity } from "react-native";
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form";
import React, { useRef, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "./themeProvider";
import { useTokens, tokensFor } from "../theme/useTokens";

interface InputProps<TFieldValues extends FieldValues = FieldValues> extends React.ComponentProps<typeof TextInput> {
  name?: Path<TFieldValues>;
  placeholder: string;
  /** Optional field label rendered above the input. When set, the field also
   * gets its own bottom spacing so stacked form fields are evenly separated. */
  label?: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  errors?: FieldErrors<TFieldValues>;
  control: Control<TFieldValues>;
}

/**
 * Markt form input.
 * - 56px height, 12px radius, a soft `surface-sunken` fill
 * - The fill carries the field's shape, so a border only ever means an error
 *   or focus. Hard-bordered boxes on every field read as a wireframe.
 * - Placeholder uses the secondary text token
 */
export function Input<TFieldValues extends FieldValues = FieldValues>({
  name,
  placeholder,
  label,
  secureTextEntry = false,
  value,
  onChangeText,
  errors,
  control,
  multiline = false,
  numberOfLines,
  keyboardType = "default",
  style,
  // Everything else goes straight to the TextInput.
  //
  // It used to be dropped. The props interface extends TextInput's, so call
  // sites had been passing `autoCapitalize="none"` on every email and
  // username field for a long time and it had never once reached the input —
  // which is how someone typing their address on iOS got "Ife@..." when they
  // meant "ife@...", and ended up with two accounts on one inbox. Same for
  // autoComplete and textContentType, so none of these fields ever offered
  // the right keyboard autofill either.
  ...rest
}: InputProps<TFieldValues>) {
  const hasError = name && errors?.[name];
  const errorMessage = hasError ? (errors[name!]?.message as string) : undefined;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTokens();

  // Multiline fields (post caption, request description) render as a taller
  // top-aligned textbox instead of a single-line 48px input.
  const sizeClass = multiline ? "min-h-[120px] py-3" : "h-14";

  return (
    <View className={`w-full ${label ? "mb-5" : ""}`}>
      {label ? (
        <Text className="mb-2 text-[13px] font-semibold text-text-secondary">
          {label}
        </Text>
      ) : null}
      <Controller
        control={control}
        name={name!}
        render={({ field: { onChange, onBlur, value: fieldValue } }) => (
          <>
            <TextInput
              {...rest}
              onChangeText={onChange}
              onBlur={onBlur}
              value={fieldValue}
              placeholder={placeholder}
              placeholderTextColor={t.textSecondary}
              secureTextEntry={secureTextEntry}
              // Soft filled field rather than a hard-bordered box: the fill
              // carries the shape, so the border is only ever an error signal.
              className={`w-full rounded-xl ${sizeClass} px-4 text-[16px] text-text-primary bg-surface-sunken border ${
                hasError ? "border-danger" : "border-transparent"
              }`}
              multiline={multiline}
              numberOfLines={numberOfLines}
              textAlignVertical={multiline ? "top" : "auto"}
              style={style}
              keyboardType={keyboardType}
              accessibilityLabel={placeholder}
              accessibilityState={{ disabled: false }}
            />
            {errorMessage ? (
              <Text className="mt-1 text-xs text-danger-text" accessibilityLiveRegion="polite">
                {errorMessage}
              </Text>
            ) : null}
          </>
        )}
      />
    </View>
  );
}

interface PasswordInputProps<TFieldValues extends FieldValues = FieldValues> extends Omit<InputProps<TFieldValues>, "secureTextEntry"> {
  /** When true, show password visibility toggle (eye icon) at end of field */
  showVisibilityToggle?: boolean;
}

/** Password input with optional eye toggle for show/hide */
export function PasswordInput<TFieldValues extends FieldValues = FieldValues>({
  showVisibilityToggle = true,
  ...inputProps
}: PasswordInputProps<TFieldValues>) {
  const [visible, setVisible] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const hasError = inputProps.name && inputProps.errors?.[inputProps.name];
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <View className="w-full">
      <Controller
        control={inputProps.control}
        name={inputProps.name!}
        render={({ field: { onChange, onBlur, value: fieldValue } }) => (
          <>
            <View
              className={`flex-row items-center rounded-xl h-14 px-4 border bg-surface-sunken ${
                hasError ? "border-danger" : isFocused ? "border-primary" : "border-transparent"
              }`}
            >
              <TextInput
                onChangeText={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                  setIsFocused(false);
                  onBlur();
                }}
                value={fieldValue}
                placeholder={inputProps.placeholder}
                placeholderTextColor={tokensFor(isDark).textSecondary}
                secureTextEntry={!visible}
                className="flex-1 text-[16px] text-text-primary"
                keyboardType={inputProps.keyboardType ?? "default"}
                textContentType="password"
                // Explicit, because iOS otherwise capitalises the first
                // character of a password the same way it does a sentence —
                // and with the field masked there is nothing to see it in.
                // The show/hide toggle only helps once you suspect something.
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                accessibilityLabel={inputProps.placeholder}
                accessibilityState={{ disabled: false }}
              />
              {showVisibilityToggle && (
                <TouchableOpacity
                  onPress={() => setVisible((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={visible ? "Hide password" : "Show password"}
                  accessibilityRole="button"
                >
                  {visible ? <EyeOff size={20} color={tokensFor(isDark).textSecondary} /> : <Eye size={20} color={tokensFor(isDark).textSecondary} />}
                </TouchableOpacity>
              )}
            </View>
            {inputProps.errors?.[inputProps.name!] ? (
              <Text className="mt-1 text-xs text-danger-text" accessibilityLiveRegion="polite">
                {inputProps.errors[inputProps.name!]?.message as string}
              </Text>
            ) : null}
          </>
        )}
      />
    </View>
  );
}

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  digits?: number;
}

/**
 * The 6-digit verification code input.
 *
 * The boxes used to be filled with `textPrimary` — which is black in light
 * mode, so six solid black squares sat in the middle of an otherwise white
 * screen, looking like images that had failed to load. They were also the
 * only input in the app that inverted its colours, while every other field
 * uses a soft `surface-sunken` fill.
 *
 * Now they match: sunken fill, transparent border that turns primary on focus
 * and danger on error, with the digit in normal text. The focused box is the
 * only thing that moves, which is what tells you where you are.
 */
export function OTPInput({ value, onChange, error, digits = 6 }: OTPInputProps) {
  const t = useTokens();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [digitArray, setDigits] = useState<string[]>(Array(digits).fill(""));
  const [focused, setFocused] = useState<number | null>(null);

  useEffect(() => {
    if (value && value.length === digits) {
      setDigits(value.split(""));
    } else if (!value) {
      setDigits(Array(digits).fill(""));
    }
  }, [value, digits]);

  const handleChange = (text: string, index: number) => {
    const newDigits = [...digitArray];
    const char = text.slice(-1);
    newDigits[index] = char;
    setDigits(newDigits);

    const newValue = newDigits.join("");
    onChange(newValue);

    // Auto-focus next box
    if (char && index < digits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!digitArray[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digitArray];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        onChange(newDigits.join(""));
      }
    }
  };

  return (
    <View className="w-full">
      <View className="flex-row justify-between">
        {Array(digits)
          .fill(0)
          .map((_, i) => (
            <View
              key={i}
              className={`rounded-xl items-center justify-center border-2 bg-surface-sunken ${
                error
                  ? "border-danger"
                  : focused === i
                    ? "border-primary"
                    : "border-transparent"
              }`}
              style={{
                width: `${100 / digits - 2}%`,
                // Not a square: a 1:1 box at this width is taller than any
                // other field on the screen and dominates it.
                aspectRatio: 0.82,
              }}
            >
              <TextInput
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                className="text-[22px] font-bold text-center w-full h-full text-text-primary"
                keyboardType="number-pad"
                maxLength={1}
                value={digitArray[i]}
                onChangeText={(text) => handleChange(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                onFocus={() => setFocused(i)}
                onBlur={() => setFocused((f) => (f === i ? null : f))}
                selectionColor={t.primaryText}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
              />
            </View>
          ))}
      </View>
      {error ? (
        <Text className="mt-2 text-xs text-danger-text" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
