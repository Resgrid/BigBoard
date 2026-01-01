import { logger } from '@/lib/logging';
import { audioService } from '@/services/audio.service';
import type { AudioButtonEvent, BluetoothAudioDevice, Device } from '@/stores/app/bluetooth-audio-store';
import { State, useBluetoothAudioStore } from '@/stores/app/bluetooth-audio-store';
import { useLiveKitStore } from '@/stores/app/livekit-store';

import { BluetoothAudioServiceBase } from './base.service';

// Web Bluetooth API type declarations
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
}

interface BluetoothRemoteGATTCharacteristic {
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

interface BluetoothNavigator extends Navigator {
  bluetooth: {
    getAvailability(): Promise<boolean>;
    requestDevice(options: any): Promise<BluetoothDevice>;
  };
}

declare global {
  interface Navigator {
    bluetooth?: {
      getAvailability(): Promise<boolean>;
      requestDevice(options: any): Promise<BluetoothDevice>;
    };
  }
}

// Web Bluetooth service UUIDs for audio devices
const AUDIO_SERVICE_UUID = '0000110a-0000-1000-8000-00805f9b34fb'; // A2DP
const HFP_SERVICE_UUID = '0000111e-0000-1000-8000-00805f9b34fb'; // Hands-Free Profile
const HSP_SERVICE_UUID = '00001108-0000-1000-8000-00805f9b34fb'; // Headset Profile

// Button control characteristic UUIDs
const BUTTON_CONTROL_UUIDS = [
  '0000fe59-0000-1000-8000-00805f9b34fb', // Common button control
  '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
  '00001812-0000-1000-8000-00805f9b34fb', // Human Interface Device Service
];

/**
 * Web implementation of BluetoothAudioService using Web Bluetooth API
 * Provides Bluetooth Low Energy functionality for web browsers
 */
export class BluetoothAudioServiceWeb extends BluetoothAudioServiceBase {
  private connectedDevice: BluetoothDevice | null = null;
  private gattServer: BluetoothRemoteGATTServer | null = null;
  private characteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();
  private scanAbortController: AbortController | null = null;

  getPlatform(): 'web' {
    return 'web';
  }

  isSupported(): boolean {
    // Check if Web Bluetooth API is available
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Initialize the Web Bluetooth service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.isSupported()) {
      throw new Error('Web Bluetooth API is not supported in this browser');
    }

    try {
      logger.info({
        message: 'Initializing Bluetooth Audio Service (Web)',
      });

      this.setupEventListeners();
      this.isInitialized = true;

      // Check Bluetooth availability
      const state = await this.checkBluetoothState();
      if (state !== State.PoweredOn) {
        logger.info({
          message: 'Bluetooth not available, skipping initialization',
          context: { state },
        });
        return;
      }

      // Attempt to connect to preferred device
      await this.attemptPreferredDeviceConnection();
    } catch (error) {
      logger.error({
        message: 'Failed to initialize Bluetooth Audio Service (Web)',
        context: { error },
      });
    }
  }

  protected async attemptPreferredDeviceConnection(): Promise<void> {
    if (this.hasAttemptedPreferredDeviceConnection) {
      return;
    }

    this.hasAttemptedPreferredDeviceConnection = true;

    try {
      // In web, we can't directly connect to a stored device
      // The user must initiate the connection through a user gesture
      logger.info({
        message: 'Web Bluetooth requires user gesture to connect to devices',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to attempt preferred device connection',
        context: { error },
      });
    }
  }

  protected setupEventListeners(): void {
    // Web Bluetooth events are handled differently
    // Event listeners are set up when devices are connected
    logger.debug({
      message: 'Web Bluetooth event listeners will be set up per device connection',
    });
  }

  protected handleBluetoothStateChange(state: any): void {
    logger.info({
      message: 'Bluetooth availability changed',
      context: { state },
    });

    // Update store with new state
    useBluetoothAudioStore.getState().setBluetoothState(state);
  }

  protected handleDeviceDiscovered(device: Device): void {
    // Web Bluetooth doesn't have a discovery event like native
    // Devices are discovered through the requestDevice method
    logger.debug({
      message: 'Device discovery in Web Bluetooth happens through user interaction',
      context: { device },
    });
  }

  protected handleDeviceDisconnected(args: { peripheral: string }): void {
    logger.info({
      message: 'Web Bluetooth device disconnected',
      context: { deviceId: args.peripheral },
    });

    if (this.connectedDevice && this.connectedDevice.id === args.peripheral) {
      this.connectedDevice = null;
      this.gattServer = null;
      this.characteristics.clear();

      useBluetoothAudioStore.getState().setConnectedDevice(null);
      useBluetoothAudioStore.getState().clearConnectionError();

      this.revertLiveKitAudioRouting();
    }
  }

  protected handleButtonEvent(data: string): void {
    try {
      logger.debug({
        message: 'Web Bluetooth button event received',
        context: { data },
      });

      // Parse button event (simplified for web)
      const buttonEvent = this.parseWebButtonData(data);
      if (buttonEvent) {
        this.processButtonEvent(buttonEvent);
      }
    } catch (error) {
      logger.error({
        message: 'Failed to handle web button event',
        context: { error },
      });
    }
  }

  private parseWebButtonData(data: string): AudioButtonEvent | null {
    try {
      // Convert base64 data to buffer for parsing
      const buffer = Buffer.from(data, 'base64');
      if (buffer.length === 0) return null;

      const byte = buffer[0];
      let buttonType: AudioButtonEvent['button'] = 'unknown';
      let eventType: AudioButtonEvent['type'] = 'press';

      // Generic web button mapping
      switch (byte) {
        case 0x01:
          buttonType = 'ptt_start';
          break;
        case 0x00:
          buttonType = 'ptt_stop';
          break;
        case 0x02:
          buttonType = 'mute';
          break;
        case 0x03:
          buttonType = 'volume_up';
          break;
        case 0x04:
          buttonType = 'volume_down';
          break;
      }

      // Check for long press
      if (buffer.length > 1 && buffer[1] === 0x01) {
        eventType = 'long_press';
      }

      return {
        type: eventType,
        button: buttonType,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error({
        message: 'Failed to parse web button data',
        context: { error, data },
      });
      return null;
    }
  }

  async requestPermissions(): Promise<boolean> {
    // Web Bluetooth doesn't require explicit permission requests
    // Permissions are granted through user interaction when calling requestDevice
    return this.isSupported();
  }

  async checkBluetoothState(): Promise<State> {
    try {
      if (!this.isSupported()) {
        return 'Unsupported' as State;
      }

      // Check if Bluetooth is available (this is limited in web)
      if (!navigator.bluetooth) {
        return State.Unsupported;
      }
      const availability = await navigator.bluetooth.getAvailability();
      return availability ? (State.PoweredOn as State) : (State.PoweredOff as State);
    } catch (error) {
      logger.error({
        message: 'Failed to check Bluetooth state',
        context: { error },
      });
      return 'Unknown' as State;
    }
  }

  async startScanning(durationMs: number = 10000): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth API is not supported');
    }

    const state = await this.checkBluetoothState();
    if (state !== State.PoweredOn) {
      throw new Error(`Bluetooth is ${state}. Please enable Bluetooth.`);
    }

    useBluetoothAudioStore.getState().setIsScanning(true);
    useBluetoothAudioStore.getState().clearDevices();

    logger.info({
      message: 'Starting Web Bluetooth device scan',
      context: { durationMs },
    });

    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not supported');
      }

      // Web Bluetooth requires user interaction and doesn't have a continuous scan
      // Instead, we request a device with audio service filters
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [AUDIO_SERVICE_UUID] }, { services: [HFP_SERVICE_UUID] }, { services: [HSP_SERVICE_UUID] }, { namePrefix: 'AINA' }, { namePrefix: 'Inrico' }, { namePrefix: 'HYS' }],
        optionalServices: BUTTON_CONTROL_UUIDS,
      });

      if (device) {
        this.handleWebDeviceFound(device);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        logger.info({
          message: 'No Web Bluetooth device selected by user',
        });
      } else {
        logger.error({
          message: 'Failed to scan for Web Bluetooth devices',
          context: { error },
        });
        throw error;
      }
    } finally {
      useBluetoothAudioStore.getState().setIsScanning(false);
    }
  }

  async startDebugScanning(durationMs: number = 15000): Promise<void> {
    logger.info({
      message: 'Starting Web Bluetooth debug scan - will request any device',
      context: { durationMs },
    });

    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not supported');
      }

      // For debug scanning, accept any device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [AUDIO_SERVICE_UUID, HFP_SERVICE_UUID, HSP_SERVICE_UUID, ...BUTTON_CONTROL_UUIDS],
      });

      if (device) {
        logger.info({
          message: 'Debug: Web Bluetooth device selected',
          context: {
            id: device.id,
            name: device.name,
            gatt: device.gatt?.connected,
          },
        });
        this.handleWebDeviceFound(device);
      }
    } catch (error) {
      logger.error({
        message: 'Failed debug Web Bluetooth scan',
        context: { error },
      });
      throw error;
    }
  }

  private handleWebDeviceFound(device: BluetoothDevice): void {
    const audioDevice: BluetoothAudioDevice = {
      id: device.id,
      name: device.name || null,
      rssi: undefined, // RSSI not available in Web Bluetooth
      isConnected: false,
      hasAudioCapability: true,
      supportsMicrophoneControl: this.supportsWebMicrophoneControl(device),
      device: this.createDeviceFromBluetoothDevice(device),
    };

    logger.info({
      message: 'Web Bluetooth audio device found',
      context: {
        deviceId: device.id,
        deviceName: device.name,
        supportsMicControl: audioDevice.supportsMicrophoneControl,
      },
    });

    useBluetoothAudioStore.getState().addDevice(audioDevice);
  }

  private createDeviceFromBluetoothDevice(device: BluetoothDevice): Device {
    // Convert BluetoothDevice to our Device interface
    return {
      id: device.id,
      name: device.name,
      // Web Bluetooth doesn't provide all the properties that native BLE does
      advertising: undefined,
      rssi: -50, // Default RSSI for web devices since it's not available
    } as unknown as Device;
  }

  private supportsWebMicrophoneControl(device: BluetoothDevice): boolean {
    // In Web Bluetooth, we can only determine this after connecting
    // For now, assume devices might support it based on name patterns
    const name = device.name?.toLowerCase() || '';
    return name.includes('headset') || name.includes('hands') || name.includes('hfp');
  }

  protected isAudioDevice(device: Device): boolean {
    const name = device.name?.toLowerCase() || '';
    const audioKeywords = ['speaker', 'headset', 'earbuds', 'headphone', 'audio', 'mic', 'sound', 'wireless', 'bluetooth', 'bt', 'aina', 'inrico', 'hys', 'b01', 'ptt'];

    return audioKeywords.some((keyword) => name.includes(keyword));
  }

  stopScanning(): void {
    if (this.scanAbortController) {
      this.scanAbortController.abort();
      this.scanAbortController = null;
    }

    useBluetoothAudioStore.getState().setIsScanning(false);

    logger.info({
      message: 'Web Bluetooth scan stopped',
    });
  }

  async connectToDevice(deviceId: string): Promise<void> {
    const availableDevices = useBluetoothAudioStore.getState().availableDevices;
    const targetDevice = availableDevices.find((d) => d.id === deviceId);

    if (!targetDevice) {
      throw new Error('Device not found in available devices');
    }

    try {
      useBluetoothAudioStore.getState().setIsConnecting(true);

      // For web, we need to find the BluetoothDevice
      // In a real implementation, you'd need to store the BluetoothDevice reference
      // For now, we'll simulate the connection process

      logger.info({
        message: 'Connecting to Web Bluetooth audio device',
        context: { deviceId },
      });

      // Simulate connection to GATT server
      // const server = await device.gatt.connect();
      // this.gattServer = server;

      // Set up device in store
      useBluetoothAudioStore.getState().setConnectedDevice({
        ...targetDevice,
        isConnected: true,
      });

      // Set up button event monitoring
      await this.setupButtonEventMonitoring(targetDevice.device);

      // Integrate with LiveKit audio routing
      await this.setupLiveKitAudioRouting(targetDevice.device);

      // Play connected device sound
      await audioService.playConnectedDeviceSound();

      useBluetoothAudioStore.getState().setIsConnecting(false);
    } catch (error) {
      logger.error({
        message: 'Failed to connect to Web Bluetooth audio device',
        context: { deviceId, error },
      });

      useBluetoothAudioStore.getState().setIsConnecting(false);
      useBluetoothAudioStore.getState().setConnectionError(error instanceof Error ? error.message : 'Unknown connection error');
      throw error;
    }
  }

  protected async setupButtonEventMonitoring(device: Device): Promise<void> {
    try {
      logger.info({
        message: 'Setting up Web Bluetooth button event monitoring',
        context: {
          deviceId: device.id,
          deviceName: device.name,
        },
      });

      // In a real implementation, you would:
      // 1. Connect to GATT services
      // 2. Subscribe to characteristic notifications
      // 3. Set up event handlers for characteristic value changes

      // For now, we'll simulate the setup
      logger.debug({
        message: 'Web Bluetooth button monitoring setup (simulated)',
      });
    } catch (error) {
      logger.warn({
        message: 'Could not set up Web Bluetooth button event monitoring',
        context: { deviceId: device.id, error },
      });
    }
  }

  protected processButtonEvent(buttonEvent: AudioButtonEvent): void {
    logger.info({
      message: 'Web Bluetooth button event processed',
      context: { buttonEvent },
    });

    useBluetoothAudioStore.getState().addButtonEvent(buttonEvent);

    // Handle different button types
    if (buttonEvent.button === 'mute') {
      this.handleMuteToggle();
      return;
    }

    if (buttonEvent.button === 'ptt_start') {
      this.setMicrophoneEnabled(true);
      return;
    }

    if (buttonEvent.button === 'ptt_stop') {
      this.setMicrophoneEnabled(false);
      return;
    }

    if (buttonEvent.button === 'volume_up' || buttonEvent.button === 'volume_down') {
      this.handleVolumeChange(buttonEvent.button);
    }
  }

  protected async handleMuteToggle(): Promise<void> {
    const liveKitStore = useLiveKitStore.getState();
    if (liveKitStore.currentRoom) {
      const currentMuteState = !liveKitStore.currentRoom.localParticipant.isMicrophoneEnabled;

      try {
        await liveKitStore.currentRoom.localParticipant.setMicrophoneEnabled(currentMuteState);

        logger.info({
          message: 'Microphone toggled via Web Bluetooth button',
          context: { enabled: currentMuteState },
        });

        useBluetoothAudioStore.getState().setLastButtonAction({
          action: currentMuteState ? 'unmute' : 'mute',
          timestamp: Date.now(),
        });

        if (currentMuteState) {
          await audioService.playStartTransmittingSound();
        } else {
          await audioService.playStopTransmittingSound();
        }
      } catch (error) {
        logger.error({
          message: 'Failed to toggle microphone via Web Bluetooth button',
          context: { error },
        });
      }
    }
  }

  protected async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    const liveKitStore = useLiveKitStore.getState();
    if (liveKitStore.currentRoom) {
      const currentMuteState = !liveKitStore.currentRoom.localParticipant.isMicrophoneEnabled;

      try {
        if ((enabled && !currentMuteState) || (!enabled && currentMuteState)) return;

        await liveKitStore.currentRoom.localParticipant.setMicrophoneEnabled(enabled);

        logger.info({
          message: 'Microphone set via Web Bluetooth button',
          context: { enabled },
        });

        useBluetoothAudioStore.getState().setLastButtonAction({
          action: enabled ? 'unmute' : 'mute',
          timestamp: Date.now(),
        });

        if (enabled) {
          await audioService.playStartTransmittingSound();
        } else {
          await audioService.playStopTransmittingSound();
        }
      } catch (error) {
        logger.error({
          message: 'Failed to set microphone via Web Bluetooth button',
          context: { error },
        });
      }
    }
  }

  protected async handleVolumeChange(direction: 'volume_up' | 'volume_down'): Promise<void> {
    logger.info({
      message: 'Volume change requested via Web Bluetooth button',
      context: { direction },
    });

    useBluetoothAudioStore.getState().setLastButtonAction({
      action: direction,
      timestamp: Date.now(),
    });

    // Web-specific volume control would go here
    // This might involve the Web Audio API or media session API
  }

  protected async setupLiveKitAudioRouting(device: Device): Promise<void> {
    try {
      logger.info({
        message: 'Setting up LiveKit audio routing for Web Bluetooth device',
        context: { deviceId: device.id, deviceName: device.name },
      });

      const bluetoothStore = useBluetoothAudioStore.getState();
      const deviceName = device.name || 'Web Bluetooth Device';

      const bluetoothAudioDevice = {
        id: device.id,
        name: deviceName,
        type: 'bluetooth' as const,
        isAvailable: true,
      };

      const currentDevices = bluetoothStore.availableAudioDevices.filter((d) => d.type !== 'bluetooth');
      bluetoothStore.setAvailableAudioDevices([...currentDevices, bluetoothAudioDevice]);

      // Set as audio devices
      bluetoothStore.setSelectedMicrophone(bluetoothAudioDevice);
      bluetoothStore.setSelectedSpeaker(bluetoothAudioDevice);
      bluetoothStore.setAudioRoutingActive(true);

      // In a real web implementation, you would:
      // 1. Use navigator.mediaDevices.getUserMedia() with specific deviceId
      // 2. Configure WebRTC/LiveKit to use the selected audio devices
      // 3. Handle audio context routing for the connected Bluetooth device
    } catch (error) {
      logger.error({
        message: 'Failed to setup LiveKit audio routing for Web Bluetooth',
        context: { error },
      });
      throw error;
    }
  }

  protected revertLiveKitAudioRouting(): void {
    try {
      logger.info({
        message: 'Reverting Web Bluetooth LiveKit audio routing to default',
      });

      const bluetoothStore = useBluetoothAudioStore.getState();

      const nonBluetoothDevices = bluetoothStore.availableAudioDevices.filter((d) => d.type !== 'bluetooth');
      bluetoothStore.setAvailableAudioDevices(nonBluetoothDevices);

      const defaultMic = nonBluetoothDevices.find((d) => d.type === 'default' && d.id.includes('mic'));
      const defaultSpeaker = nonBluetoothDevices.find((d) => d.type === 'default' && d.id.includes('speaker'));

      if (defaultMic) {
        bluetoothStore.setSelectedMicrophone(defaultMic);
      }
      if (defaultSpeaker) {
        bluetoothStore.setSelectedSpeaker(defaultSpeaker);
      }

      bluetoothStore.setAudioRoutingActive(false);
    } catch (error) {
      logger.error({
        message: 'Failed to revert Web Bluetooth LiveKit audio routing',
        context: { error },
      });
    }
  }

  async disconnectDevice(): Promise<void> {
    if (this.connectedDevice) {
      try {
        if (this.gattServer && this.gattServer.connected) {
          this.gattServer.disconnect();
        }

        logger.info({
          message: 'Web Bluetooth audio device disconnected manually',
          context: { deviceId: this.connectedDevice.id },
        });

        this.handleDeviceDisconnected({ peripheral: this.connectedDevice.id });
      } catch (error) {
        logger.error({
          message: 'Error disconnecting Web Bluetooth audio device',
          context: { error },
        });
      }
    }
  }

  async getConnectedDevice(): Promise<BluetoothAudioDevice | null> {
    return useBluetoothAudioStore.getState().connectedDevice;
  }

  async isDeviceConnected(deviceId: string): Promise<boolean> {
    const connectedDevice = useBluetoothAudioStore.getState().connectedDevice;
    return connectedDevice?.id === deviceId && connectedDevice.isConnected;
  }

  testButtonMapping?(deviceType: string, hexString: string): AudioButtonEvent | null {
    logger.info({
      message: 'Testing Web Bluetooth button mapping',
      context: { deviceType, hexString },
    });

    try {
      return this.parseWebButtonData(Buffer.from(hexString.replace(/[^0-9A-Fa-f]/g, ''), 'hex').toString('base64'));
    } catch (error) {
      logger.error({
        message: 'Error testing Web Bluetooth button mapping',
        context: { error },
      });
      return null;
    }
  }

  destroy(): void {
    this.stopScanning();
    this.disconnectDevice();

    this.characteristics.clear();
    this.connectedDevice = null;
    this.gattServer = null;

    this.isInitialized = false;
    this.hasAttemptedPreferredDeviceConnection = false;

    logger.info({
      message: 'Web Bluetooth Audio Service destroyed',
    });
  }
}
