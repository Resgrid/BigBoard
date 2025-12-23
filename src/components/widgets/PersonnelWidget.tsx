import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { usePersonnelSignalRUpdates } from '@/hooks/use-personnel-signalr-updates';
import { usePersonnelStore } from '@/stores/personnel/store';
import { usePersonnelSettingsStore } from '@/stores/widget-settings/personnel-settings-store';

import { WidgetContainer } from './WidgetContainer';

interface PersonnelWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const PersonnelWidget: React.FC<PersonnelWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { personnel, isLoading, error, init } = usePersonnelStore();
  const { settings } = usePersonnelSettingsStore();

  // Enable real-time updates via SignalR
  usePersonnelSignalRUpdates();

  useEffect(() => {
    init();
  }, [init]);

  const filteredPersonnel = useMemo(() => {
    return personnel.filter((person) => {
      // Check if group is hidden
      if (settings.hideGroups?.includes(person.GroupId)) {
        return false;
      }

      // Check if person should be hidden based on status
      if (settings.hideNotResponding && settings.notRespondingText) {
        if (person.Status === settings.notRespondingText) {
          return false;
        }
      }

      // Check if person should be hidden based on staffing
      if (settings.hideUnavailable && settings.unavailableText) {
        if (person.Staffing === settings.unavailableText) {
          return false;
        }
      }

      return true;
    });
  }, [personnel, settings]);

  const sortedPersonnel = useMemo(() => {
    if (!settings.sortRespondingToTop) {
      return filteredPersonnel;
    }

    // Sort so that responding personnel appear first
    return [...filteredPersonnel].sort((a, b) => {
      const aIsResponding = settings.respondingText ? a.Status === settings.respondingText : false;
      const bIsResponding = settings.respondingText ? b.Status === settings.respondingText : false;

      if (aIsResponding && !bIsResponding) return -1;
      if (!aIsResponding && bIsResponding) return 1;
      return 0;
    });
  }, [filteredPersonnel, settings.sortRespondingToTop, settings.respondingText]);

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
      <WidgetContainer title="Personnel" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Personnel" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Personnel" onRemove={onRemove} isEditMode={isEditMode} testID="personnel-widget" width={containerWidth} height={containerHeight}>
      <ScrollView style={{ flex: 1 }}>
        <VStack space="xs">
          {/* Header Row */}
          <HStack space="sm" className={`border-b pb-1 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            <Box style={{ flex: 1 }}>
              <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                Name
              </Text>
            </Box>
            {settings.showGroup && (
              <Box style={{ flex: 0.8 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Group
                </Text>
              </Box>
            )}
            {settings.showStaffing && (
              <Box style={{ flex: 0.7 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Staffing
                </Text>
              </Box>
            )}
            {settings.showStatus && (
              <Box style={{ flex: 0.7 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Status
                </Text>
              </Box>
            )}
            {settings.showRoles && (
              <Box style={{ flex: 0.8 }}>
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
                  Roles
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
          {sortedPersonnel.map((person, index) => (
            <HStack key={person.UserId} space="sm" className={`py-1 ${index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-100/50') : ''}`}>
              <Box style={{ flex: 1 }}>
                <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize }} numberOfLines={1}>
                  {person.FirstName} {person.LastName}
                </Text>
              </Box>
              {settings.showGroup && (
                <Box style={{ flex: 0.8 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
                    {person.GroupName}
                  </Text>
                </Box>
              )}
              {settings.showStaffing && (
                <Box style={{ flex: 0.7 }}>
                  <Text className="text-xs" style={{ fontSize, color: person.StaffingColor }} numberOfLines={1}>
                    {person.Staffing}
                  </Text>
                </Box>
              )}
              {settings.showStatus && (
                <Box style={{ flex: 0.7 }}>
                  <Text className="text-xs" style={{ fontSize, color: person.StatusColor }} numberOfLines={1}>
                    {person.Status}
                  </Text>
                </Box>
              )}
              {settings.showRoles && (
                <Box style={{ flex: 0.8 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: fontSize - 2 }} numberOfLines={1}>
                    {person.Roles}
                  </Text>
                </Box>
              )}
              {settings.showTimestamp && (
                <Box style={{ flex: 0.9 }}>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
                    {getTimeago(person.StatusTimestamp)}
                  </Text>
                </Box>
              )}
            </HStack>
          ))}

          {sortedPersonnel.length === 0 && (
            <Box className="flex-1 items-center justify-center py-8">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No personnel to display</Text>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </WidgetContainer>
  );
};
