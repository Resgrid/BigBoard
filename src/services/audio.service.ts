import { Asset } from 'expo-asset';
import { type AudioPlayer, type AudioSource, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';

import { logger } from '@/lib/logging';

class AudioService {
  private static instance: AudioService;
  private startTransmittingSound: AudioPlayer | null = null;
  private stopTransmittingSound: AudioPlayer | null = null;
  private connectedDeviceSound: AudioPlayer | null = null;
  private connectToAudioRoomSound: AudioPlayer | null = null;
  private disconnectedFromAudioRoomSound: AudioPlayer | null = null;
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
      await setAudioModeAsync({
        allowsRecording: true,
        shouldPlayInBackground: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        // Earpiece routing was Android-only under expo-av; expo-audio applies this
        // on iOS too whenever allowsRecording is true, so keep it platform gated.
        shouldRouteThroughEarpiece: Platform.OS === 'android',
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

  private async createPlayerForAsset(assetModule: string | number, soundName: string): Promise<AudioPlayer | null> {
    try {
      const asset = Asset.fromModule(assetModule);
      await asset.downloadAsync();

      const player = createAudioPlayer({ uri: asset.localUri || asset.uri } as AudioSource);
      player.loop = false;
      player.volume = 1.0;

      return player;
    } catch (error) {
      logger.error({
        message: 'Failed to load audio file',
        context: { soundName, error },
      });
      return null;
    }
  }

  private async loadAudioFiles(): Promise<void> {
    try {
      this.startTransmittingSound = await this.createPlayerForAsset(require('@assets/audio/ui/space_notification1.mp3'), 'startTransmitting');
      this.stopTransmittingSound = await this.createPlayerForAsset(require('@assets/audio/ui/space_notification2.mp3'), 'stopTransmitting');
      this.connectedDeviceSound = await this.createPlayerForAsset(require('@assets/audio/ui/positive_interface_beep.mp3'), 'connectedDevice');
      this.connectToAudioRoomSound = await this.createPlayerForAsset(require('@assets/audio/ui/software_interface_start.mp3'), 'connectedToAudioRoom');
      this.disconnectedFromAudioRoomSound = await this.createPlayerForAsset(require('@assets/audio/ui/software_interface_back.mp3'), 'disconnectedFromAudioRoom');

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

  private async playSound(sound: AudioPlayer | null, soundName: string): Promise<void> {
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
      await sound.seekTo(0);
      sound.play();

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

  private releasePlayer(player: AudioPlayer | null, soundName: string): void {
    if (!player) {
      return;
    }

    try {
      player.remove();
    } catch (error) {
      // A failure releasing one player must not strand the others.
      logger.error({
        message: 'Failed to release audio player',
        context: { soundName, error },
      });
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.releasePlayer(this.startTransmittingSound, 'startTransmitting');
      this.releasePlayer(this.stopTransmittingSound, 'stopTransmitting');
      this.releasePlayer(this.connectedDeviceSound, 'connectedDevice');
      this.releasePlayer(this.connectToAudioRoomSound, 'connectedToAudioRoom');
      this.releasePlayer(this.disconnectedFromAudioRoomSound, 'disconnectedFromAudioRoom');

      logger.info({
        message: 'Audio service cleaned up',
      });
    } catch (error) {
      logger.error({
        message: 'Error during audio service cleanup',
        context: { error },
      });
    } finally {
      this.startTransmittingSound = null;
      this.stopTransmittingSound = null;
      this.connectedDeviceSound = null;
      this.connectToAudioRoomSound = null;
      this.disconnectedFromAudioRoomSound = null;
      this.isInitialized = false;
    }
  }
}

export const audioService = AudioService.getInstance();
