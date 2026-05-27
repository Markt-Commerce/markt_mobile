import { Text, View, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from "react-native";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

type ButtonProps = TouchableOpacityProps & {
  /** Button label. Defaults to "Next" for backwards compatibility */
  text?: string;
  /** Visual style. Primary = brand CTA; secondary = muted; outline = bordered */
  variant?: ButtonVariant;
  /** Show spinner and disable interaction */
  loading?: boolean;
  /** Optional children override (e.g. custom content). If provided, ignores text. */
  children?: React.ReactNode;
};

/**
 * Markt primary button.
 * - Primary: brand color, white text
 * - Secondary: muted bg, primary text
 * - Outline: border only
 * - 48px height, rounded-full, proper disabled/loading states
 */
const Button = ({
  onPress,
  disabled = false,
  loading = false,
  text = "Next",
  variant = "primary",
  children,
  ...rest
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      container: isDisabled ? "bg-bg-muted" : "bg-primary",
      text: isDisabled ? "text-text-secondary" : "text-white",
    },
    secondary: {
      container: "bg-bg-muted",
      text: "text-text-primary",
    },
    outline: {
      container: "bg-transparent border border-border",
      text: "text-text-primary",
    },
  };

  const s = variantStyles[variant];

  return (
    <View className="px-4 py-3">
      <TouchableOpacity
        className={`flex h-12 flex-row items-center justify-center rounded-button px-6 ${s.container}`}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        accessibilityLabel={text}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === "primary" && !isDisabled ? "#ffffff" : "#876d64"} />
        ) : children != null ? (
          children
        ) : (
          <Text className={`text-base font-semibold tracking-[0.015em] ${s.text}`} numberOfLines={1}>
            {text}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Button;
