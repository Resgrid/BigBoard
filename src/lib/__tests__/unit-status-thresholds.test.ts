import { alertSortWeight, evaluateUnitStatusAlert, formatElapsed, NO_ALERT, type UnitStatusThreshold } from '@/lib/unit-status-thresholds';
import { UnitStatusBaseType } from '@/lib/unit-status';

// 2026-08-12T13:10:00Z — every case measures against this instant.
const NOW = Date.parse('2026-08-12T13:10:00Z');

const dispatchedAt = (isoUtc: string) => ({
  CurrentStatusBaseType: UnitStatusBaseType.Dispatched,
  CurrentStatusTimestampUtc: isoUtc,
});

// The customer case: warn at 4 minutes dispatched, escalate at 8.
const FOUR_MINUTE_RULE: UnitStatusThreshold[] = [{ BaseType: UnitStatusBaseType.Dispatched, WarnSeconds: 240, AlertSeconds: 480 }];

describe('evaluateUnitStatusAlert', () => {
  it('flags nothing when the department has configured no thresholds', () => {
    // Pre-feature behaviour: a department that never opens the settings screen sees no change.
    expect(evaluateUnitStatusAlert(dispatchedAt('2026-08-12T12:00:00Z'), [], NOW)).toEqual(NO_ALERT);
  });

  it('flags nothing before the warning time', () => {
    const result = evaluateUnitStatusAlert(dispatchedAt('2026-08-12T13:07:00Z'), FOUR_MINUTE_RULE, NOW);

    expect(result.level).toBe('none');
    expect(result.secondsInStatus).toBe(180);
  });

  it('warns exactly on the boundary', () => {
    const result = evaluateUnitStatusAlert(dispatchedAt('2026-08-12T13:06:00Z'), FOUR_MINUTE_RULE, NOW);

    expect(result.level).toBe('warn');
    expect(result.secondsInStatus).toBe(240);
    expect(result.thresholdSeconds).toBe(240);
  });

  it('escalates to alert past the alert time', () => {
    const result = evaluateUnitStatusAlert(dispatchedAt('2026-08-12T13:00:00Z'), FOUR_MINUTE_RULE, NOW);

    expect(result.level).toBe('alert');
    expect(result.secondsInStatus).toBe(600);
    expect(result.thresholdSeconds).toBe(480);
  });

  it('ignores statuses with no threshold configured', () => {
    const onScene = { CurrentStatusBaseType: UnitStatusBaseType.OnScene, CurrentStatusTimestampUtc: '2026-08-12T10:00:00Z' };

    expect(evaluateUnitStatusAlert(onScene, FOUR_MINUTE_RULE, NOW).level).toBe('none');
  });

  it('treats a zone-less timestamp as UTC', () => {
    // The API used to omit the trailing Z; reading it as local time would put a unit hours over or
    // under its threshold depending on where the board happens to be.
    const result = evaluateUnitStatusAlert(dispatchedAt('2026-08-12T13:00:00'), FOUR_MINUTE_RULE, NOW);

    expect(result.level).toBe('alert');
    expect(result.secondsInStatus).toBe(600);
  });

  it('never invents an alert when the timestamp is unusable', () => {
    // Claiming a unit is overdue when we do not know how long it has been there would be inventing
    // information on a screen dispatchers act on.
    expect(evaluateUnitStatusAlert({ CurrentStatusBaseType: UnitStatusBaseType.Dispatched, CurrentStatusTimestampUtc: null }, FOUR_MINUTE_RULE, NOW)).toEqual(NO_ALERT);
    expect(evaluateUnitStatusAlert({ CurrentStatusBaseType: UnitStatusBaseType.Dispatched, CurrentStatusTimestampUtc: 'not a date' }, FOUR_MINUTE_RULE, NOW)).toEqual(NO_ALERT);
  });

  it('ignores a unit with no base type', () => {
    expect(evaluateUnitStatusAlert({ CurrentStatusBaseType: null, CurrentStatusTimestampUtc: '2026-08-12T10:00:00Z' }, FOUR_MINUTE_RULE, NOW)).toEqual(NO_ALERT);
  });

  it('honours a warn-only rule', () => {
    const warnOnly: UnitStatusThreshold[] = [{ BaseType: UnitStatusBaseType.Dispatched, WarnSeconds: 240, AlertSeconds: 0 }];

    expect(evaluateUnitStatusAlert(dispatchedAt('2026-08-12T12:00:00Z'), warnOnly, NOW).level).toBe('warn');
  });

  it('honours an alert-only rule', () => {
    const alertOnly: UnitStatusThreshold[] = [{ BaseType: UnitStatusBaseType.Dispatched, WarnSeconds: 0, AlertSeconds: 480 }];

    expect(evaluateUnitStatusAlert(dispatchedAt('2026-08-12T13:06:00Z'), alertOnly, NOW).level).toBe('none');
    expect(evaluateUnitStatusAlert(dispatchedAt('2026-08-12T13:00:00Z'), alertOnly, NOW).level).toBe('alert');
  });
});

describe('alertSortWeight', () => {
  it('sorts alerts above warnings above everything else', () => {
    const levels = ['none', 'alert', 'warn'] as const;
    const sorted = [...levels].sort((a, b) => alertSortWeight(a) - alertSortWeight(b));

    expect(sorted).toEqual(['alert', 'warn', 'none']);
  });
});

describe('formatElapsed', () => {
  it('reads in the units a dispatcher would say out loud', () => {
    expect(formatElapsed(45)).toBe('45s');
    expect(formatElapsed(240)).toBe('4m');
    expect(formatElapsed(3600)).toBe('1h 0m');
    expect(formatElapsed(4320)).toBe('1h 12m');
  });

  it('renders nothing for an unknown duration', () => {
    expect(formatElapsed(null)).toBe('');
    expect(formatElapsed(-1)).toBe('');
  });
});
