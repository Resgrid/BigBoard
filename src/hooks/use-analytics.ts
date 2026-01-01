import { useCallback } from 'react';

import { countlyService } from '@/services/analytics.service';

interface AnalyticsEventProperties {
  [key: string]: string | number | boolean;
}

/**
 * Hook for tracking analytics events with Countly
 *
 * @returns Object with trackEvent function
 */
export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, properties?: AnalyticsEventProperties) => {
    countlyService.trackEvent(eventName, properties);
  }, []);

  return {
    trackEvent,
  };
};
