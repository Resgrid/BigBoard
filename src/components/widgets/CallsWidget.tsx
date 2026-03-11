import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

import { getAllGroups } from '@/api/groups/groups';
import { getRecipients } from '@/api/messaging/messages';
import { AutoScrollingDispatches } from '@/components/calls/auto-scrolling-dispatches';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useCallsSignalRUpdates } from '@/hooks/use-calls-signalr-updates';
import { type GroupResultData } from '@/models/v4/groups/groupsResultData';
import { type RecipientsResultData } from '@/models/v4/messages/recipientsResultData';
import { useCallsStore } from '@/stores/calls/store';
import { usePersonnelStore } from '@/stores/personnel/store';
import { useUnitsStore } from '@/stores/units/store';
import { CALLS_COLUMN_LABELS, DEFAULT_CALLS_COLUMN_ORDER, type CallsColumnKey, useCallsSettingsStore } from '@/stores/widget-settings/calls-settings-store';

import { WidgetContainer } from './WidgetContainer';

interface CallsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const CallsWidget: React.FC<CallsWidgetProps> = ({ onRemove, isEditMode, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { calls, callPriorities, callExtraDataMap, isLoading, error, init } = useCallsStore();
  const { settings } = useCallsSettingsStore();
  const { personnel, init: initPersonnel } = usePersonnelStore();
  const { units, fetchUnits } = useUnitsStore();
  const [groups, setGroups] = useState<GroupResultData[]>([]);
  const [roles, setRoles] = useState<RecipientsResultData[]>([]);

  // Enable real-time updates via SignalR
  useCallsSignalRUpdates();

  useEffect(() => {
    init();
    initPersonnel();
    fetchUnits();

    getAllGroups()
      .then((res) => setGroups(res.Data || []))
      .catch(() => setGroups([]));

    getRecipients(false, false)
      .then((res) => {
        const roleRecipients = (res.Data || []).filter((r) => r.Type === 'Role');
        setRoles(roleRecipients);
      })
      .catch(() => setRoles([]));
  }, [init, initPersonnel, fetchUnits]);

  // Build lookup maps for name resolution of dispatched entities
  const personnelMap = useMemo(() => {
    const map: Record<string, string> = {};
    personnel.forEach((p) => {
      map[p.UserId] = `${p.FirstName} ${p.LastName}`.trim();
    });
    return map;
  }, [personnel]);

  const unitsMap = useMemo(() => {
    const map: Record<string, string> = {};
    units.forEach((u) => {
      map[u.UnitId] = u.Name;
    });
    return map;
  }, [units]);

  const groupsMap = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach((g) => {
      map[g.GroupId] = g.Name;
    });
    return map;
  }, [groups]);

  const rolesMap = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach((r) => {
      map[r.Id] = r.Name;
    });
    return map;
  }, [roles]);

  const resolveDispatchName = (type: string, id: string, name: string): string => {
    if (name) return name;
    const lowerType = (type || '').toLowerCase();
    if (lowerType === 'personnel' || lowerType === 'user') return personnelMap[id] || id;
    if (lowerType === 'unit') return unitsMap[id] || id;
    if (lowerType === 'group' || lowerType === 'station') return groupsMap[id] || id;
    if (lowerType === 'role') return rolesMap[id] || id;
    return name || id;
  };

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
  const columnOrder: CallsColumnKey[] = settings.columnOrder?.length ? settings.columnOrder : DEFAULT_CALLS_COLUMN_ORDER;

  const columnVisible: Record<CallsColumnKey, boolean> = {
    id: !!settings.showId,
    name: !!settings.showName,
    address: !!settings.showAddress,
    timestamp: !!settings.showTimestamp,
    priority: !!settings.showPriority,
    dispatched: !!settings.showDispatched,
  };

  const columnFlex: Record<CallsColumnKey, number> = {
    id: 0.5,
    name: 1.2,
    address: 1.2,
    timestamp: 0.9,
    priority: 0.7,
    dispatched: 1.8,
  };

  const renderHeaderCell = (col: CallsColumnKey) => {
    if (!columnVisible[col]) return null;
    return (
      <Box key={col} style={{ flex: columnFlex[col] }}>
        <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
          {CALLS_COLUMN_LABELS[col]}
        </Text>
      </Box>
    );
  };

  const renderDataCell = (col: CallsColumnKey, call: (typeof calls)[0]) => {
    if (!columnVisible[col]) return null;
    switch (col) {
      case 'id':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize }} numberOfLines={1}>
              {call.Number}
            </Text>
          </Box>
        );
      case 'name':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize }} numberOfLines={1}>
              {call.Name}
            </Text>
          </Box>
        );
      case 'address':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
              {call.Address || 'No address'}
            </Text>
          </Box>
        );
      case 'timestamp':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
              {getTimeago(call.LoggedOn)}
            </Text>
          </Box>
        );
      case 'priority':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className="text-xs" style={{ fontSize, color: getPriorityColor(call.Priority) }} numberOfLines={1}>
              {getPriorityName(call.Priority)}
            </Text>
          </Box>
        );
      case 'dispatched': {
        const extraData = callExtraDataMap[call.CallId];
        const dispatches = extraData?.Dispatches || [];
        if (dispatches.length === 0) {
          return (
            <Box key={col} style={{ flex: columnFlex[col] }}>
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`} style={{ fontSize }}>
                —
              </Text>
            </Box>
          );
        }
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <AutoScrollingDispatches
              dispatches={dispatches}
              resolveDisplayName={resolveDispatchName}
              scrollSpeed={settings.dispatchScrollSpeed ?? 40}
              fontSize={fontSize}
            />
          </Box>
        );
      }
      default:
        return null;
    }
  };

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
            {columnOrder.map((col) => renderHeaderCell(col))}
          </HStack>

          {/* Data Rows */}
          {calls.map((call, index) => (
            <HStack key={call.CallId} space="sm" className={`py-1 ${index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-100/50') : ''}`}>
              {columnOrder.map((col) => renderDataCell(col, call))}
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
