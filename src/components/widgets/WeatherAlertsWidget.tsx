import { useRouter } from 'expo-router';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { translate } from '@/lib/i18n';
import { SEVERITY_COLORS, SEVERITY_LABEL_KEYS, WeatherAlertCategory, WeatherAlertSeverity } from '@/models/v4/weatherAlerts/weatherAlertEnums';
import { type WeatherAlertResultData } from '@/models/v4/weatherAlerts/weatherAlertResultData';
import { useWeatherAlertsStore } from '@/stores/weatherAlerts/store';
import { useWidgetSettingsStore, type WeatherAlertsWidgetSettings } from '@/stores/widget-settings/store';

import { WidgetContainer } from './WidgetContainer';

interface WeatherAlertsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

// Kept in step with the same helper on the full weather-alerts screen, so the widget and the screen
// it opens never disagree about how long an alert has left.
const formatExpiry = (expiresUtc: string): string => {
  if (!expiresUtc) return '';
  const expires = new Date(expiresUtc);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  if (diffMs <= 0) return translate('weatherAlerts.expired');
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours > 24) return `${translate('weatherAlerts.time_days_hours', { days: Math.floor(diffHours / 24), hours: diffHours % 24 })} ${translate('weatherAlerts.remaining')}`;
  if (diffHours > 0) return `${translate('weatherAlerts.time_hours_minutes', { hours: diffHours, minutes: diffMins })} ${translate('weatherAlerts.remaining')}`;
  return `${translate('weatherAlerts.time_minutes', { minutes: diffMins })} ${translate('weatherAlerts.remaining')}`;
};

const isSeverityVisible = (severity: number, ws: WeatherAlertsWidgetSettings): boolean => {
  switch (severity) {
    case WeatherAlertSeverity.Extreme:
      return ws.showExtreme;
    case WeatherAlertSeverity.Severe:
      return ws.showSevere;
    case WeatherAlertSeverity.Moderate:
      return ws.showModerate;
    case WeatherAlertSeverity.Minor:
      return ws.showMinor;
    case WeatherAlertSeverity.Unknown:
    default:
      return ws.showUnknown;
  }
};

const isCategoryVisible = (category: number, ws: WeatherAlertsWidgetSettings): boolean => {
  switch (category) {
    case WeatherAlertCategory.Met:
      return ws.showCategoryMet;
    case WeatherAlertCategory.Fire:
      return ws.showCategoryFire;
    case WeatherAlertCategory.Health:
      return ws.showCategoryHealth;
    case WeatherAlertCategory.Env:
      return ws.showCategoryEnv;
    case WeatherAlertCategory.Other:
    default:
      return ws.showCategoryOther;
  }
};

interface AlertCardProps {
  alert: WeatherAlertResultData;
  isDark: boolean;
  showHeadline: boolean;
  showArea: boolean;
  showExpiry: boolean;
  fontSize: number;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, isDark, showHeadline, showArea, showExpiry, fontSize }) => {
  const { t } = useTranslation();
  const severityColor = SEVERITY_COLORS[alert.Severity as WeatherAlertSeverity] || SEVERITY_COLORS[WeatherAlertSeverity.Unknown];
  const severityLabel = t(SEVERITY_LABEL_KEYS[alert.Severity as WeatherAlertSeverity] || 'weatherAlerts.severity.unknown');

  return (
    <HStack className="mb-1.5 overflow-hidden rounded" style={{ minHeight: 44 }}>
      <Box style={{ width: 4, backgroundColor: severityColor }} />
      <VStack className={`flex-1 px-2 py-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} space="xs">
        <HStack className="items-center justify-between">
          <Text className={`flex-1 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1} style={{ fontSize }}>
            {alert.Event}
          </Text>
          <Box className="ml-1 rounded px-1.5 py-0.5" style={{ backgroundColor: severityColor }}>
            <Text className="text-xs font-medium text-white">{severityLabel}</Text>
          </Box>
        </HStack>
        {showHeadline && alert.Headline ? (
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={2} style={{ fontSize: fontSize - 1 }}>
            {alert.Headline}
          </Text>
        ) : null}
        {showArea && alert.AreaDescription ? (
          <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={1} style={{ fontSize: fontSize - 2 }}>
            {alert.AreaDescription}
          </Text>
        ) : null}
        {showExpiry ? (
          <Text className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`} style={{ fontSize: fontSize - 2 }}>
            {formatExpiry(alert.ExpiresUtc)}
          </Text>
        ) : null}
      </VStack>
    </HStack>
  );
};

export const WeatherAlertsWidget: React.FC<WeatherAlertsWidgetProps> = ({ onRemove, isEditMode, containerWidth, containerHeight }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const alerts = useWeatherAlertsStore((state) => state.alerts);
  const isLoading = useWeatherAlertsStore((state) => state.isLoading);
  const error = useWeatherAlertsStore((state) => state.error);
  const settings = useWeatherAlertsStore((state) => state.settings);
  const fetchActiveAlerts = useWeatherAlertsStore((state) => state.fetchActiveAlerts);
  const widgetSettings = useWidgetSettingsStore((s) => s.weatherAlerts);

  useEffect(() => {
    if (!settings && !isLoading) {
      useWeatherAlertsStore.getState().init();
    }
  }, [settings, isLoading]);

  // Filter alerts by severity and category settings
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => isSeverityVisible(alert.Severity, widgetSettings) && isCategoryVisible(alert.AlertCategory, widgetSettings));
  }, [alerts, widgetSettings]);

  const handlePress = () => {
    if (!isEditMode) {
      router.push('/(app)/weather-alerts' as any);
    }
  };

  // Disabled state
  if (settings && settings.WeatherAlertsEnabled === false) {
    return (
      <WidgetContainer title={t('weatherAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="weather-alerts-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <ShieldAlert size={24} color={isDark ? '#6B7280' : '#9CA3AF'} />
          <Text className={`mt-2 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('weatherAlerts.notEnabled')}</Text>
        </Box>
      </WidgetContainer>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <WidgetContainer title={t('weatherAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="weather-alerts-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <WidgetContainer title={t('weatherAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="weather-alerts-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <AlertTriangle size={24} color={isDark ? '#EF4444' : '#DC2626'} />
          <Text className={`mt-2 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('weatherAlerts.errorLoading')}</Text>
          <Pressable onPress={() => fetchActiveAlerts()} className="mt-2" testID="weather-alerts-retry">
            <Text className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t('common.retry')}</Text>
          </Pressable>
        </Box>
      </WidgetContainer>
    );
  }

  // Empty state
  if (filteredAlerts.length === 0) {
    return (
      <WidgetContainer title={t('weatherAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="weather-alerts-widget" width={containerWidth} height={containerHeight}>
        <Pressable onPress={handlePress} style={{ flex: 1 }}>
          <Box className="flex-1 items-center justify-center">
            <CheckCircle size={24} color={isDark ? '#22C55E' : '#16A34A'} />
            <Text className={`mt-2 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('weatherAlerts.noActiveAlerts')}</Text>
          </Box>
        </Pressable>
      </WidgetContainer>
    );
  }

  const displayAlerts = filteredAlerts.slice(0, widgetSettings.maxAlertsInWidget);
  const remaining = filteredAlerts.length - displayAlerts.length;

  return (
    <WidgetContainer title={`${t('weatherAlerts.title')} (${filteredAlerts.length})`} onRemove={onRemove} isEditMode={isEditMode} testID="weather-alerts-widget" width={containerWidth} height={containerHeight}>
      <Pressable onPress={handlePress} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {displayAlerts.map((alert) => (
            <AlertCard
              key={alert.WeatherAlertId}
              alert={alert}
              isDark={isDark}
              showHeadline={widgetSettings.showHeadline}
              showArea={widgetSettings.showArea}
              showExpiry={widgetSettings.showExpiry}
              fontSize={widgetSettings.fontSize}
            />
          ))}
          {remaining > 0 && (
            <HStack className="items-center justify-center py-1">
              <AlertTriangle size={12} color={isDark ? '#F59E0B' : '#D97706'} />
              <Text className={`ml-1 text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{t('weatherAlerts.moreAlerts', { count: remaining })}</Text>
            </HStack>
          )}
        </ScrollView>
      </Pressable>
    </WidgetContainer>
  );
};
