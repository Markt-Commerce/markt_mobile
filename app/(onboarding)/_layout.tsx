import React from "react";
import { Stack } from "expo-router";

/**
 * Everything that happens after the account exists.
 *
 * That is now most of signup: verification, the profile step, the address,
 * and the photo — plus the shorter path OAuth users take, which skips
 * straight to a name and a role.
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
