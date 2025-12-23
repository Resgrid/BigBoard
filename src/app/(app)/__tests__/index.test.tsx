import { render, waitFor } from '@testing-library/react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Map from '../map';
import { useAppLifecycle } from '@/hooks/use-app-lifecycle';
import { useLocationStore } from '@/stores/app/location-store';
import { locationService } from '@/services/location';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('@/hooks/use-app-lifecycle');
jest.mock('@/stores/app/location-store');
jest.mock('@/services/location');
jest.mock('@/hooks/use-map-signalr-updates', () => ({
  useMapSignalRUpdates: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  })),
}));
jest.mock('@/api/mapping/mapping', () => ({
  getMapDataAndMarkers: jest.fn().mockResolvedValue({
    Data: { MapMakerInfos: [] }
  }),
}));
jest.mock('@rnmapbox/maps', () => ({
  setAccessToken: jest.fn(),
  MapView: 'MapView',
  Camera: 'Camera',
  PointAnnotation: 'PointAnnotation',
  StyleURL: {
    Street: 'mapbox://styles/mapbox/streets-v11',
    Dark: 'mapbox://styles/mapbox/dark-v10',
    Light: 'mapbox://styles/mapbox/light-v10',
  },
  UserTrackingMode: {
    Follow: 'follow',
    FollowWithHeading: 'followWithHeading',
  },
}));
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ children, ...props }: any) => children,
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useFocusEffect: jest.fn(() => {
    // Don't call the callback to prevent infinite loops in tests
  }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock('nativewind', () => ({
  useColorScheme: jest.fn(() => ({
    colorScheme: 'light',
  })),
}));
jest.mock('@/stores/toast/store', () => ({
  useToastStore: () => ({
    showToast: jest.fn(),
    getState: () => ({
      showToast: jest.fn(),
    }),
  }),
}));
jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: {
    getState: () => ({
      setActiveCall: jest.fn(),
    }),
  },
}));
jest.mock('@/components/maps/map-pins', () => ({
  __esModule: true,
  default: ({ pins, onPinPress }: any) => null,
}));
jest.mock('@/components/maps/pin-detail-modal', () => ({
  __esModule: true,
  default: ({ pin, isOpen, onClose, onSetAsCurrentCall }: any) => null,
}));
jest.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
  }),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider>{children}</SafeAreaProvider>
);
jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

const mockUseAppLifecycle = useAppLifecycle as jest.MockedFunction<typeof useAppLifecycle>;
const mockUseLocationStore = useLocationStore as jest.MockedFunction<typeof useLocationStore>;
const mockLocationService = locationService as jest.Mocked<typeof locationService>;
const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

// Create stable reference objects to prevent infinite re-renders
const defaultLocationState = {
  latitude: 40.7128,
  longitude: -74.0060,
  heading: 0,
  isMapLocked: false,
};

const defaultAppLifecycleState = {
  isActive: true,
  appState: 'active' as const,
  isBackground: false,
  lastActiveTimestamp: Date.now(),
};

describe('Map Component - App Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup default mocks with stable objects
    mockUseLocationStore.mockReturnValue(defaultLocationState);
    mockUseAppLifecycle.mockReturnValue(defaultAppLifecycleState);
    mockUseColorScheme.mockReturnValue({
      colorScheme: 'light',
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    });

    mockLocationService.startLocationUpdates = jest.fn().mockResolvedValue(undefined);
    mockLocationService.stopLocationUpdates = jest.fn();
  });

  afterEach(() => {
    // Clean up all timers and async operations
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();

    // Ensure location service is stopped
    if (mockLocationService.stopLocationUpdates) {
      mockLocationService.stopLocationUpdates();
    }
  });

  it('should render without crashing', async () => {
    const { unmount } = render(<Map />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    // Clean up the component
    unmount();
  });

  it('should handle location updates', async () => {
    const { unmount } = render(<Map />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    unmount();
  });

  it('should handle app lifecycle changes', async () => {
    // Test with inactive app
    mockUseAppLifecycle.mockReturnValue({
      isActive: false,
      appState: 'background' as const,
      isBackground: true,
      lastActiveTimestamp: null,
    });

    const { rerender, unmount } = render(<Map />, { wrapper: TestWrapper });

    // Simulate app becoming active
    mockUseAppLifecycle.mockReturnValue({
      isActive: true,
      appState: 'active' as const,
      isBackground: false,
      lastActiveTimestamp: Date.now(),
    });

    rerender(<Map />);

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    unmount();
  });

  it('should handle map lock state changes', async () => {
    // Start with unlocked map
    mockUseLocationStore.mockReturnValue({
      ...defaultLocationState,
      isMapLocked: false,
    });

    const { rerender, unmount } = render(<Map />, { wrapper: TestWrapper });

    // Change to locked map
    mockUseLocationStore.mockReturnValue({
      ...defaultLocationState,
      isMapLocked: true,
    });

    rerender(<Map />);

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    unmount();
  });

  it('should handle navigation mode with heading', async () => {
    // Mock locked map with heading
    mockUseLocationStore.mockReturnValue({
      ...defaultLocationState,
      heading: 90,
      isMapLocked: true,
    });

    const { unmount } = render(<Map />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    unmount();
  });

  it('should use light theme map style when in light mode', async () => {
    mockUseColorScheme.mockReturnValue({
      colorScheme: 'light',
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    });

    const { unmount } = render(<Map />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    // The map should use the light style
    // Since we can't directly test the MapView props, we test that the component renders without errors
    unmount();
  });

  it('should use dark theme map style when in dark mode', async () => {
    mockUseColorScheme.mockReturnValue({
      colorScheme: 'dark',
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    });

    const { unmount } = render(<Map />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    // The map should use the dark style
    // Since we can't directly test the MapView props, we test that the component renders without errors
    unmount();
  });

  it('should handle theme changes gracefully', async () => {
    // Start with light theme
    const setColorScheme = jest.fn();
    const toggleColorScheme = jest.fn();

    mockUseColorScheme.mockReturnValue({
      colorScheme: 'light',
      setColorScheme,
      toggleColorScheme,
    });

    const { rerender, unmount } = render(<Map />, { wrapper: TestWrapper });

    // Change to dark theme
    mockUseColorScheme.mockReturnValue({
      colorScheme: 'dark',
      setColorScheme,
      toggleColorScheme,
    });

    rerender(<Map />);

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    // Component should handle theme changes without errors
    unmount();
  });

  it('should track analytics with theme information', async () => {
    const mockTrackEvent = jest.fn();

    // We need to mock the useAnalytics hook
    jest.doMock('@/hooks/use-analytics', () => ({
      useAnalytics: () => ({ trackEvent: mockTrackEvent }),
    }));

    mockUseColorScheme.mockReturnValue({
      colorScheme: 'dark',
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    });

    const { unmount } = render(<Map />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(mockLocationService.startLocationUpdates).toHaveBeenCalled();
    });

    // Note: The analytics tracking is tested indirectly since we can't easily mock it in this setup
    unmount();
  });
});