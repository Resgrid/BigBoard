import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useCallsSignalRUpdates } from '@/hooks/use-calls-signalr-updates';
import { useCallsStore } from '@/stores/calls/store';
import { useCallsSettingsStore } from '@/stores/widget-settings/calls-settings-store';

import { WidgetContainer } from './WidgetContainer';

interface CallsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const CallsWidget: React.FC<CallsWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { calls, callPriorities, isLoading, error, init } = useCallsStore();
  const { settings } = useCallsSettingsStore();

  // Enable real-time updates via SignalR
  useCallsSignalRUpdates();

  useEffect(() => {
    init();
  }, [init]);

  const getPriorityName = (priorityId: number): string => {
    const priority = callPriorities.find((p) => p.Id === priorityId);
    return priority?.Name || 'Unknown';
  };

  const getPriorityColor = (priorityId: number): string => {
    const priority = callPriorities.find((p) => p.Id === priorityId);
    return priority?.Color ? `#${priority.Color}` : '#888888';
  };

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
      <WidgetContainer title="Calls" onRemove={onRemove} isEditMode={isEditMode} testID="calls-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Calls" onRemove={onRemove} isEditMode={isEditMode} testID="calls-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Calls" onRemove={onRemove} isEditMode={isEditMode} testID="calls-widget" width={containerWidth} height={containerHeight}>
      <ScrollView style={{ flex: 1 }}>
        <VStack space="xs">
          {/* Header Row */}
          <HStack space="sm" className={`border-b pb-1 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            {settings.showId && (
              <Box style={{ flex: 0.5 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  ID
                </Text>
              </Box>
            )}
            {settings.showName && (
              <Box style={{ flex: 1.2 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Name
                </Text>
              </Box>
            )}
            {settings.showAddress && (
              <Box style={{ flex: 1.2 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Address
                </Text>
              </Box>
            )}
            {settings.showTimestamp && (
              <Box style={{ flex: 0.9 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Logged
                </Text>
              </Box>
            )}
            {settings.showPriority && (
              <Box style={{ flex: 0.7 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Priority
                </Text>
              </Box>
            )}
          </HStack>

          {/* Data Rows */}
          {calls.map((call, index) => (
            <HStack key={call.CallId} space="sm" className={`py-1 ${index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-100/50') : ''}`}>
              {settings.showId && (
                <Box style={{ flex: 0.5 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize }} numberOfLines={1}>
                    {call.Number}
                  </Text>
                </Box>
              )}
              {settings.showName && (
                <Box style={{ flex: 1.2 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize }} numberOfLines={1}>
                    {call.Name}
                  </Text>
                </Box>
              )}
              {settings.showAddress && (
                <Box style={{ flex: 1.2 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
                    {call.Address || 'No address'}
                  </Text>
                </Box>
              )}
              {settings.showTimestamp && (
                <Box style={{ flex: 0.9 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
                    {getTimeago(call.LoggedOn)}
                  </Text>
                </Box>
              )}
              {settings.showPriority && (
                <Box style={{ flex: 0.7 }}>
                  <Text className="text-xs" style={{ fontSize, color: getPriorityColor(call.Priority) }} numberOfLines={1}>
                    {getPriorityName(call.Priority)}
                  </Text>
                </Box>
              )}
            </HStack>
          ))}

          {calls.length === 0 && (
            <Box className="flex-1 items-center justify-center py-8">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No active calls</Text>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </WidgetContainer>
  );
};
