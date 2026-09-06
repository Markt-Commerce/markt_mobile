import React, { useEffect } from "react";
import { Modal, Pressable, Text, View, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Award, Flame, Star } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useCelebration, type CelebrationKind } from "../../hooks/useCelebration";
import * as haptics from "../../utils/haptics";
import Confetti from "./Confetti";

/**
 * Renders whatever the celebration queue has at the front.
 *
 * One renderer for every achievement type: a badge, a tier and a streak differ
 * by icon, accent and weight, not by having three separate implementations.
 *
 * Motion budget follows the brief — the entrance lands in about 500ms and the
 * whole thing auto-dismisses at 2.4s. It never traps focus: the backdrop is
 * tappable, hardware back closes it, and the content is announced as one
 * assertive block so a screen reader gets the achievement rather than a pile
 * of decorative views.
 */

const AUTO_DISMISS_MS = 2400;

const ICONS: Record<CelebrationKind, React.ElementType> = {
  badge: Award,
  tier: Star,
  streak: Flame,
};

export default function CelebrationOverlay() {
  const { current, dismiss } = useCelebration();
  const t = useTokens();
  const reduced = useReducedMotion();

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const shine = useSharedValue(-1);

  const visible = current != null;

  useEffect(() => {
    if (!visible) return;

    // Haptic first: it lands with the entrance rather than after it, and it
    // fires regardless of reduced motion — someone who has turned motion off
    // should still feel the achievement.
    if (current?.kind === "streak") haptics.tick();
    else haptics.celebrate();

    if (reduced) {
      // A fade, and nothing that moves in space.
      opacity.value = withTiming(1, { duration: 160 });
      scale.value = 1;
      shine.value = -1;
    } else {
      opacity.value = withTiming(1, { duration: 140 });
      // Overshoot, then settle. Spring rather than easing so it feels thrown
      // into place instead of driven.
      scale.value = withSequence(
        withSpring(1.06, { damping: 9, stiffness: 190, mass: 0.6 }),
        withSpring(1, { damping: 14, stiffness: 160 })
      );
      // Sweep across the icon once the pop has landed.
      shine.value = -1;
      shine.value = withDelay(
        260,
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) })
      );
    }

    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // `current` identity changes per celebration, which is exactly when this
    // should re-run.
  }, [visible, current, reduced, dismiss, opacity, scale, shine]);

  // Reset for the next one in the queue.
  useEffect(() => {
    if (!visible) {
      scale.value = 0.6;
      opacity.value = 0;
    }
  }, [visible, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: shine.value > -1 && shine.value < 1 ? 0.55 : 0,
    transform: [{ translateX: shine.value * 130 }, { rotate: "18deg" }],
  }));

  if (!current) return null;

  const Icon = ICONS[current.kind] ?? Award;
  const accent = current.accent || t.primaryText;

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <Pressable
        onPress={dismiss}
        accessibilityLabel="Dismiss"
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      >
        {!reduced ? <Confetti colors={[accent, t.success, t.warning, t.primary]} /> : null}

        <Animated.View
          style={cardStyle}
          className="w-full rounded-2xl items-center px-6 py-8 bg-surface-overlay border border-border"
          // One assertive announcement carrying the whole achievement, rather
          // than letting a reader walk a decorative icon and three text nodes.
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          accessibilityLabel={`${current.title}. ${current.subtitle ?? ""}`}
        >
          <View
            className="w-24 h-24 rounded-full items-center justify-center overflow-hidden mb-5"
            style={{ backgroundColor: `${accent}22` }}
          >
            {current.iconUrl ? (
              <Image source={{ uri: current.iconUrl }} className="w-16 h-16" />
            ) : (
              <Icon size={44} color={accent} strokeWidth={1.8} />
            )}

            {/* The sweep. Purely decorative, so it goes with reduced motion. */}
            {!reduced ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    width: 26,
                    height: 180,
                    backgroundColor: t.textOnPrimary,
                  },
                  shineStyle,
                ]}
              />
            ) : null}
          </View>

          <Text className="text-[22px] font-bold text-center text-text-primary">
            {current.title}
          </Text>
          {current.subtitle ? (
            <Text className="text-sm text-center mt-2 text-text-secondary">
              {current.subtitle}
            </Text>
          ) : null}

          <Text className="text-xs mt-5 text-text-muted">Tap to dismiss</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
