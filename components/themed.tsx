import React from "react";
import { View, Text, ViewProps, TextProps } from "react-native";
import { useTheme } from "./themeProvider";

type CProps = { light?: string; dark?: string; className?: string };

export const TView: React.FC<ViewProps & CProps> = ({ light, dark, className, children, ...rest }) => {
  const { resolvedTheme } = useTheme();
  const picked = resolvedTheme === "dark" ? dark : light;
  return (
    <View className={[className, picked].filter(Boolean).join(" ")} {...rest}>
      {children}
    </View>
  );
};

export const TText: React.FC<TextProps & CProps> = ({ light, dark, className, children, ...rest }) => {
  const { resolvedTheme } = useTheme();
  const picked = resolvedTheme === "dark" ? dark : light;
  return (
    <Text className={[className, picked].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Text>
  );
};

/** Optional helper to pick classes inline */
export const useThemeClasses = () => {
  const { resolvedTheme } = useTheme();
  return (light?: string, dark?: string) => (resolvedTheme === "dark" ? dark : light) || "";
};
