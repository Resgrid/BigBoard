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

jest.mock('@/stores/security/store', () => ({
  securityStore: mockSecurityStore,
}));

jest.mock('../../security/store', () => ({
  securityStore: mockSecurityStore,
  useSecurityStore: mockSecurityStore,
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
import { useSignalRStore } from '../signalr-store';
import { logger } from '@/lib/logging';
import { signalRService } from '@/services/signalr.service';

describe('useSignalRStore', () => {
  const mockEventingUrl = 'https://eventing.example.com/';
  const mockDepartmentId = '123';

  beforeEach(() => {
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

    // Mock SignalR service methods
    (signalRService.connectToHubWithEventingUrl as jest.Mock).mockResolvedValue(undefined);
    (signalRService.disconnectFromHub as jest.Mock).mockResolvedValue(undefined);
    (signalRService.invoke as jest.Mock).mockResolvedValue(undefined);
    (signalRService.on as jest.Mock).mockImplementation(() => {});
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
  });

  describe('disconnectGeolocationHub', () => {
    it('should disconnect from geolocation hub successfully', async () => {
      const { result } = renderHook(() => useSignalRStore());

      await act(async () => {
        await result.current.disconnectGeolocationHub();
      });

      // The current implementation just sets state, doesn't call signalRService
      expect(result.current.isGeolocationHubConnected).toBe(false);
      expect(result.current.lastGeolocationMessage).toBeNull();
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
  });
});
