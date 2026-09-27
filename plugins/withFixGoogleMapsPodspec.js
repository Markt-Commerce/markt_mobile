const { withPodfile } = require("@expo/config-plugins");

/**
 * Expo SDK 57's built-in Maps config plugin still adds
 * `pod 'react-native-google-maps', path: ...` to the Podfile whenever an iOS
 * Google Maps API key is set. react-native-maps 1.2x renamed its podspec
 * from react-native-google-maps.podspec to react-native-maps.podspec, so
 * that line now fails pod install with "No podspec found for
 * `react-native-google-maps`". Runs after the built-in plugin (it's applied
 * automatically, ahead of this app.json plugins entry) and rewrites the pod
 * name it inserted.
 */
const withFixGoogleMapsPodspec = (config) => {
  return withPodfile(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /pod 'react-native-google-maps'/g,
      "pod 'react-native-maps'"
    );
    return config;
  });
};

module.exports = withFixGoogleMapsPodspec;
