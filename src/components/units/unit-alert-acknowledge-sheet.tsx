import { BellOffIcon, CheckCircleIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CustomBottomSheet } from '@/components/ui/bottom-sheet';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { VStack } from '@/components/ui/vstack';
import { formatElapsed, toAcknowledgedLevel, type UnitAlertAcknowledgementState, type UnitStatusAlert } from '@/lib/unit-status-thresholds';
import { type UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';
import { UnitStatusAlertAcknowledgementMode, type UnitStatusAlertAcknowledgementResultData } from '@/models/v4/unitStatusAlerts/unitStatusAlertAcknowledgementResultData';
import { useToastStore } from '@/stores/toast/store';
import { type UnitAlertAcknowledgementOutcome, useUnitAlertAcknowledgementsStore } from '@/stores/units/unit-alert-acknowledgements-store';

/** Mirrors UnitStatusAlertAcknowledgement.MaxNoteLength on the server. */
export const MAX_ACKNOWLEDGEMENT_NOTE_LENGTH = 500;

/** Mute choices in minutes. 0 is "until the unit changes status". */
export const MUTE_OPTIONS = [0, 15, 30, 60] as const;

interface UnitAlertAcknowledgeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitInfoResultData | null;
  alert: UnitStatusAlert | null;
  /** The acknowledgement that currently covers the unit, if any. */
  acknowledgement: UnitStatusAlertAcknowledgementResultData | null;
  acknowledgementState: UnitAlertAcknowledgementState;
}

const formatTime = (value: string | null): string => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
};

/**
 * Lets a dispatcher deal with a unit that has sat in a status past its timer: mark it as seen, mute it, and say
 * why ("MUG not departed, technical malfunction reported"). Every board in the department sees the result.
 */
export const UnitAlertAcknowledgeSheet: React.FC<UnitAlertAcknowledgeSheetProps> = ({ isOpen, onClose, unit, alert, acknowledgement, acknowledgementState }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const showToast = useToastStore((state) => state.showToast);
  const acknowledge = useUnitAlertAcknowledgementsStore((state) => state.acknowledge);
  const clear = useUnitAlertAcknowledgementsStore((state) => state.clear);
  const [note, setNote] = useState('');
  const [muteMinutes, setMuteMinutes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCovered = acknowledgementState !== 'none' && acknowledgement !== null;
  const initialNote = useRef('');
  initialNote.current = isCovered ? (acknowledgement?.Note ?? '') : '';

  // Start from the note already on the alert, so a second dispatcher adds to it instead of wiping it. Only when the
  // sheet opens for a unit: acknowledgements are refetched on every push from any board, and re-seeding then would
  // throw away what the dispatcher is typing.
  const unitId = unit?.UnitId;
  useEffect(() => {
    if (isOpen && unitId) {
      setNote(initialNote.current);
      setMuteMinutes(0);
    }
  }, [isOpen, unitId]);

  const reportOutcome = useCallback(
    (outcome: UnitAlertAcknowledgementOutcome, successMessage: string) => {
      if (outcome.ok) {
        showToast('success', successMessage);
        onClose();
        return;
      }

      switch (outcome.error) {
        case 'unit_alert_status_changed':
          showToast('info', t('unitAlerts.errorStatusChanged'));
          onClose();
          break;
        case 'unit_alert_not_overdue':
          showToast('info', t('unitAlerts.errorNotOverdue'));
          onClose();
          break;
        case 'unit_alert_conflict':
          showToast('info', t('unitAlerts.errorConflict'));
          onClose();
          break;
        default:
          showToast('error', t('unitAlerts.errorGeneric'));
      }
    },
    [onClose, showToast, t]
  );

  const submit = useCallback(
    async (mode: UnitStatusAlertAcknowledgementMode) => {
      if (!unit || !alert || alert.level === 'none') {
        return;
      }

      setIsSubmitting(true);
      try {
        const outcome = await acknowledge({
          unitId: unit.UnitId,
          unitStateId: unit.CurrentUnitStateId,
          level: toAcknowledgedLevel(alert.level),
          mode,
          muteMinutes: mode === UnitStatusAlertAcknowledgementMode.Muted ? muteMinutes : 0,
          note: note.trim(),
        });

        reportOutcome(outcome, mode === UnitStatusAlertAcknowledgementMode.Muted ? t('unitAlerts.muteSuccess') : t('unitAlerts.acknowledgeSuccess'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [acknowledge, alert, muteMinutes, note, reportOutcome, t, unit]
  );

  const handleMute = useCallback(() => submit(UnitStatusAlertAcknowledgementMode.Muted), [submit]);
  const handleAcknowledge = useCallback(() => submit(UnitStatusAlertAcknowledgementMode.Acknowledged), [submit]);

  const handleClear = useCallback(async () => {
    if (!acknowledgement) {
      return;
    }

    setIsSubmitting(true);
    try {
      reportOutcome(await clear(acknowledgement), t('unitAlerts.clearSuccess'));
    } finally {
      setIsSubmitting(false);
    }
  }, [acknowledgement, clear, reportOutcome, t]);

  if (!unit || !alert) {
    return null;
  }

  const levelColor = alert.level === 'alert' ? '#dc2626' : '#d97706';
  const seenBy = acknowledgement?.AcknowledgedByName ? t('unitAlerts.acknowledgedBy', { name: acknowledgement.AcknowledgedByName }) : t('unitAlerts.acknowledged');
  const muteDescription =
    acknowledgementState === 'muted' ? (acknowledgement?.MutedUntilUtc ? t('unitAlerts.mutedUntil', { time: formatTime(acknowledgement.MutedUntilUtc) }) : t('unitAlerts.mutedUntilStatusChange')) : null;

  return (
    <CustomBottomSheet isOpen={isOpen} onClose={onClose} isLoading={isSubmitting} testID="unit-alert-acknowledge-sheet">
      <VStack className="w-full flex-1 p-4" space="md">
        <Text className="text-center text-lg font-semibold">{t('unitAlerts.sheetTitle')}</Text>

        <VStack space="xs">
          <Text className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{unit.Name}</Text>
          <Text className="text-sm font-semibold" style={{ color: levelColor }}>
            {t('unitAlerts.inStatusFor', { status: unit.CurrentStatus || t('common.unknown'), elapsed: formatElapsed(alert.secondsInStatus) })}
          </Text>
        </VStack>

        {isCovered ? (
          <Box className={`rounded p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} testID="unit-alert-current-acknowledgement">
            <HStack space="sm" className="items-center">
              {acknowledgementState === 'muted' ? <BellOffIcon size={16} color={levelColor} /> : <CheckCircleIcon size={16} color={levelColor} />}
              <Text className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{seenBy}</Text>
            </HStack>
            {muteDescription ? <Text className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{muteDescription}</Text> : null}
            {acknowledgement?.Note ? <Text className={`mt-1 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{acknowledgement.Note}</Text> : null}
            <Button variant="outline" action="negative" size="xs" className="mt-2 self-start" onPress={handleClear} disabled={isSubmitting} testID="unit-alert-clear-button">
              <ButtonText>{t('unitAlerts.clear')}</ButtonText>
            </Button>
          </Box>
        ) : null}

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>{t('unitAlerts.note')}</FormControlLabelText>
          </FormControlLabel>
          <Textarea>
            <TextareaInput
              placeholder={t('unitAlerts.notePlaceholder')}
              value={note}
              onChangeText={setNote}
              maxLength={MAX_ACKNOWLEDGEMENT_NOTE_LENGTH}
              numberOfLines={3}
              testID="unit-alert-note-input"
              accessibilityLabel={t('unitAlerts.note')}
            />
          </Textarea>
        </FormControl>

        <VStack space="xs">
          <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('unitAlerts.muteFor')}</Text>
          <HStack space="sm" className="flex-wrap">
            {MUTE_OPTIONS.map((minutes) => (
              <Button
                key={minutes}
                size="xs"
                variant={muteMinutes === minutes ? 'solid' : 'outline'}
                onPress={() => setMuteMinutes(minutes)}
                testID={`unit-alert-mute-option-${minutes}`}
                accessibilityState={{ selected: muteMinutes === minutes }}
              >
                <ButtonText>{minutes === 0 ? t('unitAlerts.muteUntilStatusChange') : t('unitAlerts.muteMinutes', { count: minutes })}</ButtonText>
              </Button>
            ))}
          </HStack>
        </VStack>

        <HStack space="md" className="pt-4">
          <Button variant="outline" className="flex-1" onPress={onClose} disabled={isSubmitting}>
            <ButtonText>{t('common.cancel')}</ButtonText>
          </Button>
          <Button variant="outline" className="flex-1" onPress={handleMute} disabled={isSubmitting} testID="unit-alert-mute-button">
            <ButtonText>{t('unitAlerts.mute')}</ButtonText>
          </Button>
          <Button className="flex-1" onPress={handleAcknowledge} disabled={isSubmitting} testID="unit-alert-acknowledge-button">
            <ButtonText>{t('unitAlerts.acknowledge')}</ButtonText>
          </Button>
        </HStack>
      </VStack>
    </CustomBottomSheet>
  );
};
