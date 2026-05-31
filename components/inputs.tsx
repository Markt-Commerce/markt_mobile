import { TextInput, View, Text, TouchableOpacity } from "react-native";
import { Control, Controller } from "react-hook-form";
import React from "react";
import { Eye, EyeOff } from "lucide-react-native";

interface InputProps extends React.ComponentProps<typeof TextInput> {
  name?: string;
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  errors?: Record<string, { message?: string }>;
  control: Control<any>;
}

/**
 * Markt form input.
 * - 56px height, rounded-xl, bg-muted
 * - Placeholder: text-secondary
 * - Error: border-error when invalid
 */
export function Input({
  name,
  placeholder,
  secureTextEntry = false,
  value,
  onChangeText,
  errors,
  control,
  multiline = false,
  keyboardType = "default",
}: InputProps) {
  const hasError = name && errors?.[name];
  const errorMessage = hasError ? (errors[name!]?.message as string) : undefined;

  return (
    <View className="flex flex-wrap items-end gap-2 py-3">
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
              placeholderTextColor="#876d64"
              secureTextEntry={secureTextEntry}
              className={`form-input w-full rounded-xl h-14 px-4 text-base font-normal text-text-primary bg-bg-muted ${
                hasError ? "border-2 border-error" : ""
              }`}
              multiline={multiline}
              keyboardType={keyboardType}
              accessibilityLabel={placeholder}
              accessibilityState={{ disabled: false }}
            />
            {errorMessage ? (
              <Text className="mt-1 text-xs text-error" accessibilityLiveRegion="polite">
                {errorMessage}
              </Text>
            ) : null}
          </>
        )}
      />
    </View>
  );
}

interface PasswordInputProps extends Omit<InputProps, "secureTextEntry"> {
  /** When true, show password visibility toggle (eye icon) at end of field */
  showVisibilityToggle?: boolean;
}

/** Password input with optional eye toggle for show/hide */
export function PasswordInput({
  showVisibilityToggle = true,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  const hasError = inputProps.name && inputProps.errors?.[inputProps.name];

  return (
    <View className="flex flex-wrap items-end gap-2 py-3">
      <Controller
        control={inputProps.control}
        name={inputProps.name!}
        render={({ field: { onChange, onBlur, value: fieldValue } }) => (
          <>
            <View
              className={`flex-row items-center rounded-xl h-14 px-4 bg-bg-muted ${
                hasError ? "border-2 border-error" : ""
              }`}
            >
              <TextInput
                onChangeText={onChange}
                onBlur={onBlur}
                value={fieldValue}
                placeholder={inputProps.placeholder}
                placeholderTextColor="#876d64"
                secureTextEntry={!visible}
                className="flex-1 text-base text-text-primary"
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
                  {visible ? <EyeOff size={20} color="#876d64" /> : <Eye size={20} color="#876d64" />}
                </TouchableOpacity>
              )}
            </View>
            {inputProps.errors?.[inputProps.name!] ? (
              <Text className="mt-1 text-xs text-error" accessibilityLiveRegion="polite">
                {inputProps.errors[inputProps.name!]?.message as string}
              </Text>
            ) : null}
          </>
        )}
      />
    </View>
  );
}