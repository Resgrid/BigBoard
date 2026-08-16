// Custom Jest resolver.
//
// 1. Reanimated v4 worklets: resolve to the non-native builds in Jest.
//    (Local copy of react-native-worklets/jest/resolver.js, shipped from
//    react-native-worklets 0.6+; this repo pins 0.5.1 which does not include it.)
// 2. Delegates to @react-native/jest-preset's resolver so the React Native
//    package-exports workaround it applies is preserved — setting `resolver` in
//    jest.config.js replaces the preset's resolver rather than extending it.

const reactNativeResolver = require('@react-native/jest-preset/jest/resolver.js');

/** @type {import('jest-resolve').SyncResolver} */
module.exports = (request, options) => {
  if (options.basedir.includes('react-native-worklets') || request.includes('react-native-worklets')) {
    const workletOptions = { ...options };
    workletOptions.extensions = workletOptions.extensions?.filter((ext) => !ext.includes('native'));
    options = workletOptions;
  }

  return reactNativeResolver(request, options);
};
