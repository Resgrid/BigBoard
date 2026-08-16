/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react-native';
import React from 'react';

import { MapWidget } from '../MapWidget.web';
import { FALLBACK_MAP_CENTER } from '@/lib/map-center';

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
      return { on: jest.fn(), remove: jest.fn(), flyTo: jest.fn(), addControl: jest.fn() };
    }),
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

jest.mock('@/hooks/use-map-signalr-updates', () => ({
  useMapSignalRUpdates: jest.fn(),
}));

jest.mock('@/api/mapping/mapping', () => ({
  getMapDataAndMarkers: jest.fn().mockResolvedValue(null),
  getMapLayers: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/env', () => ({
  Env: { MAPBOX_PUBKEY: 'pk.test' },
}));

jest.mock('@/lib/logging', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../maps/map-pins.web', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('nativewind', () => ({
  styled: jest.fn((Component: unknown) => Component),
  useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
}));

// The container ref is a raw <div>; the test renderer hands back null for host refs unless one is
// mocked, and the init effect bails on a null container before it ever reaches the Mapbox call.
const renderWidget = () => render(<MapWidget />, { createNodeMock: () => ({}) });

describe('MapWidget.web map initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockImplementation(() => mockCoreState);
    mockCoreState.isInitialized = false;
    mockCoreState.config = null;
  });

  it('does not construct a map before core configuration is available', () => {
    renderWidget();

    expect(mockMapConstructor).not.toHaveBeenCalled();
  });

  it('constructs the map on the department centre once configuration lands', () => {
    const { rerender } = renderWidget();

    mockCoreState.isInitialized = true;
    mockCoreState.config = DEPARTMENT_CENTER;
    rerender(<MapWidget />);

    expect(mockMapConstructor).toHaveBeenCalledTimes(1);
    expect(mockMapConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [DEPARTMENT_CENTER.MapCenterLongitude, DEPARTMENT_CENTER.MapCenterLatitude],
        zoom: DEPARTMENT_CENTER.MapCenterZoomLevel,
      })
    );
  });

  it('reads the department centre once per construction', () => {
    const { rerender } = renderWidget();

    mockCoreState.isInitialized = true;
    mockCoreState.config = DEPARTMENT_CENTER;
    rerender(<MapWidget />);

    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  it('falls back to the shared default centre when config has no coordinates', () => {
    const { rerender } = renderWidget();

    mockCoreState.isInitialized = true;
    mockCoreState.config = {};
    rerender(<MapWidget />);

    expect(mockMapConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [FALLBACK_MAP_CENTER.longitude, FALLBACK_MAP_CENTER.latitude],
        zoom: FALLBACK_MAP_CENTER.zoomLevel,
      })
    );
  });
});
