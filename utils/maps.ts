import Constants from "expo-constants";

/**
 * Whether a Google Maps key was present at build time.
 *
 * Without one, react-native-maps renders a blank grey rectangle on Android
 * rather than failing loudly — which reads as a broken feature rather than a
 * missing key. Every map surface checks this first and falls back to
 * something honest.
 */
export function hasMapsKey(): boolean {
  return Boolean(Constants.expoConfig?.extra?.hasMapsKey);
}
