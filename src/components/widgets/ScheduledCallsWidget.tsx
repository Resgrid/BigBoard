import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo } from 'react';
// Lazy-loaded filter data
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { getAllGroups } from '@/api/groups/groups';
import { getRecipients } from '@/api/messaging/messages';
import { AutoScrollingDispatches } from '@/components/calls/auto-scrolling-dispatches';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type GroupResultData } from '@/models/v4/groups/groupsResultData';
import { type RecipientsResultData } from '@/models/v4/messages/recipientsResultData';
import { usePersonnelStore } from '@/stores/personnel/store';
import { useScheduledCallsStore } from '@/stores/scheduledCalls/store';
import { useUnitsStore } from '@/stores/units/store';
import { DEFAULT_SCHEDULED_CALLS_COLUMN_ORDER, SCHEDULED_CALLS_COLUMN_LABELS, type ScheduledCallsColumnKey, useScheduledCallsSettingsStore } from '@/stores/widget-settings/scheduled-calls-settings-store';

import { WidgetContainer } from './WidgetContainer';

interface ScheduledCallsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const ScheduledCallsWidget: React.FC<ScheduledCallsWidgetProps> = ({ onRemove, isEditMode, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { scheduledCalls, callPriorities, callExtraDataMap, isLoading, error, init } = useScheduledCallsStore();
  const { settings } = useScheduledCallsSettingsStore();
  const { personnel, init: initPersonnel } = usePersonnelStore();
  const { units, fetchUnits } = useUnitsStore();
  const [groups, setGroups] = useState<GroupResultData[]>([]);
  const [roles, setRoles] = useState<RecipientsResultData[]>([]);

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

  /** Returns minutes until the scheduled call becomes active. Negative means overdue. */
  const getMinutesUntilActive = (call: CallResultData): number => {
    const scheduled = call.DispatchedOnUtc || call.DispatchedOn || call.LoggedOnUtc || call.LoggedOn;
    if (!scheduled) return Infinity;
    const diff = new Date(scheduled).getTime() - Date.now();
    return diff / 60000;
  };

  /** Color-code row based on how soon the call goes active */
  const getUrgencyColor = (call: CallResultData): string => {
    const minutes = getMinutesUntilActive(call);
    if (minutes <= settings.colorThresholdRedMinutes) return settings.colorRedHex;
    if (minutes <= settings.colorThresholdYellowMinutes) return settings.colorYellowHex;
    if (minutes <= settings.colorThresholdGreenMinutes) return settings.colorGreenHex;
    return settings.colorDefaultHex;
  };

  const formatScheduledTime = (call: CallResultData): string => {
    const scheduled = call.DispatchedOnUtc || call.DispatchedOn || call.LoggedOnUtc || call.LoggedOn;
    if (!scheduled) return '—';
    const date = new Date(scheduled);
    if (isNaN(date.getTime())) return '—';

    const minutes = getMinutesUntilActive(call);
    const timeStr = date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (minutes < 0) return `${timeStr} (overdue)`;
    if (minutes < 60) return `${timeStr} (${Math.ceil(minutes)}m)`;
    if (minutes < 1440) return `${timeStr} (${Math.floor(minutes / 60)}h)`;
    return `${timeStr} (${Math.floor(minutes / 1440)}d)`;
  };

  // Filter calls based on settings
  const filteredCalls = useMemo(() => {
    let result = [...scheduledCalls];

    const hasGroupFilter = settings.filterGroupIds.length > 0;
    const hasUnitFilter = settings.filterUnitIds.length > 0;
    const hasPersonnelFilter = settings.filterPersonnelIds.length > 0;
    const hasRoleFilter = settings.filterRoleIds.length > 0;
    const hasAnyFilter = hasGroupFilter || hasUnitFilter || hasPersonnelFilter || hasRoleFilter;

    if (hasAnyFilter) {
      result = result.filter((call) => {
        const extraData = callExtraDataMap[call.CallId];
        const dispatches = extraData?.Dispatches || [];

        // Check if any dispatch matches the filter criteria (OR logic across filter types)
        let matchesGroup = !hasGroupFilter;
        let matchesUnit = !hasUnitFilter;
        let matchesPersonnel = !hasPersonnelFilter;
        let matchesRole = !hasRoleFilter;

        for (const d of dispatches) {
          const lowerType = (d.Type || '').toLowerCase();

          if (hasGroupFilter && (lowerType === 'group' || lowerType === 'station')) {
            if (settings.filterGroupIds.includes(d.Id) || settings.filterGroupIds.includes(d.GroupId)) {
              matchesGroup = true;
            }
          }
          if (hasUnitFilter && lowerType === 'unit') {
            if (settings.filterUnitIds.includes(d.Id)) {
              matchesUnit = true;
            }
          }
          if (hasPersonnelFilter && (lowerType === 'personnel' || lowerType === 'user')) {
            if (settings.filterPersonnelIds.includes(d.Id)) {
              matchesPersonnel = true;
            }
          }
          if (hasRoleFilter && lowerType === 'role') {
            if (settings.filterRoleIds.includes(d.Id)) {
              matchesRole = true;
            }
          }
        }

        return matchesGroup && matchesUnit && matchesPersonnel && matchesRole;
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (settings.sortBy) {
        case 'scheduledTime': {
          const aTime = new Date(a.DispatchedOnUtc || a.DispatchedOn || a.LoggedOnUtc || a.LoggedOn || 0).getTime();
          const bTime = new Date(b.DispatchedOnUtc || b.DispatchedOn || b.LoggedOnUtc || b.LoggedOn || 0).getTime();
          cmp = aTime - bTime;
          break;
        }
        case 'priority':
          cmp = a.Priority - b.Priority;
          break;
        case 'name':
          cmp = (a.Name || '').localeCompare(b.Name || '');
          break;
      }
      return settings.sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [scheduledCalls, callExtraDataMap, settings.filterGroupIds, settings.filterUnitIds, settings.filterPersonnelIds, settings.filterRoleIds, settings.sortBy, settings.sortOrder]);

  const fontSize = settings.fontSize || 12;
  const columnOrder: ScheduledCallsColumnKey[] = settings.columnOrder?.length ? settings.columnOrder : DEFAULT_SCHEDULED_CALLS_COLUMN_ORDER;

  const columnVisible: Record<ScheduledCallsColumnKey, boolean> = {
    name: !!settings.showName,
    scheduledTime: !!settings.showScheduledTime,
    priority: !!settings.showPriority,
    address: !!settings.showAddress,
    dispatched: !!settings.showDispatched,
  };

  const columnFlex: Record<ScheduledCallsColumnKey, number> = {
    name: 1.2,
    scheduledTime: 1.2,
    priority: 0.7,
    address: 1.2,
    dispatched: 1.8,
  };

  const renderHeaderCell = (col: ScheduledCallsColumnKey) => {
    if (!columnVisible[col]) return null;
    return (
      <Box key={col} style={{ flex: columnFlex[col] }}>
        <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: fontSize - 2 }}>
          {SCHEDULED_CALLS_COLUMN_LABELS[col]}
        </Text>
      </Box>
    );
  };

  const renderDataCell = (col: ScheduledCallsColumnKey, call: CallResultData) => {
    if (!columnVisible[col]) return null;
    switch (col) {
      case 'name':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize }} numberOfLines={1}>
              {call.Name}
            </Text>
          </Box>
        );
      case 'scheduledTime':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className="text-xs" style={{ fontSize, color: getUrgencyColor(call) }} numberOfLines={1}>
              {formatScheduledTime(call)}
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
      case 'address':
        return (
          <Box key={col} style={{ flex: columnFlex[col] }}>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize }} numberOfLines={1}>
              {call.Address || 'No address'}
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
            <AutoScrollingDispatches dispatches={dispatches} resolveDisplayName={resolveDispatchName} scrollSpeed={settings.dispatchScrollSpeed ?? 40} fontSize={fontSize} />
          </Box>
        );
      }
      default:
        return null;
    }
  };

  if (error) {
    return (
      <WidgetContainer title="Scheduled Calls" onRemove={onRemove} isEditMode={isEditMode} testID="scheduled-calls-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Scheduled Calls" onRemove={onRemove} isEditMode={isEditMode} testID="scheduled-calls-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Scheduled Calls" onRemove={onRemove} isEditMode={isEditMode} testID="scheduled-calls-widget" width={containerWidth} height={containerHeight}>
      <ScrollView style={{ flex: 1 }}>
        <VStack space="xs">
          {/* Header Row */}
          <HStack space="sm" className={`border-b pb-1 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            {/* Urgency indicator column */}
            <Box style={{ width: 4 }} />
            {columnOrder.map((col) => renderHeaderCell(col))}
          </HStack>

          {/* Data Rows */}
          {filteredCalls.map((call, index) => (
            <HStack key={call.CallId} space="sm" className={`py-1 ${index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-100/50') : ''}`}>
              {/* Urgency color indicator bar */}
              <Box
                style={{
                  width: 4,
                  borderRadius: 2,
                  backgroundColor: getUrgencyColor(call),
                  alignSelf: 'stretch',
                }}
              />
              {columnOrder.map((col) => renderDataCell(col, call))}
            </HStack>
          ))}

          {filteredCalls.length === 0 && (
            <Box className="flex-1 items-center justify-center py-8">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No pending scheduled calls</Text>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </WidgetContainer>
  );
};
