import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import {
  signInWithProvider,
  AccountExistsError,
  type OAuthProvider,
} from "../services/sections/oauth";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "../services/config";
import { logger } from "../utils/logger";

/**
 * Google and Apple sign-in, with every branch mapped to copy a person can act
 * on.
 *
 * The rule throughout: a cancel is not an error. Tapping away from the sheet is
 * the most common "failure" there is, and showing an alert for it would punish
 * someone for changing their mind.
 */

export type SocialAuthState = {
  busy: OAuthProvider | null;
  error: string | null;
  /** Set when the email already belongs to a password account. */
  needsPasswordLink: boolean;
};

const GENERIC =
  "We couldn't complete that sign-in. Please try again in a moment.";

export function useSocialAuth(onSuccess: (user: any, isNew: boolean) => void) {
  const [state, setState] = useState<SocialAuthState>({
    busy: null,
    error: null,
    needsPasswordLink: false,
  });

  const fail = useCallback((message: string, needsPasswordLink = false) => {
    setState({ busy: null, error: message, needsPasswordLink });
  }, []);

  const clearError = useCallback(
    () => setState((s) => ({ ...s, error: null, needsPasswordLink: false })),
    []
  );

  const finish = useCallback(
    async (payload: Parameters<typeof signInWithProvider>[0]) => {
      try {
        const user = await signInWithProvider(payload);
        setState({ busy: null, error: null, needsPasswordLink: false });
        onSuccess(user, !user?.username || !user?.current_role);
      } catch (e: any) {
        if (e instanceof AccountExistsError) return fail(e.message, true);
        if (e?.status === 503) {
          return fail("Social sign-in isn't available right now. You can continue with email.");
        }
        if (e?.status === 401) {
          return fail("That sign-in couldn't be verified. Please try again.");
        }
        // No network, DNS failure, server down.
        if (!e?.status) {
          return fail("You appear to be offline. Check your connection and try again.");
        }
        logger.error("oauth exchange failed", e);
        fail(GENERIC);
      }
    },
    [onSuccess, fail]
  );

  const signInWithGoogle = useCallback(async () => {
    setState({ busy: "google", error: null, needsPasswordLink: false });
    try {
      GoogleSignin.configure({
        // The *web* client id is what makes Google return an idToken at all —
        // the platform client ids alone yield only an access token, which the
        // backend cannot verify as an identity.
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const result: any = await GoogleSignin.signIn();
      // v13+ returns {type, data}; older returns the user directly.
      if (result?.type === "cancelled") {
        return setState({ busy: null, error: null, needsPasswordLink: false });
      }
      const idToken = result?.data?.idToken ?? result?.idToken;
      if (!idToken) {
        return fail("Google didn't return a sign-in token. Please try again.");
      }
      await finish({ provider: "google", identity_token: idToken });
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
        return setState({ busy: null, error: null, needsPasswordLink: false });
      }
      if (e?.code === statusCodes.IN_PROGRESS) return;
      if (e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return fail("Google Play services aren't available on this device. You can continue with email.");
      }
      logger.error("google sign-in failed", e);
      fail(GENERIC);
    }
  }, [finish, fail]);

  const signInWithApple = useCallback(async () => {
    setState({ busy: "apple", error: null, needsPasswordLink: false });
    try {
      // A raw nonce is sent to Apple hashed; the token echoes the *hash*, and
      // the backend compares against that. This is what stops a token captured
      // from an earlier sign-in being replayed.
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        return fail("Apple didn't return a sign-in token. Please try again.");
      }

      // Apple sends the name exactly once, on first authorisation, and never
      // inside the token. Forward it now or it is gone for good.
      const name = [
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      await finish({
        provider: "apple",
        identity_token: credential.identityToken,
        nonce: hashedNonce,
        full_name: name || undefined,
      });
    } catch (e: any) {
      if (e?.code === "ERR_REQUEST_CANCELED" || e?.code === "ERR_CANCELED") {
        return setState({ busy: null, error: null, needsPasswordLink: false });
      }
      logger.error("apple sign-in failed", e);
      fail(GENERIC);
    }
  }, [finish, fail]);

  return { ...state, signInWithGoogle, signInWithApple, clearError };
}

/**
 * Apple only exists on iOS 13+. Android and older iOS never see the button —
 * showing a control that cannot work is worse than not offering it.
 */
export function useAppleAuthAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  const check = useCallback(async () => {
    if (Platform.OS !== "ios") return setAvailable(false);
    setAvailable(await AppleAuthentication.isAvailableAsync());
  }, []);
  // Cheap enough to run on every mount of the welcome screen.
  useState(() => {
    check();
  });
  return available;
}
