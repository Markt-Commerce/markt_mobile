const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * app.json sets `orientation: "portrait"`, which makes Expo add
 * `android:screenOrientation="portrait"` to the main activity. Google Play
 * then *implicitly* treats `android.hardware.screen.portrait` as a REQUIRED
 * hardware feature and blocks installs on devices that don't guarantee
 * portrait (ChromeOS/desktop, Android XR, some tablets/foldables).
 *
 * This plugin keeps the portrait lock but declares the screen-orientation
 * features as not required, so the app stays installable everywhere while
 * still launching in portrait. Adds an explicit
 * `<uses-feature android:required="false" />` entry (or relaxes an existing
 * one) for each feature below.
 */
const OPTIONAL_FEATURES = [
  "android.hardware.screen.portrait",
  "android.hardware.screen.landscape",
];

const withOptionalScreenFeatures = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!Array.isArray(manifest["uses-feature"])) {
      manifest["uses-feature"] = [];
    }
    const features = manifest["uses-feature"];

    for (const name of OPTIONAL_FEATURES) {
      const existing = features.find(
        (feature) => feature?.$?.["android:name"] === name
      );
      if (existing) {
        existing.$["android:required"] = "false";
      } else {
        features.push({
          $: {
            "android:name": name,
            "android:required": "false",
          },
        });
      }
    }

    return config;
  });
};

module.exports = withOptionalScreenFeatures;
