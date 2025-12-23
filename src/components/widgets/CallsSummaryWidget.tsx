import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';

import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useCallsSignalRUpdates } from '@/hooks/use-calls-signalr-updates';
import { useCallsStore } from '@/stores/calls/store';

import { WidgetContainer } from './WidgetContainer';

interface CallsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
}

export const CallsSummaryWidget: React.FC<CallsWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2 }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { calls, callPriorities, isLoading, error, init } = useCallsStore();

  // Enable real-time updates via SignalR
  useCallsSignalRUpdates();

  useEffect(() => {
    init();
  }, [init]);

  // Calculate call stats
  const callsData = React.useMemo(() => {
    const total = calls.length;

    // Count by priority
    const priorityCounts = callPriorities.reduce(
      (acc, priority) => {
        const count = calls.filter((c) => c.Priority === priority.Id).length;
        acc[priority.Name] = count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get the most recent call time
    const recentCall = calls.length > 0 ? calls[0] : null;

    return { total, priorityCounts, recentCall };
  }, [calls, callPriorities]);

  if (error) {
    return (
      <WidgetContainer title="Calls" onRemove={onRemove} isEditMode={isEditMode} testID="calls-widget">
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Calls" onRemove={onRemove} isEditMode={isEditMode} testID="calls-widget">
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Calls" onRemove={onRemove} isEditMode={isEditMode} testID="calls-widget">
      <VStack space="md" className="w-full">
        <Box className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active</Text>
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{callsData.total}</Text>
        </Box>
        {callsData.recentCall && (
          <Box className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
              {callsData.recentCall.Name}
            </Text>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={1}>
              {callsData.recentCall.Address || 'No address'}
            </Text>
          </Box>
        )}
        {callPriorities.slice(0, 3).map((priority) => (
          <Box key={priority.Id} className="flex-row items-center justify-between">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{priority.Name}</Text>
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{callsData.priorityCounts[priority.Name] || 0}</Text>
          </Box>
        ))}
      </VStack>
    </WidgetContainer>
  );
};
