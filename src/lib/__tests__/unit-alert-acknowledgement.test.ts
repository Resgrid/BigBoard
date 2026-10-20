import { UnitStatusBaseType } from '@/lib/unit-status';
import {
  acknowledgedSortWeight,
  annotateUnitAlert,
  countUnitsWithoutMeaning,
  requiresAcknowledgementNote,
  resolveAcknowledgement,
  toAcknowledgedLevel,
  UnitStatusAlertNoteRequirement,
  type UnitStatusThreshold,
} from '@/lib/unit-status-thresholds';
import {
  UnitStatusAlertAcknowledgedLevel,
  UnitStatusAlertAcknowledgementMode,
  UnitStatusAlertAcknowledgementResultData,
} from '@/models/v4/unitStatusAlerts/unitStatusAlertAcknowledgementResultData';

// These cases mirror UnitStatusAlertEvaluatorTests on the server. The two must agree.
const NOW = Date.parse('2026-10-02T12:00:00Z');
const UNIT = { UnitId: '12', CurrentUnitStateId: 77 };

const ack = (overrides: Partial<UnitStatusAlertAcknowledgementResultData> = {}): UnitStatusAlertAcknowledgementResultData =>
  Object.assign(new UnitStatusAlertAcknowledgementResultData(), {
    UnitStatusAlertAcknowledgementId: 'a1',
    UnitId: '12',
    UnitStateId: 77,
    Level: UnitStatusAlertAcknowledgedLevel.Warn,
    Mode: UnitStatusAlertAcknowledgementMode.Acknowledged,
    ...overrides,
  });

// Mirrors UnitStatusThresholdsTests.A_reason_is_required_only_at_the_levels_the_department_chose on the server.
describe('requiresAcknowledgementNote', () => {
  it.each([
    [UnitStatusAlertNoteRequirement.Optional, 'warn', false],
    [UnitStatusAlertNoteRequirement.Optional, 'alert', false],
    [UnitStatusAlertNoteRequirement.AtAlert, 'warn', false],
    [UnitStatusAlertNoteRequirement.AtAlert, 'alert', true],
    [UnitStatusAlertNoteRequirement.Always, 'warn', true],
    [UnitStatusAlertNoteRequirement.Always, 'alert', true],
    [UnitStatusAlertNoteRequirement.Always, 'none', false],
  ] as const)('requirement %s at %s -> %s', (requirement, level, expected) => {
    expect(requiresAcknowledgementNote(requirement, level)).toBe(expected);
  });

  it('treats a missing or unknown requirement as optional (older servers send none)', () => {
    expect(requiresAcknowledgementNote(undefined, 'alert')).toBe(false);
    expect(requiresAcknowledgementNote(null, 'alert')).toBe(false);
    expect(requiresAcknowledgementNote(9, 'alert')).toBe(false);
  });
});

describe('countUnitsWithoutMeaning', () => {
  const timers: UnitStatusThreshold[] = [{ BaseType: UnitStatusBaseType.Dispatched, WarnSeconds: 60, AlertSeconds: 120 }];

  it('counts units whose status has no meaning, or none sent', () => {
    const units = [{ CurrentStatusBaseType: UnitStatusBaseType.None }, { CurrentStatusBaseType: null }, { CurrentStatusBaseType: UnitStatusBaseType.Available }];

    expect(countUnitsWithoutMeaning(units, timers)).toBe(2);
  });

  it('is zero while no timers are set', () => {
    expect(countUnitsWithoutMeaning([{ CurrentStatusBaseType: UnitStatusBaseType.None }], [])).toBe(0);
  });
});

describe('resolveAcknowledgement', () => {
  it('covers the episode it was made for', () => {
    expect(resolveAcknowledgement(ack(), UNIT, 'warn', NOW)).toBe('acknowledged');
  });

  it('ends when the unit reports a new status', () => {
    expect(resolveAcknowledgement(ack(), { CurrentUnitStateId: 78 }, 'warn', NOW)).toBe('none');
  });

  it('brings the alert back when the unit escalates past the acknowledged level', () => {
    expect(resolveAcknowledgement(ack(), UNIT, 'alert', NOW)).toBe('none');
  });

  it('covers an alert acknowledged at the alert level', () => {
    expect(resolveAcknowledgement(ack({ Level: UnitStatusAlertAcknowledgedLevel.Alert }), UNIT, 'alert', NOW)).toBe('acknowledged');
  });

  it('keeps a mute with no end for the whole episode', () => {
    expect(resolveAcknowledgement(ack({ Mode: UnitStatusAlertAcknowledgementMode.Muted, MutedUntilUtc: null }), UNIT, 'warn', NOW)).toBe('muted');
  });

  it('keeps a running mute muted', () => {
    expect(resolveAcknowledgement(ack({ Mode: UnitStatusAlertAcknowledgementMode.Muted, MutedUntilUtc: '2026-10-02T12:01:00.000Z' }), UNIT, 'warn', NOW)).toBe('muted');
  });

  it('falls back to acknowledged when a mute runs out', () => {
    expect(resolveAcknowledgement(ack({ Mode: UnitStatusAlertAcknowledgementMode.Muted, MutedUntilUtc: '2026-10-02T12:00:00.000Z' }), UNIT, 'warn', NOW)).toBe('acknowledged');
  });

  it('does not hide an alert behind a mute end time it cannot read', () => {
    expect(resolveAcknowledgement(ack({ Mode: UnitStatusAlertAcknowledgementMode.Muted, MutedUntilUtc: 'not a date' }), UNIT, 'warn', NOW)).toBe('acknowledged');
  });

  it('does not let a mute survive escalation', () => {
    expect(resolveAcknowledgement(ack({ Mode: UnitStatusAlertAcknowledgementMode.Muted }), UNIT, 'alert', NOW)).toBe('none');
  });

  it('ignores a cleared acknowledgement', () => {
    expect(resolveAcknowledgement(ack({ ClearedOnUtc: '2026-10-02T11:59:00.000Z' }), UNIT, 'warn', NOW)).toBe('none');
  });

  it('matches nothing for a unit without a status record (or a server too old to send one)', () => {
    expect(resolveAcknowledgement(ack({ UnitStateId: 0 }), { CurrentUnitStateId: 0 }, 'warn', NOW)).toBe('none');
    expect(resolveAcknowledgement(ack(), {}, 'warn', NOW)).toBe('none');
  });

  it('has nothing to cover when the unit is within its timer', () => {
    expect(resolveAcknowledgement(ack(), UNIT, 'none', NOW)).toBe('none');
  });
});

describe('acknowledgedSortWeight', () => {
  it('puts unacknowledged alerts, then warnings, then acknowledged rows, then everything else', () => {
    const order = [
      acknowledgedSortWeight('alert', 'none'),
      acknowledgedSortWeight('warn', 'none'),
      acknowledgedSortWeight('alert', 'acknowledged'),
      acknowledgedSortWeight('warn', 'acknowledged'),
      acknowledgedSortWeight('alert', 'muted'),
    ];

    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(acknowledgedSortWeight('alert', 'muted')).toBe(acknowledgedSortWeight('none', 'none'));
  });
});

describe('annotateUnitAlert', () => {
  const rule: UnitStatusThreshold[] = [{ BaseType: UnitStatusBaseType.Dispatched, WarnSeconds: 240, AlertSeconds: 600 }];

  it('pairs the alert with what the acknowledgement on file means for it', () => {
    const unit = { ...UNIT, CurrentStatusBaseType: UnitStatusBaseType.Dispatched, CurrentStatusTimestampUtc: '2026-10-02T11:55:00Z' };

    const result = annotateUnitAlert(unit, rule, { '12': ack() }, NOW);

    expect(result.alert.level).toBe('warn');
    expect(result.acknowledgement?.UnitStatusAlertAcknowledgementId).toBe('a1');
    expect(result.acknowledgementState).toBe('acknowledged');
  });

  it('keeps the acknowledgement on file even when it no longer covers the alert', () => {
    const unit = { ...UNIT, CurrentStatusBaseType: UnitStatusBaseType.Dispatched, CurrentStatusTimestampUtc: '2026-10-02T11:45:00Z' };

    const result = annotateUnitAlert(unit, rule, { '12': ack() }, NOW);

    expect(result.alert.level).toBe('alert');
    expect(result.acknowledgement).not.toBeNull();
    expect(result.acknowledgementState).toBe('none');
  });
});

describe('toAcknowledgedLevel', () => {
  it('maps the board level to the server level', () => {
    expect(toAcknowledgedLevel('warn')).toBe(UnitStatusAlertAcknowledgedLevel.Warn);
    expect(toAcknowledgedLevel('alert')).toBe(UnitStatusAlertAcknowledgedLevel.Alert);
  });
});
