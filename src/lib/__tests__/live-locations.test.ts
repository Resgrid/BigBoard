import { applyLiveLocations, isValidLiveCoordinate, type LiveLocation, mergeLiveLocation, parseLocationTimestamp, parsePersonnelLocationUpdate, parseUnitLocationUpdate } from '@/lib/live-locations';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

const RECEIVED_AT = 1_000_000;

const pin = (overrides: Partial<MapMakerInfoData>): MapMakerInfoData => ({
  Id: '',
  Longitude: -119.75,
  Latitude: 39.14,
  Title: 'Pin',
  zIndex: '0',
  ImagePath: 'engine',
  InfoWindowContent: '',
  Color: '',
  Type: 1,
  ...overrides,
});

const live = (pinId: string, latitude: number, longitude: number, overrides: Partial<LiveLocation> = {}): LiveLocation => ({
  pinId,
  latitude,
  longitude,
  timestamp: null,
  receivedAt: RECEIVED_AT,
  ...overrides,
});

describe('parseUnitLocationUpdate', () => {
  it('parses the camelCase payload the server sends', () => {
    const result = parseUnitLocationUpdate({ departmentId: 1, unitId: '12', latitude: 39.5, longitude: -119.8, recordId: 'r1', timestamp: '2026-09-25T14:03:11.123Z' }, RECEIVED_AT);

    expect(result).toEqual({
      pinId: 'u12',
      latitude: 39.5,
      longitude: -119.8,
      timestamp: Date.parse('2026-09-25T14:03:11.123Z'),
      receivedAt: RECEIVED_AT,
    });
  });

  it('accepts PascalCase field names', () => {
    const result = parseUnitLocationUpdate({ DepartmentId: 1, UnitId: 7, Latitude: 10, Longitude: 20, Timestamp: '2026-09-25T14:03:11Z' }, RECEIVED_AT);

    expect(result).toMatchObject({ pinId: 'u7', latitude: 10, longitude: 20, timestamp: Date.parse('2026-09-25T14:03:11Z') });
  });

  it('accepts the payload as a JSON string', () => {
    const result = parseUnitLocationUpdate(JSON.stringify({ unitId: '3', latitude: '45.25', longitude: '-100.5' }), RECEIVED_AT);

    expect(result).toMatchObject({ pinId: 'u3', latitude: 45.25, longitude: -100.5 });
  });

  it('treats a missing, null or unparseable timestamp as unknown', () => {
    expect(parseUnitLocationUpdate({ unitId: '1', latitude: 1, longitude: 2 }, RECEIVED_AT)?.timestamp).toBeNull();
    expect(parseUnitLocationUpdate({ unitId: '1', latitude: 1, longitude: 2, timestamp: null }, RECEIVED_AT)?.timestamp).toBeNull();
    expect(parseUnitLocationUpdate({ unitId: '1', latitude: 1, longitude: 2, timestamp: 'yesterday-ish' }, RECEIVED_AT)?.timestamp).toBeNull();
  });

  it.each([
    ['latitude out of range', { unitId: '1', latitude: 91, longitude: 0.5 }],
    ['longitude out of range', { unitId: '1', latitude: 1, longitude: -180.01 }],
    ['non-finite latitude', { unitId: '1', latitude: Number.NaN, longitude: 1 }],
    ['non-numeric longitude', { unitId: '1', latitude: 1, longitude: 'west' }],
    ['null island (0,0)', { unitId: '1', latitude: 0, longitude: 0 }],
    ['missing coordinates', { unitId: '1' }],
    ['missing unit id', { latitude: 1, longitude: 2 }],
    ['blank unit id', { unitId: '  ', latitude: 1, longitude: 2 }],
  ])('rejects %s', (_label, payload) => {
    expect(parseUnitLocationUpdate(payload, RECEIVED_AT)).toBeNull();
  });

  it.each([null, undefined, 42, 'not json', '[1,2]', []])('rejects a non-object payload (%p)', (payload) => {
    expect(parseUnitLocationUpdate(payload, RECEIVED_AT)).toBeNull();
  });

  it('accepts coordinates on the edges of the valid range', () => {
    expect(parseUnitLocationUpdate({ unitId: '1', latitude: -90, longitude: 180 }, RECEIVED_AT)).not.toBeNull();
    expect(parseUnitLocationUpdate({ unitId: '1', latitude: 0, longitude: 12 }, RECEIVED_AT)).not.toBeNull();
  });
});

describe('parsePersonnelLocationUpdate', () => {
  it('prefixes the user id with p and lower-cases it', () => {
    const result = parsePersonnelLocationUpdate({ departmentId: 1, userId: 'A1B2C3D4-0000-4E5F-8A9B-ABCDEFABCDEF', latitude: 1.5, longitude: 2.5, recordId: 'x', timestamp: null }, RECEIVED_AT);

    expect(result).toEqual({ pinId: 'pa1b2c3d4-0000-4e5f-8a9b-abcdefabcdef', latitude: 1.5, longitude: 2.5, timestamp: null, receivedAt: RECEIVED_AT });
  });

  it('accepts PascalCase UserId', () => {
    expect(parsePersonnelLocationUpdate({ UserId: 'ABC', Latitude: 3, Longitude: 4 }, RECEIVED_AT)?.pinId).toBe('pabc');
  });

  it('rejects a payload without a user id', () => {
    expect(parsePersonnelLocationUpdate({ unitId: '1', latitude: 3, longitude: 4 }, RECEIVED_AT)).toBeNull();
  });
});

describe('parseLocationTimestamp / isValidLiveCoordinate', () => {
  it('parses ISO strings and passes finite epoch numbers through', () => {
    expect(parseLocationTimestamp('2026-09-25T14:03:11.123Z')).toBe(Date.parse('2026-09-25T14:03:11.123Z'));
    expect(parseLocationTimestamp(123)).toBe(123);
    expect(parseLocationTimestamp(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parseLocationTimestamp('')).toBeNull();
  });

  it('validates coordinates', () => {
    expect(isValidLiveCoordinate(45, 90)).toBe(true);
    expect(isValidLiveCoordinate(0, 0)).toBe(false);
    expect(isValidLiveCoordinate(-90.0001, 0)).toBe(false);
  });
});

describe('mergeLiveLocation', () => {
  it('adds a new entity immutably', () => {
    const current = {};
    const update = live('u1', 1, 2);

    const next = mergeLiveLocation(current, update);

    expect(next).toEqual({ u1: update });
    expect(next).not.toBe(current);
    expect(current).toEqual({});
  });

  it('keeps one entry per entity, so a burst of different entities is not lossy', () => {
    let map = {};
    map = mergeLiveLocation(map, live('u1', 1, 1));
    map = mergeLiveLocation(map, live('u2', 2, 2));
    map = mergeLiveLocation(map, live('pabc', 3, 3));

    expect(Object.keys(map).sort()).toEqual(['pabc', 'u1', 'u2']);
  });

  it('ignores an update older than the one already held', () => {
    const current = { u1: live('u1', 1, 1, { timestamp: 2000 }) };

    expect(mergeLiveLocation(current, live('u1', 5, 5, { timestamp: 1000 }))).toBe(current);
  });

  it('applies a newer or equally-timed update', () => {
    const current = { u1: live('u1', 1, 1, { timestamp: 2000 }) };

    expect(mergeLiveLocation(current, live('u1', 5, 5, { timestamp: 3000 })).u1.latitude).toBe(5);
    expect(mergeLiveLocation(current, live('u1', 6, 6, { timestamp: 2000 })).u1.latitude).toBe(6);
  });

  it('always applies an update with an unknown timestamp', () => {
    const current = { u1: live('u1', 1, 1, { timestamp: 2000 }) };

    expect(mergeLiveLocation(current, live('u1', 5, 5, { timestamp: null })).u1.latitude).toBe(5);
  });

  it('returns the same map for an exact duplicate', () => {
    const current = { u1: live('u1', 1, 1, { timestamp: 2000 }) };

    expect(mergeLiveLocation(current, live('u1', 1, 1, { timestamp: 2000, receivedAt: RECEIVED_AT + 10 }))).toBe(current);
  });
});

describe('applyLiveLocations', () => {
  const pins = [
    pin({ Id: 'c5', Type: 0, Latitude: 10, Longitude: 10 }),
    pin({ Id: 'u12', Type: 1, Latitude: 20, Longitude: 20 }),
    pin({ Id: 's3', Type: 2, Latitude: 30, Longitude: 30 }),
    pin({ Id: 'pA1B2C3D4-0000-4E5F-8A9B-ABCDEFABCDEF', Type: 3, Latitude: 40, Longitude: 40 }),
  ];

  it('returns the same array reference when there is nothing to apply', () => {
    expect(applyLiveLocations(pins, {}).pins).toBe(pins);
  });

  it('returns the same array reference when every matched pin is already in place', () => {
    const result = applyLiveLocations(pins, { u12: live('u12', 20, 20) });

    expect(result.pins).toBe(pins);
    expect(result.unknownPinIds).toEqual([]);
  });

  it('moves a unit pin immutably and leaves every other pin object untouched', () => {
    const snapshot = pins.map((p) => ({ ...p }));

    const result = applyLiveLocations(pins, { u12: live('u12', 21.5, 22.5) });

    expect(result.pins).not.toBe(pins);
    expect(result.pins[1]).toEqual({ ...pins[1], Latitude: 21.5, Longitude: 22.5 });
    expect(result.pins[1]).not.toBe(pins[1]);
    expect(result.pins[0]).toBe(pins[0]);
    expect(result.pins[2]).toBe(pins[2]);
    expect(result.pins[3]).toBe(pins[3]);
    // Inputs were not mutated
    expect(pins).toEqual(snapshot);
  });

  it('matches personnel pins case-insensitively', () => {
    const result = applyLiveLocations(pins, { 'pa1b2c3d4-0000-4e5f-8a9b-abcdefabcdef': live('pa1b2c3d4-0000-4e5f-8a9b-abcdefabcdef', 41, 42) });

    expect(result.pins[3]).toMatchObject({ Latitude: 41, Longitude: 42 });
    expect(result.unknownPinIds).toEqual([]);
  });

  it('never adds a pin, and reports live locations that matched nothing', () => {
    const result = applyLiveLocations(pins, { u99: live('u99', 1, 1), u12: live('u12', 25, 25) });

    expect(result.pins).toHaveLength(pins.length);
    expect(result.pins.map((p) => p.Id)).toEqual(pins.map((p) => p.Id));
    expect(result.unknownPinIds).toEqual(['u99']);
  });

  it('only moves unit (Type 1) and personnel (Type 3) pins', () => {
    // A station pin whose id happens to look like a unit id must not move
    const odd = [pin({ Id: 'u12', Type: 2, Latitude: 5, Longitude: 5 })];

    const result = applyLiveLocations(odd, { u12: live('u12', 6, 6) });

    expect(result.pins).toBe(odd);
    expect(result.unknownPinIds).toEqual(['u12']);
  });

  it('with receivedSince, only applies live locations received at or after that time', () => {
    const liveLocations = {
      u12: live('u12', 26, 26, { receivedAt: 500 }),
      'pa1b2c3d4-0000-4e5f-8a9b-abcdefabcdef': live('pa1b2c3d4-0000-4e5f-8a9b-abcdefabcdef', 46, 46, { receivedAt: 1500 }),
    };

    const result = applyLiveLocations(pins, liveLocations, { receivedSince: 1000 });

    // The unit fix predates the snapshot request, the snapshot wins
    expect(result.pins[1]).toBe(pins[1]);
    expect(result.pins[3]).toMatchObject({ Latitude: 46, Longitude: 46 });
  });
});
