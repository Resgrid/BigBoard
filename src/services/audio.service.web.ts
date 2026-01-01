import { Asset } from 'expo-asset';

import { logger } from '@/lib/logging';

class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
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
      // Create Web Audio API context
      if (typeof window !== 'undefined') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Pre-load audio assets
      await this.preloadAudioAssets();

      this.isInitialized = true;

      logger.info({
        message: 'Audio service (web) initialized successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to initialize audio service (web)',
        context: { error },
      });
    }
  }

  public async preloadAudioAssets(): Promise<void> {
    try {
      // Web audio files would be loaded from the assets directory
      const audioFiles = [
        { name: 'startTransmitting', asset: require('../../assets/audio/ui/space_notification1.mp3') },
        { name: 'stopTransmitting', asset: require('../../assets/audio/ui/space_notification2.mp3') },
        { name: 'connectedDevice', asset: require('../../assets/audio/ui/positive_interface_beep.mp3') },
        { name: 'connectToAudioRoom', asset: require('../../assets/audio/ui/software_interface_start.mp3') },
        { name: 'disconnectedFromAudioRoom', asset: require('../../assets/audio/ui/software_interface_back.mp3') },
      ];

      await Promise.all(
        audioFiles.map(async (file) => {
          try {
            const asset = Asset.fromModule(file.asset);
            await asset.downloadAsync();

            if (asset.localUri || asset.uri) {
              const response = await fetch(asset.localUri || asset.uri);
              const arrayBuffer = await response.arrayBuffer();
              if (this.audioContext) {
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(file.name, audioBuffer);
              }
            }
          } catch (error) {
            logger.warn({
              message: `Failed to load audio file: ${file.name}`,
              context: { error },
            });
          }
        })
      );

      logger.debug({
        message: 'Audio assets preloaded successfully (web)',
      });
    } catch (error) {
      logger.error({
        message: 'Error preloading audio assets (web)',
        context: { error },
      });
    }
  }

  private async playAudioBuffer(bufferName: string): Promise<void> {
    if (!this.audioContext || !this.audioBuffers.has(bufferName)) {
      logger.warn({
        message: `Audio buffer not found: ${bufferName}`,
      });
      return;
    }

    try {
      const buffer = this.audioBuffers.get(bufferName);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      logger.error({
        message: `Failed to play audio: ${bufferName}`,
        context: { error },
      });
    }
  }

  public async playStartTransmittingSound(): Promise<void> {
    await this.playAudioBuffer('startTransmitting');
  }

  public async playStopTransmittingSound(): Promise<void> {
    await this.playAudioBuffer('stopTransmitting');
  }

  public async playConnectedDeviceSound(): Promise<void> {
    await this.playAudioBuffer('connectedDevice');
  }

  public async playConnectToAudioRoomSound(): Promise<void> {
    await this.playAudioBuffer('connectToAudioRoom');
  }

  public async playDisconnectedFromAudioRoomSound(): Promise<void> {
    await this.playAudioBuffer('disconnectedFromAudioRoom');
  }

  public async setAudioModeForBluetooth(): Promise<void> {
    // No-op on web - audio routing is handled by the browser
    logger.debug({
      message: 'setAudioModeForBluetooth is a no-op on web',
    });
  }

  public async setAudioModeForDefault(): Promise<void> {
    // No-op on web - audio routing is handled by the browser
    logger.debug({
      message: 'setAudioModeForDefault is a no-op on web',
    });
  }

  public async unloadAllSounds(): Promise<void> {
    // Clear audio buffers
    this.audioBuffers.clear();

    logger.info({
      message: 'All audio sounds unloaded (web)',
    });
  }

  public async cleanup(): Promise<void> {
    await this.unloadAllSounds();

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;

    logger.info({
      message: 'Audio service cleaned up (web)',
    });
  }
}

export const audioService = AudioService.getInstance();
