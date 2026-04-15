import { useLocalSearchParams } from 'expo-router';
import { AlertTriangle, Clock, Info, MapPin, Shield } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { SEVERITY_COLORS, SEVERITY_LABELS, WeatherAlertCertainty, type WeatherAlertSeverity, WeatherAlertUrgency } from '@/models/v4/weatherAlerts/weatherAlertEnums';
import { useWeatherAlertsStore } from '@/stores/weatherAlerts/store';

const URGENCY_LABELS: Record<number, string> = {
  [WeatherAlertUrgency.Unknown]: 'Unknown',
  [WeatherAlertUrgency.Immediate]: 'Immediate',
  [WeatherAlertUrgency.Expected]: 'Expected',
  [WeatherAlertUrgency.Future]: 'Future',
  [WeatherAlertUrgency.Past]: 'Past',
};

const CERTAINTY_LABELS: Record<number, string> = {
  [WeatherAlertCertainty.Unknown]: 'Unknown',
  [WeatherAlertCertainty.Observed]: 'Observed',
  [WeatherAlertCertainty.Likely]: 'Likely',
  [WeatherAlertCertainty.Possible]: 'Possible',
  [WeatherAlertCertainty.Unlikely]: 'Unlikely',
};

const formatDateTime = (utc: string): string => {
  if (!utc) return 'N/A';
  return new Date(utc).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function WeatherAlertDetailScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const { selectedAlert, isLoadingDetail, alerts, fetchAlertDetail } = useWeatherAlertsStore();

  useEffect(() => {
    if (!alertId) return;
    // Check if alert is already in the list
    const existing = alerts.find((a) => a.WeatherAlertId === alertId);
    if (existing) {
      useWeatherAlertsStore.setState({ selectedAlert: existing });
    } else {
      fetchAlertDetail(alertId);
    }
  }, [alertId, alerts, fetchAlertDetail]);

  if (isLoadingDetail || !selectedAlert) {
    return (
      <Box className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Spinner size="large" />
        <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading alert details...</Text>
      </Box>
    );
  }

  const alert = selectedAlert;
  const severityColor = SEVERITY_COLORS[alert.Severity as WeatherAlertSeverity] || SEVERITY_COLORS[0];
  const severityLabel = SEVERITY_LABELS[alert.Severity as WeatherAlertSeverity] || 'Unknown';

  return (
    <Box className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} testID="weather-alert-detail-screen">
      {/* Severity-colored header accent */}
      <Box style={{ height: 4, backgroundColor: severityColor }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <VStack className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`} space="sm">
          <HStack className="items-center">
            <AlertTriangle size={24} color={severityColor} />
            <Text className={`ml-2 flex-1 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{alert.Event}</Text>
          </HStack>
          <Box className="self-start rounded px-3 py-1" style={{ backgroundColor: severityColor }}>
            <Text className="text-sm font-semibold text-white">{severityLabel}</Text>
          </Box>
        </VStack>

        {/* Headline */}
        {alert.Headline ? (
          <VStack className={`mx-4 mt-3 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`} space="xs">
            <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Headline</Text>
            <Text className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{alert.Headline}</Text>
          </VStack>
        ) : null}

        {/* Timing */}
        <VStack className={`mx-4 mt-3 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`} space="sm">
          <HStack className="items-center">
            <Clock size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`ml-2 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Timing</Text>
          </HStack>
          <VStack space="xs">
            <HStack className="items-center justify-between">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Effective</Text>
              <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDateTime(alert.EffectiveUtc)}</Text>
            </HStack>
            <HStack className="items-center justify-between">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Onset</Text>
              <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDateTime(alert.OnsetUtc)}</Text>
            </HStack>
            <HStack className="items-center justify-between">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Expires</Text>
              <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDateTime(alert.ExpiresUtc)}</Text>
            </HStack>
          </VStack>
        </VStack>

        {/* Area */}
        {alert.AreaDescription ? (
          <VStack className={`mx-4 mt-3 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`} space="xs">
            <HStack className="items-center">
              <MapPin size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`ml-2 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Affected Area</Text>
            </HStack>
            <Text className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{alert.AreaDescription}</Text>
          </VStack>
        ) : null}

        {/* Description */}
        {alert.Description ? (
          <VStack className={`mx-4 mt-3 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`} space="xs">
            <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</Text>
            <Text className={`text-sm leading-5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{alert.Description}</Text>
          </VStack>
        ) : null}

        {/* Instructions */}
        {alert.Instruction ? (
          <VStack className={`mx-4 mt-3 rounded-lg border p-4 ${isDark ? 'border-amber-700 bg-amber-900/20' : 'border-amber-300 bg-amber-50'}`} space="xs">
            <HStack className="items-center">
              <Shield size={16} color={isDark ? '#F59E0B' : '#D97706'} />
              <Text className={`ml-2 text-sm font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Instructions</Text>
            </HStack>
            <Text className={`text-sm leading-5 ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>{alert.Instruction}</Text>
          </VStack>
        ) : null}

        {/* Metadata */}
        <VStack className={`mx-4 mt-3 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`} space="sm">
          <HStack className="items-center">
            <Info size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`ml-2 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Details</Text>
          </HStack>
          <Divider />
          <VStack space="xs">
            <HStack className="items-center justify-between">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Urgency</Text>
              <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{URGENCY_LABELS[alert.Urgency] || 'Unknown'}</Text>
            </HStack>
            <HStack className="items-center justify-between">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Certainty</Text>
              <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{CERTAINTY_LABELS[alert.Certainty] || 'Unknown'}</Text>
            </HStack>
            {alert.SenderName ? (
              <HStack className="items-center justify-between">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sender</Text>
                <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{alert.SenderName}</Text>
              </HStack>
            ) : null}
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
