import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';

import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { usePersonnelSignalRUpdates } from '@/hooks/use-personnel-signalr-updates';
import { useHomeStore } from '@/stores/home/home-store';
import { usePersonnelStore } from '@/stores/personnel/store';
import { useWidgetSettingsStore } from '@/stores/widget-settings/store';

import { WidgetContainer } from './WidgetContainer';

interface PersonnelStatusSummaryWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
}

export const PersonnelStatusSummaryWidget: React.FC<PersonnelStatusSummaryWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2 }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { personnel, isLoading: isLoadingPersonnel, error: personnelError, init } = usePersonnelStore();
  const { availableStatuses, isLoadingOptions, fetchStatusOptions } = useHomeStore();
  const { personnelStatusSummary } = useWidgetSettingsStore();

  // Enable real-time updates via SignalR
  usePersonnelSignalRUpdates();

  useEffect(() => {
    init();
    fetchStatusOptions();
  }, [init, fetchStatusOptions]);

  // Calculate personnel counts by status
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};

    availableStatuses.forEach((status) => {
      const count = personnel.filter((p) => {
        return p.Status?.toLowerCase() === status.Text.toLowerCase();
      }).length;
      counts[status.Text] = count;
    });

    return counts;
  }, [personnel, availableStatuses]);

  const isLoading = isLoadingPersonnel || isLoadingOptions;

  if (personnelError) {
    return (
      <WidgetContainer title="Personnel Status" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-status-widget">
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Personnel Status" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-status-widget">
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Personnel Status" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-status-widget">
      <VStack space="md" className="w-full">
        {availableStatuses.length === 0 ? (
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: personnelStatusSummary.fontSize }}>
            No statuses available
          </Text>
        ) : (
          availableStatuses.map((status) => (
            <Box key={status.Id} className="flex-row items-center justify-between">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: personnelStatusSummary.fontSize }}>
                {status.Text}
              </Text>
              <Text
                className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{
                  fontSize: personnelStatusSummary.fontSize * 1.5,
                  color: personnelStatusSummary.showColors ? status.BColor || undefined : undefined,
                }}
              >
                {statusCounts[status.Text] || 0}
              </Text>
            </Box>
          ))
        )}
      </VStack>
    </WidgetContainer>
  );
};
