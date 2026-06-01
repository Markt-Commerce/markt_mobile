import { TextInput, View, Text, TouchableOpacity } from "react-native";
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form";
import React, { useRef, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "./themeProvider";

interface InputProps<TFieldValues extends FieldValues = FieldValues> extends React.ComponentProps<typeof TextInput> {
  name?: Path<TFieldValues>;
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  errors?: FieldErrors<TFieldValues>;
  control: Control<TFieldValues>;
}

/**
 * Markt form input (Kinetic Minimalist).
 * - 48px height, rounded (8px), bg-background, 1px border-border
 * - Placeholder: text-muted
 * - Error: border-error when invalid
 */
export function Input<TFieldValues extends FieldValues = FieldValues>({
  name,
  placeholder,
  secureTextEntry = false,
  value,
  onChangeText,
  errors,
  control,
  multiline = false,
  keyboardType = "default",
}: InputProps<TFieldValues>) {
  const hasError = name && errors?.[name];
  const errorMessage = hasError ? (errors[name!]?.message as string) : undefined;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <View className="w-full">
      <Controller
        control={control}
        name={name!}
        render={({ field: { onChange, onBlur, value: fieldValue } }) => (
          <>
            <TextInput
              onChangeText={onChange}
              onBlur={onBlur}
              value={fieldValue}
              placeholder={placeholder}
              placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
              secureTextEntry={secureTextEntry}
              className={`w-full rounded h-12 px-4 text-base font-inter ${isDark ? "text-[#f0f1f2] bg-[#1a1c1d]" : "text-secondary bg-background"} border ${
                hasError ? "border-error" : isDark ? "border-[#46464e] focus:border-[#f0f1f2]" : "border-border focus:border-secondary"
              }`}
              multiline={multiline}
              keyboardType={keyboardType}
              accessibilityLabel={placeholder}
              accessibilityState={{ disabled: false }}
            />
            {errorMessage ? (
              <Text className="mt-1 text-xs font-geist text-error" accessibilityLiveRegion="polite">
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
              className={`flex-row items-center rounded h-12 px-4 bg-background border ${
                hasError ? "border-error" : isFocused ? (isDark ? "border-[#f0f1f2]" : "border-secondary") : isDark ? "border-[#46464e]" : "border-border"
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
                placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
                secureTextEntry={!visible}
                className={`flex-1 text-base font-inter ${isDark ? "text-[#f0f1f2]" : "text-secondary"}`}
                keyboardType={inputProps.keyboardType ?? "default"}
                textContentType="password"
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
                  {visible ? <EyeOff size={20} color={isDark ? "#c6c5cf" : "#71717A"} /> : <Eye size={20} color={isDark ? "#c6c5cf" : "#71717A"} />}
                </TouchableOpacity>
              )}
            </View>
            {inputProps.errors?.[inputProps.name!] ? (
              <Text className="mt-1 text-xs font-geist text-error" accessibilityLiveRegion="polite">
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
 * Highly stylized OTP/Verification code input.
 * - Dark, rounded boxes (Kinetic Minimalist)
 * - Auto-focus management
 * - Consistent with user reference image
 */
export function OTPInput({ value, onChange, error, digits = 6 }: OTPInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [digitArray, setDigits] = useState<string[]>(Array(digits).fill(""));
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
              className={`rounded items-center justify-center border ${
                error ? "border-error" : "border-transparent"
              }`}
              style={{
                width: `${100 / digits - 2}%`,
                aspectRatio: 1,
                backgroundColor: isDark ? "#2f3132" : "#000000",
              }}
            >
              <TextInput
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                className={`text-2xl font-geist font-bold text-center w-full h-full ${isDark ? "text-[#f0f1f2]" : "text-white"}`}
                keyboardType="number-pad"
                maxLength={1}
                value={digitArray[i]}
                onChangeText={(text) => handleChange(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                selectionColor="#FFFFFF"
                autoComplete="one-time-code"
              />
            </View>
          ))}
      </View>
      {error ? (
        <Text className="mt-2 text-xs font-inter text-error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
