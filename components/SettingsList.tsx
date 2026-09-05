/**
 * The list language the whole app speaks.
 *
 * These started life inside the settings screen. Profile, Wallet and Help all
 * wanted the same thing and would otherwise each have grown their own
 * near-miss version, so they live here and everyone imports them.
 *
 * The shape: a tinted full-bleed band names a group, rows run edge to edge, and
 * the hairline between rows is inset to start under the label -- so the eye
 * reads a list rather than a stack of boxes. Nothing is outlined.
 */
import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { useTokens } from "../theme/useTokens";

/**
 * (moved from the settings screen)
 *
 * These used to be a `px-6` inset card with a `rounded border` wrapper and a
 * `border-b` on every row -- a bordered box inside a bordered screen, so each
 * row was outlined twice and 48px of width was given away on every line.
 *
 * Now: a tinted full-bleed band names the group, rows run edge to edge, and the
 * hairline between them is inset to start where the label starts, so the eye
 * reads a list instead of a stack of boxes.
 */
export function SettingsSection({
  title,
  children,
}: {
  title: string;
  /** Optional: a section can be just a band, used as a list header above rows
   *  the parent renders itself (the wallet's activity list does this). */
  children?: React.ReactNode;
}) {
  return (
    <View className="mt-2">
      <View className="px-4 py-2.5 bg-surface-sunken">
        <Text
          className="font-bold text-[13px] text-text-secondary"
        >
          {title}
        </Text>
      </View>
      <View className="bg-surface-raised">{children}</View>
    </View>
  );
}

/** The hairline between rows, inset so it lines up under the label. */
export function RowDivider() {
  return <View className="h-px ml-[52px] bg-border" />;
}

export function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  value,
  onPress,
  last = false,
  destructive = false,
}: {
  icon: React.ElementType;
  title: string;
  /** Only when it says something the label doesn't. Most rows don't need one. */
  subtitle?: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
  destructive?: boolean;
}) {
  const t = useTokens();
  const labelColor = destructive ? "text-danger-text" : "text-text-primary";
  const iconColor = destructive ? t.dangerText : t.textSecondary;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={value ? `${title}, ${value}` : title}
        className="flex-row items-center px-4 min-h-[56px] py-3"
      >
        {/* No tinted tile behind the glyph -- it was a third surface competing
            with the card and the row. */}
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
        <View className="flex-1 ml-4 pr-3">
          <Text className={`text-[16px] ${labelColor}`}>{title}</Text>
          {subtitle ? (
            <Text
              className="text-[13px] mt-0.5 leading-[18px] text-text-muted"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {value ? (
          <Text
            className="text-[14px] mr-2 text-text-muted"
          >
            {value}
          </Text>
        ) : null}
        <ArrowRight
          size={18}
          color={t.textMuted}
          strokeWidth={2}
        />
      </TouchableOpacity>
      {last ? null : <RowDivider />}
    </>
  );
}

export function SettingsSwitchRow({
  icon: Icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  last = false,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  const t = useTokens();
  return (
    <>
      <View className="flex-row items-center px-4 min-h-[56px] py-3">
        <Icon size={20} color={t.textSecondary} strokeWidth={1.8} />
        <View className="flex-1 ml-4 pr-3">
          <Text className="text-[16px] text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="text-[13px] mt-0.5 leading-[18px] text-text-muted"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: t.border, true: t.primaryFill }}
          thumbColor="#FFFFFF"
        />
      </View>
      {last ? null : <RowDivider />}
    </>
  );
}
