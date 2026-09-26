import { act, renderHook } from '@testing-library/react-native';

// Create the mock before any imports
const mockFetchConfig = jest.fn();
const mockCoreStoreGetState = jest.fn(() => ({
  config: {
    EventingUrl: 'https://eventing.example.com/',
  },
  isInitialized: true,
  isInitializing: false,
  fetchConfig: mockFetchConfig,
}));

const mockSecurityStore = {
  getState: jest.fn(() => ({
    rights: {
      DepartmentId: '123',
    },
  })),
};

// Mock all dependencies before importing anything
jest.mock('@/services/signalr.service', () => {
  const mockInstance = {
    connectToHubWithEventingUrl: jest.fn().mockResolvedValue(undefined),
    disconnectFromHub: jest.fn().mockResolvedValue(undefined),
    invoke: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    connectToHub: jest.fn().mockResolvedValue(undefined),
    disconnectAll: jest.fn().mockResolvedValue(undefined),
    registerConnectionStateCallbacks: jest.fn((_hubName: string, callbacks: unknown) => callbacks),
    unregisterConnectionStateCallbacks: jest.fn(),
    isHubConnected: jest.fn(() => false),
    isHubAvailable: jest.fn(() => false),
  };
  return {
    signalRService: mockInstance,
    default: mockInstance,
  };
});

// Mock the core store module directly - mock as a function that behaves like a Zustand store
jest.mock('../../app/core-store', () => {
  const createMockStore = () => {
    const mockStore = () => mockCoreStoreGetState();
    // Ensure getState always calls the current mock function
    mockStore.getState = () => mockCoreStoreGetState();
    mockStore.subscribe = jest.fn();
    mockStore.setState = jest.fn();
    mockStore.destroy = jest.fn();
    
    return mockStore;
  };
  
  return {
    useCoreStore: createMockStore(),
  };
});

// Resolved lazily: the factories run while the imports below are being hoisted, before
// mockSecurityStore is initialised, so capturing it directly would hand the store `undefined`.
jest.mock('@/stores/security/store', () => ({
  securityStore: { getState: () => mockSecurityStore.getState() },
}));

jest.mock('../../security/store', () => ({
  securityStore: { getState: () => mockSecurityStore.getState() },
  useSecurityStore: { getState: () => mockSecurityStore.getState() },
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  },
}));

jest.mock('@/lib/env', () => ({
  Env: {
    CHANNEL_HUB_NAME: 'eventingHub',
    REALTIME_GEO_HUB_NAME: 'geolocationHub',
  },
}));

jest.mock('@/lib', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      accessToken: 'mock-token',
    })),
  },
}));

// Import the store after all mocks are set up
import { GEOLOCATION_HUB_METHODS, HUB_REPAIR_MAX_BACKOFF_MS, UNKNOWN_PIN_REFRESH_COOLDOWN_MS, UNKNOWN_PIN_REFRESH_DELAY_MS, useSignalRStore } from '../signalr-store';
import { logger } from '@/lib/logging';
import { type SignalRConnectionStateCallbacks, signalRService } from '@/services/signalr.service';

// The service is a singleton whose listeners and state callbacks outlive a single test, so they are
// captured here (by event / hub name) rather than read back from mock.calls, which clearAllMocks wipes.
const mockEventHandlers = new Map<string, (data: unknown) => void>();
const mockStateCallbacks = new Map<string, SignalRConnectionStateCallbacks>();
const mockConnectedHubs = new Set<string>();

const mockService = signalRService as unknown as Record<string, jest.Mock>;

const installServiceFakes = () => {
  mockService.on.mockImplementation((event: string, callback: (data: unknown) => void) => {
    mockEventHandlers.set(event, callback);
  });
  mockService.registerConnectionStateCallbacks.mockImplementation((hubName: string, callbacks: SignalRConnectionStateCallbacks) => {
    mockStateCallbacks.set(hubName, callbacks);
    return callbacks;
  });
  mockService.unregisterConnectionStateCallbacks.mockImplementation((hubName: string) => {
    mockStateCallbacks.delete(hubName);
  });
  mockService.connectToHubWithEventingUrl.mockImplementation(async (config: { name: string }) => {
    mockConnectedHubs.add(config.name);
  });
  mockService.disconnectFromHub.mockImplementation(async (hubName: string) => {
    mockConnectedHubs.delete(hubName);
  });
  mockService.invoke.mockResolvedValue(undefined);
  mockService.isHubConnected.mockImplementation((hubName: string) => mockConnectedHubs.has(hubName));
  mockService.isHubAvailable.mockImplementation((hubName: string) => mockConnectedHubs.has(hubName));
};

const flushMicrotasks = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

const GEO_HUB = 'geolocationHub';
const UPDATE_HUB = 'eventingHub';
const USER_GUID = 'A1B2C3D4-0000-4E5F-8A9B-ABCDEFABCDEF';

const geolocationConnectCalls = () => mockService.invoke.mock.calls.filter((call: unknown[]) => call[1] === 'GeolocationConnect');

describe('useSignalRStore', () => {
  const mockEventingUrl = 'https://eventing.example.com/';
  const mockDepartmentId = '123';

  beforeEach(async () => {
    // Put the module-level connection state back to "nothing wanted, nothing joined" through the
    // public API, so each test starts from the same place.
    installServiceFakes();
    await useSignalRStore.getState().disconnectGeolocationHub();
    await useSignalRStore.getState().disconnectUpdateHub();
    useSignalRStore.getState().clearLiveLocations();
    mockConnectedHubs.clear();
    useSignalRStore.setState({
      isUpdateHubConnected: false,
      isGeolocationHubConnected: false,
      error: null,
      liveLocations: {},
      mapRefreshRequestTimestamp: 0,
      lastUpdateTimestamp: 0,
      lastCallsTimestamp: 0,
      lastUnitsTimestamp: 0,
      lastPersonnelTimestamp: 0,
      lastUpdateMessage: null,
      lastGeolocationMessage: null,
      lastGeolocationTimestamp: 0,
    });

    jest.clearAllMocks();

    // Reset the mock function to default behavior
    mockCoreStoreGetState.mockReturnValue({
      config: {
        EventingUrl: mockEventingUrl,
      },
      isInitialized: true,
      isInitializing: false,
      fetchConfig: mockFetchConfig,
    });

    // Reset fetchConfig mock
    mockFetchConfig.mockResolvedValue(undefined);

    // Mock security store
    mockSecurityStore.getState.mockReturnValue({
      rights: {
        DepartmentId: mockDepartmentId,
      },
    } as any);

    // Mock SignalR service methods (connections are tracked so isHubConnected tells the truth)
    installServiceFakes();
  });

  describe('Basic Store Functionality', () => {
    it('should create a store instance with correct initial state', () => {
      const { result } = renderHook(() => useSignalRStore());

      expect(result.current).toBeDefined();
      expect(typeof result.current.connectUpdateHub).toBe('function');
      expect(typeof result.current.disconnectUpdateHub).toBe('function');
      expect(typeof result.current.connectGeolocationHub).toBe('function');
      expect(typeof result.current.disconnectGeolocationHub).toBe('function');
      
      expect(result.current.isUpdateHubConnected).toBe(false);
      expect(result.current.isGeolocationHubConnected).toBe(false);
      expect(result.current.lastUpdateMessage).toBeNull();
      expect(result.current.lastGeolocationMessage).toBeNull();
      expect(result.current.lastUpdateTimestamp).toBe(0);
      expect(result.current.lastGeolocationTimestamp).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('connectUpdateHub', () => {
    it('should handle missing EventingUrl and attempt to fetch config', async () => {
      // Mock core store without EventingUrl, not initialized
      mockCoreStoreGetState.mockReturnValue({
        config: {
          EventingUrl: undefined,
        } as any,
        isInitialized: false,
        isInitializing: false,
        fetchConfig: mockFetchConfig,
      });

      // Mock fetchConfig to fail (simulating inability to get EventingUrl)
      mockFetchConfig.mockRejectedValue(new Error('Config fetch failed'));

      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        try {
          await result.current.connectUpdateHub();
        } catch {
          // Expected to throw
        }
      });

      expect(signalRService.connectToHubWithEventingUrl).not.toHaveBeenCalled();
      expect(result.current.error).toEqual(
        new Error('Failed to fetch config for SignalR connection')
      );

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to fetch config for SignalR connection',
        context: { error: expect.any(Error) },
      });
    });

    it('should handle missing config and attempt to fetch it', async () => {
      // Mock core store without config
      mockCoreStoreGetState.mockReturnValue({
        config: null as any,
        isInitialized: false,
        isInitializing: false,
        fetchConfig: mockFetchConfig,
      });

      // Mock fetchConfig to fail
      mockFetchConfig.mockRejectedValue(new Error('Config fetch failed'));

      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        try {
          await result.current.connectUpdateHub();
        } catch {
          // Expected to throw
        }
      });

      expect(signalRService.connectToHubWithEventingUrl).not.toHaveBeenCalled();
      expect(result.current.error).toEqual(
        new Error('Failed to fetch config for SignalR connection')
      );
    });

    it('should successfully connect after fetching config', async () => {
      let callCount = 0;
      // First call returns no EventingUrl, subsequent calls return it
      mockCoreStoreGetState.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return {
            config: { EventingUrl: undefined as any },
            isInitialized: false,
            isInitializing: false,
            fetchConfig: mockFetchConfig,
          };
        }
        return {
          config: { EventingUrl: mockEventingUrl },
          isInitialized: true,
          isInitializing: false,
          fetchConfig: mockFetchConfig,
        };
      });

      mockFetchConfig.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        await result.current.connectUpdateHub();
      });

      expect(mockFetchConfig).toHaveBeenCalled();
      expect(signalRService.connectToHubWithEventingUrl).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      (signalRService.connectToHubWithEventingUrl as jest.Mock).mockRejectedValue(connectionError);

      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        await result.current.connectUpdateHub();
      });

      expect(result.current.error).toEqual(connectionError);
      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to connect to SignalR hubs',
        context: { error: connectionError },
      });
    });
  });

  describe('disconnectUpdateHub', () => {
    it('should disconnect from update hub successfully', async () => {
      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        await result.current.disconnectUpdateHub();
      });

      expect(signalRService.disconnectFromHub).toHaveBeenCalledWith('eventingHub');
      expect(result.current.isUpdateHubConnected).toBe(false);
      expect(result.current.lastUpdateMessage).toBeNull();
    });

    it('should handle disconnect errors', async () => {
      const disconnectError = new Error('Disconnect failed');
      (signalRService.disconnectFromHub as jest.Mock).mockRejectedValue(disconnectError);

      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        await result.current.disconnectUpdateHub();
      });

      expect(result.current.error).toEqual(disconnectError);
      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to disconnect from SignalR hubs',
        context: { error: disconnectError },
      });
    });
  });

  describe('connectGeolocationHub', () => {
    it('should handle missing EventingUrl and attempt to fetch config', async () => {
      // Mock core store without EventingUrl
      mockCoreStoreGetState.mockReturnValue({
        config: {
          EventingUrl: undefined,
        } as any,
        isInitialized: false,
        isInitializing: false,
        fetchConfig: mockFetchConfig,
      });

      // Mock fetchConfig to fail
      mockFetchConfig.mockRejectedValue(new Error('Config fetch failed'));

      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        try {
          await result.current.connectGeolocationHub();
        } catch {
          // Expected to throw
        }
      });

      expect(signalRService.connectToHubWithEventingUrl).not.toHaveBeenCalled();
      expect(result.current.error).toEqual(
        new Error('Failed to fetch config for geolocation hub connection')
      );
    });

    it('opens the geolocation hub and joins the department group with a zero-argument GeolocationConnect', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });

      expect(signalRService.connectToHubWithEventingUrl).toHaveBeenCalledWith({
        name: GEO_HUB,
        eventingUrl: mockEventingUrl,
        hubName: GEO_HUB,
        methods: GEOLOCATION_HUB_METHODS,
      });
      expect(GEOLOCATION_HUB_METHODS).toEqual(['onUnitLocationUpdated', 'onPersonnelLocationUpdated', 'onGeolocationConnect']);

      const joins = geolocationConnectCalls();
      expect(joins).toHaveLength(1);
      // Exactly (hubName, method): no data argument, or the server rejects the call
      expect(joins[0]).toEqual([GEO_HUB, 'GeolocationConnect']);

      // Listeners are in place before the connection is opened
      expect(mockEventHandlers.has('onUnitLocationUpdated')).toBe(true);
      expect(mockEventHandlers.has('onPersonnelLocationUpdated')).toBe(true);
      expect(mockEventHandlers.has('onGeolocationConnect')).toBe(true);
    });

    it('reports connected only once the server confirms the join', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });

      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);

      act(() => {
        mockEventHandlers.get('onGeolocationConnect')?.('connection-1');
      });

      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(true);
    });

    it('does not let a stale connected flag block a repair', async () => {
      useSignalRStore.setState({ isGeolocationHubConnected: true });

      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });

      expect(signalRService.connectToHubWithEventingUrl).toHaveBeenCalledTimes(1);
      expect(geolocationConnectCalls()).toHaveLength(1);
    });

    it('does nothing when already connected and joined', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
        mockEventHandlers.get('onGeolocationConnect')?.('connection-1');
      });
      jest.clearAllMocks();

      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });

      expect(signalRService.connectToHubWithEventingUrl).not.toHaveBeenCalled();
      expect(signalRService.invoke).not.toHaveBeenCalled();
    });

    it('records the error and stays disconnected when the join fails', async () => {
      const joinError = new Error('HubException: Method does not exist');
      mockService.invoke.mockRejectedValueOnce(joinError);

      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });

      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);
      expect(useSignalRStore.getState().error).toBe(joinError);
      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to connect to geolocation hub',
        context: { error: joinError },
      });
    });

    it('ignores a late join confirmation after the hub was disconnected', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
        await useSignalRStore.getState().disconnectGeolocationHub();
      });

      act(() => {
        mockEventHandlers.get('onGeolocationConnect')?.('stale-connection');
      });

      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);
    });
  });

  describe('geolocation hub reconnects', () => {
    const connectAndJoin = async () => {
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
        mockEventHandlers.get('onGeolocationConnect')?.('connection-1');
      });
    };

    it('marks the hub disconnected while reconnecting and after close', async () => {
      await connectAndJoin();
      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(true);

      act(() => {
        mockStateCallbacks.get(GEO_HUB)?.onReconnecting?.();
      });
      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);

      await connectAndJoin();
      act(() => {
        mockStateCallbacks.get(GEO_HUB)?.onClose?.();
      });
      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);
    });

    it('re-invokes GeolocationConnect after every reconnect (automatic reconnect and the service rebuild both report onReconnected)', async () => {
      await connectAndJoin();
      jest.clearAllMocks();

      // First reconnect
      await act(async () => {
        mockStateCallbacks.get(GEO_HUB)?.onReconnecting?.();
        mockStateCallbacks.get(GEO_HUB)?.onReconnected?.();
        await flushMicrotasks();
      });
      expect(geolocationConnectCalls()).toEqual([[GEO_HUB, 'GeolocationConnect']]);
      // Not connected until the server confirms the new connection's join
      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);

      act(() => {
        mockEventHandlers.get('onGeolocationConnect')?.('connection-2');
      });
      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(true);

      // A second, independent reconnect joins again
      await act(async () => {
        mockStateCallbacks.get(GEO_HUB)?.onReconnected?.();
        await flushMicrotasks();
      });
      expect(geolocationConnectCalls()).toHaveLength(2);
    });

    it('requests one catch-up map refresh per re-join, but not on the first join', async () => {
      await connectAndJoin();
      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBe(0);

      await act(async () => {
        mockStateCallbacks.get(GEO_HUB)?.onReconnected?.();
        await flushMicrotasks();
      });

      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBeGreaterThan(0);
    });

    it('also treats connecting again after a disconnect (app resume) as a re-join', async () => {
      await connectAndJoin();
      await act(async () => {
        await useSignalRStore.getState().disconnectGeolocationHub();
      });
      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBe(0);

      await connectAndJoin();

      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBeGreaterThan(0);
    });

    it('logs and leaves the repair to the watchdog when the re-join fails', async () => {
      await connectAndJoin();
      const joinError = new Error('Invocation canceled');
      mockService.invoke.mockRejectedValueOnce(joinError);

      await act(async () => {
        mockStateCallbacks.get(GEO_HUB)?.onReconnected?.();
        await flushMicrotasks();
      });

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to re-join geolocation hub department group after reconnect',
        context: { error: joinError },
      });
      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);
    });
  });

  describe('update hub reconnects', () => {
    it('re-invokes connect with the department id after a reconnect and nudges every widget to refetch', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectUpdateHub();
      });
      expect(signalRService.invoke).toHaveBeenCalledWith(UPDATE_HUB, 'connect', 123);
      jest.clearAllMocks();

      await act(async () => {
        mockStateCallbacks.get(UPDATE_HUB)?.onReconnecting?.();
        mockStateCallbacks.get(UPDATE_HUB)?.onReconnected?.();
        await flushMicrotasks();
      });

      expect(signalRService.invoke).toHaveBeenCalledTimes(1);
      expect(signalRService.invoke).toHaveBeenCalledWith(UPDATE_HUB, 'connect', 123);

      const state = useSignalRStore.getState();
      expect(state.isUpdateHubConnected).toBe(true);
      expect(state.lastCallsTimestamp).toBeGreaterThan(0);
      expect(state.lastUnitsTimestamp).toBeGreaterThan(0);
      expect(state.lastPersonnelTimestamp).toBeGreaterThan(0);
      expect(state.lastUpdateTimestamp).toBeGreaterThan(0);
    });

    it('does not let a stale connected flag block a reconnect', async () => {
      useSignalRStore.setState({ isUpdateHubConnected: true });

      await act(async () => {
        await useSignalRStore.getState().connectUpdateHub();
      });

      expect(signalRService.connectToHubWithEventingUrl).toHaveBeenCalledTimes(1);
      expect(signalRService.invoke).toHaveBeenCalledWith(UPDATE_HUB, 'connect', 123);
    });
  });

  describe('geolocation pushes', () => {
    beforeEach(async () => {
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });
    });

    const pushUnit = (payload: unknown) => mockEventHandlers.get('onUnitLocationUpdated')?.(payload);
    const pushPersonnel = (payload: unknown) => mockEventHandlers.get('onPersonnelLocationUpdated')?.(payload);

    it('stores the latest position per unit and per person', () => {
      act(() => {
        pushUnit({ departmentId: 1, unitId: '12', latitude: 39.5, longitude: -119.8, recordId: 'r1', timestamp: '2026-09-25T14:03:11.123Z' });
        pushPersonnel({ departmentId: 1, userId: USER_GUID, latitude: 39.6, longitude: -119.9, recordId: 'r2', timestamp: null });
      });

      const { liveLocations, lastGeolocationTimestamp } = useSignalRStore.getState();
      expect(liveLocations.u12).toMatchObject({ pinId: 'u12', latitude: 39.5, longitude: -119.8, timestamp: Date.parse('2026-09-25T14:03:11.123Z') });
      expect(liveLocations[`p${USER_GUID.toLowerCase()}`]).toMatchObject({ latitude: 39.6, longitude: -119.9, timestamp: null });
      expect(lastGeolocationTimestamp).toBeGreaterThan(0);
    });

    it('keeps every entity from a burst dispatched in one frame', () => {
      act(() => {
        pushUnit({ unitId: '1', latitude: 1, longitude: 1 });
        pushUnit({ unitId: '2', latitude: 2, longitude: 2 });
        pushUnit(JSON.stringify({ UnitId: '3', Latitude: 3, Longitude: 3 }));
      });

      expect(Object.keys(useSignalRStore.getState().liveLocations).sort()).toEqual(['u1', 'u2', 'u3']);
    });

    it('ignores a fix older than the one already applied for the same entity', () => {
      act(() => {
        pushUnit({ unitId: '12', latitude: 10, longitude: 10, timestamp: '2026-09-25T14:05:00Z' });
        pushUnit({ unitId: '12', latitude: 20, longitude: 20, timestamp: '2026-09-25T14:04:00Z' });
      });

      expect(useSignalRStore.getState().liveLocations.u12).toMatchObject({ latitude: 10, longitude: 10 });
    });

    it('ignores payloads without usable coordinates', () => {
      const before = useSignalRStore.getState().liveLocations;

      act(() => {
        pushUnit({ unitId: '12', latitude: 0, longitude: 0 });
        pushPersonnel({ userId: USER_GUID, latitude: 95, longitude: 10 });
      });

      expect(useSignalRStore.getState().liveLocations).toBe(before);
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });

    it('clears live locations', () => {
      act(() => {
        pushUnit({ unitId: '12', latitude: 10, longitude: 10 });
        useSignalRStore.getState().clearLiveLocations();
      });

      expect(useSignalRStore.getState().liveLocations).toEqual({});
    });
  });

  describe('map refresh requests', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('requestMapRefresh always moves strictly above lastUpdateTimestamp', () => {
      const future = Date.now() + 60_000;
      useSignalRStore.setState({ lastUpdateTimestamp: future });

      act(() => {
        useSignalRStore.getState().requestMapRefresh();
      });

      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBeGreaterThan(future);
    });

    it('coalesces unknown pins into one delayed refresh and rate-limits each pin', () => {
      jest.useFakeTimers();

      act(() => {
        useSignalRStore.getState().reportUnknownLivePins(['u1', 'u2']);
        useSignalRStore.getState().reportUnknownLivePins(['u3']);
      });

      jest.advanceTimersByTime(UNKNOWN_PIN_REFRESH_DELAY_MS - 1);
      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1);
      });
      const firstRefresh = useSignalRStore.getState().mapRefreshRequestTimestamp;
      expect(firstRefresh).toBeGreaterThan(0);

      // Same pins again inside the cooldown: no further refetch
      act(() => {
        useSignalRStore.getState().reportUnknownLivePins(['u1', 'u2', 'u3']);
        jest.advanceTimersByTime(UNKNOWN_PIN_REFRESH_DELAY_MS * 2);
      });
      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBe(firstRefresh);

      // After the cooldown the same pin may ask once more
      act(() => {
        jest.advanceTimersByTime(UNKNOWN_PIN_REFRESH_COOLDOWN_MS);
        useSignalRStore.getState().reportUnknownLivePins(['u1']);
        jest.advanceTimersByTime(UNKNOWN_PIN_REFRESH_DELAY_MS);
      });
      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBeGreaterThan(firstRefresh);
    });

    it('clearLiveLocations cancels a pending unknown-pin refresh', () => {
      jest.useFakeTimers();

      act(() => {
        useSignalRStore.getState().reportUnknownLivePins(['u77']);
        useSignalRStore.getState().clearLiveLocations();
        jest.advanceTimersByTime(UNKNOWN_PIN_REFRESH_DELAY_MS * 2);
      });

      expect(useSignalRStore.getState().mapRefreshRequestTimestamp).toBe(0);
    });
  });

  describe('ensureHubConnections (watchdog)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('reconnects and re-joins a wanted hub the service has given up on', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });
      mockConnectedHubs.delete(GEO_HUB); // max attempts reached / rebuild failed: no connection left
      jest.clearAllMocks();

      await act(async () => {
        await useSignalRStore.getState().ensureHubConnections();
      });

      expect(signalRService.connectToHubWithEventingUrl).toHaveBeenCalledWith(expect.objectContaining({ name: GEO_HUB }));
      expect(geolocationConnectCalls()).toHaveLength(1);
    });

    it('re-joins a hub that is connected but not in its group', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectUpdateHub();
      });
      mockService.invoke.mockRejectedValueOnce(new Error('Invocation canceled'));
      await act(async () => {
        mockStateCallbacks.get(UPDATE_HUB)?.onReconnected?.();
        await flushMicrotasks();
      });
      jest.clearAllMocks();

      await act(async () => {
        await useSignalRStore.getState().ensureHubConnections();
      });

      expect(signalRService.invoke).toHaveBeenCalledWith(UPDATE_HUB, 'connect', 123);
    });

    it('leaves healthy hubs and deliberately disconnected hubs alone', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectUpdateHub();
        await useSignalRStore.getState().connectGeolocationHub();
        await useSignalRStore.getState().disconnectGeolocationHub();
      });
      jest.clearAllMocks();

      await act(async () => {
        await useSignalRStore.getState().ensureHubConnections();
      });

      expect(signalRService.connectToHubWithEventingUrl).not.toHaveBeenCalled();
      expect(signalRService.invoke).not.toHaveBeenCalled();
    });

    it('backs off after a failed repair', async () => {
      jest.useFakeTimers();
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });
      mockConnectedHubs.delete(GEO_HUB);
      mockService.connectToHubWithEventingUrl.mockRejectedValue(new Error('Negotiation failed'));
      jest.clearAllMocks();

      await act(async () => {
        await useSignalRStore.getState().ensureHubConnections();
        await useSignalRStore.getState().ensureHubConnections();
      });
      expect(signalRService.connectToHubWithEventingUrl).toHaveBeenCalledTimes(1);

      // Once the backoff has elapsed it tries again -- and a success clears the backoff
      installServiceFakes();
      jest.setSystemTime(Date.now() + HUB_REPAIR_MAX_BACKOFF_MS + 1);
      await act(async () => {
        await useSignalRStore.getState().ensureHubConnections();
      });
      expect(signalRService.connectToHubWithEventingUrl).toHaveBeenCalledTimes(2);
      expect(mockConnectedHubs.has(GEO_HUB)).toBe(true);
    });
  });

  describe('disconnectGeolocationHub', () => {
    it('closes the geolocation hub connection', async () => {
      await act(async () => {
        await useSignalRStore.getState().connectGeolocationHub();
      });

      await act(async () => {
        await useSignalRStore.getState().disconnectGeolocationHub();
      });

      expect(signalRService.unregisterConnectionStateCallbacks).toHaveBeenCalledWith(GEO_HUB, expect.any(Object));
      expect(signalRService.disconnectFromHub).toHaveBeenCalledWith(GEO_HUB);
      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);
      expect(useSignalRStore.getState().lastGeolocationMessage).toBeNull();
    });

    it('should handle disconnect and reset state', async () => {
      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        await result.current.disconnectGeolocationHub();
      });

      expect(result.current.isGeolocationHubConnected).toBe(false);
      expect(result.current.lastGeolocationMessage).toBeNull();
      expect(logger.info).toHaveBeenCalledWith({ message: 'Geolocation hub disconnected' });
    });

    it('reports not connected even if closing the connection fails', async () => {
      useSignalRStore.setState({ isGeolocationHubConnected: true });
      mockService.disconnectFromHub.mockRejectedValueOnce(new Error('stop failed'));

      await act(async () => {
        await useSignalRStore.getState().disconnectGeolocationHub();
      });

      expect(useSignalRStore.getState().isGeolocationHubConnected).toBe(false);
    });
  });
});
