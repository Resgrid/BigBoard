import { Platform } from 'react-native';

import { logger } from '@/lib/logging';

import type { BluetoothAudioServiceBase } from './base.service';
import { BluetoothAudioServiceWeb } from './web.service';

// Type for the native service class
type BluetoothAudioServiceNativeType = new () => BluetoothAudioServiceBase;

// Conditionally import native service only on native platforms
let BluetoothAudioServiceNative: BluetoothAudioServiceNativeType | null = null;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BluetoothAudioServiceNative = require('./native.service').BluetoothAudioServiceNative;
}

/**
 * Factory function to create the appropriate BluetoothAudioService implementation
 * based on the current platform and capabilities
 */
export function createBluetoothAudioService(): BluetoothAudioServiceBase {
  // Use React Native Platform to detect the platform
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // Native mobile platforms - use native implementation
    if (!BluetoothAudioServiceNative) {
      throw new Error('Native Bluetooth Audio Service not available');
    }
    logger.info({
      message: 'Creating Native Bluetooth Audio Service',
      context: { platform: Platform.OS },
    });
    return new BluetoothAudioServiceNative();
  }

  // All other platforms (web, windows, macos, etc.) default to web implementation
  logger.info({
    message: 'Creating Web Bluetooth Audio Service',
    context: { platform: Platform.OS },
  });
  return new BluetoothAudioServiceWeb();
}

/**
 * Get information about available Bluetooth implementations
 */
export function getAvailableBluetoothImplementations(): {
  native: boolean;
  web: boolean;
  recommended: 'native' | 'web';
} {
  const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

  return {
    native: isNativePlatform,
    web: !isNativePlatform,
    recommended: isNativePlatform ? 'native' : 'web',
  };
}

/**
 * Check if any Bluetooth implementation is supported on the current platform
 */
export function isBluetoothSupported(): boolean {
  // Bluetooth is always supported - native on iOS/Android, web on other platforms
  return true;
}

/**
 * Get a description of the current platform's Bluetooth capabilities
 */
export function getBluetoothCapabilityDescription(): string {
  const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

  if (isNativePlatform) {
    return `Native Bluetooth support (${Platform.OS})`;
  }

  return `Web Bluetooth support (${Platform.OS})`;
}
