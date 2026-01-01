import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import React from 'react';
import { Platform } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';

import { storage } from '../storage';

const KEEP_ALIVE_ENABLED = 'KEEP_ALIVE_ENABLED';

/**
 * Hook for managing keep alive/screen awake functionality
 * This hooks will return the keep alive state which is stored in MMKV
 * When enabled, the screen will stay awake and not go to sleep
 * Note: Keep awake functionality is not supported on web
 */
export const useKeepAlive = () => {
  const [keepAliveEnabled, _setKeepAliveEnabled] = useMMKVBoolean(KEEP_ALIVE_ENABLED, storage);

  const setKeepAliveEnabled = React.useCallback(
    async (enabled: boolean) => {
      // Skip keep awake on web platform
      if (Platform.OS === 'web') {
        console.warn('Keep awake is not supported on web platform');
        return;
      }

      try {
        if (enabled) {
          await activateKeepAwakeAsync('settings');
        } else {
          deactivateKeepAwake('settings');
        }
        _setKeepAliveEnabled(enabled);
      } catch (error) {
        console.error('Failed to update keep alive state:', error);
      }
    },
    [_setKeepAliveEnabled]
  );

  const isKeepAliveEnabled = keepAliveEnabled ?? false;
  return { isKeepAliveEnabled, setKeepAliveEnabled } as const;
};

// Function to be used in the root file to load the keep alive state from MMKV on app startup
export const loadKeepAliveState = async () => {
  // Skip keep awake on web platform
  if (Platform.OS === 'web') {
    console.debug('Keep awake initialization skipped on web platform');
    return;
  }

  try {
    const keepAliveEnabled = storage.getBoolean(KEEP_ALIVE_ENABLED);
    if (keepAliveEnabled === true) {
      await activateKeepAwakeAsync('settings');
    }
  } catch (error) {
    console.error('Failed to load keep alive state on startup:', error);
  }
};
