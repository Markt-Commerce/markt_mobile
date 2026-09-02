/**
 * SkeletonImage — Image with skeleton placeholder while loading
 *
 * Backed by expo-image (as postMedia.tsx already is) rather than RN's Image so
 * feed rows get memory+disk caching and downsampled decodes instead of holding
 * a full-resolution bitmap per visible card.
 */

import React, { useState } from "react";
import { View, StyleProp, ImageStyle } from "react-native";
import { Image } from "expo-image";

interface SkeletonImageProps {
  source: { uri: string };
  style?: StyleProp<ImageStyle>;
  containerClassName?: string;
  resizeMode?: "cover" | "contain" | "stretch";
  accessibilityLabel?: string;
  /**
   * Identity of the content in a recycled row. When it changes, expo-image
   * clears the previous bitmap instead of briefly showing the last row's
   * image in the new one.
   */
  recyclingKey?: string;
}

/** RN's resizeMode vocabulary → expo-image's CSS-style contentFit. */
const CONTENT_FIT = {
  cover: "cover",
  contain: "contain",
  stretch: "fill",
} as const;

export default function SkeletonImage({
  source,
  style,
  containerClassName = "",
  resizeMode = "cover",
  accessibilityLabel,
  recyclingKey,
}: SkeletonImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View className={`relative ${containerClassName}`}>
      {!loaded && <View className="absolute inset-0 bg-surface" />}
      <Image
        source={source}
        style={[{ width: "100%", height: "100%" }, style]}
        contentFit={CONTENT_FIT[resizeMode]}
        recyclingKey={recyclingKey ?? source.uri}
        cachePolicy="memory-disk"
        transition={150}
        onLoad={() => setLoaded(true)}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}
