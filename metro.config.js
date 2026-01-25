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

// Add platform-specific resolutions for web and desktop platforms
// Desktop platforms (macOS/Windows) use web implementations where appropriate
const desktopPlatforms = ['macos', 'windows'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if this is a web-like platform (web, macos, or windows)
  const isWebLikePlatform = platform === 'web' || desktopPlatforms.includes(platform);

  if (isWebLikePlatform) {
    // LiveKit WebRTC mocks - not needed on web/desktop (uses web WebRTC)
    if (moduleName === '@livekit/react-native-webrtc' || moduleName === '@livekit/react-native') {
      return {
        type: 'empty',
      };
    }

    // MMKV storage mock for web/desktop
    if (moduleName === 'react-native-mmkv') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, '__mocks__/react-native-mmkv.ts'),
      };
    }

    // expo-keep-awake mock for web/desktop
    if (moduleName === 'expo-keep-awake') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, '__mocks__/expo-keep-awake.ts'),
      };
    }

    // Notifee - iOS/Android only, mock for web/desktop
    if (moduleName === '@notifee/react-native') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, '__mocks__/runtime/@notifee/react-native.ts'),
      };
    }

    // CallKeep - iOS only, mock for web/desktop
    if (moduleName === 'react-native-callkeep') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, '__mocks__/runtime/react-native-callkeep.ts'),
      };
    }
  }

  // Ensure you call the default resolver for all other modules
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.unstable_conditionNames = _.uniq(config.resolver.unstable_conditionNames.concat('browser', 'require', 'react-native')); // <-- and here we can override what we want

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
