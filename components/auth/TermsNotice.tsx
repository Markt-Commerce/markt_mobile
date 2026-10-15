import React from "react";
import { Linking, Text } from "react-native";

export const TERMS_URL = "https://marktcommerce.com/terms-of-service/";

/**
 * The agreement line under every way in.
 *
 * App Store Guideline 1.2: apps with user-generated content must have users
 * agree to terms that rule out objectionable content and abusive users
 * before they register or log in. The terms themselves live on the site so
 * there is one copy to keep current.
 */
export default function TermsNotice({ className = "" }: { className?: string }) {
  return (
    <Text className={`text-[12px] leading-[18px] text-center text-text-secondary ${className}`}>
      By continuing, you agree to the{" "}
      <Text
        onPress={() => Linking.openURL(TERMS_URL)}
        accessibilityRole="link"
        className="font-semibold underline text-text-primary"
      >
        Terms and Conditions
      </Text>
      .
    </Text>
  );
}
