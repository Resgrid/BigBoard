import { act, renderHook } from '@testing-library/react-native';
import { useState } from 'react';

import { type LiveLocation, type LiveLocationMap } from '@/lib/live-locations';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

import { useMapLiveLocations } from '../use-map-live-locations';

// A real (tiny) zustand store with just the slice the hook reads, so selectors and getState behave
// exactly as they do in the app.
jest.mock('@/stores/signalr/signalr-store', () => {
  const { create } = jest.requireActual('zustand');
  return {
    useSignalRStore: create(() => ({
      liveLocations: {},
      reportUnknownLivePins: jest.fn(),
    })),
  };
});

type MockStoreState = { liveLocations: LiveLocationMap; reportUnknownLivePins: jest.Mock };
const mockStore = useSignalRStore as unknown as { getState: () => MockStoreState; setState: (partial: Partial<MockStoreState>) => void };

const pin = (overrides: Partial<MapMakerInfoData>): MapMakerInfoData => ({
  Id: '',
  Longitude: 0,
  Latitude: 0,
  Title: 'Pin',
  zIndex: '0',
  ImagePath: 'engine',
  InfoWindowContent: '',
  Color: '',
  Type: 1,
  ...overrides,
});

const live = (pinId: string, latitude: number, longitude: number, receivedAt: number): LiveLocation => ({ pinId, latitude, longitude, timestamp: null, receivedAt });

const CALL_PIN = pin({ Id: 'c1', Type: 0, Latitude: 1, Longitude: 1 });
const UNIT_PIN = pin({ Id: 'u12', Type: 1, Latitude: 10, Longitude: 10 });
const PERSON_PIN = pin({ Id: 'pABC', Type: 3, Latitude: 20, Longitude: 20 });

const pushLive = (location: LiveLocation) => {
  act(() => {
    mockStore.setState({ liveLocations: { ...mockStore.getState().liveLocations, [location.pinId]: location } });
  });
};

const renderMap = (initialPins: MapMakerInfoData[] = []) =>
  renderHook(() => {
    const [pins, setPins] = useState<MapMakerInfoData[]>(initialPins);
    const { applySnapshot } = useMapLiveLocations(pins, setPins);
    return { pins, setPins, applySnapshot };
  });

describe('useMapLiveLocations', () => {
  beforeEach(() => {
    mockStore.setState({ liveLocations: {}, reportUnknownLivePins: jest.fn() });
  });

  const loadSnapshot = (result: ReturnType<typeof renderMap>['result'], markers: MapMakerInfoData[], fetchStartedAt: number) => {
    act(() => {
      result.current.setPins(result.current.applySnapshot(markers, fetchStartedAt));
    });
  };

  it('moves the matching pin in place when a push arrives, leaving other pin objects untouched', () => {
    const { result } = renderMap();
    loadSnapshot(result, [CALL_PIN, UNIT_PIN, PERSON_PIN], 1000);
    const before = result.current.pins;

    pushLive(live('u12', 11, 12, 2000));

    expect(result.current.pins).not.toBe(before);
    expect(result.current.pins[1]).toMatchObject({ Id: 'u12', Latitude: 11, Longitude: 12 });
    expect(result.current.pins[0]).toBe(before[0]);
    expect(result.current.pins[2]).toBe(before[2]);
  });

  it('matches personnel pins case-insensitively', () => {
    const { result } = renderMap();
    loadSnapshot(result, [PERSON_PIN], 1000);

    pushLive(live('pabc', 21, 22, 2000));

    expect(result.current.pins[0]).toMatchObject({ Latitude: 21, Longitude: 22 });
  });

  it('keeps the same pins array when a push does not move anything', () => {
    const { result } = renderMap();
    loadSnapshot(result, [UNIT_PIN], 1000);
    const before = result.current.pins;

    pushLive(live('u12', 10, 10, 2000));

    expect(result.current.pins).toBe(before);
  });

  it('never adds a pin from a push, and reports it as unknown once the map has data', () => {
    const { result } = renderMap();
    loadSnapshot(result, [UNIT_PIN], 1000);

    pushLive(live('u99', 5, 5, 2000));

    expect(result.current.pins).toHaveLength(1);
    expect(mockStore.getState().reportUnknownLivePins).toHaveBeenCalledWith(['u99']);
  });

  it('does not report unknown pins before the first snapshot has loaded', () => {
    renderMap();

    pushLive(live('u12', 5, 5, 2000));

    expect(mockStore.getState().reportUnknownLivePins).not.toHaveBeenCalled();
  });

  it('re-applies positions that arrived while the snapshot request was in flight', () => {
    const { result } = renderMap();
    loadSnapshot(result, [UNIT_PIN, PERSON_PIN], 1000);

    // Pushed after the refetch started, before its (older) response came back
    pushLive(live('u12', 15, 15, 5000));
    loadSnapshot(result, [UNIT_PIN, PERSON_PIN], 4000);

    expect(result.current.pins[0]).toMatchObject({ Latitude: 15, Longitude: 15 });
  });

  it('does not roll a fresh snapshot back to positions received before that request started', () => {
    const { result } = renderMap();
    loadSnapshot(result, [UNIT_PIN, PERSON_PIN], 1000);
    pushLive(live('u12', 15, 15, 2000));

    // A newer snapshot has the unit somewhere else
    const freshUnit = { ...UNIT_PIN, Latitude: 16, Longitude: 16 };
    loadSnapshot(result, [freshUnit, PERSON_PIN], 3000);
    expect(result.current.pins[0]).toMatchObject({ Latitude: 16, Longitude: 16 });

    // An unrelated push must not drag the old unit position back in either
    pushLive(live('pabc', 25, 25, 4000));
    expect(result.current.pins[0]).toMatchObject({ Latitude: 16, Longitude: 16 });
    expect(result.current.pins[1]).toMatchObject({ Latitude: 25, Longitude: 25 });
  });

  it('ignores positions that were already known when the map mounted (its first snapshot is newer)', () => {
    mockStore.setState({ liveLocations: { u12: live('u12', 99, 99, 500) } });
    const { result } = renderMap();

    loadSnapshot(result, [UNIT_PIN], 1000);

    expect(result.current.pins[0]).toBe(UNIT_PIN);
  });

  it('does not re-render the map for every push that moves none of its pins', () => {
    let hookRuns = 0;
    const { result } = renderHook(() => {
      hookRuns += 1;
      const [pins, setPins] = useState<MapMakerInfoData[]>([]);
      const { applySnapshot } = useMapLiveLocations(pins, setPins);
      return { pins, setPins, applySnapshot };
    });
    act(() => {
      result.current.setPins(result.current.applySnapshot([UNIT_PIN], 1000));
    });
    const hookRunsAfterLoad = hookRuns;

    for (let i = 0; i < 5; i++) {
      pushLive(live('u12', 10, 10, 2000 + i)); // already there
      pushLive(live(`pnobody${i}`, 5, 5, 2000 + i)); // not on this map
    }

    // React may render once before bailing out on an unchanged state; it must not render per push.
    expect(hookRuns - hookRunsAfterLoad).toBeLessThanOrEqual(1);

    const hookRunsBeforeMove = hookRuns;
    pushLive(live('u12', 11, 11, 3000));
    expect(hookRuns).toBe(hookRunsBeforeMove + 1);
    expect(result.current.pins[0]).toMatchObject({ Latitude: 11, Longitude: 11 });
  });

  it('stops listening when the map unmounts', () => {
    const { result, unmount } = renderMap();
    loadSnapshot(result, [UNIT_PIN], 1000);
    unmount();

    pushLive(live('u99', 5, 5, 2000));

    expect(mockStore.getState().reportUnknownLivePins).not.toHaveBeenCalled();
  });

  it('uses the snapshot as is when no fetch start time is given', () => {
    pushLive(live('u12', 15, 15, 2000));
    const { result } = renderMap();

    const markers = [UNIT_PIN];
    expect(result.current.applySnapshot(markers)).toBe(markers);
  });
});
