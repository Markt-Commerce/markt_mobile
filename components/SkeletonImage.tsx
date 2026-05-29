/**
 * SkeletonImage — Image with skeleton placeholder while loading
 */

import React, { useState } from "react";
import { View, Image, StyleProp, ImageStyle } from "react-native";

interface SkeletonImageProps {
  source: { uri: string };
  style?: StyleProp<ImageStyle>;
  containerClassName?: string;
  resizeMode?: "cover" | "contain" | "stretch";
  accessibilityLabel?: string;
}

export default function SkeletonImage({
  source,
  style,
  containerClassName = "",
  resizeMode = "cover",
  accessibilityLabel,
}: SkeletonImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View className={`relative ${containerClassName}`}>
      {!loaded && (
        <View
          className="absolute inset-0 bg-surface"
        />
      )}
      <Image
        source={source}
        style={[{ width: "100%", height: "100%" }, style]}
        resizeMode={resizeMode}
        onLoad={() => setLoaded(true)}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}
