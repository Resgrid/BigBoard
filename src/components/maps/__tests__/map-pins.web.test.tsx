/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react-native';
import React from 'react';

import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

import MapPins from '../map-pins.web';

interface FakeMarker {
  element: HTMLElement;
  setLngLat: jest.Mock;
  addTo: jest.Mock;
  remove: jest.Mock;
}

interface FakeRoot {
  render: jest.Mock;
  unmount: jest.Mock;
}

const mockMarkers: FakeMarker[] = [];
const mockRoots: FakeRoot[] = [];

jest.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    Marker: jest.fn().mockImplementation((options: { element: HTMLElement }) => {
      const marker: FakeMarker = {
        element: options.element,
        setLngLat: jest.fn().mockReturnThis(),
        addTo: jest.fn().mockReturnThis(),
        remove: jest.fn(),
      };
      mockMarkers.push(marker);
      return marker;
    }),
  },
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => {
    const root: FakeRoot = { render: jest.fn(), unmount: jest.fn() };
    mockRoots.push(root);
    return root;
  }),
}));

jest.mock('../pin-marker', () => ({
  __esModule: true,
  default: () => null,
}));

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

const fakeMap = {} as never;

const UNIT = pin({ Id: 'u12', Type: 1, Latitude: 10, Longitude: 20, Title: 'Engine 12' });
const STATION = pin({ Id: 's1', Type: 2, Latitude: 11, Longitude: 21, Title: 'Station 1' });

describe('MapPins (web)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockMarkers.length = 0;
    mockRoots.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates one marker per pin with usable coordinates', () => {
    render(<MapPins map={fakeMap} pins={[UNIT, STATION, pin({ Id: 'u0', Latitude: 0, Longitude: 0 })]} isMapReady />);

    expect(mockMarkers).toHaveLength(2);
    expect(mockMarkers[0].setLngLat).toHaveBeenCalledWith([20, 10]);
    expect(mockMarkers[0].addTo).toHaveBeenCalledWith(fakeMap);
    expect(mockRoots[0].render).toHaveBeenCalledTimes(1);
  });

  it('does nothing until the map is ready', () => {
    render(<MapPins map={fakeMap} pins={[UNIT]} isMapReady={false} />);

    expect(mockMarkers).toHaveLength(0);
  });

  it('moves a pin with setLngLat on its existing marker instead of rebuilding the markers', () => {
    const { rerender } = render(<MapPins map={fakeMap} pins={[UNIT, STATION]} isMapReady />);
    const [unitMarker, stationMarker] = mockMarkers;
    unitMarker.setLngLat.mockClear();

    const moved = { ...UNIT, Latitude: 10.5, Longitude: 20.5 };
    rerender(<MapPins map={fakeMap} pins={[moved, STATION]} isMapReady />);

    expect(mockMarkers).toHaveLength(2); // nothing new constructed
    expect(unitMarker.setLngLat).toHaveBeenCalledWith([20.5, 10.5]);
    expect(unitMarker.remove).not.toHaveBeenCalled();
    expect(stationMarker.remove).not.toHaveBeenCalled();
    // Position-only change: the marker content is not re-rendered
    expect(mockRoots[0].render).toHaveBeenCalledTimes(1);
  });

  it('keeps unchanged markers when a refresh hands back equal pins', () => {
    const { rerender } = render(<MapPins map={fakeMap} pins={[UNIT]} isMapReady />);
    const [unitMarker] = mockMarkers;
    unitMarker.setLngLat.mockClear();

    rerender(<MapPins map={fakeMap} pins={[{ ...UNIT }]} isMapReady />);

    expect(mockMarkers).toHaveLength(1);
    expect(unitMarker.setLngLat).not.toHaveBeenCalled();
    expect(unitMarker.remove).not.toHaveBeenCalled();
  });

  it('re-renders the marker content in place when its label changes', () => {
    const { rerender } = render(<MapPins map={fakeMap} pins={[UNIT]} isMapReady />);

    rerender(<MapPins map={fakeMap} pins={[{ ...UNIT, Title: 'Engine 12 (responding)' }]} isMapReady />);

    expect(mockMarkers).toHaveLength(1);
    expect(mockRoots[0].render).toHaveBeenCalledTimes(2);
  });

  it('removes the marker and unmounts its React root when a pin disappears', () => {
    const { rerender } = render(<MapPins map={fakeMap} pins={[UNIT, STATION]} isMapReady />);

    rerender(<MapPins map={fakeMap} pins={[STATION]} isMapReady />);

    expect(mockMarkers[0].remove).toHaveBeenCalledTimes(1);
    jest.runAllTimers();
    expect(mockRoots[0].unmount).toHaveBeenCalledTimes(1);
    expect(mockRoots[1].unmount).not.toHaveBeenCalled();
  });

  it('removes every marker and unmounts every root on unmount', () => {
    const { unmount } = render(<MapPins map={fakeMap} pins={[UNIT, STATION]} isMapReady />);

    unmount();
    jest.runAllTimers();

    expect(mockMarkers.every((marker) => marker.remove.mock.calls.length === 1)).toBe(true);
    expect(mockRoots.every((root) => root.unmount.mock.calls.length === 1)).toBe(true);
  });

  it('hands the latest pin object to onPinPress after the pin moved', () => {
    const onPinPress = jest.fn();
    const { rerender } = render(<MapPins map={fakeMap} pins={[UNIT]} isMapReady onPinPress={onPinPress} />);

    const moved = { ...UNIT, Latitude: 12, Longitude: 22 };
    rerender(<MapPins map={fakeMap} pins={[moved]} isMapReady onPinPress={onPinPress} />);

    const element = mockRoots[0].render.mock.calls[0][0] as React.ReactElement<{ onPress: () => void }>;
    element.props.onPress();

    expect(onPinPress).toHaveBeenCalledWith(moved);
  });
});
