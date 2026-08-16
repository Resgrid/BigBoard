import { AlertTriangleIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUnitsSignalRUpdates } from '@/hooks/use-units-signalr-updates';
import { alertRowStyle, alertSortWeight, evaluateUnitStatusAlert, formatElapsed, useUnitStatusThresholds } from '@/lib/unit-status-thresholds';
import { useUnitsStore } from '@/stores/units/store';

import { WidgetContainer } from './WidgetContainer';

interface UnitAlertsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

/**
 * Shows only the units that have been sitting in a status longer than the department allows.
 *
 * The Units widget already highlights these in place; this is for boards that want a dedicated
 * panel — the dispatcher glances at one small box instead of scanning a long roster.
 *
 * Re-evaluates on a timer as well as on SignalR updates: a unit crosses its threshold through the
 * passage of time, not through anything the server sends, so without the tick a unit dispatched
 * three minutes ago would never turn red until something else happened to it.
 */
const REEVALUATE_INTERVAL_MS = 15000;

export const UnitAlertsWidget: React.FC<UnitAlertsWidgetProps> = ({ onRemove, isEditMode, containerWidth, containerHeight }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { units, isLoading, error, fetchUnits } = useUnitsStore();
  const thresholds = useUnitStatusThresholds();
  // The instant every unit is measured against. Held in state rather than read inside the memo
  // so the passage of time is an explicit input — it is the only thing that moves a unit across its
  // threshold when nothing else about it has changed.
  const [evaluatedAt, setEvaluatedAt] = useState(() => Date.now());

  useUnitsSignalRUpdates();

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    if (thresholds.length === 0) {
      return;
    }

    const interval = setInterval(() => setEvaluatedAt(Date.now()), REEVALUATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [thresholds.length]);

  const breaching = useMemo(() => {
    if (thresholds.length === 0) {
      return [];
    }

    return units
      .map((unit) => ({ unit, alert: evaluateUnitStatusAlert(unit, thresholds, evaluatedAt) }))
      .filter((entry) => entry.alert.level !== 'none')
      .sort((a, b) => {
        const weight = alertSortWeight(a.alert.level) - alertSortWeight(b.alert.level);

        if (weight !== 0) {
          return weight;
        }

        return (b.alert.secondsInStatus ?? 0) - (a.alert.secondsInStatus ?? 0);
      });
  }, [units, thresholds, evaluatedAt]);

  if (error) {
    return (
      <WidgetContainer title={t('unitAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="unit-alerts-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{t('unitAlerts.errorLoading')}</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title={t('unitAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="unit-alerts-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title={t('unitAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="unit-alerts-widget" width={containerWidth} height={containerHeight}>
      <ScrollView style={{ flex: 1 }}>
        <VStack space="xs">
          {breaching.map(({ unit, alert }) => {
            const rowStyle = alertRowStyle(alert.level, isDark);

            return (
              <HStack
                key={unit.UnitId}
                space="sm"
                className="items-center rounded px-2 py-1"
                style={{ backgroundColor: rowStyle.backgroundColor, borderLeftWidth: 3, borderLeftColor: rowStyle.borderLeftColor }}
                testID={`unit-alert-${alert.level}`}
              >
                <AlertTriangleIcon size={14} color={rowStyle.borderLeftColor} />
                <VStack className="flex-1">
                  <Text className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`} numberOfLines={1}>
                    {unit.Name}
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={1}>
                    {unit.CurrentStatus || t('common.unknown')}
                    {unit.GroupName ? ` · ${unit.GroupName}` : ''}
                  </Text>
                </VStack>
                <Text className="text-sm font-bold" style={{ color: rowStyle.borderLeftColor }}>
                  {formatElapsed(alert.secondsInStatus)}
                </Text>
              </HStack>
            );
          })}

          {breaching.length === 0 ? (
            <Box className="flex-1 items-center justify-center py-8">
              {/* Two genuinely different situations: nothing is being timed, versus everything is
                  within its time. Saying "all units within thresholds" when none are configured
                  would be a false reassurance on a screen dispatchers trust. */}
              <Text className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{thresholds.length === 0 ? t('unitAlerts.noThresholds') : t('unitAlerts.withinThresholds')}</Text>
            </Box>
          ) : null}
        </VStack>
      </ScrollView>
    </WidgetContainer>
  );
};
