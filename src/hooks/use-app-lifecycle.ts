import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { useAppLifecycleStore } from '@/stores/app/app-lifecycle';

export const useAppLifecycle = () => {
  // On web, return static values to avoid store subscription overhead
  // Use useMemo to ensure stable object reference
  const staticWebValues = useMemo(
    () => ({
      appState: 'active' as const,
      isActive: true,
      isBackground: false,
      lastActiveTimestamp: null,
    }),
    []
  );

  // On native platforms, subscribe to the store
  const storeValues = useAppLifecycleStore((state) => ({
    appState: state.appState,
    isActive: state.isActive,
    isBackground: state.isBackground,
    lastActiveTimestamp: state.lastActiveTimestamp,
  }));

  // Choose which values to return based on platform
  const values = Platform.OS === 'web' ? staticWebValues : storeValues;

  useEffect(() => {
    // Skip effect on web platform
    if (Platform.OS === 'web') {
      return;
    }

    // You can add any side effects based on app state changes here
    // For example, you might want to pause/resume certain operations
    // when the app goes to background/foreground
  }, [values.appState]);

  return values;
};
