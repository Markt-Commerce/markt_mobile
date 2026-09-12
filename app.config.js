/**
 * Expo config, wrapping app.json so native keys can come from the environment.
 *
 * app.json cannot read environment variables, and a Google Maps key must not
 * be committed: it is restricted to our package name and signing certificate,
 * but a key in git is a key in every fork, clone and CI log forever.
 *
 * Two keys, not one, on purpose. Google's application restrictions are
 * per-platform -- Android keys are locked to a package name plus signing
 * certificate, iOS keys to a bundle identifier -- so a single key would have
 * to be unrestricted to work on both, which is precisely the configuration
 * that turns a leaked key into somebody else's bill.
 *
 *   GOOGLE_MAPS_API_KEY_ANDROID
 *   GOOGLE_MAPS_API_KEY_IOS
 *
 * Set both as EAS secrets (Expo dashboard -> project -> Secrets, or
 * `eas secret:create`). They are read at build time, not runtime, so they do
 * NOT take the EXPO_PUBLIC_ prefix -- that prefix inlines a value into the
 * JavaScript bundle, which is the wrong place for these.
 *
 * Absent, the app builds and runs fine: every map surface checks
 * `hasMapsKey()` and falls back to a coordinate readout rather than rendering
 * a blank grey rectangle that looks like a broken feature.
 */
const base = require("./app.json");

const androidKey = process.env.GOOGLE_MAPS_API_KEY_ANDROID || "";
const iosKey = process.env.GOOGLE_MAPS_API_KEY_IOS || "";

module.exports = ({ config }) => {
  const expo = { ...base.expo, ...config };

  return {
    ...expo,
    ios: {
      ...expo.ios,
      config: {
        ...(expo.ios?.config || {}),
        ...(iosKey ? { googleMapsApiKey: iosKey } : {}),
      },
    },
    android: {
      ...expo.android,
      config: {
        ...(expo.android?.config || {}),
        ...(androidKey
          ? { googleMaps: { apiKey: androidKey } }
          : {}),
      },
    },
    extra: {
      ...(expo.extra || {}),
      // Read at runtime so a screen can tell whether a map will actually
      // render before it tries. Deliberately a boolean, not the key: the key
      // belongs in the native config, and copying it into `extra` would put
      // it in the JS bundle for no reason.
      hasMapsKey: Boolean(androidKey || iosKey),
    },
  };
};
