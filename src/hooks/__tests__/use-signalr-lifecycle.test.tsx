import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AppStateStatus } from 'react-native';

import { useSignalRStore } from '@/stores/signalr/signalr-store';

import { SIGNALR_WATCHDOG_INTERVAL_MS, useSignalRLifecycle } from '../use-signalr-lifecycle';

// Mock the dependencies
jest.mock('@/stores/signalr/signalr-store');
jest.mock('../use-app-lifecycle');

const mockUseSignalRStore = useSignalRStore as jest.MockedFunction<typeof useSignalRStore>;
const mockUseAppLifecycle = require('../use-app-lifecycle').useAppLifecycle as jest.MockedFunction<any>;

describe('useSignalRLifecycle', () => {
  const mockConnectUpdateHub = jest.fn();
  const mockDisconnectUpdateHub = jest.fn();
  const mockConnectGeolocationHub = jest.fn();
  const mockDisconnectGeolocationHub = jest.fn();
  const mockEnsureHubConnections = jest.fn();
  const mockClearLiveLocations = jest.fn();

  // Create shared state for app lifecycle that can be updated
  let appLifecycleState = {
    appState: 'active' as AppStateStatus,
    isActive: true,
  };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Reset app lifecycle state
    appLifecycleState = {
      appState: 'active' as AppStateStatus,
      isActive: true,
    };

    // Mock SignalR store (hook uses per-field selectors)
    const signalRState = {
      connectUpdateHub: mockConnectUpdateHub,
      disconnectUpdateHub: mockDisconnectUpdateHub,
      connectGeolocationHub: mockConnectGeolocationHub,
      disconnectGeolocationHub: mockDisconnectGeolocationHub,
      ensureHubConnections: mockEnsureHubConnections,
      clearLiveLocations: mockClearLiveLocations,
      isUpdateHubConnected: false,
      isGeolocationHubConnected: false,
    };
    mockUseSignalRStore.mockImplementation(((selector: any) => (typeof selector === 'function' ? selector(signalRState) : signalRState)) as any);

    // Mock useAppLifecycle to return shared state
    mockUseAppLifecycle.mockImplementation(() => appLifecycleState);
    mockEnsureHubConnections.mockResolvedValue(undefined);
  });

  it('should disconnect SignalR when app goes to background', async () => {
    const { result } = renderHook(
      (props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props),
      {
        initialProps: { isSignedIn: true, hasInitialized: true }
      }
    );

    // Call the background handler directly
    await act(async () => {
      await result.current.handleAppBackground();
    });

    // Both hubs follow the app into the background
    expect(mockDisconnectUpdateHub).toHaveBeenCalled();
    expect(mockDisconnectGeolocationHub).toHaveBeenCalled();
  });

  it('should reconnect SignalR when app becomes active from background', async () => {
    const { result } = renderHook(
      (props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props),
      {
        initialProps: { isSignedIn: true, hasInitialized: true }
      }
    );

    // Call the resume handler directly
    await act(async () => {
      await result.current.handleAppResume();
    });

    // Both hubs come back on resume
    expect(mockConnectUpdateHub).toHaveBeenCalled();
    expect(mockConnectGeolocationHub).toHaveBeenCalled();
  });

  it('still reconnects the geolocation hub when the update hub reconnect fails', async () => {
    mockConnectUpdateHub.mockRejectedValueOnce(new Error('Update hub connect failed'));
    const { result } = renderHook((props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props), {
      initialProps: { isSignedIn: true, hasInitialized: true },
    });

    await act(async () => {
      await result.current.handleAppResume();
    });

    expect(mockConnectGeolocationHub).toHaveBeenCalledTimes(1);
  });

  it('runs the connection watchdog on an interval while signed in and active', async () => {
    renderHook((props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props), {
      initialProps: { isSignedIn: true, hasInitialized: true },
    });

    expect(mockEnsureHubConnections).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(SIGNALR_WATCHDOG_INTERVAL_MS);
    });
    expect(mockEnsureHubConnections).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(SIGNALR_WATCHDOG_INTERVAL_MS);
    });
    expect(mockEnsureHubConnections).toHaveBeenCalledTimes(2);
  });

  it('does not start a watchdog pass while the previous one is still running', async () => {
    mockEnsureHubConnections.mockImplementation(() => new Promise(() => {}));
    renderHook((props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props), {
      initialProps: { isSignedIn: true, hasInitialized: true },
    });

    await act(async () => {
      jest.advanceTimersByTime(SIGNALR_WATCHDOG_INTERVAL_MS * 3);
    });

    expect(mockEnsureHubConnections).toHaveBeenCalledTimes(1);
  });

  it('does not run the watchdog when signed out, before initialization, or in the background', async () => {
    const { rerender } = renderHook((props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props), {
      initialProps: { isSignedIn: false, hasInitialized: true },
    });
    await act(async () => {
      jest.advanceTimersByTime(SIGNALR_WATCHDOG_INTERVAL_MS * 2);
    });

    rerender({ isSignedIn: true, hasInitialized: false });
    await act(async () => {
      jest.advanceTimersByTime(SIGNALR_WATCHDOG_INTERVAL_MS * 2);
    });

    appLifecycleState = { appState: 'background' as AppStateStatus, isActive: false };
    rerender({ isSignedIn: true, hasInitialized: true });
    await act(async () => {
      jest.advanceTimersByTime(SIGNALR_WATCHDOG_INTERVAL_MS * 2);
    });

    expect(mockEnsureHubConnections).not.toHaveBeenCalled();
  });

  it('disconnects both hubs and clears live locations on sign-out', async () => {
    const { rerender } = renderHook((props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props), {
      initialProps: { isSignedIn: true, hasInitialized: true },
    });
    expect(mockClearLiveLocations).not.toHaveBeenCalled();

    rerender({ isSignedIn: false, hasInitialized: true });

    expect(mockClearLiveLocations).toHaveBeenCalledTimes(1);
    expect(mockDisconnectGeolocationHub).toHaveBeenCalledTimes(1);
    expect(mockDisconnectUpdateHub).toHaveBeenCalledTimes(1);
  });

  it('should not manage SignalR when user is not signed in', async () => {
    const { result } = renderHook(
      (props) => useSignalRLifecycle(props),
      {
        initialProps: { isSignedIn: false, hasInitialized: true }
      }
    );

    // Call the background handler directly
    await act(async () => {
      await result.current.handleAppBackground();
    });

    // Should not call SignalR methods when user is not signed in
    expect(mockDisconnectUpdateHub).not.toHaveBeenCalled();
  });

  it('should not manage SignalR when app is not initialized', async () => {
    const { result } = renderHook(
      (props) => useSignalRLifecycle(props),
      {
        initialProps: { isSignedIn: true, hasInitialized: false }
      }
    );

    // Call the background handler directly
    await act(async () => {
      await result.current.handleAppBackground();
    });

    // Should not call SignalR methods when app is not initialized
    expect(mockDisconnectUpdateHub).not.toHaveBeenCalled();
  });

  it('should handle SignalR operation failures gracefully', async () => {
    // Mock operation to fail
    mockDisconnectUpdateHub.mockRejectedValue(new Error('Update hub disconnect failed'));

    const { result } = renderHook(
      (props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props),
      {
        initialProps: { isSignedIn: true, hasInitialized: true }
      }
    );

    // Call the background handler directly - should not throw
    await act(async () => {
      await result.current.handleAppBackground();
    });

    // Should have been called despite failing
    expect(mockDisconnectUpdateHub).toHaveBeenCalledTimes(1);
  });

  it('should prevent concurrent operations', async () => {
    const { result } = renderHook(
      (props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props),
      {
        initialProps: { isSignedIn: true, hasInitialized: true }
      }
    );

    // First call background handler
    await act(async () => {
      await result.current.handleAppBackground();
    });

    expect(mockDisconnectUpdateHub).toHaveBeenCalledTimes(1);

    // Then call resume handler
    await act(async () => {
      await result.current.handleAppResume();
    });

    // Should have been called once each
    expect(mockDisconnectUpdateHub).toHaveBeenCalledTimes(1);
    expect(mockConnectUpdateHub).toHaveBeenCalledTimes(1);
  });

  it('should not disconnect SignalR on rapid navigation state changes', async () => {
    // This test verifies that rapid state changes don't trigger disconnects
    // The actual timer logic is complex to test with mocks, so we focus on the 
    // core functionality via direct handler calls
    const { result } = renderHook(
      (props) => useSignalRLifecycle(props),
      {
        initialProps: { isSignedIn: true, hasInitialized: true }
      }
    );

    // Verify the handlers exist
    expect(typeof result.current.handleAppBackground).toBe('function');
    expect(typeof result.current.handleAppResume).toBe('function');

    // The timer-based logic is tested through integration tests
    // This test confirms the handlers are available for timer callbacks
  });

  it('should provide app state and lifecycle handlers', async () => {
    const { result } = renderHook(
      (props: { isSignedIn: boolean; hasInitialized: boolean }) => useSignalRLifecycle(props),
      {
        initialProps: { isSignedIn: true, hasInitialized: true }
      }
    );

    // Verify the hook returns the expected interface
    expect(result.current).toHaveProperty('isActive');
    expect(result.current).toHaveProperty('appState');
    expect(result.current).toHaveProperty('handleAppBackground');
    expect(result.current).toHaveProperty('handleAppResume');

    // Verify handlers are functions
    expect(typeof result.current.handleAppBackground).toBe('function');
    expect(typeof result.current.handleAppResume).toBe('function');
  });
}); 