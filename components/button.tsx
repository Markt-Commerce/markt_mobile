import { Text, View, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { useTokens } from "../theme/useTokens";

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
  const t = useTokens();
  const [pressed, setPressed] = useState(false);

  const variantStyles = {
    // primary-fill, not primary. `primary` is the brand *swatch*, and in dark
    // it is a light orange (#F4805F) -- a white label on it measures 2.59:1.
    // primary-fill exists precisely to be sat on: 5.01:1 in dark. Light is
    // unchanged at 3.80:1, which is the brand call flagged in DARKMODE_AUDIT.
    primary: {
      container: isDisabled ? "bg-surface-sunken" : "bg-primary-fill",
      text: isDisabled ? "text-text-muted" : "text-text-on-primary",
    },
    conversion: {
      container: isDisabled ? "bg-surface-sunken" : "bg-primary-fill",
      text: isDisabled ? "text-text-muted" : "text-text-on-primary",
    },
    secondary: {
      container: "bg-surface-sunken",
      text: "text-text-primary",
    },
    outline: {
      container: `bg-transparent border border-border-strong`,
      text: "text-text-primary",
    },
  };

  const s = variantStyles[variant];

  return (
    <TouchableOpacity
      className={`flex h-14 flex-row items-center justify-center rounded-2xl px-6 active:opacity-90 ${s.container}`}
      // A press that does nothing visible reads as a dead control. 0.98 is
      // enough to feel and small enough not to look like a bounce.
      style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={text}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "outline" || variant === "secondary" || isDisabled ? (t.textPrimary) : t.textOnPrimary} />
      ) : children != null ? (
        children
      ) : (
        <Text className={`text-[16px] font-bold ${s.text}`} numberOfLines={1}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
