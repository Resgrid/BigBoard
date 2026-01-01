import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';

import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { usePersonnelSignalRUpdates } from '@/hooks/use-personnel-signalr-updates';
import { usePersonnelStore } from '@/stores/personnel/store';

import { WidgetContainer } from './WidgetContainer';

interface PersonnelWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
}

export const PersonnelSummaryWidget: React.FC<PersonnelWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2 }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { personnel, isLoading, error, init } = usePersonnelStore();

  // Enable real-time updates via SignalR
  usePersonnelSignalRUpdates();

  useEffect(() => {
    init();
  }, [init]);

  // Calculate personnel stats
  const personnelData = React.useMemo(() => {
    const total = personnel.length;
    const onDuty = personnel.filter((p) => p.Staffing?.toLowerCase().includes('on duty')).length;
    const available = personnel.filter((p) => p.Status?.toLowerCase().includes('available')).length;
    const responding = personnel.filter((p) => p.Status?.toLowerCase().includes('responding')).length;

    return { total, onDuty, available, responding };
  }, [personnel]);

  if (error) {
    return (
      <WidgetContainer title="Personnel" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-widget">
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Personnel" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-widget">
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Personnel" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-widget">
      <VStack space="md" className="w-full">
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total</Text>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{personnelData.total}</Text>
        </Box>
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>On Duty</Text>
          <Text className={`text-xl font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{personnelData.onDuty}</Text>
        </Box>
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Available</Text>
          <Text className={`text-xl font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{personnelData.available}</Text>
        </Box>
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Responding</Text>
          <Text className={`text-xl font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{personnelData.responding}</Text>
        </Box>
      </VStack>
    </WidgetContainer>
  );
};
