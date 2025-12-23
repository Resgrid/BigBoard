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
import { useUnitsSettingsStore } from '@/stores/widget-settings/units-settings-store';

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
            <Box style={{ flex: 1 }}>
              <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                Name
              </Text>
            </Box>
            {settings.showStation && (
              <Box style={{ flex: 0.8 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Station
                </Text>
              </Box>
            )}
            {settings.showType && (
              <Box style={{ flex: 0.7 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Type
                </Text>
              </Box>
            )}
            {settings.showState && (
              <Box style={{ flex: 0.7 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  State
                </Text>
              </Box>
            )}
            {settings.showTimestamp && (
              <Box style={{ flex: 0.9 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Updated
                </Text>
              </Box>
            )}
          </HStack>

          {/* Data Rows */}
          {filteredUnits.map((unit, index) => (
            <HStack key={unit.UnitId} space="sm" className={`py-1 ${index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-100/50') : ''}`}>
              <Box style={{ flex: 1 }}>
                <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize }} numberOfLines={1}>
                  {unit.Name}
                </Text>
              </Box>
              {settings.showStation && (
                <Box style={{ flex: 0.8 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
                    {unit.GroupName}
                  </Text>
                </Box>
              )}
              {settings.showType && (
                <Box style={{ flex: 0.7 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
                    {unit.Type}
                  </Text>
                </Box>
              )}
              {settings.showState && (
                <Box style={{ flex: 0.7 }}>
                  <Text className="text-xs" style={{ fontSize, color: unit.CurrentStatusColor ? `#${unit.CurrentStatusColor}` : '#888888' }} numberOfLines={1}>
                    {unit.CurrentStatus || 'Unknown'}
                  </Text>
                </Box>
              )}
              {settings.showTimestamp && (
                <Box style={{ flex: 0.9 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
                    {getTimeago(unit.CurrentStatusTimestampUtc)}
                  </Text>
                </Box>
              )}
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
