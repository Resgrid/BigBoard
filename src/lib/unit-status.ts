/**
 * Helpers for reading a unit's status off the v4 payload.
 *
 * Departments define their own statuses ("Wheels Up", "At Patient"), so neither the status id nor
 * its text can be compared against a fixed list. The API exposes `CurrentStatusBaseType` — the
 * canonical meaning behind the department's own label — and that is what these read.
 */

/** Mirrors ActionBaseTypes in Resgrid.Model. Keep the values in step with the server enum. */
export enum UnitStatusBaseType {
  None = -1,
  Available = 0,
  NotResponding = 1,
  Responding = 2,
  OnScene = 3,
  MadeContact = 4,
  Investigating = 5,
  Dispatched = 6,
  Cleared = 7,
  Returning = 8,
  Staging = 9,
  Unavailable = 10,
  Enroute = 11,
  Transporting = 12,
  Delivering = 13,
  AtPatient = 14,
  AtHospital = 15,
  Searching = 16,
  Loading = 17,
  Standby = 18,
  OnPatrol = 19,
  Maintenance = 20,
  OnBreak = 21,
  Completed = 22,
}

/**
 * In service and assignable. Mirrors the server's AvailabilityMatrix so the board agrees with
 * reporting and with the dispatch recommendation engine.
 */
export const AVAILABLE_BASE_TYPES: number[] = [UnitStatusBaseType.Available, UnitStatusBaseType.Cleared, UnitStatusBaseType.OnPatrol, UnitStatusBaseType.Completed];

/** Dispatched and moving, but not yet at the incident. */
export const RESPONDING_BASE_TYPES: number[] = [UnitStatusBaseType.Dispatched, UnitStatusBaseType.Responding, UnitStatusBaseType.Enroute, UnitStatusBaseType.Staging];

/** Working the incident or the transport that follows it. */
export const ON_SCENE_BASE_TYPES: number[] = [
  UnitStatusBaseType.OnScene,
  UnitStatusBaseType.MadeContact,
  UnitStatusBaseType.Investigating,
  UnitStatusBaseType.Searching,
  UnitStatusBaseType.AtPatient,
  UnitStatusBaseType.Loading,
  UnitStatusBaseType.Transporting,
  UnitStatusBaseType.Delivering,
  UnitStatusBaseType.AtHospital,
];

/** Out of service. */
export const UNAVAILABLE_BASE_TYPES: number[] = [UnitStatusBaseType.NotResponding, UnitStatusBaseType.Unavailable, UnitStatusBaseType.Maintenance, UnitStatusBaseType.OnBreak];

export const isBaseTypeIn = (baseType: number | null | undefined, group: number[]): boolean => typeof baseType === 'number' && group.includes(baseType);

/**
 * Normalises a status colour for use as a CSS colour.
 *
 * `CurrentStatusColor` arrives as a hex value with its leading '#'. The widgets used to prefix a
 * second one, producing "##5CB85C" — an invalid colour, which browsers ignore, which is why every
 * unit status rendered in the default near-black instead of its configured colour. Older rows can
 * still hold a bootstrap class name, so those are mapped rather than passed through as garbage.
 */
export const normalizeStatusColor = (color: string | null | undefined, fallback = '#888888'): string => {
  const raw = (color ?? '').trim();

  if (!raw) {
    return fallback;
  }

  if (raw.startsWith('#')) {
    return raw;
  }

  const legacyLabelColors: Record<string, string> = {
    'label-default': '#777777',
    'label-warning': '#F0AD4E',
    'label-danger': '#FF0000',
    'label-info': '#5BC0DE',
    'label-success': '#5CB85C',
    'label-inverse': '#000000',
  };

  if (legacyLabelColors[raw]) {
    return legacyLabelColors[raw];
  }

  // A bare hex value with no '#', e.g. "5CB85C".
  if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw}`;
  }

  return fallback;
};

/**
 * Parses an API timestamp that represents a UTC instant.
 *
 * The API used to serialise these without a trailing "Z", and `new Date(...)` then read them as
 * local time — which is why units in a UTC+2 department showed as two hours stale. Assume UTC when
 * no zone is present so old and new servers both read correctly.
 */
export const parseUtcTimestamp = (value: string | null | undefined): Date | null => {
  const raw = (value ?? '').trim();

  if (!raw) {
    return null;
  }

  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const parsed = new Date(hasZone ? raw : `${raw}Z`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Seconds since the unit entered its current status, or null when the timestamp is unusable. */
export const secondsInStatus = (timestampUtc: string | null | undefined, now: number = Date.now()): number | null => {
  const parsed = parseUtcTimestamp(timestampUtc);

  if (!parsed) {
    return null;
  }

  return Math.max(0, Math.floor((now - parsed.getTime()) / 1000));
};
