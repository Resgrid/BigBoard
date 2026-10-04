import { useMemo } from 'react';

import { UnitStatusAlertAcknowledgedLevel, UnitStatusAlertAcknowledgementMode, type UnitStatusAlertAcknowledgementResultData } from '@/models/v4/unitStatusAlerts/unitStatusAlertAcknowledgementResultData';
import { useCoreStore } from '@/stores/app/core-store';

import { secondsInStatus } from './unit-status';

/**
 * Time-in-status alerting.
 *
 * A department can say "flag a unit that has been dispatched for more than four minutes without
 * reporting that it has departed". Thresholds are keyed by the status's canonical base type rather
 * than the department's own status ids, because that sentence is about what the status *means*, not
 * what it is called.
 *
 * With no thresholds configured nothing is ever flagged, which is how the board behaved before this
 * existed.
 */

export type UnitStatusAlertLevel = 'none' | 'warn' | 'alert';

export interface UnitStatusThreshold {
  BaseType: number;
  /** Seconds after which the unit is highlighted. 0 disables the warning. */
  WarnSeconds: number;
  /** Seconds after which the unit is escalated. 0 disables it. */
  AlertSeconds: number;
}

interface EvaluableUnit {
  CurrentStatusBaseType?: number | null;
  CurrentStatusTimestampUtc?: string | null;
}

export interface UnitStatusAlert {
  level: UnitStatusAlertLevel;
  /** Seconds the unit has been in its current status, or null when the timestamp was unusable. */
  secondsInStatus: number | null;
  /** The threshold that fired, for showing "4 min over" style detail. Null when nothing fired. */
  thresholdSeconds: number | null;
}

export const NO_ALERT: UnitStatusAlert = { level: 'none', secondsInStatus: null, thresholdSeconds: null };

/**
 * Evaluates one unit against the department's thresholds.
 *
 * `now` is injected so callers can evaluate a whole list against a single instant — otherwise two
 * units a millisecond apart could disagree about which side of a boundary they are on.
 */
export const evaluateUnitStatusAlert = (unit: EvaluableUnit, thresholds: UnitStatusThreshold[], now: number = Date.now()): UnitStatusAlert => {
  if (!thresholds || thresholds.length === 0) {
    return NO_ALERT;
  }

  const baseType = unit?.CurrentStatusBaseType;

  if (typeof baseType !== 'number') {
    return NO_ALERT;
  }

  const threshold = thresholds.find((x) => x.BaseType === baseType);

  if (!threshold) {
    return NO_ALERT;
  }

  const elapsed = secondsInStatus(unit?.CurrentStatusTimestampUtc, now);

  // No usable timestamp means we genuinely do not know how long it has been sitting there. Claiming
  // an alert would be inventing information on a screen dispatchers act on.
  if (elapsed === null) {
    return NO_ALERT;
  }

  if (threshold.AlertSeconds > 0 && elapsed >= threshold.AlertSeconds) {
    return { level: 'alert', secondsInStatus: elapsed, thresholdSeconds: threshold.AlertSeconds };
  }

  if (threshold.WarnSeconds > 0 && elapsed >= threshold.WarnSeconds) {
    return { level: 'warn', secondsInStatus: elapsed, thresholdSeconds: threshold.WarnSeconds };
  }

  return { level: 'none', secondsInStatus: elapsed, thresholdSeconds: null };
};

/**
 * What a dispatcher's acknowledgement means for a unit right now.
 *
 * - `none`: nobody has acknowledged this alert, so it shows at full strength.
 * - `acknowledged`: someone has seen it. It stays highlighted, marked with who saw it and their note.
 * - `muted`: moved out of the way until the mute runs out or the unit changes status.
 */
export type UnitAlertAcknowledgementState = 'none' | 'acknowledged' | 'muted';

const LEVEL_RANK: Record<UnitStatusAlertLevel, number> = { none: 0, warn: 1, alert: 2 };

/** The server's level number for an alert the board is showing. */
export const toAcknowledgedLevel = (level: UnitStatusAlertLevel): UnitStatusAlertAcknowledgedLevel => (level === 'alert' ? UnitStatusAlertAcknowledgedLevel.Alert : UnitStatusAlertAcknowledgedLevel.Warn);

interface AcknowledgeableUnit {
  CurrentUnitStateId?: number | null;
}

/**
 * Whether an acknowledgement still covers a unit. These rules are the same as the server's
 * `UnitStatusAlertEvaluator.Resolve`; keep the two in step.
 *
 * It does not cover the unit when the unit has reported a new status (a different CurrentUnitStateId), or when
 * the unit has gone past the level that was acknowledged: a warning someone saw must not hide the alert that
 * follows it. A mute that has run out falls back to acknowledged. Someone did see it, and the row coming back
 * into view is the reminder.
 */
export const resolveAcknowledgement = (
  acknowledgement: UnitStatusAlertAcknowledgementResultData | null | undefined,
  unit: AcknowledgeableUnit | null | undefined,
  level: UnitStatusAlertLevel,
  now: number = Date.now()
): UnitAlertAcknowledgementState => {
  if (!acknowledgement || acknowledgement.ClearedOnUtc || level === 'none') {
    return 'none';
  }

  const currentUnitStateId = unit?.CurrentUnitStateId;

  if (typeof currentUnitStateId !== 'number' || currentUnitStateId <= 0 || acknowledgement.UnitStateId !== currentUnitStateId) {
    return 'none';
  }

  if (LEVEL_RANK[level] > acknowledgement.Level) {
    return 'none';
  }

  if (acknowledgement.Mode === UnitStatusAlertAcknowledgementMode.Muted) {
    if (!acknowledgement.MutedUntilUtc) {
      return 'muted';
    }

    const mutedUntil = Date.parse(acknowledgement.MutedUntilUtc);

    // An end time we cannot read is treated as already passed. Hiding an alert on a guess is the worse mistake.
    if (Number.isFinite(mutedUntil) && mutedUntil > now) {
      return 'muted';
    }
  }

  return 'acknowledged';
};

/**
 * Sort weight once acknowledgements are taken into account: unacknowledged alerts, then unacknowledged
 * warnings, then acknowledged rows, then everything else (including muted rows).
 */
export const acknowledgedSortWeight = (level: UnitStatusAlertLevel, acknowledgement: UnitAlertAcknowledgementState): number => {
  if (level === 'none' || acknowledgement === 'muted') {
    return 4;
  }

  if (acknowledgement === 'acknowledged') {
    return level === 'alert' ? 2 : 3;
  }

  return alertSortWeight(level);
};

export interface AnnotatedUnitAlert {
  alert: UnitStatusAlert;
  /** The acknowledgement on file for the unit, whether or not it still covers the alert. */
  acknowledgement: UnitStatusAlertAcknowledgementResultData | null;
  acknowledgementState: UnitAlertAcknowledgementState;
}

/** Evaluates a unit's alert and what any acknowledgement on file means for it, against one instant. */
export const annotateUnitAlert = (
  unit: EvaluableUnit & AcknowledgeableUnit & { UnitId: string },
  thresholds: UnitStatusThreshold[],
  acknowledgements: Record<string, UnitStatusAlertAcknowledgementResultData>,
  now: number
): AnnotatedUnitAlert => {
  const alert = evaluateUnitStatusAlert(unit, thresholds, now);
  const acknowledgement = acknowledgements[unit.UnitId] ?? null;

  return { alert, acknowledgement, acknowledgementState: resolveAcknowledgement(acknowledgement, unit, alert.level, now) };
};

/** Row colours for an acknowledged alert: the level's edge colour stays, the loud fill goes. */
export const acknowledgedRowStyle = (level: UnitStatusAlertLevel, isDark: boolean): { backgroundColor: string | undefined; borderLeftColor: string | undefined } => {
  const { borderLeftColor } = alertRowStyle(level, isDark);

  if (!borderLeftColor) {
    return { backgroundColor: undefined, borderLeftColor: undefined };
  }

  return { backgroundColor: isDark ? '#1f2937' : '#f3f4f6', borderLeftColor };
};

/** Sort weight: alerts first, then warnings, then everything else. */
export const alertSortWeight = (level: UnitStatusAlertLevel): number => {
  switch (level) {
    case 'alert':
      return 0;
    case 'warn':
      return 1;
    default:
      return 2;
  }
};

/** Row colours for each level, per theme. Null background means "leave the row alone". */
export const alertRowStyle = (level: UnitStatusAlertLevel, isDark: boolean): { backgroundColor: string | undefined; borderLeftColor: string | undefined } => {
  if (level === 'alert') {
    return { backgroundColor: isDark ? '#4c1d1d' : '#fee2e2', borderLeftColor: '#dc2626' };
  }

  if (level === 'warn') {
    return { backgroundColor: isDark ? '#463016' : '#fef3c7', borderLeftColor: '#d97706' };
  }

  return { backgroundColor: undefined, borderLeftColor: undefined };
};

/** Compact "4m" / "1h 12m" for the overdue duration. */
export const formatElapsed = (seconds: number | null): string => {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return '';
  }

  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

/** The department's thresholds from config. Empty until config loads, so nothing flags early. */
export const useUnitStatusThresholds = (): UnitStatusThreshold[] => {
  const config = useCoreStore((state) => state.config);

  return useMemo(() => config?.UnitStatusThresholds ?? [], [config?.UnitStatusThresholds]);
};
