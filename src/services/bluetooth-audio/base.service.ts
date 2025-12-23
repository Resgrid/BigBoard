import type { AudioButtonEvent, BluetoothAudioDevice, Device, State } from '@/stores/app/bluetooth-audio-store';

export interface AudioDevice {
  id: string;
  name: string;
  type: 'bluetooth' | 'default' | 'speaker' | 'microphone';
  isAvailable: boolean;
}

/**
 * Abstract base class for Bluetooth Audio Service implementations
 * Provides a common interface for different platform implementations (Native, Web)
 */
export abstract class BluetoothAudioServiceBase {
  protected isInitialized: boolean = false;
  protected hasAttemptedPreferredDeviceConnection: boolean = false;

  /**
   * Initialize the Bluetooth service
   */
  abstract initialize(): Promise<void>;

  /**
   * Request necessary permissions for Bluetooth functionality
   */
  abstract requestPermissions(): Promise<boolean>;

  /**
   * Check the current Bluetooth state
   */
  abstract checkBluetoothState(): Promise<State>;

  /**
   * Start scanning for Bluetooth audio devices
   */
  abstract startScanning(durationMs?: number): Promise<void>;

  /**
   * Start debug scanning (for troubleshooting)
   */
  abstract startDebugScanning(durationMs?: number): Promise<void>;

  /**
   * Stop the current Bluetooth scan
   */
  abstract stopScanning(): void;

  /**
   * Connect to a specific Bluetooth device
   */
  abstract connectToDevice(deviceId: string): Promise<void>;

  /**
   * Disconnect from the currently connected device
   */
  abstract disconnectDevice(): Promise<void>;

  /**
   * Get the currently connected device
   */
  abstract getConnectedDevice(): Promise<BluetoothAudioDevice | null>;

  /**
   * Check if a specific device is connected
   */
  abstract isDeviceConnected(deviceId: string): Promise<boolean>;

  /**
   * Test button mapping for debugging (optional, may not be supported on all platforms)
   */
  testButtonMapping?(deviceType: string, hexString: string): AudioButtonEvent | null;

  /**
   * Clean up resources and destroy the service instance
   */
  abstract destroy(): void;

  /**
   * Setup event listeners for the platform-specific implementation
   */
  protected abstract setupEventListeners(): void;

  /**
   * Handle Bluetooth state changes
   */
  protected abstract handleBluetoothStateChange(state: any): void;

  /**
   * Handle device discovery during scanning
   */
  protected abstract handleDeviceDiscovered(device: Device): void;

  /**
   * Handle device disconnection events
   */
  protected abstract handleDeviceDisconnected(args: { peripheral: string }): void;

  /**
   * Handle button events from connected devices
   */
  protected abstract handleButtonEvent(data: string): void;

  /**
   * Setup button event monitoring for a connected device
   */
  protected abstract setupButtonEventMonitoring(device: Device): Promise<void>;

  /**
   * Setup audio routing for LiveKit integration
   */
  protected abstract setupLiveKitAudioRouting(device: Device): Promise<void>;

  /**
   * Revert audio routing to default settings
   */
  protected abstract revertLiveKitAudioRouting(): void;

  /**
   * Attempt to connect to a preferred device from storage
   */
  protected abstract attemptPreferredDeviceConnection(): Promise<void>;

  /**
   * Determine if a device has audio capabilities
   */
  protected abstract isAudioDevice(device: Device): boolean;

  /**
   * Process button events and trigger appropriate actions
   */
  protected abstract processButtonEvent(buttonEvent: AudioButtonEvent): void;

  /**
   * Handle mute/unmute toggle
   */
  protected abstract handleMuteToggle(): Promise<void>;

  /**
   * Set microphone enabled/disabled state
   */
  protected abstract setMicrophoneEnabled(enabled: boolean): Promise<void>;

  /**
   * Handle volume change events
   */
  protected abstract handleVolumeChange(direction: 'volume_up' | 'volume_down'): Promise<void>;

  /**
   * Get the platform name for this implementation
   */
  abstract getPlatform(): 'native' | 'web' | 'mock';

  /**
   * Check if the current platform is supported
   */
  abstract isSupported(): boolean;
}
