import { AVAILABLE_BASE_TYPES, isBaseTypeIn, normalizeStatusColor, ON_SCENE_BASE_TYPES, parseUtcTimestamp, RESPONDING_BASE_TYPES, secondsInStatus, UnitStatusBaseType } from '../unit-status';

describe('normalizeStatusColor', () => {
  it('passes a hex colour through untouched', () => {
    // The regression: widgets prefixed a second '#', producing "##5CB85C" — invalid CSS, so every
    // status rendered in the inherited near-black instead of its configured colour.
    expect(normalizeStatusColor('#5CB85C')).toBe('#5CB85C');
  });

  it('adds the hash to a bare hex value', () => {
    expect(normalizeStatusColor('5CB85C')).toBe('#5CB85C');
    expect(normalizeStatusColor('abc')).toBe('#abc');
  });

  it('maps legacy bootstrap label classes to a real colour', () => {
    expect(normalizeStatusColor('label-success')).toBe('#5CB85C');
    expect(normalizeStatusColor('label-danger')).toBe('#FF0000');
  });

  it('falls back for empty or unrecognised values', () => {
    expect(normalizeStatusColor('')).toBe('#888888');
    expect(normalizeStatusColor(null)).toBe('#888888');
    expect(normalizeStatusColor('chartreuse-ish')).toBe('#888888');
    expect(normalizeStatusColor(undefined, '#111111')).toBe('#111111');
  });
});

describe('parseUtcTimestamp', () => {
  it('treats a timestamp with no zone marker as UTC', () => {
    // The API used to emit these without a trailing "Z"; `new Date(...)` read them as local time,
    // which is why a status set moments ago showed as two hours old in a UTC+2 department.
    expect(parseUtcTimestamp('2026-08-12T13:05:22')?.toISOString()).toBe('2026-08-12T13:05:22.000Z');
  });

  it('respects an explicit zone', () => {
    expect(parseUtcTimestamp('2026-08-12T13:05:22Z')?.toISOString()).toBe('2026-08-12T13:05:22.000Z');
    expect(parseUtcTimestamp('2026-08-12T15:05:22+02:00')?.toISOString()).toBe('2026-08-12T13:05:22.000Z');
  });

  it('returns null for missing or unparseable values', () => {
    expect(parseUtcTimestamp('')).toBeNull();
    expect(parseUtcTimestamp(null)).toBeNull();
    expect(parseUtcTimestamp('not a date')).toBeNull();
  });
});

describe('secondsInStatus', () => {
  it('measures against UTC regardless of the host timezone', () => {
    const now = Date.parse('2026-08-12T13:06:22Z');
    expect(secondsInStatus('2026-08-12T13:05:22', now)).toBe(60);
  });

  it('never returns a negative age', () => {
    const now = Date.parse('2026-08-12T13:00:00Z');
    expect(secondsInStatus('2026-08-12T13:05:22', now)).toBe(0);
  });

  it('returns null when there is no usable timestamp', () => {
    expect(secondsInStatus(null)).toBeNull();
  });
});

describe('base type grouping', () => {
  it('classifies the EMS/Ambulance template statuses', () => {
    expect(isBaseTypeIn(UnitStatusBaseType.Available, AVAILABLE_BASE_TYPES)).toBe(true);
    expect(isBaseTypeIn(UnitStatusBaseType.Dispatched, RESPONDING_BASE_TYPES)).toBe(true);
    expect(isBaseTypeIn(UnitStatusBaseType.Responding, RESPONDING_BASE_TYPES)).toBe(true);
    expect(isBaseTypeIn(UnitStatusBaseType.OnScene, ON_SCENE_BASE_TYPES)).toBe(true);
    expect(isBaseTypeIn(UnitStatusBaseType.AtPatient, ON_SCENE_BASE_TYPES)).toBe(true);
    expect(isBaseTypeIn(UnitStatusBaseType.Transporting, ON_SCENE_BASE_TYPES)).toBe(true);
    expect(isBaseTypeIn(UnitStatusBaseType.AtHospital, ON_SCENE_BASE_TYPES)).toBe(true);
  });

  it('keeps the groups disjoint', () => {
    expect(isBaseTypeIn(UnitStatusBaseType.Responding, AVAILABLE_BASE_TYPES)).toBe(false);
    expect(isBaseTypeIn(UnitStatusBaseType.OnScene, RESPONDING_BASE_TYPES)).toBe(false);
    expect(isBaseTypeIn(UnitStatusBaseType.Available, ON_SCENE_BASE_TYPES)).toBe(false);
  });

  it('treats a missing base type as belonging to nothing', () => {
    // A unit with no status row must not be silently counted as available.
    expect(isBaseTypeIn(null, AVAILABLE_BASE_TYPES)).toBe(false);
    expect(isBaseTypeIn(undefined, RESPONDING_BASE_TYPES)).toBe(false);
  });
});
