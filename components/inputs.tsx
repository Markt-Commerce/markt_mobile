import { TextInput, View, Text } from "react-native";
import { Control, Controller } from "react-hook-form";
import React from "react";

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
 * Markt form input. Follows DESIGN_SYSTEM.md:
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