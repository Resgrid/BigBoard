import { useMemo } from 'react';

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
