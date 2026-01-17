import { Env } from '@env';
import React, { useRef } from 'react';
import { Platform } from 'react-native';

import Countly from '@/lib/countly';
import { logger } from '@/lib/logging';
import { countlyService } from '@/services/analytics.service';

// Conditionally import CountlyConfig only on native platforms
let CountlyConfig: any;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CountlyConfig = require('countly-sdk-react-native-bridge/CountlyConfig').default;
}

interface CountlyProviderProps {
  appKey: string;
  serverURL: string;
  children: React.ReactNode;
}

export const CountlyProvider: React.FC<CountlyProviderProps> = ({ appKey, serverURL, children }) => {
  const initializationAttempted = useRef(false);

  React.useEffect(() => {
    // Only attempt initialization once
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;

    // Check if analytics is already disabled due to previous errors
    if (countlyService.isAnalyticsDisabled()) {
      logger.debug({
        message: 'Countly initialization skipped - service is disabled',
        context: countlyService.getStatus(),
      });
      return;
    }

    const initializeCountly = async () => {
      try {
        // Initialize Countly with proper configuration
        const keyToUse = appKey || Env.COUNTLY_APP_KEY;
        const urlToUse = serverURL || Env.COUNTLY_SERVER_URL;

        if (!keyToUse || !urlToUse) {
          logger.warn({
            message: 'Countly initialization skipped - missing configuration',
            context: {
              hasAppKey: !!keyToUse,
              hasServerURL: !!urlToUse,
              platform: Platform.OS,
            },
          });
          return;
        }

        logger.debug({
          message: 'Initializing Countly analytics',
          context: {
            appKey: keyToUse.substring(0, 8) + '...',
            serverURL: urlToUse,
            platform: Platform.OS,
          },
        });

        if (Platform.OS === 'web') {
          // Web platform initialization
          await Countly.initWithConfig?.({
            appKey: keyToUse,
            url: urlToUse,
          });

          logger.debug({
            message: 'Countly Web analytics initialized successfully',
          });
        } else {
          // Native platform initialization (iOS/Android)
          const config = new CountlyConfig(urlToUse, keyToUse).enableCrashReporting().setRequiresConsent(false);

          await Countly.initWithConfig?.(config);

          logger.debug({
            message: 'Countly Native analytics initialized successfully',
          });
        }
      } catch (error) {
        logger.error({
          message: 'Failed to initialize Countly analytics',
          context: {
            error: error instanceof Error ? error.message : String(error),
            platform: Platform.OS,
          },
        });

        // Handle the error through the service
        countlyService.reset();
      }
    };

    // Call the async initialization function
    initializeCountly();
  }, [appKey, serverURL]);

  // Always render children - Countly doesn't require a provider wrapper around the app
  return <>{children}</>;
};

// Legacy export for backward compatibility
export const CountlyProviderWrapper = CountlyProvider;

// Aptabase compatibility wrapper for migration
interface AptabaseProviderWrapperProps {
  appKey: string;
  serverURL?: string;
  children: React.ReactNode;
}

export const AptabaseProviderWrapper: React.FC<AptabaseProviderWrapperProps> = ({ appKey, serverURL, children }) => {
  return (
    <CountlyProvider appKey={appKey} serverURL={serverURL || Env.COUNTLY_SERVER_URL}>
      {children}
    </CountlyProvider>
  );
};
