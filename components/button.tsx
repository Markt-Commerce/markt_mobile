import { Text, View, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from "react-native";
import React from "react";
import { useTheme } from "./themeProvider";

type ButtonVariant = "primary" | "conversion" | "secondary" | "outline";

type ButtonProps = TouchableOpacityProps & {
  /** Button label. Defaults to "Next" for backwards compatibility */
  text?: string;
  /** Visual style. Primary = brand accent CTA; conversion = brand accent; secondary = muted; outline = bordered */
  variant?: ButtonVariant;
  /** Show spinner and disable interaction */
  loading?: boolean;
  /** Optional children override (e.g. custom content). If provided, ignores text. */
  children?: React.ReactNode;
};

/**
 * Markt button (Kinetic Minimalist).
 * - Primary: Brand accent (#E94C2A), white text
 * - Conversion: Brand accent (#E94C2A), white text (for Buy/Critical actions)
 * - Secondary: Muted bg, black text
 * - Outline: border only
 * - 48px height, rounded (8px base), no excess wrapper margins
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const variantStyles = {
    primary: {
      container: isDisabled ? "bg-surface-dim" : "bg-primary",
      text: isDisabled ? "text-tertiary" : "text-white",
    },
    conversion: {
      container: isDisabled ? "bg-surface-dim" : "bg-primary",
      text: isDisabled ? "text-tertiary" : "text-white",
    },
    secondary: {
      container: isDark ? "bg-[#2f3132]" : "bg-surface",
      text: isDark ? "text-[#f0f1f2]" : "text-secondary",
    },
    outline: {
      container: `bg-transparent border ${isDark ? "border-[#46464e]" : "border-border"}`,
      text: isDark ? "text-[#f0f1f2]" : "text-secondary",
    },
  };

  const s = variantStyles[variant];

  return (
    <TouchableOpacity
      className={`flex h-12 flex-row items-center justify-center rounded px-6 ${s.container}`}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={text}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "outline" || variant === "secondary" || isDisabled ? (isDark ? "#f0f1f2" : "#000000") : "#ffffff"} />
      ) : children != null ? (
        children
      ) : (
        <Text className={`text-base font-inter font-semibold tracking-wide ${s.text}`} numberOfLines={1}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
