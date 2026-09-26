import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

/**
 * Realtime unit / personnel positions pushed by the Eventing service's geolocation hub.
 *
 * The REST map endpoint (`/Mapping/GetMapDataAndMarkers`) is the source of truth for WHICH pins a
 * viewer may see: it applies the department's visibility matrix and location TTLs. The geolocation
 * hub broadcasts every position in the department to the whole department group and applies neither,
 * so a push may only ever MOVE a pin the REST data already contains -- never create one.
 */

/** REST pin types that a realtime push is allowed to move. */
export const LIVE_LOCATION_UNIT_PIN_TYPE = 1;
export const LIVE_LOCATION_PERSONNEL_PIN_TYPE = 3;

export interface LiveLocation {
  /** Lower-cased REST pin id: `u{UnitId}` for units, `p{UserId}` for personnel. */
  pinId: string;
  latitude: number;
  longitude: number;
  /** UTC time of the GPS fix in epoch ms, or null when the server did not say (older servers). */
  timestamp: number | null;
  /** Local epoch ms at which this client received the push. */
  receivedAt: number;
}

export type LiveLocationMap = Record<string, LiveLocation>;

type PayloadRecord = Record<string, unknown>;

const toRecord = (payload: unknown): PayloadRecord | null => {
  let value = payload;

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as PayloadRecord;
};

/** Reads `name` in camelCase, PascalCase, or (as a last resort) any other casing. */
const readField = (record: PayloadRecord, camelName: string): unknown => {
  if (camelName in record) {
    return record[camelName];
  }

  const pascalName = camelName.charAt(0).toUpperCase() + camelName.slice(1);
  if (pascalName in record) {
    return record[pascalName];
  }

  const lowerName = camelName.toLowerCase();
  const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === lowerName);
  return key === undefined ? undefined : record[key];
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toIdentifier = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  return null;
};

/** ISO-8601 (or epoch ms) to epoch ms. Missing, null or unparseable means "unknown" (null). */
export const parseLocationTimestamp = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isValidLiveCoordinate = (latitude: number, longitude: number): boolean => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }

  // 0,0 is what a tracker reports when it has no fix, not a real position in the Gulf of Guinea.
  return !(latitude === 0 && longitude === 0);
};

const parseLocationUpdate = (payload: unknown, idField: 'unitId' | 'userId', pinPrefix: 'u' | 'p', receivedAt: number): LiveLocation | null => {
  const record = toRecord(payload);
  if (!record) {
    return null;
  }

  const id = toIdentifier(readField(record, idField));
  const latitude = toFiniteNumber(readField(record, 'latitude'));
  const longitude = toFiniteNumber(readField(record, 'longitude'));

  if (id === null || latitude === null || longitude === null || !isValidLiveCoordinate(latitude, longitude)) {
    return null;
  }

  return {
    pinId: `${pinPrefix}${id}`.toLowerCase(),
    latitude,
    longitude,
    timestamp: parseLocationTimestamp(readField(record, 'timestamp')),
    receivedAt,
  };
};

/** Parses an `onUnitLocationUpdated` push. Returns null for anything that cannot be placed on a map. */
export const parseUnitLocationUpdate = (payload: unknown, receivedAt: number = Date.now()): LiveLocation | null => parseLocationUpdate(payload, 'unitId', 'u', receivedAt);

/** Parses an `onPersonnelLocationUpdated` push. Returns null for anything that cannot be placed on a map. */
export const parsePersonnelLocationUpdate = (payload: unknown, receivedAt: number = Date.now()): LiveLocation | null => parseLocationUpdate(payload, 'userId', 'p', receivedAt);

/**
 * Folds one parsed push into the per-entity map, immutably.
 *
 * Trackers replay buffered fixes and queue consumers can reorder, so a fix OLDER than the one already
 * held for the same entity is dropped. A fix with an unknown timestamp always applies. Returns the
 * same map reference when nothing changed so subscribers do not re-render.
 */
export const mergeLiveLocation = (current: LiveLocationMap, update: LiveLocation): LiveLocationMap => {
  const existing = current[update.pinId];

  if (existing) {
    if (existing.timestamp !== null && update.timestamp !== null && update.timestamp < existing.timestamp) {
      return current;
    }

    if (existing.latitude === update.latitude && existing.longitude === update.longitude && existing.timestamp === update.timestamp) {
      return current;
    }
  }

  return { ...current, [update.pinId]: update };
};

export interface ApplyLiveLocationsOptions {
  /**
   * Only apply live locations received at or after this local time (epoch ms). Used when a REST
   * snapshot replaces the pins: pushes that arrived while the request was in flight may be newer
   * than the snapshot, anything received before it started is not.
   */
  receivedSince?: number;
}

export interface ApplyLiveLocationsResult {
  /** The input array itself when no pin moved; otherwise a new array with new objects for moved pins only. */
  pins: MapMakerInfoData[];
  /** Live locations that matched no unit/personnel pin in `pins`. */
  unknownPinIds: string[];
}

const isMovablePin = (pin: MapMakerInfoData): boolean => pin.Type === LIVE_LOCATION_UNIT_PIN_TYPE || pin.Type === LIVE_LOCATION_PERSONNEL_PIN_TYPE;

/**
 * Moves unit (Type 1) and personnel (Type 3) pins to their latest live location. Never adds, removes
 * or mutates a pin, and never touches any other pin type.
 */
export const applyLiveLocations = (pins: MapMakerInfoData[], liveLocations: LiveLocationMap, options: ApplyLiveLocationsOptions = {}): ApplyLiveLocationsResult => {
  const { receivedSince } = options;
  const candidates = new Map<string, LiveLocation>();

  for (const [key, location] of Object.entries(liveLocations)) {
    if (!location || (receivedSince !== undefined && location.receivedAt < receivedSince)) {
      continue;
    }

    candidates.set(key.toLowerCase(), location);
  }

  if (candidates.size === 0) {
    return { pins, unknownPinIds: [] };
  }

  const matched = new Set<string>();
  let nextPins: MapMakerInfoData[] | null = null;

  for (let index = 0; index < pins.length; index++) {
    const pin = pins[index];
    if (!pin || !isMovablePin(pin) || pin.Id === undefined || pin.Id === null) {
      continue;
    }

    const key = String(pin.Id).toLowerCase();
    const location = candidates.get(key);
    if (!location) {
      continue;
    }

    matched.add(key);

    if (pin.Latitude === location.latitude && pin.Longitude === location.longitude) {
      continue;
    }

    if (!nextPins) {
      nextPins = pins.slice();
    }

    nextPins[index] = { ...pin, Latitude: location.latitude, Longitude: location.longitude };
  }

  const unknownPinIds: string[] = [];
  candidates.forEach((_location, key) => {
    if (!matched.has(key)) {
      unknownPinIds.push(key);
    }
  });

  return { pins: nextPins ?? pins, unknownPinIds };
};
