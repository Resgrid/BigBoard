import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppStateStatus } from 'react-native';

import { useSignalRStore } from '@/stores/signalr/signalr-store';

// Mock the SignalR store
jest.mock('@/stores/signalr/signalr-store');

const mockUseSignalRStore = useSignalRStore as jest.MockedFunction<typeof useSignalRStore>;

// Create a custom hook to test the SignalR lifecycle logic
function useSignalRLifecycle(isActive: boolean, appState: AppStateStatus, isSignedIn: boolean, hasInitialized: boolean) {
  const signalRStore = useSignalRStore();

  React.useEffect(() => {
    // Handle app going to background
    if (!isActive && (appState === 'background' || appState === 'inactive') && hasInitialized && isSignedIn) {
      signalRStore.disconnectUpdateHub();
      signalRStore.disconnectGeolocationHub();
    }
  }, [isActive, appState, hasInitialized, isSignedIn, signalRStore]);

  React.useEffect(() => {
    // Handle app resuming from background
    if (isActive && appState === 'active' && hasInitialized && isSignedIn) {
      signalRStore.connectUpdateHub();
      signalRStore.connectGeolocationHub();
    }
  }, [isActive, appState, hasInitialized, isSignedIn, signalRStore]);

  return signalRStore;
}

describe('SignalR Lifecycle Management', () => {
  const mockConnectUpdateHub = jest.fn();
  const mockDisconnectUpdateHub = jest.fn();
  const mockConnectGeolocationHub = jest.fn();
  const mockDisconnectGeolocationHub = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SignalR store
    mockUseSignalRStore.mockReturnValue({
      connectUpdateHub: mockConnectUpdateHub,
      disconnectUpdateHub: mockDisconnectUpdateHub,
      connectGeolocationHub: mockConnectGeolocationHub,
      disconnectGeolocationHub: mockDisconnectGeolocationHub,
      isUpdateHubConnected: false,
      isGeolocationHubConnected: false,
    } as any);
  });

  it('should disconnect SignalR when app goes to background', async () => {
    const { rerender } = renderHook(
      ({ isActive, appState, isSignedIn, hasInitialized }) =>
        useSignalRLifecycle(isActive, appState, isSignedIn, hasInitialized),
      {
        initialProps: {
          isActive: true,
          appState: 'active' as AppStateStatus,
          isSignedIn: true,
          hasInitialized: true,
        },
      }
    );

    // Simulate app going to background
    rerender({
      isActive: false,
      appState: 'background' as AppStateStatus,
      isSignedIn: true,
      hasInitialized: true,
    });

    await waitFor(() => {
      expect(mockDisconnectUpdateHub).toHaveBeenCalled();
      expect(mockDisconnectGeolocationHub).toHaveBeenCalled();
    });
  });

  it('should reconnect SignalR when app becomes active again', async () => {
    const { rerender } = renderHook(
      ({ isActive, appState, isSignedIn, hasInitialized }) =>
        useSignalRLifecycle(isActive, appState, isSignedIn, hasInitialized),
      {
        initialProps: {
          isActive: false,
          appState: 'background' as AppStateStatus,
          isSignedIn: true,
          hasInitialized: true,
        },
      }
    );

    // Simulate app becoming active
    rerender({
      isActive: true,
      appState: 'active' as AppStateStatus,
      isSignedIn: true,
      hasInitialized: true,
    });

    await waitFor(() => {
      expect(mockConnectUpdateHub).toHaveBeenCalled();
      expect(mockConnectGeolocationHub).toHaveBeenCalled();
    });
  });

  it('should not manage SignalR connections when user is not signed in', async () => {
    const { rerender } = renderHook(
      ({ isActive, appState, isSignedIn, hasInitialized }) =>
        useSignalRLifecycle(isActive, appState, isSignedIn, hasInitialized),
      {
        initialProps: {
          isActive: true,
          appState: 'active' as AppStateStatus,
          isSignedIn: false,
          hasInitialized: true,
        },
      }
    );

    // Simulate app going to background
    rerender({
      isActive: false,
      appState: 'background' as AppStateStatus,
      isSignedIn: false,
      hasInitialized: true,
    });

    // Should not call SignalR methods when user is not signed in
    expect(mockDisconnectUpdateHub).not.toHaveBeenCalled();
    expect(mockDisconnectGeolocationHub).not.toHaveBeenCalled();
  });

  it('should not manage SignalR connections when app is not initialized', async () => {
    const { rerender } = renderHook(
      ({ isActive, appState, isSignedIn, hasInitialized }) =>
        useSignalRLifecycle(isActive, appState, isSignedIn, hasInitialized),
      {
        initialProps: {
          isActive: true,
          appState: 'active' as AppStateStatus,
          isSignedIn: true,
          hasInitialized: false,
        },
      }
    );

    // Simulate app going to background
    rerender({
      isActive: false,
      appState: 'background' as AppStateStatus,
      isSignedIn: true,
      hasInitialized: false,
    });

    // Should not call SignalR methods when app is not initialized
    expect(mockDisconnectUpdateHub).not.toHaveBeenCalled();
    expect(mockDisconnectGeolocationHub).not.toHaveBeenCalled();
  });
}); 