import React from 'react';
import { Platform } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';

import { pushNotificationService } from '@/services/push-notification';

import { USE_MODERN_NOTIFICATION_SOUNDS } from '../notification-sounds';
import { storage } from '../storage';

/**
 * Hook for managing the Android "modern notification sounds" preference (stored in MMKV).
 *
 * When enabled (the default) Android notification channels use the new modern sound set;
 * when disabled they fall back to the legacy (non-modern) sounds. Because Android
 * notification channels are immutable once created, toggling this re-creates the affected
 * channels so the change takes effect immediately.
 *
 * Note: notification channel sounds only apply on Android. The preference is still
 * persisted on other platforms but has no channel effect.
 */
export const useModernNotificationSounds = () => {
  const [enabled, _setEnabled] = useMMKVBoolean(USE_MODERN_NOTIFICATION_SOUNDS, storage);

  const setModernSoundsEnabled = React.useCallback(
    async (value: boolean) => {
      try {
        _setEnabled(value);

        // Android channels are immutable, so the service must delete and recreate the
        // affected channels for the new sound preference to take effect.
        if (Platform.OS === 'android') {
          await pushNotificationService.refreshNotificationSoundChannels();
        }
      } catch (error) {
        console.error('Failed to update modern notification sounds preference:', error);
      }
    },
    [_setEnabled]
  );

  // Default to true (modern sounds) when the preference has not been set yet.
  const isModernSoundsEnabled = enabled ?? true;
  return { isModernSoundsEnabled, setModernSoundsEnabled } as const;
};
