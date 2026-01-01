// Mock dependencies first
jest.mock('@/api/voice', () => ({
  getDepartmentAudioStreams: jest.fn(),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Audio } from 'expo-av';
import { getDepartmentAudioStreams } from '@/api/voice';
import { logger } from '@/lib/logging';
import { type DepartmentAudioResultStreamData } from '@/models/v4/voice/departmentAudioResultStreamData';
import { useAudioStreamStore } from '../audio-stream-store';

const mockGetDepartmentAudioStreams = getDepartmentAudioStreams as jest.MockedFunction<typeof getDepartmentAudioStreams>;
const mockAudio = Audio as jest.Mocked<typeof Audio>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('AudioStreamStore', () => {
  const mockStream: DepartmentAudioResultStreamData = {
    Id: '1',
    Name: 'Test Stream',
    Type: 'mp3',
    Url: 'https://example.com/stream.mp3',
  };

  const mockSoundObject = {
    playAsync: jest.fn(() => Promise.resolve()),
    pauseAsync: jest.fn(() => Promise.resolve()),
    unloadAsync: jest.fn(() => Promise.resolve()),
    replayAsync: jest.fn(() => Promise.resolve()),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store state
    useAudioStreamStore.setState({
      availableStreams: [],
      isLoadingStreams: false,
      currentStream: null,
      soundObject: null,
      isPlaying: false,
      isLoading: false,
      isBuffering: false,
      isBottomSheetVisible: false,
    });

    // Reset mock implementations
    mockSoundObject.playAsync.mockImplementation(() => Promise.resolve());
    mockSoundObject.pauseAsync.mockImplementation(() => Promise.resolve());
    mockSoundObject.unloadAsync.mockImplementation(() => Promise.resolve());
    mockSoundObject.replayAsync.mockImplementation(() => Promise.resolve());

    // Mock Audio methods
    mockAudio.setAudioModeAsync.mockResolvedValue(undefined);
    mockAudio.Sound.createAsync.mockResolvedValue({
      sound: mockSoundObject,
    } as any);
  });

  describe('initial state', () => {
    it('should have the correct initial state', () => {
      const state = useAudioStreamStore.getState();
      
      expect(state.availableStreams).toEqual([]);
      expect(state.isLoadingStreams).toBe(false);
      expect(state.currentStream).toBeNull();
      expect(state.soundObject).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isBuffering).toBe(false);
      expect(state.isBottomSheetVisible).toBe(false);
    });
  });

  describe('state setters', () => {
    it('should set available streams', () => {
      const streams = [mockStream];
      useAudioStreamStore.getState().setAvailableStreams(streams);
      
      expect(useAudioStreamStore.getState().availableStreams).toEqual(streams);
    });

    it('should set loading streams state', () => {
      useAudioStreamStore.getState().setIsLoadingStreams(true);
      
      expect(useAudioStreamStore.getState().isLoadingStreams).toBe(true);
    });

    it('should set current stream', () => {
      useAudioStreamStore.getState().setCurrentStream(mockStream);
      
      expect(useAudioStreamStore.getState().currentStream).toEqual(mockStream);
    });

    it('should set playing state', () => {
      useAudioStreamStore.getState().setIsPlaying(true);
      
      expect(useAudioStreamStore.getState().isPlaying).toBe(true);
    });

    it('should set loading state', () => {
      useAudioStreamStore.getState().setIsLoading(true);
      
      expect(useAudioStreamStore.getState().isLoading).toBe(true);
    });

    it('should set buffering state', () => {
      useAudioStreamStore.getState().setIsBuffering(true);
      
      expect(useAudioStreamStore.getState().isBuffering).toBe(true);
    });

    it('should set bottom sheet visibility', () => {
      useAudioStreamStore.getState().setIsBottomSheetVisible(true);
      
      expect(useAudioStreamStore.getState().isBottomSheetVisible).toBe(true);
    });
  });

  describe('fetchAvailableStreams', () => {
    it('should fetch streams successfully', async () => {
      const mockResponse = {
        PageSize: 0,
        Timestamp: '',
        Version: '',
        Node: '',
        RequestId: '',
        Status: '',
        Environment: '',
        Data: [mockStream],
      };
      
      mockGetDepartmentAudioStreams.mockResolvedValue(mockResponse);
      
      await useAudioStreamStore.getState().fetchAvailableStreams();
      
      const state = useAudioStreamStore.getState();
      expect(state.availableStreams).toEqual([mockStream]);
      expect(state.isLoadingStreams).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Audio streams fetched successfully',
        context: { count: 1 },
      });
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Fetch failed');
      mockGetDepartmentAudioStreams.mockRejectedValue(mockError);
      
      await useAudioStreamStore.getState().fetchAvailableStreams();
      
      const state = useAudioStreamStore.getState();
      expect(state.availableStreams).toEqual([]);
      expect(state.isLoadingStreams).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to fetch audio streams',
        context: { error: mockError },
      });
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        PageSize: 0,
        Timestamp: '',
        Version: '',
        Node: '',
        RequestId: '',
        Status: '',
        Environment: '',
        Data: null,
      };
      
      mockGetDepartmentAudioStreams.mockResolvedValue(mockResponse as any);
      
      await useAudioStreamStore.getState().fetchAvailableStreams();
      
      const state = useAudioStreamStore.getState();
      expect(state.availableStreams).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Audio streams fetched successfully',
        context: { count: 0 },
      });
    });
  });

  describe('playStream', () => {
    it('should play stream successfully', async () => {
      await useAudioStreamStore.getState().playStream(mockStream);
      
      const state = useAudioStreamStore.getState();
      expect(state.currentStream).toEqual(mockStream);
      expect(state.soundObject).toEqual(mockSoundObject);
      expect(state.isPlaying).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.isBuffering).toBe(false);
      
      expect(mockAudio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      expect(mockAudio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: mockStream.Url },
        {
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
          isMuted: false,
          progressUpdateIntervalMillis: 1000,
        },
        expect.any(Function)
      );
      
      expect(mockSoundObject.playAsync).toHaveBeenCalled();
      
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Starting audio stream',
        context: { streamName: mockStream.Name, streamUrl: mockStream.Url },
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Audio stream started successfully',
        context: { streamName: mockStream.Name },
      });
    });

    it('should stop current stream before playing new one', async () => {
      // Set up existing stream
      useAudioStreamStore.setState({
        soundObject: mockSoundObject,
        currentStream: mockStream,
        isPlaying: true,
      });
      
      const newStream = { ...mockStream, Id: '2', Name: 'New Stream' };
      
      await useAudioStreamStore.getState().playStream(newStream);
      
      expect(mockSoundObject.pauseAsync).toHaveBeenCalled();
      expect(mockSoundObject.unloadAsync).toHaveBeenCalled();
    });

    it('should handle play stream error', async () => {
      const mockError = new Error('Play failed');
      mockAudio.Sound.createAsync.mockRejectedValue(mockError);
      
      await useAudioStreamStore.getState().playStream(mockStream);
      
      const state = useAudioStreamStore.getState();
      expect(state.soundObject).toBeNull();
      expect(state.currentStream).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isBuffering).toBe(false);
      
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to play audio stream',
        context: { error: mockError, streamName: mockStream.Name },
      });
    });
  });

  describe('stopStream', () => {
    it('should stop stream successfully', async () => {
      // Set up playing stream
      useAudioStreamStore.setState({
        soundObject: mockSoundObject,
        currentStream: mockStream,
        isPlaying: true,
      });
      
      await useAudioStreamStore.getState().stopStream();
      
      const state = useAudioStreamStore.getState();
      expect(state.soundObject).toBeNull();
      expect(state.currentStream).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isBuffering).toBe(false);
      
      expect(mockSoundObject.pauseAsync).toHaveBeenCalled();
      expect(mockSoundObject.unloadAsync).toHaveBeenCalled();
      
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Audio stream stopped',
        context: { streamName: mockStream.Name },
      });
    });

    it('should handle stop stream error', async () => {
      const mockError = new Error('Stop failed');
      mockSoundObject.pauseAsync.mockRejectedValue(mockError);
      
      useAudioStreamStore.setState({
        soundObject: mockSoundObject,
        currentStream: mockStream,
        isPlaying: true,
      });
      
      await useAudioStreamStore.getState().stopStream();
      
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to stop audio stream',
        context: { error: mockError },
      });
    });

    it('should handle null sound object', async () => {
      useAudioStreamStore.setState({
        soundObject: null,
        currentStream: mockStream,
        isPlaying: true,
      });
      
      await useAudioStreamStore.getState().stopStream();
      
      const state = useAudioStreamStore.getState();
      expect(state.soundObject).toBeNull();
      expect(state.currentStream).toBeNull();
      expect(state.isPlaying).toBe(false);
      
      expect(mockSoundObject.pauseAsync).not.toHaveBeenCalled();
      expect(mockSoundObject.unloadAsync).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup successfully', async () => {
      useAudioStreamStore.setState({
        soundObject: mockSoundObject,
        currentStream: mockStream,
        isPlaying: true,
      });
      
      await useAudioStreamStore.getState().cleanup();
      
      const state = useAudioStreamStore.getState();
      expect(state.soundObject).toBeNull();
      expect(state.currentStream).toBeNull();
      expect(state.isPlaying).toBe(false);
      
      expect(mockSoundObject.pauseAsync).toHaveBeenCalled();
      expect(mockSoundObject.unloadAsync).toHaveBeenCalled();
      
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Audio stream store cleaned up',
      });
    });

    it('should handle cleanup error', async () => {
      const mockError = new Error('Cleanup failed');
      mockSoundObject.pauseAsync.mockRejectedValue(mockError);
      
      useAudioStreamStore.setState({
        soundObject: mockSoundObject,
        currentStream: mockStream,
        isPlaying: true,
      });
      
      await useAudioStreamStore.getState().cleanup();
      
      // The cleanup method calls stopStream, which catches its own errors
      // So we expect the stopStream error message, not the cleanup error message
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to stop audio stream',
        context: { error: mockError },
      });
    });
  });
});
