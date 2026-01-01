import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockSound = {
  setPositionAsync: jest.fn(),
  playAsync: jest.fn(),
  unloadAsync: jest.fn(),
  getStatusAsync: jest.fn(),
} as any;

const mockAsset = {
  downloadAsync: jest.fn(),
  localUri: 'mock://local-uri',
  uri: 'mock://uri',
} as any;

// Mock expo-modules-core first to prevent NativeUnimoduleProxy errors
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  requireNativeModule: jest.fn(),
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
    fromModule: jest.fn(() => mockAsset),
  },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    Sound: {
      createAsync: jest.fn(),
    },
  },
  InterruptionModeIOS: {
    DoNotMix: 'doNotMix',
    DuckOthers: 'duckOthers',
    MixWithOthers: 'mixWithOthers',
  },
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj: any) => obj.ios),
  },
}));

// Mock logger
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock audio files with proper paths
jest.mock('@assets/audio/ui/space_notification1.mp3', () => 'mocked-start-transmitting-sound', { virtual: true });
jest.mock('@assets/audio/ui/space_notification2.mp3', () => 'mocked-stop-transmitting-sound', { virtual: true });
jest.mock('@assets/audio/ui/positive_interface_beep.mp3', () => 'mocked-connected-device-sound', { virtual: true });
jest.mock('@assets/audio/ui/software_interface_start.mp3', () => 'mocked-connect-to-audio-room-sound', { virtual: true });
jest.mock('@assets/audio/ui/software_interface_back.mp3', () => 'mocked-disconnected-from-audio-room-sound', { virtual: true });

import { Asset } from 'expo-asset';
import { Audio, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';
import { logger } from '@/lib/logging';

const mockAssetLoadAsync = Asset.loadAsync as jest.MockedFunction<typeof Asset.loadAsync>;
const mockAssetFromModule = Asset.fromModule as jest.MockedFunction<typeof Asset.fromModule>;
const mockAudioSetAudioModeAsync = Audio.setAudioModeAsync as jest.MockedFunction<typeof Audio.setAudioModeAsync>;
const mockSoundCreateAsync = Audio.Sound.createAsync as jest.MockedFunction<typeof Audio.Sound.createAsync>;

describe('AudioService', () => {
  let audioService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set up mocks with proper return values BEFORE importing the service
    mockAssetLoadAsync.mockResolvedValue([] as any);
    mockAssetFromModule.mockReturnValue(mockAsset);
    (mockAudioSetAudioModeAsync as jest.MockedFunction<any>).mockResolvedValue(undefined);
    (mockSoundCreateAsync as jest.MockedFunction<any>).mockResolvedValue({ sound: mockSound, status: {} });
    mockAsset.downloadAsync.mockResolvedValue(undefined);
    mockSound.setPositionAsync.mockResolvedValue({} as any);
    mockSound.playAsync.mockResolvedValue({} as any);
    mockSound.unloadAsync.mockResolvedValue({} as any);
    mockSound.getStatusAsync.mockResolvedValue({ isLoaded: true } as any);

    // Clear the module cache to ensure fresh imports
    delete require.cache[require.resolve('../audio.service')];

    // Import the service after setting up mocks
    const AudioServiceModule = require('../audio.service');
    audioService = AudioServiceModule.audioService;

    // Reset the initialization flag and manually trigger initialization to ensure it runs with our mocks
    (audioService as any).isInitialized = false;
    await audioService.initialize();
  });

  describe('initialization', () => {
    it('should initialize audio service successfully', async () => {
      expect(logger.info).toHaveBeenCalledWith({
        message: 'Audio service initialized successfully',
      });
    });

    it('should set audio mode correctly', () => {
      expect(mockAudioSetAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: true,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true,
        interruptionModeIOS: 'doNotMix',
      });
    });

    it('should preload all audio assets', () => {
      expect(mockAssetLoadAsync).toHaveBeenCalledTimes(5);
    });

    it('should load all audio files', () => {
      expect(mockAssetFromModule).toHaveBeenCalledTimes(5);
      expect(mockSoundCreateAsync).toHaveBeenCalledTimes(5);
    });
  });

  describe('playStartTransmittingSound', () => {
    it('should play start transmitting sound successfully', async () => {
      jest.clearAllMocks();

      await audioService.playStartTransmittingSound();

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should handle start transmitting sound playback errors', async () => {
      jest.clearAllMocks();
      mockSound.playAsync.mockRejectedValueOnce(new Error('Playback failed'));

      await audioService.playStartTransmittingSound();

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to play sound',
        context: { soundName: 'startTransmitting', error: expect.any(Error) },
      });
    });
  });

  describe('playStopTransmittingSound', () => {
    it('should play stop transmitting sound successfully', async () => {
      jest.clearAllMocks();

      await audioService.playStopTransmittingSound();

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should handle stop transmitting sound playback errors', async () => {
      jest.clearAllMocks();
      mockSound.playAsync.mockRejectedValueOnce(new Error('Playback failed'));

      await audioService.playStopTransmittingSound();

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to play sound',
        context: { soundName: 'stopTransmitting', error: expect.any(Error) },
      });
    });
  });

  describe('playConnectedDeviceSound', () => {
    it('should play connected device sound successfully', async () => {
      jest.clearAllMocks();

      await audioService.playConnectedDeviceSound();

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should handle connected device sound playback errors', async () => {
      jest.clearAllMocks();
      mockSound.playAsync.mockRejectedValueOnce(new Error('Playback failed'));

      await audioService.playConnectedDeviceSound();

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to play sound',
        context: { soundName: 'connectedDevice', error: expect.any(Error) },
      });
    });
  });

  describe('playConnectToAudioRoomSound', () => {
    it('should play connect to audio room sound successfully', async () => {
      jest.clearAllMocks();

      await audioService.playConnectToAudioRoomSound();

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should handle connect to audio room sound playback errors', async () => {
      jest.clearAllMocks();
      mockSound.playAsync.mockRejectedValueOnce(new Error('Playback failed'));

      await audioService.playConnectToAudioRoomSound();

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to play sound',
        context: { soundName: 'connectedToAudioRoom', error: expect.any(Error) },
      });
    });
  });

  describe('playDisconnectedFromAudioRoomSound', () => {
    it('should play disconnected from audio room sound successfully', async () => {
      jest.clearAllMocks();

      await audioService.playDisconnectedFromAudioRoomSound();

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should handle disconnected from audio room sound playback errors', async () => {
      jest.clearAllMocks();
      mockSound.playAsync.mockRejectedValueOnce(new Error('Playback failed'));

      await audioService.playDisconnectedFromAudioRoomSound();

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to play sound',
        context: { soundName: 'disconnectedFromAudioRoom', error: expect.any(Error) },
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup audio resources successfully', async () => {
      jest.clearAllMocks();

      await audioService.cleanup();

      expect(mockSound.unloadAsync).toHaveBeenCalledTimes(5);
      expect(logger.info).toHaveBeenCalledWith({
        message: 'Audio service cleaned up',
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      // Set up a fresh service instance for this test
      jest.clearAllMocks();
      mockSound.unloadAsync.mockRejectedValueOnce(new Error('Unload failed'));

      // Clear module cache and re-import to get fresh instance
      delete require.cache[require.resolve('../audio.service')];
      const AudioServiceModule = require('../audio.service');
      const testService = AudioServiceModule.audioService;
      (testService as any).isInitialized = false;
      await testService.initialize();

      await testService.cleanup();

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Error during audio service cleanup',
        context: { error: expect.any(Error) },
      });
    });
  });

  describe('error handling', () => {
    it('should handle null sound objects gracefully', async () => {
      // Create a new service instance with createAsync that doesn't return sound
      jest.clearAllMocks();
      delete require.cache[require.resolve('../audio.service')];

      // Mock createAsync to return null sound to simulate failed sound creation
      (mockSoundCreateAsync as jest.MockedFunction<any>).mockResolvedValue({ sound: null, status: {} });

      const AudioServiceModule = require('../audio.service');
      const testService = AudioServiceModule.audioService;

      (testService as any).isInitialized = false;
      await testService.initialize();
      await testService.playStartTransmittingSound();

      expect(logger.warn).toHaveBeenCalledWith({
        message: 'Sound not loaded: startTransmitting',
      });
    });

    it('should handle initialization failures', async () => {
      jest.clearAllMocks();
      (mockAudioSetAudioModeAsync as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('Audio mode failed'));

      // Re-import to trigger new initialization
      delete require.cache[require.resolve('../audio.service')];
      const AudioServiceModule = require('../audio.service');
      const testService = AudioServiceModule.audioService;

      (testService as any).isInitialized = false;
      await testService.initialize();

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Failed to initialize audio service',
        context: { error: expect.any(Error) },
      });
    });
  });
});
