import React from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

import { USE_MODERN_NOTIFICATION_SOUNDS } from '../notification-sounds';
import { storage } from '../storage';

/**
 * Web variant of the modern notification sounds hook. Notification channels do not exist
 * on web, so this only persists the preference and never touches the push service.
 */
export const useModernNotificationSounds = () => {
  const [enabled, _setEnabled] = useMMKVBoolean(USE_MODERN_NOTIFICATION_SOUNDS, storage);

  const setModernSoundsEnabled = React.useCallback(
    async (value: boolean) => {
      _setEnabled(value);
    },
    [_setEnabled]
  );

  const isModernSoundsEnabled = enabled ?? true;
  return { isModernSoundsEnabled, setModernSoundsEnabled } as const;
};
