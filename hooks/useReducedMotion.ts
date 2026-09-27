import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Whether the OS "reduce motion" setting is on.
 *
 * Read in one place so every celebration degrades the same way. Nothing in the
 * app consulted this before — which meant a spring-and-particles celebration
 * would have fired at someone who had explicitly asked the system not to move
 * things, and for a vestibular disorder that is not a preference, it is a
 * symptom trigger.
 *
 * Degrading means fading instead of springing and skipping particles. It never
 * means hiding the achievement: the copy and the haptic still land, so the user
 * gets the same information with none of the motion.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduced(value);
    });

    // The setting can change while the app is open.
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => setReduced(value)
    );

    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
