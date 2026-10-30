/**
 * Building blocks shared by the Markt Business screens.
 *
 * Same tokens and shapes as the rest of the app (the filled field from
 * inputs.tsx, the chip from FilterChip.tsx), so business mode reads as Markt
 * — a little denser and more tabular, because businesses compare figures.
 */
import React from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, type TextInputProps } from "react-native";
import { BadgeCheck, type LucideIcon } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import type { BusinessOption, BusinessVerificationStatus } from "../../models/business";

/** A labelled, controlled text field matching components/inputs.tsx. */
export function Field({
  label,
  hint,
  multiline,
  ...rest
}: TextInputProps & { label: string; hint?: string }) {
  const t = useTokens();
  return (
    <View className="w-full mb-4">
      <Text className="mb-2 text-[13px] font-semibold text-text-secondary">{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "auto"}
        placeholderTextColor={t.textMuted}
        accessibilityLabel={label}
        className={`w-full rounded-xl ${multiline ? "min-h-[110px] py-3" : "h-14"} px-4 text-[16px] text-text-primary bg-surface-sunken`}
      />
      {hint ? <Text className="mt-1.5 text-xs text-text-muted">{hint}</Text> : null}
    </View>
  );
}

/** Pick one (or several, with `multiple`) from a backend lookup list. */
export function OptionPicker({
  label,
  hint,
  options,
  selected,
  onToggle,
}: {
  label: string;
  hint?: string;
  options: BusinessOption[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <View className="w-full mb-4">
      <Text className="mb-1 text-[13px] font-semibold text-text-secondary">{label}</Text>
      {hint ? <Text className="mb-2 text-xs text-text-muted">{hint}</Text> : null}
      <View className="flex-row flex-wrap gap-2 mt-1">
        {options.map((o) => {
          const on = selected.includes(o.key);
          return (
            <TouchableOpacity
              key={o.key}
              onPress={() => onToggle(o.key)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              className={`h-9 px-4 rounded-full items-center justify-center ${on ? "bg-primary-fill" : "bg-surface-sunken"}`}
            >
              <Text className={`text-[13px] font-semibold ${on ? "text-text-on-primary" : "text-text-secondary"}`}>
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-2xl border border-border bg-surface-raised p-4 ${className}`}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-baseline justify-between px-4 mt-6 mb-3">
      <Text className="text-[17px] font-bold tracking-tight text-text-primary">{title}</Text>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-[13px] font-bold text-primary-text">{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Stat({ label, value, hint, onPress }: { label: string; value: string; hint?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      className="flex-1 min-w-[45%] rounded-2xl border border-border bg-surface-raised p-4"
    >
      <Text className="text-xs font-semibold text-text-secondary">{label}</Text>
      <Text className="mt-1 text-[26px] font-bold tracking-tight text-text-primary">{value}</Text>
      {hint ? <Text className="mt-0.5 text-[11px] text-text-muted">{hint}</Text> : null}
    </TouchableOpacity>
  );
}

type Tone = "brand" | "success" | "warning" | "muted";

const TONES: Record<Tone, { box: string; text: string }> = {
  brand: { box: "bg-primary-muted", text: "text-primary-text" },
  success: { box: "bg-success-muted", text: "text-success-text" },
  warning: { box: "bg-warning-muted", text: "text-warning-text" },
  muted: { box: "bg-surface-sunken", text: "text-text-secondary" },
};

export function Badge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const s = TONES[tone];
  return (
    <View className={`px-2.5 py-1 rounded-full ${s.box}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{label}</Text>
    </View>
  );
}

/** `compact` shows only a positive status: on cards, an unverified business
 *  carries no badge rather than a negative one. */
export function VerificationBadge({ status, compact = false }: { status: BusinessVerificationStatus; compact?: boolean }) {
  const t = useTokens();
  if (compact && status !== "VERIFIED") return null;
  if (status === "VERIFIED") {
    return (
      <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-success-muted">
        <BadgeCheck size={12} color={t.successText} strokeWidth={2.2} />
        <Text className="text-[10px] font-bold uppercase tracking-wider text-success-text">Verified</Text>
      </View>
    );
  }
  return <Badge label={status === "PENDING" ? "Verification pending" : "Not verified"} tone={status === "PENDING" ? "warning" : "muted"} />;
}

export function ListRow({
  title,
  meta,
  aside,
  onPress,
  last = false,
}: {
  title: string;
  meta?: string;
  aside?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      className={`flex-row items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-border"}`}
    >
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-text-primary" numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text className="mt-0.5 text-[13px] text-text-secondary" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {typeof aside === "string" ? <Text className="text-[13px] font-bold text-text-primary">{aside}</Text> : aside}
    </TouchableOpacity>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  const t = useTokens();
  return (
    <View className="items-center px-8 py-10">
      <View className="w-14 h-14 rounded-2xl items-center justify-center bg-surface-sunken mb-4">
        <Icon size={24} color={t.textSecondary} strokeWidth={1.8} />
      </View>
      <Text className="text-base font-bold text-center text-text-primary">{title}</Text>
      {message ? <Text className="mt-1.5 text-sm text-center leading-5 text-text-secondary">{message}</Text> : null}
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.85} className="mt-5 h-11 px-6 rounded-xl bg-primary-fill items-center justify-center">
          <Text className="text-sm font-bold text-text-on-primary">{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Loading() {
  const t = useTokens();
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color={t.textPrimary} />
    </View>
  );
}

/** A label/value cell, for listing terms and request details. */
export function Term({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-xl bg-surface-sunken px-3.5 py-3">
      <Text className="text-[11px] font-semibold text-text-secondary">{label}</Text>
      <Text className="mt-0.5 text-[15px] font-bold text-text-primary">{value}</Text>
    </View>
  );
}

/** Name/value specification rows ("Moisture" / "12%"). */
export function SpecificationEditor({
  rows,
  onChange,
}: {
  rows: { key: string; value: string }[];
  onChange: (rows: { key: string; value: string }[]) => void;
}) {
  const t = useTokens();
  const update = (i: number, patch: Partial<{ key: string; value: string }>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <View className="w-full mb-4">
      <Text className="mb-1 text-[13px] font-semibold text-text-secondary">Specifications</Text>
      <Text className="mb-2 text-xs text-text-muted">Grade, variety, size, material — whatever buyers compare on.</Text>
      {rows.map((row, i) => (
        <View key={i} className="flex-row gap-2 mb-2">
          <TextInput
            value={row.key}
            onChangeText={(key) => update(i, { key })}
            placeholder="e.g. Moisture"
            placeholderTextColor={t.textMuted}
            accessibilityLabel={`Specification ${i + 1} name`}
            // minWidth 0: a text input has a built-in minimum width on web and
            // won't shrink into a row without it.
            style={{ flex: 1, minWidth: 0 }}
            className="h-12 rounded-xl px-3 text-[15px] text-text-primary bg-surface-sunken"
          />
          <TextInput
            value={row.value}
            onChangeText={(value) => update(i, { value })}
            placeholder="e.g. 12% max"
            placeholderTextColor={t.textMuted}
            accessibilityLabel={`Specification ${i + 1} value`}
            style={{ flex: 1.4, minWidth: 0 }}
            className="h-12 rounded-xl px-3 text-[15px] text-text-primary bg-surface-sunken"
          />
        </View>
      ))}
      <TouchableOpacity onPress={() => onChange([...rows, { key: "", value: "" }])} className="self-start py-1.5">
        <Text className="text-[13px] font-bold text-primary-text">+ Add specification</Text>
      </TouchableOpacity>
    </View>
  );
}

export function specsToRows(specs: Record<string, string> | null | undefined) {
  const entries = Object.entries(specs ?? {});
  return entries.length ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }];
}

export function rowsToSpecs(rows: { key: string; value: string }[]): Record<string, string> | null {
  const specs: Record<string, string> = {};
  for (const r of rows) if (r.key.trim() && r.value.trim()) specs[r.key.trim()] = r.value.trim();
  return Object.keys(specs).length ? specs : null;
}

/** Optional number from a text field: "" → null, junk → NaN (caller rejects). */
export function parseOptionalNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}
