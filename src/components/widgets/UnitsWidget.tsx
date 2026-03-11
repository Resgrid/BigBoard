import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUnitsSignalRUpdates } from '@/hooks/use-units-signalr-updates';
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

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      // Check if group is hidden
      if (settings.hideGroups?.includes(unit.GroupId || '')) {
        return false;
      }
      return true;
    });
  }, [units, settings.hideGroups]);

  const getTimeago = (date: string) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

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
            <Text className="text-xs" style={{ fontSize, color: unit.CurrentStatusColor ? `#${unit.CurrentStatusColor}` : '#888888' }} numberOfLines={1}>
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
          {filteredUnits.map((unit, index) => (
            <HStack key={unit.UnitId} space="sm" className={`py-1 ${index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-100/50') : ''}`}>
              {columnOrder.map((col) => renderDataCell(col, unit))}
            </HStack>
          ))}

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
