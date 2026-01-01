/* eslint-disable react/no-unstable-nested-components */

import { NovuProvider } from '@novu/react-native';
import Mapbox from '@rnmapbox/maps';
import { isRunningInExpoGo } from 'expo';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { Menu, Plus, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationButton } from '@/components/notifications/NotificationButton';
import { NotificationInbox } from '@/components/notifications/NotificationInbox';
import SideMenu from '@/components/sidebar/side-menu';
import { View } from '@/components/ui';
import { Button, ButtonText } from '@/components/ui/button';
import { Drawer, DrawerBackdrop, DrawerBody, DrawerContent, DrawerFooter } from '@/components/ui/drawer/index';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { DrawerProvider, useDrawer } from '@/contexts/DrawerContext';
import { useAppLifecycle } from '@/hooks/use-app-lifecycle';
import { useSignalRLifecycle } from '@/hooks/use-signalr-lifecycle';
import { useAuthStore } from '@/lib/auth';
import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { useIsFirstTime } from '@/lib/storage';
import { type GetConfigResultData } from '@/models/v4/configs/getConfigResultData';
import { usePushNotifications } from '@/services/push-notification';
import { useCoreStore } from '@/stores/app/core-store';
import { useCallsStore } from '@/stores/calls/store';
import { useDashboardStore } from '@/stores/dashboard/store';
import { useRolesStore } from '@/stores/roles/store';
import { securityStore } from '@/stores/security/store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';
import { WIDGET_LABELS, WidgetType } from '@/types/widget';

export default function TabLayout() {
  const { t } = useTranslation();
  const { status } = useAuthStore();
  const [isFirstTime, _setIsFirstTime] = useIsFirstTime();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  // Get store states first (hooks must be at top level)
  const config = useCoreStore((state) => state.config);
  const coreIsInitializing = useCoreStore((state) => state.isInitializing);
  const coreIsInitialized = useCoreStore((state) => state.isInitialized);
  const rights = securityStore((state) => state.rights);
  const userId = useAuthStore((state) => state.userId);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { isActive, appState } = useAppLifecycle();
  const insets = useSafeAreaInsets();

  // Refs to track initialization state
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);
  const hasHiddenSplash = useRef(false);
  const lastSignedInStatus = useRef<string | null>(null);
  const parentRef = useRef(null);

  // Initialize push notifications
  //usePushNotifications();

  // Initialize Mapbox - only on native platforms
  // On web, Mapbox GL JS is loaded separately and doesn't use this initialization
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Mapbox.setAccessToken(Env.MAPBOX_PUBKEY);
      logger.info({
        message: 'Mapbox access token set',
        context: { platform: Platform.OS },
      });
    }
  }, []);

  const initializeApp = useCallback(async () => {
    if (isInitializing.current) {
      logger.info({
        message: 'App initialization already in progress, skipping',
      });
      return;
    }

    if (status !== 'signedIn') {
      logger.info({
        message: 'User not signed in, skipping initialization',
        context: { status },
      });
      return;
    }

    isInitializing.current = true;
    logger.info({
      message: 'Starting app initialization',
      context: {
        hasInitialized: hasInitialized.current,
        platform: Platform.OS,
      },
    });

    try {
      // Set a timeout for initialization to prevent infinite hanging
      const initTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Initialization timeout after 30 seconds')), 30000));

      const initPromise = (async () => {
        await useCoreStore.getState().init();

        logger.info({
          message: 'Core store initialized, initializing calls store',
          context: { platform: Platform.OS },
        });

        await useCallsStore.getState().init();

        logger.info({
          message: 'Calls store initialized, getting security rights',
          context: { platform: Platform.OS },
        });

        await securityStore.getState().getRights();

        logger.info({
          message: 'Security rights retrieved, connecting SignalR',
          context: { platform: Platform.OS },
        });

        // Connect to SignalR after core initialization is complete
        try {
          await useSignalRStore.getState().connectUpdateHub();
          logger.info({
            message: 'SignalR update hub connected successfully',
            context: { platform: Platform.OS },
          });
        } catch (error) {
          logger.error({
            message: 'Failed to connect SignalR update hub during initialization',
            context: { error, platform: Platform.OS },
          });
          // Don't fail initialization if SignalR connection fails
        }

        hasInitialized.current = true;

        logger.info({
          message: 'App initialization completed successfully',
          context: { platform: Platform.OS },
        });
      })();

      await Promise.race([initPromise, initTimeout]);
    } catch (error) {
      logger.error({
        message: 'Failed to initialize app',
        context: { error, platform: Platform.OS },
      });
      // Reset initialization state on error so it can be retried
      hasInitialized.current = false;
    } finally {
      isInitializing.current = false;
    }
  }, [status]);

  const refreshDataFromBackground = useCallback(async () => {
    if (status !== 'signedIn' || !hasInitialized.current) return;

    // On web platform, skip config refresh as network requests are blocked
    // This prevents an infinite loop when AppState changes trigger refreshes
    if (Platform.OS === 'web') {
      logger.info({
        message: 'Skipping background data refresh on web platform (AppState handling not needed)',
      });
      return;
    }

    logger.info({
      message: 'App resumed from background, refreshing data',
    });

    try {
      // Refresh data
      await Promise.all([useCoreStore.getState().fetchConfig(), useCallsStore.getState().fetchCalls(), useRolesStore.getState().fetchRoles()]);
    } catch (error) {
      logger.error({
        message: 'Failed to refresh data on app resume',
        context: { error },
      });
    }
  }, [status]);

  // Handle SignalR lifecycle management
  useSignalRLifecycle({
    isSignedIn: status === 'signedIn',
    hasInitialized: hasInitialized.current,
  });

  // WEB PLATFORM WORKAROUND: Call initialization directly during render
  // useEffect doesn't reliably fire on web platform due to React Native Web issues
  if (Platform.OS === 'web') {
    // CRITICAL: Also check coreIsInitializing from the store to prevent re-initialization during state updates
    const shouldInitialize = status === 'signedIn' && !hasInitialized.current && !isInitializing.current && !coreIsInitializing;

    if (shouldInitialize) {
      logger.info({
        message: 'WEB: Triggering initialization during render phase',
        context: {
          status,
          hasInitialized: hasInitialized.current,
          isInitializing: isInitializing.current,
          coreIsInitializing,
        },
      });
      // Trigger initialization in next tick to avoid setState during render
      Promise.resolve().then(() => {
        initializeApp();
      });
    }
  }

  // Handle app initialization (for native platforms)
  useEffect(() => {
    // Skip on web - handled above in render phase
    if (Platform.OS === 'web') {
      logger.info({
        message: 'Skipping useEffect initialization on web (handled in render)',
      });
      return;
    }

    const shouldInitialize = status === 'signedIn' && !hasInitialized.current && !isInitializing.current;

    logger.info({
      message: 'App initialization effect triggered',
      context: {
        status,
        hasInitialized: hasInitialized.current,
        isInitializing: isInitializing.current,
        shouldInitialize,
        lastStatus: lastSignedInStatus.current,
      },
    });

    if (shouldInitialize) {
      logger.info({
        message: 'Triggering app initialization',
        context: {
          statusChanged: lastSignedInStatus.current !== status,
          lastStatus: lastSignedInStatus.current,
          currentStatus: status,
        },
      });
      initializeApp();
    }

    // Stop location tracking when user signs out
    if (status === 'signedOut' && lastSignedInStatus.current === 'signedIn') {
      logger.info({
        message: 'User signed out, stopping location tracking',
      });
    }

    // Update last known status
    lastSignedInStatus.current = status;
  }, [status, initializeApp]); // Added initializeApp to dependencies

  // Handle app resuming from background - separate from initialization
  useEffect(() => {
    // Only trigger on state change, not on initial render
    if (isActive && appState === 'active' && hasInitialized.current) {
      const timer = setTimeout(() => {
        refreshDataFromBackground();
      }, 500); // Small delay to prevent multiple rapid calls

      return () => clearTimeout(timer);
    }
  }, [isActive, appState, refreshDataFromBackground]);

  // Check for maintenance mode
  if (Env.MAINTENANCE_MODE) {
    logger.info({
      message: 'Maintenance mode enabled, redirecting to maintenance page',
    });
    return <Redirect href={'/maintenance' as any} />;
  }

  if (isFirstTime) {
    logger.info({
      message: 'Is first time navigating to onboarding',
    });

    return <Redirect href={'/onboarding' as any} />;
  } else if (status === 'signedOut' || status === 'idle' || status === 'error') {
    logger.info({
      message: 'User is not signed in, redirecting to login',
      context: { status },
    });

    return <Redirect href={'/login' as any} />;
  }

  // Show loading screen while app is initializing
  if (!coreIsInitialized || coreIsInitializing || !config) {
    logger.info({
      message: 'App still initializing, showing loading screen',
      context: {
        coreIsInitializing,
        coreIsInitialized,
        hasConfig: !!config,
      },
    });

    return (
      <View style={styles.container}>
        <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
          <ActivityIndicator size="large" color="#0066cc" />
          <Text className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading...</Text>
        </View>
      </View>
    );
  }

  logger.info({
    message: 'Rendering app layout',
    context: {
      status,
      isFirstTime,
      platform: Platform.OS,
      userId: userId || 'null',
      hasConfig: !!config,
    },
  });

  const content = (
    <DrawerProvider isLandscape={isLandscape}>
      <LayoutContent t={t} insets={insets} isLandscape={isLandscape} coreIsInitialized={coreIsInitialized} rights={rights} parentRef={parentRef} />
    </DrawerProvider>
  );

  // On web, skip Novu integration as it may cause rendering issues
  if (Platform.OS === 'web') {
    logger.info({
      message: 'Rendering app layout for web platform (Novu disabled)',
    });
    return content;
  }

  return (
    <>
      {userId && config && rights?.DepartmentCode ? (
        <NovuProvider subscriberId={`${rights?.DepartmentCode}_User_${userId}`} applicationIdentifier={config.NovuApplicationId} backendUrl={config.NovuBackendApiUrl} socketUrl={config.NovuSocketUrl}>
          {/* NotificationInbox at the root level */}
          <NotificationInbox isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
          {content}
        </NovuProvider>
      ) : (
        content
      )}
    </>
  );
}

interface LayoutContentProps {
  t: any;
  insets: any;
  isLandscape: boolean;
  coreIsInitialized: boolean;
  rights: any;
  parentRef: any;
}

const LayoutContent = ({ t, insets, isLandscape, coreIsInitialized, rights, parentRef }: LayoutContentProps) => {
  const { isOpen, closeDrawer, openDrawer } = useDrawer();
  const pathname = usePathname();
  const router = useRouter();

  // Memoize drawer navigation handler for better performance
  const handleNavigate = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  // Check if we're on the home page to show dashboard controls
  const isHomePage = pathname === '/(app)/home' || pathname === '/home';

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between bg-primary-600 px-4" style={{ paddingTop: insets.top }}>
        <CreateDrawerMenuButton openDrawer={openDrawer} isLandscape={isLandscape} />
        <View className="flex-1 items-center">
          <Text className="text-lg font-semibold text-white">{t('app.title', 'Resgrid Responder')}</Text>
        </View>
        {isHomePage && <DashboardControls router={router} />}
      </View>

      <View className="flex-1 flex-row" ref={parentRef}>
        {/* Drawer - always use drawer regardless of orientation */}
        <Drawer isOpen={isOpen} onClose={closeDrawer}>
          <DrawerBackdrop onPress={closeDrawer} />
          <DrawerContent className={`${isLandscape ? 'w-1/3' : 'w-4/5'} bg-white p-0 dark:bg-gray-900`}>
            <DrawerBody className="m-0 mt-0 mb-0">{coreIsInitialized ? <SideMenu onNavigate={handleNavigate} /> : null}</DrawerBody>
            <DrawerFooter className="px-4 pb-4">
              <Button onPress={closeDrawer} className="w-full bg-primary-600">
                <ButtonText>Close</ButtonText>
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Main content area */}
        <View className="flex-1">
          <Slot />
        </View>
      </View>
    </View>
  );
};

interface DashboardControlsProps {
  router: any;
}

const DashboardControls = ({ router }: DashboardControlsProps) => {
  const { isEditMode, setEditMode, setShowAddMenu, widgets } = useDashboardStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Calculate grid dimensions
  const BASE_WIDGET_WIDTH = 180;
  const screenWidth = Dimensions.get('window').width;
  const numColumns = Math.floor(screenWidth / BASE_WIDGET_WIDTH);

  // Calculate total grid units used
  const totalGridUnits = widgets.reduce((sum, widget) => sum + (widget.w || 1) * (widget.h || 1), 0);

  // Calculate occupied rows
  const maxY = widgets.length > 0 ? Math.max(...widgets.map((w) => w.y + (w.h || 1))) : 0;
  const totalCells = maxY * numColumns;

  return (
    <View className="flex-row items-center gap-2">
      {isEditMode && (
        <View className={`mr-2 rounded px-2 py-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Grid: {numColumns} cols • {widgets.length} widgets • {totalGridUnits} units
          </Text>
        </View>
      )}
      <Pressable onPress={() => setEditMode(!isEditMode)} className={`rounded px-3 py-1.5 ${isEditMode ? 'bg-blue-500' : 'bg-primary-700'}`} testID="dashboard-edit-button">
        <Text className="text-sm font-medium text-white">{isEditMode ? 'Done' : 'Edit'}</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/(app)/configure')} className="rounded bg-primary-700 p-1.5" testID="dashboard-configure-button">
        <Settings size={20} color="white" />
      </Pressable>
      <Pressable onPress={() => setShowAddMenu(true)} className="rounded bg-primary-700 p-1.5" testID="dashboard-add-button">
        <Plus size={20} color="white" />
      </Pressable>
    </View>
  );
};

interface CreateDrawerMenuButtonProps {
  openDrawer: () => void;
  isLandscape: boolean;
}

const CreateDrawerMenuButton = ({ openDrawer, isLandscape }: CreateDrawerMenuButtonProps) => {
  return (
    <Pressable className="p-2" onPress={openDrawer}>
      <Menu size={24} color="white" />
    </Pressable>
  );
};

const CreateNotificationButton = ({
  config,
  setIsNotificationsOpen,
  userId,
  departmentCode,
}: {
  config: GetConfigResultData | null;
  setIsNotificationsOpen: (isOpen: boolean) => void;
  userId: string | null;
  departmentCode: string | undefined;
}) => {
  if (!userId || !config || !config.NovuApplicationId || !config.NovuBackendApiUrl || !config.NovuSocketUrl || !departmentCode) {
    return null;
  }

  return <NotificationButton onPress={() => setIsNotificationsOpen(true)} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
