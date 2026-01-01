import { Asset } from 'expo-asset';
import { Audio, type AVPlaybackSource, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';

import { logger } from '@/lib/logging';

class AudioService {
  private static instance: AudioService;
  private startTransmittingSound: Audio.Sound | null = null;
  private stopTransmittingSound: Audio.Sound | null = null;
  private connectedDeviceSound: Audio.Sound | null = null;
  private connectToAudioRoomSound: Audio.Sound | null = null;
  private disconnectedFromAudioRoomSound: Audio.Sound | null = null;
  private isInitialized = false;

  private constructor() {
    this.initializeAudio();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public async initialize(): Promise<void> {
    await this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Configure audio mode for production builds
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      });

      // Pre-load audio assets for production builds
      await this.preloadAudioAssets();

      // Load audio files
      await this.loadAudioFiles();

      this.isInitialized = true;

      logger.info({
        message: 'Audio service initialized successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to initialize audio service',
        context: { error },
      });
    }
  }

  public async preloadAudioAssets(): Promise<void> {
    try {
      await Promise.all([
        Asset.loadAsync(require('@assets/audio/ui/space_notification1.mp3')),
        Asset.loadAsync(require('@assets/audio/ui/space_notification2.mp3')),
        Asset.loadAsync(require('@assets/audio/ui/positive_interface_beep.mp3')),
        Asset.loadAsync(require('@assets/audio/ui/software_interface_start.mp3')),
        Asset.loadAsync(require('@assets/audio/ui/software_interface_back.mp3')),
      ]);

      logger.debug({
        message: 'Audio assets preloaded successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Error preloading audio assets',
        context: { error },
      });
    }
  }

  private async loadAudioFiles(): Promise<void> {
    try {
      // Load start transmitting sound
      const startTransmittingSoundAsset = Asset.fromModule(require('@assets/audio/ui/space_notification1.mp3'));
      await startTransmittingSoundAsset.downloadAsync();

      const { sound: startSound } = await Audio.Sound.createAsync({ uri: startTransmittingSoundAsset.localUri || startTransmittingSoundAsset.uri } as AVPlaybackSource, {
        shouldPlay: false,
        isLooping: false,
        volume: 1.0,
      });
      this.startTransmittingSound = startSound;

      // Load stop transmitting sound
      const stopTransmittingSoundAsset = Asset.fromModule(require('@assets/audio/ui/space_notification2.mp3'));
      await stopTransmittingSoundAsset.downloadAsync();

      const { sound: stopSound } = await Audio.Sound.createAsync({ uri: stopTransmittingSoundAsset.localUri || stopTransmittingSoundAsset.uri } as AVPlaybackSource, {
        shouldPlay: false,
        isLooping: false,
        volume: 1.0,
      });
      this.stopTransmittingSound = stopSound;

      // Load connected device sound
      const connectedDeviceSoundAsset = Asset.fromModule(require('@assets/audio/ui/positive_interface_beep.mp3'));
      await connectedDeviceSoundAsset.downloadAsync();

      const { sound: connectedSound } = await Audio.Sound.createAsync({ uri: connectedDeviceSoundAsset.localUri || connectedDeviceSoundAsset.uri } as AVPlaybackSource, {
        shouldPlay: false,
        isLooping: false,
        volume: 1.0,
      });
      this.connectedDeviceSound = connectedSound;

      // Load connect to audio room sound
      const connectToAudioRoomSoundAsset = Asset.fromModule(require('@assets/audio/ui/software_interface_start.mp3'));
      await connectToAudioRoomSoundAsset.downloadAsync();

      const { sound: connectToRoomSound } = await Audio.Sound.createAsync({ uri: connectToAudioRoomSoundAsset.localUri || connectToAudioRoomSoundAsset.uri } as AVPlaybackSource, {
        shouldPlay: false,
        isLooping: false,
        volume: 1.0,
      });
      this.connectToAudioRoomSound = connectToRoomSound;

      // Load disconnect from audio room sound
      const disconnectedFromAudioRoomSoundAsset = Asset.fromModule(require('@assets/audio/ui/software_interface_back.mp3'));
      await disconnectedFromAudioRoomSoundAsset.downloadAsync();

      const { sound: disconnectFromRoomSound } = await Audio.Sound.createAsync({ uri: disconnectedFromAudioRoomSoundAsset.localUri || disconnectedFromAudioRoomSoundAsset.uri } as AVPlaybackSource, {
        shouldPlay: false,
        isLooping: false,
        volume: 1.0,
      });
      this.disconnectedFromAudioRoomSound = disconnectFromRoomSound;

      logger.debug({
        message: 'Audio files loaded successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to load audio files',
        context: { error },
      });
    }
  }

  private async playSound(sound: Audio.Sound | null, soundName: string): Promise<void> {
    try {
      if (!sound) {
        logger.warn({
          message: `Sound not loaded: ${soundName}`,
        });
        return;
      }

      // Ensure audio service is initialized
      if (!this.isInitialized) {
        await this.initializeAudio();
      }

      // Reset to start and play
      await sound.setPositionAsync(0);
      await sound.playAsync();

      logger.debug({
        message: 'Sound played successfully',
        context: { soundName },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to play sound',
        context: { soundName, error },
      });
    }
  }

  async playStartTransmittingSound(): Promise<void> {
    try {
      await this.playSound(this.startTransmittingSound, 'startTransmitting');
    } catch (error) {
      logger.error({
        message: 'Failed to play start transmitting sound',
        context: { error },
      });
    }
  }

  async playStopTransmittingSound(): Promise<void> {
    try {
      await this.playSound(this.stopTransmittingSound, 'stopTransmitting');
    } catch (error) {
      logger.error({
        message: 'Failed to play stop transmitting sound',
        context: { error },
      });
    }
  }

  async playConnectedDeviceSound(): Promise<void> {
    try {
      await this.playSound(this.connectedDeviceSound, 'connectedDevice');
    } catch (error) {
      logger.error({
        message: 'Failed to play connected device sound',
        context: { error },
      });
    }
  }

  async playConnectToAudioRoomSound(): Promise<void> {
    try {
      await this.playSound(this.connectToAudioRoomSound, 'connectedToAudioRoom');
    } catch (error) {
      logger.error({
        message: 'Failed to play connected to audio room sound',
        context: { error },
      });
    }
  }

  async playDisconnectedFromAudioRoomSound(): Promise<void> {
    try {
      await this.playSound(this.disconnectedFromAudioRoomSound, 'disconnectedFromAudioRoom');
    } catch (error) {
      logger.error({
        message: 'Failed to play disconnected from audio room sound',
        context: { error },
      });
    }
  }

  /**
   * Play a notification sound based on the notification type
   * Uses the positive interface beep for general notifications
   */
  async playNotificationSound(notificationType?: 'call' | 'message' | 'chat' | 'group-chat' | 'unknown'): Promise<void> {
    try {
      // For now, use the connected device sound (positive beep) for all notifications
      // In the future, you could load different sounds for different notification types
      await this.playSound(this.connectedDeviceSound, `notification-${notificationType || 'default'}`);

      logger.debug({
        message: 'Notification sound played',
        context: { notificationType },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to play notification sound',
        context: { error, notificationType },
      });
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Unload start transmitting sound
      if (this.startTransmittingSound) {
        await this.startTransmittingSound.unloadAsync();
        this.startTransmittingSound = null;
      }

      // Unload stop transmitting sound
      if (this.stopTransmittingSound) {
        await this.stopTransmittingSound.unloadAsync();
        this.stopTransmittingSound = null;
      }

      // Unload connected device sound
      if (this.connectedDeviceSound) {
        await this.connectedDeviceSound.unloadAsync();
        this.connectedDeviceSound = null;
      }

      // Unload connect to audio room sound
      if (this.connectToAudioRoomSound) {
        await this.connectToAudioRoomSound.unloadAsync();
        this.connectToAudioRoomSound = null;
      }

      // Unload disconnect from audio room sound
      if (this.disconnectedFromAudioRoomSound) {
        await this.disconnectedFromAudioRoomSound.unloadAsync();
        this.disconnectedFromAudioRoomSound = null;
      }

      this.isInitialized = false;

      logger.info({
        message: 'Audio service cleaned up',
      });
    } catch (error) {
      logger.error({
        message: 'Error during audio service cleanup',
        context: { error },
      });
    }
  }
}

export const audioService = AudioService.getInstance();
