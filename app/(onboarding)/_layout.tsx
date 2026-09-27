import React from "react";
import { Redirect, Stack, usePathname } from "expo-router";

import { useUser } from "../../hooks/userContextProvider";
import { useRegData } from "../../models/signupSteps";

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
  const { user, isRestoringSession } = useUser();
  const { regData } = useRegData();
  const pathname = usePathname();

  // Verification runs BEFORE there is a session, so it cannot be held to the
  // same test as the steps after it.
  //
  // Registering creates the account but deliberately issues no credentials --
  // proving you own the address is what does that -- so `user` is still null
  // when signup pushes here. Signing in with an unverified account is the
  // same: login refuses it, so that bounce arrives with no session either.
  // Guarding the whole group on `user` therefore redirected both of them to
  // the welcome screen the instant the code screen mounted. The code was
  // already in the inbox; there was just nowhere to type it.
  //
  // `regData.email` is what makes this safe to allow: it is set by the two
  // screens that send someone here, and without it the code screen has no
  // address to verify or resend to and does nothing anyway.
  // usePathname, not useSegments: the route group is not part of the pathname
  // and its typed tuple has no second element to read.
  const pendingVerification =
    pathname.endsWith("/emailVerification") && !!regData?.email;

  // Being outside both guards in app/_layout.tsx is deliberate — the account
  // exists on the server by the time these run, so they cannot live in the
  // !isLoggedIn group — but it left this group reachable *by accident*, which
  // is what the rest of this check is for.
  //
  // "/" is owned by (tabs)/index, which sits inside a guard. When that guard
  // is closed there is nothing left owning "/", so the router falls back to
  // the first group in the navigator, which is this one. A signed-out person
  // opening the app could therefore land on a bare signup step — "What
  // should we call you?" with no account behind it — instead of the welcome
  // screen, with no way to tell how they got there.
  //
  // Not while the session is still being restored: that answer is "not yet",
  // not "no", and acting on it would bounce a returning user out of their
  // own signup for the beat it takes to read storage.
  if (!isRestoringSession && !user && !pendingVerification) {
    return <Redirect href="/introduction" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
      // A declared first screen, so entering the group without naming one is
      // deterministic. Verification is the only step that makes sense
      // without context: it is the first thing every account needs, and the
      // one the server will send them back to anyway.
      initialRouteName="emailVerification"
    />
  );
}
