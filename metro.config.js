/* eslint-env node */

const _ = require('lodash');
const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
//const { getDefaultConfig } = require('expo/metro-config');
//const path = require('path');
const { withNativeWind } = require('nativewind/metro');

const config = getSentryExpoConfig(__dirname, {
  isCSSEnabled: true,
});

// 1. Watch all files within the monorepo
// 2. Let Metro know where to resolve packages and in what order
//config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Configure path aliases
//config.resolver.extraNodeModules = {
//  '@': path.resolve(__dirname, 'src'),
//  '@env': path.resolve(__dirname, 'src/lib/env.js'),
//  '@assets': path.resolve(__dirname, 'assets'),
//};

// Add platform-specific resolutions for web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect various native module imports to our mocks on web
  if (platform === 'web') {
    // LiveKit WebRTC mocks
    if (moduleName === '@livekit/react-native-webrtc' || moduleName === '@livekit/react-native') {
      return {
        type: 'empty',
      };
    }

    // MMKV storage mock for web
    if (moduleName === 'react-native-mmkv') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, '__mocks__/react-native-mmkv.ts'),
      };
    }

    // expo-keep-awake mock for web
    if (moduleName === 'expo-keep-awake') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, '__mocks__/expo-keep-awake.ts'),
      };
    }
  }

  // Ensure you call the default resolver for all other modules
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.unstable_conditionNames = _.uniq(config.resolver.unstable_conditionNames.concat('browser', 'require', 'react-native')); // <-- and here we can override what we want

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
