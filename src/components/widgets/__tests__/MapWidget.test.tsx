import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { getMapDataAndMarkers } from '@/api/mapping/mapping';
import { useMapSignalRUpdates } from '@/hooks/use-map-signalr-updates';
import { FALLBACK_DAY_MAP_STYLE } from '@/lib/map-style';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

import { MapWidget } from '../MapWidget';

const mockSetCamera = jest.fn();
const mockMapViewStyleURL = jest.fn();
let mockCoreConfig: Record<string, unknown> | null = null;
let mockColorScheme = 'light';

jest.mock('@rnmapbox/maps', () => {
  const ReactActual = jest.requireActual('react');
  const MapView = ({ children, onDidFinishLoadingMap, styleURL }: { children: React.ReactNode; onDidFinishLoadingMap?: () => void; styleURL?: string }) => {
    mockMapViewStyleURL(styleURL);
    ReactActual.useEffect(() => {
      onDidFinishLoadingMap?.();
    }, [onDidFinishLoadingMap]);
    return children;
  };
  const Camera = ReactActual.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
    ReactActual.useImperativeHandle(ref, () => ({ setCamera: (...args: unknown[]) => mockSetCamera(...args) }));
    return null;
  });
  return { __esModule: true, default: { MapView, Camera } };
});

jest.mock('../../maps/map-pins', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../WidgetContainer', () => ({
  WidgetContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/ui/box', () => ({
  Box: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('@/components/ui/spinner', () => ({
  Spinner: () => null,
}));

jest.mock('@/components/ui/text', () => ({
  Text: () => null,
}));

jest.mock('@/hooks/use-map-signalr-updates', () => ({
  useMapSignalRUpdates: jest.fn(),
}));

jest.mock('@/hooks/use-map-live-locations', () => ({
  useMapLiveLocations: () => ({ applySnapshot: (markers: unknown) => markers }),
}));

jest.mock('@/api/mapping/mapping', () => ({
  getMapDataAndMarkers: jest.fn(),
  getMapLayers: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: (selector: (state: unknown) => unknown) => selector({ isInitialized: true, config: mockCoreConfig }),
}));

jest.mock('@/stores/auth/store', () => ({
  __esModule: true,
  default: (selector: (state: unknown) => unknown) => selector({ accessToken: 'token' }),
}));

jest.mock('@/stores/mapping/map-store', () => {
  const mockSetMapData = jest.fn();
  return {
    useMapStore: (selector: (state: unknown) => unknown) => selector({ setMapData: mockSetMapData }),
  };
});

jest.mock('@/lib/logging', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('nativewind', () => ({
  styled: jest.fn((Component: unknown) => Component),
  useColorScheme: jest.fn(() => ({ colorScheme: mockColorScheme })),
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

describe('MapWidget (native) camera', () => {
  const UNIT = pin({ Id: 'u12', Type: 1, Latitude: 39.14, Longitude: -119.75 });

  beforeEach(() => {
    jest.clearAllMocks();
    (getMapDataAndMarkers as jest.Mock).mockResolvedValue({ Data: { MapMakerInfos: [UNIT], CenterLat: '', CenterLon: '', ZoomLevel: '' } });
  });

  it('centers on the pins once and leaves the camera alone on later pin updates', async () => {
    render(<MapWidget />);

    await waitFor(() => {
      expect(mockSetCamera).toHaveBeenCalledTimes(1);
    });
    expect(mockSetCamera).toHaveBeenCalledWith(expect.objectContaining({ centerCoordinate: [UNIT.Longitude, UNIT.Latitude] }));

    // Realtime position updates and SignalR refreshes replace the pins array
    const onMarkersUpdate = (useMapSignalRUpdates as jest.Mock).mock.calls.at(-1)?.[0] as (pins: MapMakerInfoData[], fetchStartedAt: number) => void;
    act(() => {
      onMarkersUpdate([{ ...UNIT, Latitude: 39.2, Longitude: -119.8 }], Date.now());
    });
    act(() => {
      onMarkersUpdate([{ ...UNIT, Latitude: 39.3, Longitude: -119.9 }], Date.now());
    });

    expect(mockSetCamera).toHaveBeenCalledTimes(1);
  });
});

describe('MapWidget (native) base map style', () => {
  const SATELLITE = 'mapbox://styles/mapbox/satellite-v9';
  const NAVIGATION_NIGHT = 'mapbox://styles/mapbox/navigation-night-v1';

  beforeEach(() => {
    jest.clearAllMocks();
    (getMapDataAndMarkers as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    mockCoreConfig = null;
    mockColorScheme = 'light';
  });

  it('renders the department day style in a light theme', async () => {
    mockCoreConfig = { MapDayStyleUrl: SATELLITE, MapNightStyleUrl: NAVIGATION_NIGHT };

    render(<MapWidget />);

    await waitFor(() => {
      expect(mockMapViewStyleURL).toHaveBeenCalled();
    });
    expect(mockMapViewStyleURL).toHaveBeenLastCalledWith(SATELLITE);
  });

  it('renders the department night style in a dark theme', async () => {
    mockCoreConfig = { MapDayStyleUrl: SATELLITE, MapNightStyleUrl: NAVIGATION_NIGHT };
    mockColorScheme = 'dark';

    render(<MapWidget />);

    await waitFor(() => {
      expect(mockMapViewStyleURL).toHaveBeenCalled();
    });
    expect(mockMapViewStyleURL).toHaveBeenLastCalledWith(NAVIGATION_NIGHT);
  });

  it('falls back to Streets before config loads', async () => {
    render(<MapWidget />);

    await waitFor(() => {
      expect(mockMapViewStyleURL).toHaveBeenCalled();
    });
    expect(mockMapViewStyleURL).toHaveBeenLastCalledWith(FALLBACK_DAY_MAP_STYLE);
  });
});
