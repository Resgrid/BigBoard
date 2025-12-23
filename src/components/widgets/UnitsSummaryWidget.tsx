import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';

import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUnitsSignalRUpdates } from '@/hooks/use-units-signalr-updates';
import { useUnitsStore } from '@/stores/units/store';

import { WidgetContainer } from './WidgetContainer';

interface UnitsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
}

export const UnitsSummaryWidget: React.FC<UnitsWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2 }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { units, isLoading, error, fetchUnits } = useUnitsStore();

  // Enable real-time updates via SignalR
  useUnitsSignalRUpdates();

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Calculate unit stats
  const unitsData = React.useMemo(() => {
    const total = units.length;
    const available = units.filter((u) => u.State === 0).length; // Available = State 0
    const responding = units.filter((u) => u.State === 2 || u.State === 3).length; // Responding/En Route
    const onScene = units.filter((u) => u.State === 4).length; // On Scene

    return { total, available, responding, onScene };
  }, [units]);

  if (error) {
    return (
      <WidgetContainer title="Units" onRemove={onRemove} isEditMode={isEditMode} testID="units-widget">
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Units" onRemove={onRemove} isEditMode={isEditMode} testID="units-widget">
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Units" onRemove={onRemove} isEditMode={isEditMode} testID="units-widget">
      <VStack space="md" className="w-full">
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total</Text>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{unitsData.total}</Text>
        </Box>
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Available</Text>
          <Text className={`text-xl font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{unitsData.available}</Text>
        </Box>
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Responding</Text>
          <Text className={`text-xl font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{unitsData.responding}</Text>
        </Box>
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>On Scene</Text>
          <Text className={`text-xl font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{unitsData.onScene}</Text>
        </Box>
      </VStack>
    </WidgetContainer>
  );
};
