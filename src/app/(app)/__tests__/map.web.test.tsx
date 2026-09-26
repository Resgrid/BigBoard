/**
 * @jest-environment jsdom
 */
import { act, render, waitFor } from '@testing-library/react-native';
import mapboxgl from 'mapbox-gl';
import React from 'react';

import Map from '../map.web';
import { getMapDataAndMarkers } from '@/api/mapping/mapping';
import { useMapSignalRUpdates } from '@/hooks/use-map-signalr-updates';
import { FALLBACK_MAP_CENTER } from '@/lib/map-center';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

const DEPARTMENT_CENTER = { MapCenterLatitude: 50.8698, MapCenterLongitude: 3.8102, MapCenterZoomLevel: 14 };

const mockCoreState: { isInitialized: boolean; config: Record<string, unknown> | null } = { isInitialized: false, config: null };
const mockGetState = jest.fn(() => mockCoreState);
const mockMapConstructor = jest.fn();

jest.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    accessToken: '',
    Map: jest.fn().mockImplementation((options: unknown) => {
      mockMapConstructor(options);
      return { on: jest.fn(), remove: jest.fn(), flyTo: jest.fn(), addControl: jest.fn(), setStyle: jest.fn(), fitBounds: jest.fn() };
    }),
    Marker: jest.fn().mockImplementation(() => ({ setLngLat: jest.fn().mockReturnThis(), setPopup: jest.fn().mockReturnThis(), addTo: jest.fn().mockReturnThis(), remove: jest.fn() })),
    Popup: jest.fn().mockImplementation(() => ({ setDOMContent: jest.fn().mockReturnThis() })),
    LngLatBounds: jest.fn().mockImplementation(() => ({ extend: jest.fn() })),
    NavigationControl: jest.fn(),
    GeolocateControl: jest.fn(),
  },
}));

// The factory runs while the top-level imports are still resolving, so it has to reach for the
// spies lazily rather than capture them.
jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: Object.assign((selector?: (state: unknown) => unknown) => (selector ? selector(mockCoreState) : mockCoreState), { getState: () => mockGetState() }),
}));

jest.mock('@/stores/auth/store', () => ({
  __esModule: true,
  default: (selector?: (state: unknown) => unknown) => {
    const state = { accessToken: 'token' };
    return selector ? selector(state) : state;
  },
}));

jest.mock('@/stores/app/location-store', () => ({
  useLocationStore: (selector?: (state: unknown) => unknown) => {
    const state = { latitude: null, longitude: null, heading: null, isMapLocked: false };
    return selector ? selector(state) : state;
  },
}));

jest.mock('@/stores/toast/store', () => ({
  useToastStore: { getState: () => ({ showToast: jest.fn() }) },
}));

jest.mock('@/hooks/use-map-signalr-updates', () => ({
  useMapSignalRUpdates: jest.fn(),
}));

jest.mock('@/hooks/use-map-live-locations', () => ({
  useMapLiveLocations: () => ({ applySnapshot: (markers: unknown) => markers }),
}));

jest.mock('@/hooks/use-app-lifecycle', () => ({
  useAppLifecycle: () => ({ isActive: true }),
}));

jest.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({ trackEvent: jest.fn() }),
}));

jest.mock('@/api/mapping/mapping', () => ({
  getMapDataAndMarkers: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/components/maps/pin-detail-modal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/lib/env', () => ({
  Env: { MAPBOX_PUBKEY: 'pk.test' },
}));

jest.mock('@/lib/logging', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('lucide-react-native', () => ({
  NavigationIcon: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('nativewind', () => ({
  styled: jest.fn((Component: unknown) => Component),
  useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
}));

// The container ref is a raw <div>; the test renderer hands back null for host refs unless one is
// mocked, and the init effect bails on a null container before it ever reaches the Mapbox call.
const renderMap = () => render(<Map />, { createNodeMock: () => ({}) });

describe('map.web map initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockImplementation(() => mockCoreState);
    mockCoreState.isInitialized = false;
    mockCoreState.config = null;
  });

  it('does not construct a map before core configuration is available', () => {
    renderMap();

    expect(mockMapConstructor).not.toHaveBeenCalled();
  });

  it('constructs the map on the department centre once configuration lands', () => {
    const { rerender } = renderMap();

    mockCoreState.isInitialized = true;
    mockCoreState.config = DEPARTMENT_CENTER;
    rerender(<Map />);

    expect(mockMapConstructor).toHaveBeenCalledTimes(1);
    expect(mockMapConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [DEPARTMENT_CENTER.MapCenterLongitude, DEPARTMENT_CENTER.MapCenterLatitude],
        zoom: DEPARTMENT_CENTER.MapCenterZoomLevel,
      })
    );
  });

  it('reads the department centre once per construction', () => {
    const { rerender } = renderMap();

    mockCoreState.isInitialized = true;
    mockCoreState.config = DEPARTMENT_CENTER;
    rerender(<Map />);

    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  it('falls back to the shared default centre when config has no coordinates', () => {
    const { rerender } = renderMap();

    mockCoreState.isInitialized = true;
    mockCoreState.config = {};
    rerender(<Map />);

    expect(mockMapConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [FALLBACK_MAP_CENTER.longitude, FALLBACK_MAP_CENTER.latitude],
        zoom: FALLBACK_MAP_CENTER.zoomLevel,
      })
    );
  });
});

describe('map.web live pin updates', () => {
  const pin = (overrides: Partial<MapMakerInfoData>): MapMakerInfoData => ({
    Id: '',
    Longitude: 3.81,
    Latitude: 50.87,
    Title: 'Pin',
    zIndex: '0',
    ImagePath: 'engine',
    InfoWindowContent: '',
    Color: '',
    Type: 1,
    ...overrides,
  });

  const UNIT = pin({ Id: 'u12', Type: 1, Latitude: 50.87, Longitude: 3.81, Title: 'Engine 12' });
  const STATION = pin({ Id: 's1', Type: 2, Latitude: 50.88, Longitude: 3.82, Title: 'Station 1' });

  const mapInstance = () => (mapboxgl.Map as unknown as jest.Mock).mock.results[0].value as { on: jest.Mock; fitBounds: jest.Mock };
  const markerInstances = () => (mapboxgl.Marker as unknown as jest.Mock).mock.results.map((result) => result.value as { setLngLat: jest.Mock; remove: jest.Mock });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockImplementation(() => mockCoreState);
    mockCoreState.isInitialized = true;
    mockCoreState.config = DEPARTMENT_CENTER;
    (getMapDataAndMarkers as jest.Mock).mockResolvedValue({ Data: { MapMakerInfos: [UNIT, STATION], CenterLat: '', CenterLon: '', ZoomLevel: '' } });
  });

  afterEach(() => {
    (getMapDataAndMarkers as jest.Mock).mockResolvedValue(null);
  });

  it('fits the camera once, then moves markers in place on later pin updates', async () => {
    renderMap();

    const onLoad = mapInstance().on.mock.calls.find(([event]) => event === 'load')?.[1] as () => void;
    act(() => {
      onLoad();
    });

    await waitFor(() => {
      expect(markerInstances()).toHaveLength(2);
    });
    expect(mapInstance().fitBounds).toHaveBeenCalledTimes(1);

    const [unitMarker, stationMarker] = markerInstances();
    unitMarker.setLngLat.mockClear();

    // A realtime position update (or a SignalR refresh) hands the map a new pins array
    const onMarkersUpdate = (useMapSignalRUpdates as jest.Mock).mock.calls.at(-1)?.[0] as (pins: MapMakerInfoData[], fetchStartedAt: number) => void;
    act(() => {
      onMarkersUpdate([{ ...UNIT, Latitude: 50.9, Longitude: 3.9 }, STATION], Date.now());
    });

    expect(unitMarker.setLngLat).toHaveBeenCalledWith([3.9, 50.9]);
    expect(unitMarker.remove).not.toHaveBeenCalled();
    expect(stationMarker.remove).not.toHaveBeenCalled();
    expect(markerInstances()).toHaveLength(2);
    // The camera stays where the user left it
    expect(mapInstance().fitBounds).toHaveBeenCalledTimes(1);
  });

  it('puts pin text into the popup as text, never as markup', async () => {
    const hostile = pin({
      Id: 'c1',
      Title: '<img src=x onerror=alert(1)>',
      InfoWindowContent: '<script>alert(2)</script>',
      Color: '0deg) url(https://evil.example/f.svg#x',
    });
    (getMapDataAndMarkers as jest.Mock).mockResolvedValue({ Data: { MapMakerInfos: [hostile], CenterLat: '', CenterLon: '', ZoomLevel: '' } });

    renderMap();

    const onLoad = mapInstance().on.mock.calls.find(([event]) => event === 'load')?.[1] as () => void;
    act(() => {
      onLoad();
    });

    await waitFor(() => {
      expect(markerInstances()).toHaveLength(1);
    });

    const popup = (mapboxgl.Popup as unknown as jest.Mock).mock.results[0].value as { setDOMContent: jest.Mock };
    const content = popup.setDOMContent.mock.calls[0][0] as HTMLElement;
    expect(content.querySelector('img')).toBeNull();
    expect(content.querySelector('script')).toBeNull();
    expect(content.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(content.textContent).toContain('<script>alert(2)</script>');

    // A color that is not a bare angle never reaches the CSS filter
    const markerElement = (mapboxgl.Marker as unknown as jest.Mock).mock.calls[0][0] as HTMLElement;
    expect(markerElement.style.filter).toBe('');
  });
});
