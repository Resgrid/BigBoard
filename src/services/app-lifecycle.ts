import { AppState, type AppStateStatus, Platform } from 'react-native';

import { logger } from '@/lib/logging';
import { useAppLifecycleStore } from '@/stores/app/app-lifecycle';

class AppLifecycleService {
  private static instance: AppLifecycleService;
  private subscription: { remove: () => void } | null = null;
  private lastStateChangeTime: number = 0;
  private readonly DEBOUNCE_MS = 100; // Debounce rapid state changes

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AppLifecycleService {
    if (!AppLifecycleService.instance) {
      AppLifecycleService.instance = new AppLifecycleService();
    }
    return AppLifecycleService.instance;
  }

  private initialize(): void {
    // Skip AppState listener on web platform
    // Web doesn't have the same app lifecycle as mobile (no background/foreground states)
    if (Platform.OS === 'web') {
      logger.info({
        message: 'AppState listener skipped on web platform',
      });
      return;
    }

    this.subscription = AppState.addEventListener('change', this.handleAppStateChange);

    logger.info({
      message: 'AppState listener initialized',
      context: { platform: Platform.OS },
    });
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    const currentState = useAppLifecycleStore.getState().appState;

    // Prevent rapid-fire updates (debounce)
    const now = Date.now();
    if (now - this.lastStateChangeTime < this.DEBOUNCE_MS) {
      logger.debug({
        message: 'AppState change debounced',
        context: { timeSinceLastChange: now - this.lastStateChangeTime },
      });
      return;
    }
    this.lastStateChangeTime = now;

    // Only update if state actually changed
    if (currentState === nextAppState) {
      logger.debug({
        message: 'AppState unchanged, skipping update',
        context: { state: currentState },
      });
      return;
    }

    logger.info({
      message: 'App state changed',
      context: {
        from: currentState,
        to: nextAppState,
      },
    });

    useAppLifecycleStore.getState().setAppState(nextAppState);

    if (nextAppState === 'active') {
      useAppLifecycleStore.getState().updateLastActiveTimestamp();
    }
  };

  public getCurrentState(): AppStateStatus {
    return useAppLifecycleStore.getState().appState;
  }

  public isAppActive(): boolean {
    return useAppLifecycleStore.getState().isActive;
  }

  public isAppBackground(): boolean {
    return useAppLifecycleStore.getState().isBackground;
  }

  public getLastActiveTimestamp(): number | null {
    return useAppLifecycleStore.getState().lastActiveTimestamp;
  }

  public cleanup(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}

export const appLifecycleService = AppLifecycleService.getInstance();
