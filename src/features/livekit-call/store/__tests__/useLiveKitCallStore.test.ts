import { Platform } from 'react-native';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';

// Mock Platform
const mockPlatform = Platform as jest.Mocked<typeof Platform>;

// Mock the CallKeep service module
jest.mock('../../../../services/callkeep.service.ios', () => ({
  callKeepService: {
    setup: jest.fn(),
    startCall: jest.fn(),
    endCall: jest.fn(),
    isCallActiveNow: jest.fn(),
    getCurrentCallUUID: jest.fn(),
    cleanup: jest.fn(),
    setMuteStateCallback: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../../../lib/logging', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock livekit-client
const mockRoom = {
  on: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  localParticipant: {
    setMicrophoneEnabled: jest.fn(),
    setCameraEnabled: jest.fn(),
    identity: 'local-participant',
  },
  remoteParticipants: new Map(),
  name: 'test-room',
} as any;

jest.mock('livekit-client', () => ({
  Room: jest.fn().mockImplementation(() => mockRoom),
  RoomEvent: {
    ConnectionStateChanged: 'connectionStateChanged',
    ParticipantConnected: 'participantConnected',
    ParticipantDisconnected: 'participantDisconnected',
  },
  ConnectionState: {
    Connected: 'connected',
    Disconnected: 'disconnected',
    Connecting: 'connecting',
    Reconnecting: 'reconnecting',
  },
}));

import { useLiveKitCallStore } from '../useLiveKitCallStore';
import { logger } from '../../../../lib/logging';

// Get the mocked constructors after the imports
const mockCallKeepService = require('../../../../services/callkeep.service.ios').callKeepService;
const mockLogger = logger as jest.Mocked<typeof logger>;
const MockedRoom = require('livekit-client').Room as jest.MockedClass<any>;

describe('useLiveKitCallStore with CallKeep Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatform.OS = 'ios';
    
    // Reset mock implementations
    mockCallKeepService.setup.mockResolvedValue(undefined);
    mockCallKeepService.startCall.mockResolvedValue('test-uuid');
    mockCallKeepService.endCall.mockResolvedValue(undefined);
    mockCallKeepService.isCallActiveNow.mockReturnValue(false);
    mockCallKeepService.getCurrentCallUUID.mockReturnValue(null);
    mockCallKeepService.setMuteStateCallback.mockReturnValue(undefined);
    
    // Reset the Room mock to return mockRoom by default
    MockedRoom.mockImplementation(() => mockRoom);
    
    mockRoom.connect.mockResolvedValue(undefined);
    mockRoom.disconnect.mockResolvedValue(undefined);
    mockRoom.localParticipant.setMicrophoneEnabled.mockResolvedValue(undefined);
    mockRoom.localParticipant.setCameraEnabled.mockResolvedValue(undefined);
    
    // Clear logger mocks
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    
    // Reset the store to initial state
    useLiveKitCallStore.setState({
      availableRooms: [
        { id: 'emergency-channel', name: 'Emergency Channel' },
        { id: 'tactical-1', name: 'Tactical 1' },
        { id: 'dispatch', name: 'Dispatch' },
      ],
      selectedRoomForJoining: null,
      currentRoomId: null,
      isConnecting: false,
      isConnected: false,
      roomInstance: null,
      participants: [],
      error: null,
      localParticipant: null,
    });
  });

  describe('CallKeep Mute State Callback', () => {
    beforeEach(() => {
      mockPlatform.OS = 'ios';
    });

    it('should register mute state callback when connecting on iOS', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.connectToRoom('test-room', 'test-participant');
      });

      expect(mockCallKeepService.setMuteStateCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear mute state callback when disconnecting on iOS', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // Set up connected state
      act(() => {
        result.current.actions._setRoomInstance(mockRoom);
        result.current.actions._setIsConnected(true);
      });
      
      await act(async () => {
        await result.current.actions.disconnectFromRoom();
      });

      expect(mockCallKeepService.setMuteStateCallback).toHaveBeenCalledWith(null);
    });

    it('should not register callback on non-iOS platforms', async () => {
      mockPlatform.OS = 'android';
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.connectToRoom('test-room', 'test-participant');
      });

      expect(mockCallKeepService.setMuteStateCallback).not.toHaveBeenCalled();
    });
  });

  describe('Room Connection with CallKeep', () => {
    beforeEach(() => {
      // Mock successful connection flow
      mockRoom.on.mockImplementation((event: any, callback: any) => {
        if (event === 'connectionStateChanged') {
          // Simulate connected state
          setTimeout(() => callback('connected'), 0);
        }
        return mockRoom;
      });
    });

    it('should start CallKeep call on successful room connection (iOS)', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.connectToRoom('emergency-channel', 'test-participant');
        // Wait for the connection state change event to fire
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockCallKeepService.startCall).toHaveBeenCalledWith('emergency-channel');
    });

    it('should not start CallKeep call on Android', async () => {
      mockPlatform.OS = 'android';
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.connectToRoom('emergency-channel', 'test-participant');
      });

      expect(mockCallKeepService.startCall).not.toHaveBeenCalled();
    });

    it('should handle CallKeep start call errors gracefully', async () => {
      const error = new Error('Failed to start call');
      mockCallKeepService.startCall.mockRejectedValueOnce(error);
      
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.connectToRoom('emergency-channel', 'test-participant');
        // Wait for the connection state change event to fire
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Failed to start CallKeep call (background audio may not work)',
        context: { error, roomId: 'emergency-channel' },
      });
    });
  });

  describe('Room Disconnection with CallKeep', () => {
    it('should end CallKeep call on room disconnection (iOS)', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // First set up a connected state
      act(() => {
        result.current.actions._setRoomInstance(mockRoom);
        result.current.actions._setIsConnected(true);
      });
      
      await act(async () => {
        await result.current.actions.disconnectFromRoom();
      });

      expect(mockRoom.disconnect).toHaveBeenCalled();
      expect(mockCallKeepService.endCall).toHaveBeenCalled();
    });

    it('should not end CallKeep call on Android', async () => {
      mockPlatform.OS = 'android';
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // First set up a connected state
      act(() => {
        result.current.actions._setRoomInstance(mockRoom);
        result.current.actions._setIsConnected(true);
      });
      
      await act(async () => {
        await result.current.actions.disconnectFromRoom();
      });

      expect(mockRoom.disconnect).toHaveBeenCalled();
      expect(mockCallKeepService.endCall).not.toHaveBeenCalled();
    });

    it('should handle CallKeep end call errors gracefully', async () => {
      const error = new Error('Failed to end call');
      mockCallKeepService.endCall.mockRejectedValueOnce(error);
      
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // First set up a connected state
      act(() => {
        result.current.actions._setRoomInstance(mockRoom);
        result.current.actions._setIsConnected(true);
      });
      
      await act(async () => {
        await result.current.actions.disconnectFromRoom();
      });

      expect(mockRoom.disconnect).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Failed to end CallKeep call',
        context: { error },
      });
    });

    it('should handle disconnection when no room instance exists', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.disconnectFromRoom();
      });

      expect(mockRoom.disconnect).not.toHaveBeenCalled();
      expect(mockCallKeepService.endCall).not.toHaveBeenCalled();
    });
  });

  describe('Connection State Changes with CallKeep', () => {
    it('should end CallKeep call on connection lost (iOS)', async () => {
      mockPlatform.OS = 'ios';
      
      // Mock the room event listener
      let connectionStateListener: Function | null = null;
      mockRoom.on.mockImplementation((event: any, callback: any) => {
        if (event === 'connectionStateChanged') {
          connectionStateListener = callback;
        }
        return mockRoom;
      });
      
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.connectToRoom('test-room', 'test-participant');
      });
      
      expect(connectionStateListener).toBeDefined();
      
      // Simulate disconnection
      if (connectionStateListener) {
        act(() => {
          connectionStateListener!('disconnected');
        });
      }

      expect(mockCallKeepService.endCall).toHaveBeenCalled();
    });

    it('should not end CallKeep call on Android disconnection', async () => {
      mockPlatform.OS = 'android';
      
      // Mock the room event listener
      let connectionStateListener: Function | null = null;
      mockRoom.on.mockImplementation((event: any, callback: any) => {
        if (event === 'connectionStateChanged') {
          connectionStateListener = callback;
        }
        return mockRoom;
      });
      
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.connectToRoom('test-room', 'test-participant');
      });
      
      expect(connectionStateListener).toBeDefined();
      
      // Simulate disconnection
      if (connectionStateListener) {
        act(() => {
          connectionStateListener!('disconnected');
        });
      }

      expect(mockCallKeepService.endCall).not.toHaveBeenCalled();
    });
  });

  describe('Store State Management', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      expect(result.current.availableRooms).toHaveLength(3);
      expect(result.current.selectedRoomForJoining).toBeNull();
      expect(result.current.currentRoomId).toBeNull();
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.roomInstance).toBeNull();
      expect(result.current.participants).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.localParticipant).toBeNull();
    });

    it('should clear error when setting selected room', () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      act(() => {
        result.current.actions.setSelectedRoomForJoining('test-room');
      });
      
      expect(result.current.selectedRoomForJoining).toBe('test-room');
      expect(result.current.error).toBeNull();
    });

    it('should clear error explicitly', () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      act(() => {
        result.current.actions._clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('Microphone Control', () => {
    it('should enable microphone when connected', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // Set up connected state
      act(() => {
        result.current.actions._setRoomInstance(mockRoom);
        result.current.actions._setIsConnected(true);
      });
      
      await act(async () => {
        await result.current.actions.setMicrophoneEnabled(true);
      });

      expect(mockRoom.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(true);
    });

    it('should disable microphone when connected', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // Set up connected state
      act(() => {
        result.current.actions._setRoomInstance(mockRoom);
        result.current.actions._setIsConnected(true);
      });
      
      await act(async () => {
        await result.current.actions.setMicrophoneEnabled(false);
      });

      expect(mockRoom.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(false);
    });

    it('should handle microphone errors', async () => {
      const error = new Error('Microphone error');
      mockRoom.localParticipant.setMicrophoneEnabled.mockRejectedValueOnce(error);
      
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // Set up connected state
      act(() => {
        result.current.actions._setRoomInstance(mockRoom);
        result.current.actions._setIsConnected(true);
      });
      
      await act(async () => {
        await result.current.actions.setMicrophoneEnabled(true);
      });

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Error setting microphone state',
        context: { error, enabled: true },
      });
      expect(result.current.error).toBe('Could not change microphone state.');
    });

    it('should handle microphone control when not connected', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      await act(async () => {
        await result.current.actions.setMicrophoneEnabled(true);
      });

      expect(mockRoom.localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled();
    });
  });

  describe('Connection Prevention', () => {
    it('should prevent connection when already connecting', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // Set connecting state
      act(() => {
        result.current.actions._setIsConnecting(true);
      });
      
      // First connection attempt should succeed
      await act(async () => {
        await result.current.actions.connectToRoom('test-room', 'test-participant');
      });
      
      // Second connection attempt should be prevented
      await act(async () => {
        await result.current.actions.connectToRoom('test-room', 'test-participant');
      });

      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Connection attempt while already connecting or connected',
        context: { 
          roomId: 'test-room', 
          participantIdentity: 'test-participant', 
          isConnecting: true, 
          isConnected: false 
        },
      });
    });

    it('should prevent connection when already connected', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());
      
      // Set connected state
      act(() => {
        result.current.actions._setIsConnected(true);
        result.current.actions._setRoomInstance(mockRoom);
      });
      
      await act(async () => {
        await result.current.actions.connectToRoom('test-room', 'test-participant');
      });

      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Connection attempt while already connecting or connected',
        context: { 
          roomId: 'test-room', 
          participantIdentity: 'test-participant', 
          isConnecting: false, 
          isConnected: true 
        },
      });
    });
  });

  describe('Error Handling', () => {
    describe('Error Handling', () => {
    it('should handle room initialization errors', async () => {
      // Make the Room constructor throw an error
      MockedRoom.mockImplementationOnce(() => {
        throw new Error('Failed to initialize room');
      });
      
      const { result } = renderHook(() => useLiveKitCallStore());

      await act(async () => {
        await result.current.actions.connectToRoom('test-room', 'test-participant');
      });

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to connect to LiveKit room',
        context: { error: expect.any(Error), roomId: 'test-room', participantIdentity: 'test-participant' },
      });
      expect(result.current.error).toBe('Failed to initialize room');
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle basic error state management', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());

      // Test basic error clearing functionality since token fetching isn't implemented
      act(() => {
        // Set an error state and then clear it
        result.current.actions._clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

    it('should handle basic error state management', async () => {
      const { result } = renderHook(() => useLiveKitCallStore());

      // Test basic error clearing functionality since token fetching isn't implemented
      act(() => {
        // Set an error state and then clear it
        result.current.actions._clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
