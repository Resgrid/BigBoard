import { useRouter } from 'expo-router';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { translate } from '@/lib/i18n';
import { SEVERITY_COLORS, SEVERITY_LABELS, WeatherAlertSeverity } from '@/models/v4/weatherAlerts/weatherAlertEnums';
import { type WeatherAlertResultData } from '@/models/v4/weatherAlerts/weatherAlertResultData';
import { useWeatherAlertsStore } from '@/stores/weatherAlerts/store';

type FilterType = 'all' | 'extreme' | 'severe' | 'moderate' | 'minor';
type SortType = 'severity' | 'expires' | 'newest';

const FILTER_MAP: Record<FilterType, WeatherAlertSeverity | null> = {
  all: null,
  extreme: WeatherAlertSeverity.Extreme,
  severe: WeatherAlertSeverity.Severe,
  moderate: WeatherAlertSeverity.Moderate,
  minor: WeatherAlertSeverity.Minor,
};

const getFilters = (): { label: string; value: FilterType }[] => [
  { label: translate('weatherAlerts.filter.all'), value: 'all' },
  { label: translate('weatherAlerts.filter.extreme'), value: 'extreme' },
  { label: translate('weatherAlerts.filter.severe'), value: 'severe' },
  { label: translate('weatherAlerts.filter.moderate'), value: 'moderate' },
  { label: translate('weatherAlerts.filter.minor'), value: 'minor' },
];

const getSorts = (): { label: string; value: SortType }[] => [
  { label: translate('weatherAlerts.sort.severity'), value: 'severity' },
  { label: translate('weatherAlerts.sort.expiresSoonest'), value: 'expires' },
  { label: translate('weatherAlerts.sort.newest'), value: 'newest' },
];

const formatDateTime = (utc: string): string => {
  if (!utc) return translate('call_detail.not_available');
  const date = new Date(utc);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

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

export default function WeatherAlertsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { alerts, isLoading, error, fetchActiveAlerts } = useWeatherAlertsStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('severity');

  const filteredAndSorted = useMemo(() => {
    let result = [...alerts];

    const severityFilter = FILTER_MAP[filter];
    if (severityFilter !== null) {
      result = result.filter((a) => a.Severity === severityFilter);
    }

    switch (sort) {
      case 'expires':
        result.sort((a, b) => new Date(a.ExpiresUtc).getTime() - new Date(b.ExpiresUtc).getTime());
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.EffectiveUtc).getTime() - new Date(a.EffectiveUtc).getTime());
        break;
      case 'severity':
      default:
        result.sort((a, b) => {
          if (b.Severity !== a.Severity) return b.Severity - a.Severity;
          return new Date(b.EffectiveUtc).getTime() - new Date(a.EffectiveUtc).getTime();
        });
        break;
    }

    return result;
  }, [alerts, filter, sort]);

  const onRefresh = useCallback(() => {
    fetchActiveAlerts();
  }, [fetchActiveAlerts]);

  const renderAlertCard = ({ item }: { item: WeatherAlertResultData }) => {
    const severityColor = SEVERITY_COLORS[item.Severity as WeatherAlertSeverity] || SEVERITY_COLORS[0];
    const severityLabel = SEVERITY_LABELS[item.Severity as WeatherAlertSeverity] || translate('common.unknown');

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/(app)/weather-alert-detail' as any, params: { alertId: item.WeatherAlertId } })}
        className={`mx-4 mb-3 overflow-hidden rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        style={styles.card}
      >
        <HStack>
          <Box style={{ width: 5, backgroundColor: severityColor }} />
          <VStack className="flex-1 p-3" space="sm">
            <HStack className="items-center justify-between">
              <Text className={`flex-1 text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                {item.Event}
              </Text>
              <Box className="ml-2 rounded px-2 py-0.5" style={{ backgroundColor: severityColor }}>
                <Text className="text-xs font-medium text-white">{severityLabel}</Text>
              </Box>
            </HStack>
            {item.Headline ? (
              <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={2}>
                {item.Headline}
              </Text>
            ) : null}
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={1}>
              {item.AreaDescription}
            </Text>
            <HStack className="items-center justify-between">
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {translate('weatherAlerts.detail.effective')}: {formatDateTime(item.EffectiveUtc)}
              </Text>
              <Text className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatExpiry(item.ExpiresUtc)}</Text>
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (error && !isLoading) {
      return (
        <Box className="flex-1 items-center justify-center py-20">
          <AlertCircle size={48} color={isDark ? '#EF4444' : '#DC2626'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{translate('weatherAlerts.errorLoading')}</Text>
          <Button variant="outline" onPress={onRefresh} className="mt-4">
            <ButtonText>{translate('common.retry')}</ButtonText>
          </Button>
        </Box>
      );
    }

    return (
      <Box className="flex-1 items-center justify-center py-20">
        <CheckCircle size={48} color={isDark ? '#22C55E' : '#16A34A'} />
        <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{translate('weatherAlerts.noActiveAlerts')}</Text>
        {filter !== 'all' && <Text className={`mt-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{translate('weatherAlerts.tryChangingFilter')}</Text>}
      </Box>
    );
  };

  return (
    <Box className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} testID="weather-alerts-screen">
      {/* Header */}
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <AlertTriangle size={20} color={isDark ? '#F59E0B' : '#D97706'} />
          <Text className={`ml-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{translate('weatherAlerts.title')}</Text>
          <View style={[styles.countBadge, { backgroundColor: '#0066cc' }]}>
            <Text className="text-xs font-medium text-white">{alerts.length}</Text>
          </View>
        </View>

        {/* Filter tabs - horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {getFilters().map(({ label, value }) => {
            const isActive = filter === value;
            return (
              <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filterPill, isActive ? styles.filterPillActive : isDark ? styles.filterPillDark : styles.filterPillLight]}>
                <Text className={`text-xs font-medium ${isActive ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Sort options - horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          <Text className={`mr-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{translate('weatherAlerts.sort.label')}</Text>
          {getSorts().map(({ label, value }) => {
            const isActive = sort === value;
            return (
              <Pressable key={value} onPress={() => setSort(value)} style={[styles.sortPill, isActive ? (isDark ? styles.sortPillActiveDark : styles.sortPillActiveLight) : null]}>
                <Text className={`text-xs ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Alert list */}
      <FlatList
        data={filteredAndSorted}
        renderItem={renderAlertCard}
        keyExtractor={(item) => item.WeatherAlertId}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  headerDark: {
    borderBottomColor: '#374151',
    backgroundColor: '#1F2937',
  },
  headerLight: {
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    marginLeft: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  filterPill: {
    marginRight: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: '#0066cc',
  },
  filterPillDark: {
    backgroundColor: '#374151',
  },
  filterPillLight: {
    backgroundColor: '#E5E7EB',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  sortPill: {
    marginRight: 8,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortPillActiveDark: {
    backgroundColor: '#4B5563',
  },
  sortPillActiveLight: {
    backgroundColor: '#D1D5DB',
  },
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
