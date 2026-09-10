import React from "react";
import { Stack } from "expo-router";

/**
 * Profile completion, after the account exists.
 *
 * A separate group from `(entrances)` because these screens run on the *other*
 * side of authentication. `(entrances)` is guarded `!isLoggedIn`, so the moment
 * an account is created that group unmounts — and any completion step living
 * inside it becomes unreachable mid-flow.
 *
 * `gestureEnabled: false` throughout: these steps are sequential and each one
 * commits something. Swiping back into a completed step is the bug this
 * restructure exists to fix, and disabling the gesture closes it on iOS the
 * same way `replace` closes it for the buttons.
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    />
  );
}
