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

interface PersonnelStaffingSummaryWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
}

export const PersonnelStaffingSummaryWidget: React.FC<PersonnelStaffingSummaryWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2 }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { personnel, isLoading: isLoadingPersonnel, error: personnelError, init } = usePersonnelStore();
  const { availableStaffings, isLoadingOptions, fetchStatusOptions } = useHomeStore();
  const { personnelStaffingSummary } = useWidgetSettingsStore();

  // Enable real-time updates via SignalR
  usePersonnelSignalRUpdates();

  useEffect(() => {
    init();
    fetchStatusOptions();
  }, [init, fetchStatusOptions]);

  // Calculate personnel counts by staffing
  const staffingCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};

    availableStaffings.forEach((staffing) => {
      const count = personnel.filter((p) => {
        return p.Staffing?.toLowerCase() === staffing.Text.toLowerCase();
      }).length;
      counts[staffing.Text] = count;
    });

    return counts;
  }, [personnel, availableStaffings]);

  const isLoading = isLoadingPersonnel || isLoadingOptions;

  if (personnelError) {
    return (
      <WidgetContainer title="Personnel Staffing" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-staffing-widget">
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Personnel Staffing" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-staffing-widget">
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Personnel Staffing" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-staffing-widget">
      <VStack space="md" className="w-full">
        {availableStaffings.length === 0 ? (
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: personnelStaffingSummary.fontSize }}>
            No staffings available
          </Text>
        ) : (
          availableStaffings.map((staffing) => (
            <Box key={staffing.Id} className="flex-row items-center justify-between">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: personnelStaffingSummary.fontSize }}>
                {staffing.Text}
              </Text>
              <Text
                className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{
                  fontSize: personnelStaffingSummary.fontSize * 1.5,
                  color: personnelStaffingSummary.showColors ? staffing.BColor || undefined : undefined,
                }}
              >
                {staffingCounts[staffing.Text] || 0}
              </Text>
            </Box>
          ))
        )}
      </VStack>
    </WidgetContainer>
  );
};
