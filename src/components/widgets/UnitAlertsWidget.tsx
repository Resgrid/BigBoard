import { AlertTriangleIcon, BellOffIcon, CheckCircleIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { UnitAlertAcknowledgeSheet } from '@/components/units/unit-alert-acknowledge-sheet';
import { useUnitAlertAcknowledgements } from '@/hooks/use-unit-alert-acknowledgements';
import { useUnitsSignalRUpdates } from '@/hooks/use-units-signalr-updates';
import { acknowledgedRowStyle, acknowledgedSortWeight, alertRowStyle, type AnnotatedUnitAlert, annotateUnitAlert, formatElapsed, useUnitStatusThresholds } from '@/lib/unit-status-thresholds';
import { type UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';
import { useCoreStore } from '@/stores/app/core-store';
import { useSecurityStore } from '@/stores/security/store';
import { useUnitsStore } from '@/stores/units/store';

import { WidgetContainer } from './WidgetContainer';

interface UnitAlertsWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

type AlertEntry = AnnotatedUnitAlert & { unit: UnitInfoResultData };

/**
 * Shows only the units that have been sitting in a status longer than the department allows.
 *
 * The Units widget already highlights these in place; this is for boards that want a dedicated
 * panel — the dispatcher glances at one small box instead of scanning a long roster.
 *
 * Dispatchers with the Create Call permission can tap a row to acknowledge it (it stays, marked as seen,
 * with their note), or mute it (it drops into a collapsed section until the mute runs out or the unit
 * changes status). An alert that escalates from warning to alert comes back regardless.
 *
 * Re-evaluates on a timer as well as on SignalR updates: a unit crosses its threshold through the
 * passage of time, not through anything the server sends, so without the tick a unit dispatched
 * three minutes ago would never turn red until something else happened to it.
 */
const REEVALUATE_INTERVAL_MS = 15000;

export const UnitAlertsWidget: React.FC<UnitAlertsWidgetProps> = ({ onRemove, isEditMode, containerWidth, containerHeight }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const units = useUnitsStore((state) => state.units);
  const isLoading = useUnitsStore((state) => state.isLoading);
  const error = useUnitsStore((state) => state.error);
  const fetchUnits = useUnitsStore((state) => state.fetchUnits);
  const config = useCoreStore((state) => state.config);
  const configError = useCoreStore((state) => state.error);
  const { canUserCreateCalls } = useSecurityStore();
  const thresholds = useUnitStatusThresholds();
  const acknowledgements = useUnitAlertAcknowledgements(thresholds.length > 0);
  // The instant every unit is measured against. Held in state rather than read inside the memo
  // so the passage of time is an explicit input — it is the only thing that moves a unit across its
  // threshold when nothing else about it has changed.
  const [evaluatedAt, setEvaluatedAt] = useState(() => Date.now());
  const [showMuted, setShowMuted] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  useUnitsSignalRUpdates();

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    if (thresholds.length === 0) {
      return;
    }

    const interval = setInterval(() => setEvaluatedAt(Date.now()), REEVALUATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [thresholds.length]);

  const { active, muted } = useMemo(() => {
    if (thresholds.length === 0) {
      return { active: [] as AlertEntry[], muted: [] as AlertEntry[] };
    }

    const breaching: AlertEntry[] = units.map((unit) => ({ unit, ...annotateUnitAlert(unit, thresholds, acknowledgements, evaluatedAt) })).filter((entry) => entry.alert.level !== 'none');

    const byUrgency = (a: AlertEntry, b: AlertEntry) => {
      const weight = acknowledgedSortWeight(a.alert.level, a.acknowledgementState) - acknowledgedSortWeight(b.alert.level, b.acknowledgementState);

      if (weight !== 0) {
        return weight;
      }

      return (b.alert.secondsInStatus ?? 0) - (a.alert.secondsInStatus ?? 0);
    };

    return {
      active: breaching.filter((entry) => entry.acknowledgementState !== 'muted').sort(byUrgency),
      muted: breaching.filter((entry) => entry.acknowledgementState === 'muted').sort(byUrgency),
    };
  }, [units, thresholds, acknowledgements, evaluatedAt]);

  // Looked up from the live lists so the sheet follows the unit as it escalates or a colleague acts on it.
  const selected = useMemo(() => [...active, ...muted].find((entry) => entry.unit.UnitId === selectedUnitId) ?? null, [active, muted, selectedUnitId]);

  // Only an explicit empty list confirms that the department has no timers.
  // Loading failures and responses from servers without timer support are unknown.
  if (error || configError || (config && !Array.isArray(config.UnitStatusThresholds))) {
    return (
      <WidgetContainer title={t('unitAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="unit-alerts-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{t('unitAlerts.errorLoading')}</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading || !config) {
    return (
      <WidgetContainer title={t('unitAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="unit-alerts-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" testID="unit-alerts-loading" />
        </Box>
      </WidgetContainer>
    );
  }

  const canAcknowledge = (unit: UnitInfoResultData) => !isEditMode && canUserCreateCalls === true && (unit.CurrentUnitStateId ?? 0) > 0;

  const renderRow = ({ unit, alert, acknowledgement, acknowledgementState }: AlertEntry) => {
    const isAcknowledged = acknowledgementState === 'acknowledged';
    const isMuted = acknowledgementState === 'muted';
    const rowStyle = isAcknowledged || isMuted ? acknowledgedRowStyle(alert.level, isDark) : alertRowStyle(alert.level, isDark);
    const detail = [unit.CurrentStatus || t('common.unknown'), unit.GroupName].filter(Boolean).join(' · ');
    const seenBy = acknowledgement?.AcknowledgedByName ? t('unitAlerts.acknowledgedBy', { name: acknowledgement.AcknowledgedByName }) : t('unitAlerts.acknowledged');
    const pressable = canAcknowledge(unit);

    const content = (
      <HStack
        space="sm"
        className="items-center rounded px-2 py-1"
        style={{ backgroundColor: rowStyle.backgroundColor, borderLeftWidth: 3, borderLeftColor: rowStyle.borderLeftColor, opacity: isMuted ? 0.7 : 1 }}
        testID={`unit-alert-${alert.level}${isAcknowledged ? '-acknowledged' : ''}${isMuted ? '-muted' : ''}`}
      >
        {isMuted ? (
          <BellOffIcon size={14} color={rowStyle.borderLeftColor} />
        ) : isAcknowledged ? (
          <CheckCircleIcon size={14} color={rowStyle.borderLeftColor} />
        ) : (
          <AlertTriangleIcon size={14} color={rowStyle.borderLeftColor} />
        )}
        <VStack className="flex-1">
          <Text className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`} numberOfLines={1}>
            {unit.Name}
          </Text>
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={1}>
            {detail}
          </Text>
          {isAcknowledged || isMuted ? (
            <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={2} testID="unit-alert-acknowledgement-detail">
              {acknowledgement?.Note ? `${seenBy}: ${acknowledgement.Note}` : seenBy}
            </Text>
          ) : null}
        </VStack>
        <Text className="text-sm font-bold" style={{ color: rowStyle.borderLeftColor }}>
          {formatElapsed(alert.secondsInStatus)}
        </Text>
      </HStack>
    );

    return pressable ? (
      <Pressable
        key={unit.UnitId}
        onPress={() => setSelectedUnitId(unit.UnitId)}
        accessibilityRole="button"
        accessibilityLabel={t('unitAlerts.openAcknowledge', { name: unit.Name })}
        testID={`unit-alert-row-${unit.UnitId}`}
      >
        {content}
      </Pressable>
    ) : (
      <Box key={unit.UnitId}>{content}</Box>
    );
  };

  return (
    <WidgetContainer title={t('unitAlerts.title')} onRemove={onRemove} isEditMode={isEditMode} testID="unit-alerts-widget" width={containerWidth} height={containerHeight}>
      <ScrollView style={{ flex: 1 }}>
        <VStack space="xs">
          {active.map(renderRow)}

          {muted.length > 0 ? (
            <VStack space="xs">
              <Pressable onPress={() => setShowMuted((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: showMuted }} testID="unit-alerts-muted-toggle">
                <HStack space="xs" className="items-center px-1 py-1">
                  {showMuted ? <ChevronDownIcon size={14} color={isDark ? '#9ca3af' : '#4b5563'} /> : <ChevronRightIcon size={14} color={isDark ? '#9ca3af' : '#4b5563'} />}
                  <Text className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('unitAlerts.mutedSection', { count: muted.length })}</Text>
                </HStack>
              </Pressable>
              {showMuted ? muted.map(renderRow) : null}
            </VStack>
          ) : null}

          {active.length === 0 && muted.length === 0 ? (
            <Box className="flex-1 items-center justify-center py-8">
              {/* Two genuinely different situations: nothing is being timed, versus everything is
                  within its time. Saying "all units within thresholds" when none are configured
                  would be a false reassurance on a screen dispatchers trust. */}
              <Text className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{thresholds.length === 0 ? t('unitAlerts.noThresholds') : t('unitAlerts.withinThresholds')}</Text>
            </Box>
          ) : null}
        </VStack>
      </ScrollView>

      <UnitAlertAcknowledgeSheet
        isOpen={selected !== null}
        onClose={() => setSelectedUnitId(null)}
        unit={selected?.unit ?? null}
        alert={selected?.alert ?? null}
        acknowledgement={selected?.acknowledgement ?? null}
        acknowledgementState={selected?.acknowledgementState ?? 'none'}
      />
    </WidgetContainer>
  );
};
