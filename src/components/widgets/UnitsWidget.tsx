import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUnitsSignalRUpdates } from '@/hooks/use-units-signalr-updates';
import { normalizeStatusColor, secondsInStatus } from '@/lib/unit-status';
import { alertRowStyle, alertSortWeight, evaluateUnitStatusAlert, formatElapsed, useUnitStatusThresholds } from '@/lib/unit-status-thresholds';
import { useUnitsStore } from '@/stores/units/store';
import { DEFAULT_UNITS_COLUMN_ORDER, type UnitsColumnKey, useUnitsSettingsStore } from '@/stores/widget-settings/units-settings-store';

import { WidgetContainer } from './WidgetContainer';

interface UnitsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const UnitsWidget: React.FC<UnitsWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { units, unitStatuses, isLoading, error, fetchUnits } = useUnitsStore();
  const { settings } = useUnitsSettingsStore();

  // Enable real-time updates via SignalR
  useUnitsSignalRUpdates();

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const thresholds = useUnitStatusThresholds();

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      // Check if group is hidden
      if (settings.hideGroups?.includes(unit.GroupId || '')) {
        return false;
      }
      return true;
    });
  }, [units, settings.hideGroups]);

  // Every unit is evaluated against a single instant, so two units a millisecond apart can never
  // disagree about which side of a threshold they are on. Breaching units sort to the top: the
  // point of the feature is that a dispatcher spots them without reading the whole board.
  const displayedUnits = useMemo(() => {
    const now = Date.now();

    const annotated = filteredUnits.map((unit) => ({
      unit,
      alert: evaluateUnitStatusAlert(unit, thresholds, now),
    }));

    if (thresholds.length === 0) {
      return annotated;
    }

    return annotated.sort((a, b) => {
      const weight = alertSortWeight(a.alert.level) - alertSortWeight(b.alert.level);

      if (weight !== 0) {
        return weight;
      }

      // Within a level, longest overdue first.
      return (b.alert.secondsInStatus ?? 0) - (a.alert.secondsInStatus ?? 0);
    });
  }, [filteredUnits, thresholds]);

  const getTimeago = (date: string) => {
    // secondsInStatus treats a zone-less timestamp as UTC. `new Date(...)` read it as local time, so
    // a status set a minute ago showed as hours old in any department that is not on UTC.
    const diffInSeconds = secondsInStatus(date);

    if (diffInSeconds === null) return '';

    if (diffInSeconds < 60) return '1 minute ago';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const fontSize = settings.fontSize || 12;
  const columnOrder: UnitsColumnKey[] = settings.columnOrder?.length ? settings.columnOrder : DEFAULT_UNITS_COLUMN_ORDER;

  const columnVisible: Record<UnitsColumnKey, boolean> = {
    name: true,
    station: !!settings.showStation,
    type: !!settings.showType,
    state: !!settings.showState,
    timestamp: !!settings.showTimestamp,
  };

  const columnFlex: Record<UnitsColumnKey, number> = {
    name: 1,
    station: 0.8,
    type: 0.7,
    state: 0.7,
    timestamp: 0.9,
  };

  const columnHeaderLabel: Record<UnitsColumnKey, string> = {
    name: 'Name',
    station: 'Station',
    type: 'Type',
    state: 'State',
    timestamp: 'Updated',
  };

  const renderHeaderCell = (col: UnitsColumnKey) => {
    if (!columnVisible[col]) return null;
    return (
      <Box key={col} style={{ flex: columnFlex[col] }}>
        <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
          {columnHeaderLabel[col]}
        </Text>
      </Box>
    );
  };

  const renderDataCell = (col: UnitsColumnKey, unit: (typeof filteredUnits)[0]) => {
    if (!columnVisible[col]) return null;
    switch (col) {
      case 'name':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize }} numberOfLines={1}>
              {unit.Name}
            </Text>
          </Box>
        );
      case 'station':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
              {unit.GroupName}
            </Text>
          </Box>
        );
      case 'type':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
              {unit.Type}
            </Text>
          </Box>
        );
      case 'state':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className="text-xs" style={{ fontSize, color: normalizeStatusColor(unit.CurrentStatusColor) }} numberOfLines={1}>
              {unit.CurrentStatus || 'Unknown'}
            </Text>
          </Box>
        );
      case 'timestamp':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
              {getTimeago(unit.CurrentStatusTimestampUtc)}
            </Text>
          </Box>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <WidgetContainer title="Units" onRemove={onRemove} isEditMode={isEditMode} testID="units-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Units" onRemove={onRemove} isEditMode={isEditMode} testID="units-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Units" onRemove={onRemove} isEditMode={isEditMode} testID="units-widget" width={containerWidth} height={containerHeight}>
      <ScrollView style={{ flex: 1 }}>
        <VStack space="xs">
          {/* Header Row */}
          <HStack space="sm" className={`border-b pb-1 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            {columnOrder.map((col) => renderHeaderCell(col))}
          </HStack>

          {/* Data Rows */}
          {displayedUnits.map(({ unit, alert }, index) => {
            const rowStyle = alertRowStyle(alert.level, isDark);

            return (
              <HStack
                key={unit.UnitId}
                space="sm"
                className={`py-1 ${alert.level === 'none' && index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-100/50') : ''}`}
                style={rowStyle.backgroundColor ? { backgroundColor: rowStyle.backgroundColor, borderLeftWidth: 3, borderLeftColor: rowStyle.borderLeftColor } : undefined}
                testID={alert.level !== 'none' ? `unit-row-${alert.level}` : undefined}
              >
                {columnOrder.map((col) => renderDataCell(col, unit))}
                {alert.level !== 'none' ? (
                  <Box>
                    <Text className="text-xs font-semibold" style={{ fontSize, color: rowStyle.borderLeftColor }} numberOfLines={1}>
                      {formatElapsed(alert.secondsInStatus)}
                    </Text>
                  </Box>
                ) : null}
              </HStack>
            );
          })}

          {filteredUnits.length === 0 && (
            <Box className="flex-1 items-center justify-center py-8">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No units to display</Text>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </WidgetContainer>
  );
};
