// Local copy of react-native-worklets/jest/resolver.js (shipped from
// react-native-worklets 0.6+; this repo pins 0.5.1 which does not include it).
// Reanimated v4 worklets: resolve to the non-native builds in Jest.

/** @type {import('jest-resolve').SyncResolver} */
module.exports = (request, options) => {
  const { defaultResolver } = options;
  if (options.basedir.includes('react-native-worklets') || request.includes('react-native-worklets')) {
    const workletOptions = { ...options };
    workletOptions.extensions = workletOptions.extensions?.filter((ext) => !ext.includes('native'));
    options = workletOptions;
  }

  return defaultResolver(request, options);
};
