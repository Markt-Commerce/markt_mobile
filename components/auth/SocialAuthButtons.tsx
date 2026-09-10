import React from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import Svg, { Path } from "react-native-svg";
import { useTokens } from "../../theme/useTokens";
import { useTheme } from "../themeProvider";
import { IS_GOOGLE_CONFIGURED } from "../../services/config";
import type { OAuthProvider } from "../../services/sections/oauth";

/**
 * The two social sign-in buttons.
 *
 * Apple's is rendered with `AppleAuthentication.AppleAuthenticationButton`
 * rather than a hand-built one. Apple's Human Interface Guidelines govern the
 * mark, corner radius, type and spacing, and a custom lookalike is a review
 * rejection — the native component is the only version guaranteed to stay
 * compliant when the guidelines change.
 *
 * Google's is hand-built because there is no equivalent native component in
 * the RN package, so it follows Google's identity guidelines directly: the
 * four-colour "G", a neutral surface, and the exact wording "Continue with
 * Google".
 */

const GOOGLE_MARK = [
  { d: "M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z", fill: "#4285F4" },
  { d: "M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z", fill: "#34A853" },
  { d: "M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z", fill: "#FBBC05" },
  { d: "M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z", fill: "#EA4335" },
];

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      {GOOGLE_MARK.map((p, i) => (
        <Path key={i} d={p.d} fill={p.fill} />
      ))}
    </Svg>
  );
}

export default function SocialAuthButtons({
  busy,
  appleAvailable,
  onGoogle,
  onApple,
}: {
  busy: OAuthProvider | null;
  appleAvailable: boolean;
  onGoogle: () => void;
  onApple: () => void;
}) {
  const t = useTokens();
  const { resolvedTheme } = useTheme();
  const anyBusy = busy !== null;

  return (
    <View className="gap-3">
      {/* Apple first on iOS. Apple requires Sign in with Apple to be offered
          wherever another social login is, and placing it first is the
          convention iOS users expect. */}
      {Platform.OS === "ios" && appleAvailable ? (
        <View>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
            }
            buttonStyle={
              resolvedTheme === "dark"
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={8}
            // 52 rather than the 44pt minimum: this is a primary action and
            // it sits beside a 52pt Google button, so matching them keeps the
            // stack optically even.
            style={{ height: 52, width: "100%", opacity: anyBusy ? 0.5 : 1 }}
            onPress={anyBusy ? () => {} : onApple}
          />
          {busy === "apple" ? (
            <View className="absolute inset-0 items-center justify-center">
              <ActivityIndicator
                color={resolvedTheme === "dark" ? "#000000" : "#FFFFFF"}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {IS_GOOGLE_CONFIGURED ? (
        <Pressable
          onPress={onGoogle}
          disabled={anyBusy}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: anyBusy, busy: busy === "google" }}
          className="h-[52px] rounded flex-row items-center justify-center gap-3 border border-border bg-surface-raised active:opacity-80"
          style={{ opacity: anyBusy ? 0.5 : 1 }}
        >
          {busy === "google" ? (
            <ActivityIndicator size="small" color={t.textPrimary} />
          ) : (
            <GoogleMark />
          )}
          <Text className="text-[16px] font-semibold text-text-primary">
            Continue with Google
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
