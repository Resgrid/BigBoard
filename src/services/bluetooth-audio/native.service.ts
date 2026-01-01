import { Buffer } from 'buffer';
import { Alert, DeviceEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import BleManager, { type BleManagerDidUpdateValueForCharacteristicEvent, BleScanCallbackType, BleScanMatchMode, BleScanMode, type BleState, type Peripheral } from 'react-native-ble-manager';

import { logger } from '@/lib/logging';
import { audioService } from '@/services/audio.service';
import { type AudioButtonEvent, type BluetoothAudioDevice, type Device, State, useBluetoothAudioStore } from '@/stores/app/bluetooth-audio-store';
import { useLiveKitStore } from '@/stores/app/livekit-store';

import { BluetoothAudioServiceBase } from './base.service';

// Standard Bluetooth UUIDs for audio services
const AUDIO_SERVICE_UUID = '0000110A-0000-1000-8000-00805F9B34FB'; // Advanced Audio Distribution Profile
const A2DP_SOURCE_UUID = '0000110A-0000-1000-8000-00805F9B34FB';
const HFP_SERVICE_UUID = '0000111E-0000-1000-8000-00805F9B34FB'; // Hands-Free Profile
const HSP_SERVICE_UUID = '00001108-0000-1000-8000-00805F9B34FB'; // Headset Profile

const AINA_HEADSET = 'D11C8116-A913-434D-A79D-97AE94A529B3';
const AINA_HEADSET_SERVICE = '127FACE1-CB21-11E5-93D0-0002A5D5C51B';
const AINA_HEADSET_SVC_PROP = '127FBEEF-CB21-11E5-93D0-0002A5D5C51B';

const B01INRICO_HEADSET = '2BD21C44-0198-4B92-9110-D622D53D8E37';
//const B01INRICO_HEADSET_SERVICE = '6666';
const B01INRICO_HEADSET_SERVICE = '00006666-0000-1000-8000-00805F9B34FB';
//const B01INRICO_HEADSET_SERVICE_CHAR = '8888';
const B01INRICO_HEADSET_SERVICE_CHAR = '00008888-0000-1000-8000-00805F9B34FB';

const HYS_HEADSET = '3CD31C55-A914-435E-B80E-98AF95B630C4';
const HYS_HEADSET_SERVICE = '0000FFE0-0000-1000-8000-00805F9B34FB';
//const HYS_HEADSET_SERVICE = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
//const HYS_HEADSET_SERVICE_CHAR = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const HYS_HEADSET_SERVICE_CHAR = '00002902-0000-1000-8000-00805F9B34FB';

// Common button control characteristic UUIDs (varies by manufacturer)
const BUTTON_CONTROL_UUIDS = [
  '0000FE59-0000-1000-8000-00805F9B34FB', // Common button control
  '0000180F-0000-1000-8000-00805F9B34FB', // Battery Service (often includes button data)
  '00001812-0000-1000-8000-00805F9B34FB', // Human Interface Device Service
];

/**
 * Native implementation of BluetoothAudioService for iOS and Android
 * Uses react-native-ble-manager for Bluetooth Low Energy functionality
 */
export class BluetoothAudioServiceNative extends BluetoothAudioServiceBase {
  private connectedDevice: Device | null = null;
  private scanTimeout: number | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private eventListeners: { remove: () => void }[] = [];

  getPlatform(): 'native' {
    return 'native';
  }

  isSupported(): boolean {
    // Native implementation is supported on iOS and Android
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Initialize the Bluetooth service and attempt to connect to the preferred device
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info({
        message: 'Initializing Bluetooth Audio Service (Native)',
      });

      // Initialize BLE Manager
      await BleManager.start({ showAlert: false });
      this.setupEventListeners();

      this.isInitialized = true;

      // Check if we have permissions
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        logger.warn({
          message: 'Bluetooth permissions not granted, skipping initialization',
        });
        return;
      }

      // Check Bluetooth state
      const state = await this.checkBluetoothState();
      if (state !== State.PoweredOn) {
        logger.info({
          message: 'Bluetooth not powered on, skipping initialization',
          context: { state },
        });
        return;
      }

      // Attempt to connect to preferred device
      await this.attemptPreferredDeviceConnection();
    } catch (error) {
      logger.error({
        message: 'Failed to initialize Bluetooth Audio Service (Native)',
        context: { error },
      });
    }
  }

  /**
   * Attempt to connect to a preferred device from storage.
   * This method can only be called once per service instance.
   */
  protected async attemptPreferredDeviceConnection(): Promise<void> {
    // Prevent multiple calls to this method
    if (this.hasAttemptedPreferredDeviceConnection) {
      logger.debug({
        message: 'Preferred device connection already attempted, skipping',
      });
      return;
    }

    this.hasAttemptedPreferredDeviceConnection = true;

    try {
      // Load preferred device from storage
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getItem } = require('@/lib/storage');
      const preferredDevice: { id: string; name: string } | null = getItem('preferredBluetoothDevice');

      if (preferredDevice) {
        logger.info({
          message: 'Found preferred Bluetooth device, attempting to connect',
          context: { deviceId: preferredDevice.id, deviceName: preferredDevice.name },
        });

        // Set the preferred device in the store
        useBluetoothAudioStore.getState().setPreferredDevice(preferredDevice);

        // Try to connect directly to the preferred device
        try {
          await this.connectToDevice(preferredDevice.id);
          logger.info({
            message: 'Successfully connected to preferred Bluetooth device',
            context: { deviceId: preferredDevice.id },
          });
        } catch (error) {
          logger.warn({
            message: 'Failed to connect to preferred Bluetooth device, will scan for it',
            context: { deviceId: preferredDevice.id, error },
          });

          // If direct connection fails, start scanning to find the device
          this.startScanning(5000); // 5 second scan
        }
      } else {
        logger.info({
          message: 'No preferred Bluetooth device found',
        });
      }
    } catch (error) {
      logger.error({
        message: 'Failed to attempt preferred device connection',
        context: { error },
      });
    }
  }

  protected setupEventListeners(): void {
    // Bluetooth state change listener
    const stateListener = BleManager.onDidUpdateState(this.handleBluetoothStateChange.bind(this));
    this.eventListeners.push(stateListener);

    // Device disconnection listener
    const disconnectListener = BleManager.onDisconnectPeripheral(this.handleDeviceDisconnected.bind(this));
    this.eventListeners.push(disconnectListener);

    // Device discovered listener
    const discoverListener = BleManager.onDiscoverPeripheral(this.handleDeviceDiscovered.bind(this));
    this.eventListeners.push(discoverListener);

    // Characteristic value update listener
    const valueUpdateListener = BleManager.onDidUpdateValueForCharacteristic(this.handleCharacteristicValueUpdate.bind(this));
    this.eventListeners.push(valueUpdateListener);

    // Stop scan listener
    const stopScanListener = BleManager.onStopScan(this.handleScanStopped.bind(this));
    this.eventListeners.push(stopScanListener);
  }

  protected handleBluetoothStateChange(args: { state: BleState }): void {
    const state = this.mapBleStateToState(args.state);

    logger.info({
      message: 'Bluetooth state changed',
      context: { state },
    });

    useBluetoothAudioStore.getState().setBluetoothState(state);

    if (state === State.PoweredOff || state === State.Unauthorized) {
      this.handleBluetoothDisabled();
    } else if (state === State.PoweredOn && this.isInitialized && !this.hasAttemptedPreferredDeviceConnection) {
      // If Bluetooth is turned back on, try to reconnect to preferred device
      this.attemptReconnectToPreferredDevice();
    }
  }

  private mapBleStateToState(bleState: BleState): State {
    switch (bleState) {
      case 'on':
        return State.PoweredOn;
      case 'off':
        return State.PoweredOff;
      case 'turning_on':
        return State.Resetting;
      case 'turning_off':
        return State.Resetting;
      default:
        return State.Unknown;
    }
  }

  protected handleDeviceDiscovered(device: Peripheral): void {
    if (!device || !device.id || !device.advertising || !device.advertising.isConnectable) {
      return;
    }

    // Define RSSI threshold for strong signals (typical range: -100 to -20 dBm)
    const STRONG_RSSI_THRESHOLD = -60; // Only allow devices with RSSI stronger than -60 dBm

    // Check RSSI signal strength - only proceed with strong signals
    if (!device.rssi || device.rssi < STRONG_RSSI_THRESHOLD) {
      return;
    }

    // Log discovered device for debugging
    logger.debug({
      message: 'Device discovered during scan with strong RSSI',
      context: {
        deviceId: device.id,
        deviceName: device.name,
        rssi: device.rssi,
        advertising: device.advertising,
      },
    });

    // Check if this is an audio device
    if (this.isAudioDevice(device)) {
      this.handleDeviceFound(device);
    }
  }

  private handleCharacteristicValueUpdate(data: BleManagerDidUpdateValueForCharacteristicEvent): void {
    // Convert the value array to a base64 string to match the old API
    const value = Buffer.from(data.value).toString('base64');

    logger.debug({
      message: 'Characteristic value updated',
      context: {
        peripheral: data.peripheral,
        service: data.service,
        characteristic: data.characteristic,
        value: Buffer.from(data.value).toString('hex'),
      },
    });

    // Handle button events based on service and characteristic UUIDs
    this.handleButtonEventFromCharacteristic(data.service, data.characteristic, value);
  }

  private handleScanStopped(): void {
    useBluetoothAudioStore.getState().setIsScanning(false);
    logger.info({
      message: 'Bluetooth scan stopped',
    });
  }

  private handleButtonEventFromCharacteristic(serviceUuid: string, characteristicUuid: string, value: string): void {
    const upperServiceUuid = serviceUuid.toUpperCase();
    const upperCharUuid = characteristicUuid.toUpperCase();

    // Route to appropriate handler based on service/characteristic
    if (upperServiceUuid === AINA_HEADSET_SERVICE.toUpperCase() && upperCharUuid === AINA_HEADSET_SVC_PROP.toUpperCase()) {
      this.handleAinaButtonEvent(value);
    } else if (upperServiceUuid === B01INRICO_HEADSET_SERVICE.toUpperCase() && upperCharUuid === B01INRICO_HEADSET_SERVICE_CHAR.toUpperCase()) {
      this.handleB01InricoButtonEvent(value);
    } else if (upperServiceUuid === HYS_HEADSET_SERVICE.toUpperCase() && upperCharUuid === HYS_HEADSET_SERVICE_CHAR.toUpperCase()) {
      this.handleHYSButtonEvent(value);
    } else if (BUTTON_CONTROL_UUIDS.some((uuid) => uuid.toUpperCase() === upperCharUuid)) {
      this.handleGenericButtonEvent(value);
    }
  }

  private async attemptReconnectToPreferredDevice(): Promise<void> {
    logger.info({
      message: 'Bluetooth turned on, attempting preferred device connection',
    });

    // Reset the flag to allow reconnection attempt
    this.hasAttemptedPreferredDeviceConnection = false;

    // Attempt preferred device connection
    await this.attemptPreferredDeviceConnection();
  }

  private handleBluetoothDisabled(): void {
    this.stopScanning();
    this.disconnectDevice();
    useBluetoothAudioStore.getState().clearDevices();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permissions = [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

        const results = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = Object.values(results).every((result) => result === PermissionsAndroid.RESULTS.GRANTED);

        logger.info({
          message: 'Bluetooth permissions requested',
          context: { results, allGranted },
        });

        return allGranted;
      } catch (error) {
        logger.error({
          message: 'Failed to request Bluetooth permissions',
          context: { error },
        });
        return false;
      }
    }
    return true; // iOS permissions are handled via Info.plist
  }

  async checkBluetoothState(): Promise<State> {
    try {
      const bleState = await BleManager.checkState();
      return this.mapBleStateToState(bleState);
    } catch (error) {
      logger.error({
        message: 'Failed to check Bluetooth state',
        context: { error },
      });
      return State.Unknown;
    }
  }

  async startScanning(durationMs: number = 10000): Promise<void> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth permissions not granted');
    }

    const state = await this.checkBluetoothState();
    if (state !== State.PoweredOn) {
      throw new Error(`Bluetooth is ${state}. Please enable Bluetooth.`);
    }

    if (useBluetoothAudioStore.getState().isScanning) {
      logger.warn({ message: 'Scan already in progress, ignoring request', context: { durationMs } });
      return;
    }

    useBluetoothAudioStore.getState().setIsScanning(true);
    useBluetoothAudioStore.getState().clearDevices();

    logger.info({
      message: 'Starting Bluetooth audio device scan',
      context: { durationMs },
    });

    try {
      // Start scanning for all devices - filtering will be done in the discovery handler
      await BleManager.scan([], durationMs / 1000, false, {
        matchMode: BleScanMatchMode.Sticky,
        scanMode: BleScanMode.LowLatency,
        callbackType: BleScanCallbackType.AllMatches,
      });

      // Set timeout to update UI when scan completes
      this.scanTimeout = setTimeout(() => {
        this.handleScanStopped();

        logger.info({
          message: 'Bluetooth scan completed',
          context: {
            durationMs,
            devicesFound: useBluetoothAudioStore.getState().availableDevices.length,
          },
        });
      }, durationMs);
    } catch (error) {
      logger.error({
        message: 'Failed to start Bluetooth scan',
        context: { error },
      });
      useBluetoothAudioStore.getState().setIsScanning(false);
      throw error;
    }
  }

  /**
   * Debug method to scan for ALL devices with detailed logging
   * Use this for troubleshooting device discovery issues
   */
  async startDebugScanning(durationMs: number = 15000): Promise<void> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth permissions not granted');
    }

    const state = await this.checkBluetoothState();
    if (state !== State.PoweredOn) {
      throw new Error(`Bluetooth is ${state}. Please enable Bluetooth.`);
    }

    // Stop any existing scan first
    this.stopScanning();

    useBluetoothAudioStore.getState().setIsScanning(true);
    useBluetoothAudioStore.getState().clearDevices();

    logger.info({
      message: 'Starting DEBUG Bluetooth device scan (all devices)',
      context: { durationMs },
    });

    try {
      // Start scanning for all devices with detailed logging
      await BleManager.scan([], durationMs / 1000, true); // Allow duplicates for debugging

      // Set timeout to update UI when scan completes
      this.scanTimeout = setTimeout(() => {
        this.handleScanStopped();

        logger.info({
          message: 'DEBUG: Bluetooth scan completed',
          context: {
            durationMs,
            totalDevicesFound: useBluetoothAudioStore.getState().availableDevices.length,
          },
        });
      }, durationMs);
    } catch (error) {
      logger.error({
        message: 'Failed to start DEBUG Bluetooth scan',
        context: { error },
      });
      useBluetoothAudioStore.getState().setIsScanning(false);
      throw error;
    }
  }

  protected isAudioDevice(device: Device): boolean {
    const name = device.name?.toLowerCase() || '';
    const audioKeywords = ['speaker', 'headset', 'earbuds', 'headphone', 'audio', 'mic', 'sound', 'wireless', 'bluetooth', 'bt', 'aina', 'inrico', 'hys', 'b01', 'ptt'];

    // Check if device name contains audio-related keywords
    const hasAudioKeyword = audioKeywords.some((keyword) => name.includes(keyword));

    // Check if device has audio service UUIDs - use advertising data
    const advertisingData = device.advertising;
    const hasAudioService =
      advertisingData?.serviceUUIDs?.some((uuid: string) => {
        const upperUuid = uuid.toUpperCase();
        return [AUDIO_SERVICE_UUID, HFP_SERVICE_UUID, HSP_SERVICE_UUID, AINA_HEADSET_SERVICE, B01INRICO_HEADSET_SERVICE, HYS_HEADSET_SERVICE].includes(upperUuid);
      }) || false;

    // Check manufacturer data for known audio device manufacturers
    const hasAudioManufacturerData = advertisingData?.manufacturerData ? this.hasAudioManufacturerData(advertisingData.manufacturerData) : false;

    // Check service data for audio device indicators
    const hasAudioServiceData = advertisingData?.serviceData ? this.hasAudioServiceData(advertisingData.serviceData) : false;

    // Log device details for debugging
    logger.debug({
      message: 'Evaluating device for audio capability',
      context: {
        deviceId: device.id,
        deviceName: device.name,
        hasAudioKeyword,
        hasAudioService,
        hasAudioManufacturerData,
        hasAudioServiceData,
        serviceUUIDs: advertisingData?.serviceUUIDs,
        manufacturerData: advertisingData?.manufacturerData,
        serviceData: advertisingData?.serviceData,
      },
    });

    return hasAudioKeyword || hasAudioService || hasAudioManufacturerData || hasAudioServiceData;
  }

  private hasAudioManufacturerData(manufacturerData: string | { [key: string]: string } | Record<string, any>): boolean {
    // Known audio device manufacturer IDs (check manufacturer data for audio device indicators)
    // This is a simplified check - you'd need to implement device-specific logic

    if (typeof manufacturerData === 'string') {
      // Simple string check for audio-related manufacturer data
      return manufacturerData.toLowerCase().includes('audio') || manufacturerData.toLowerCase().includes('headset') || manufacturerData.toLowerCase().includes('speaker');
    }

    const audioManufacturerIds = [
      '0x004C', // Apple
      '0x001D', // Qualcomm
      '0x000F', // Broadcom
      '0x0087', // Mediatek
      '0x02E5', // Realtek
    ];

    return Object.keys(manufacturerData).some((key) => audioManufacturerIds.includes(key) || audioManufacturerIds.includes(`0x${key}`));
  }

  private hasAudioServiceData(serviceData: string | { [key: string]: string } | Record<string, any>): boolean {
    try {
      // Service data contains information about the device's capabilities
      // Audio devices often advertise their capabilities in service data

      if (typeof serviceData === 'string') {
        // Try to decode hex string service data
        const decodedData = this.decodeServiceDataString(serviceData);
        return this.analyzeServiceDataForAudio(decodedData);
      }

      if (typeof serviceData === 'object' && serviceData !== null) {
        // Service data is an object with service UUIDs as keys and data as values
        return Object.entries(serviceData).some(([serviceUuid, data]) => {
          if (typeof data !== 'string') {
            return false; // Skip non-string data
          }

          const upperServiceUuid = serviceUuid.toUpperCase();

          // Check if the service UUID itself indicates audio capability
          const isAudioServiceUuid = [
            AUDIO_SERVICE_UUID,
            HFP_SERVICE_UUID,
            HSP_SERVICE_UUID,
            AINA_HEADSET_SERVICE,
            B01INRICO_HEADSET_SERVICE,
            HYS_HEADSET_SERVICE,
            '0000FE59-0000-1000-8000-00805F9B34FB', // Common audio service
            '0000180F-0000-1000-8000-00805F9B34FB', // Battery service (often used by audio devices)
          ].some((uuid) => uuid.toUpperCase() === upperServiceUuid);

          if (isAudioServiceUuid) {
            logger.debug({
              message: 'Found audio service UUID in service data',
              context: {
                serviceUuid: upperServiceUuid,
                data: data,
              },
            });
            return true;
          }

          // Analyze the service data content for audio indicators
          if (typeof data === 'string') {
            const decodedData = this.decodeServiceDataString(data);
            return this.analyzeServiceDataForAudio(decodedData);
          }

          return false;
        });
      }

      return false;
    } catch (error) {
      logger.debug({
        message: 'Error analyzing service data for audio capability',
        context: { error, serviceData },
      });
      return false;
    }
  }

  private decodeServiceDataString(data: string): Buffer {
    try {
      // Service data can be in various formats: hex string, base64, etc.
      // Try hex first (most common for BLE advertising data)
      if (/^[0-9A-Fa-f]+$/.test(data)) {
        return Buffer.from(data, 'hex');
      }

      // Try base64
      try {
        return Buffer.from(data, 'base64');
      } catch {
        // Fall back to treating as raw string
        return Buffer.from(data, 'utf8');
      }
    } catch (error) {
      logger.debug({
        message: 'Failed to decode service data string',
        context: { error, data },
      });
      return Buffer.alloc(0);
    }
  }

  private analyzeServiceDataForAudio(data: Buffer): boolean {
    if (!data || data.length === 0) {
      return false;
    }

    try {
      // Convert to hex string for pattern matching
      const hexData = data.toString('hex').toLowerCase();

      // Look for common audio device indicators in service data
      const audioPatterns = [
        // Common audio capability flags (these are example patterns)
        '0001', // Audio sink capability
        '0002', // Audio source capability
        '0004', // Headset capability
        '0008', // Hands-free capability
        '1108', // HSP service class
        '110a', // A2DP sink service class
        '110b', // A2DP source service class
        '111e', // HFP service class
        '1203', // Audio/Video Remote Control Profile
        // Known manufacturer-specific patterns
        'aina', // AINA device identifier
        'inrico', // Inrico device identifier
        'hys', // HYS device identifier
      ];

      const hasAudioPattern = audioPatterns.some((pattern) => hexData.includes(pattern));

      // Check for specific byte patterns that indicate audio capabilities
      const hasAudioCapabilityBytes = this.checkAudioCapabilityBytes(data);

      // Check for device class indicators (if present in service data)
      const hasAudioDeviceClass = this.checkAudioDeviceClass(data);

      logger.debug({
        message: 'Service data audio analysis',
        context: {
          hexData,
          hasAudioPattern,
          hasAudioCapabilityBytes,
          hasAudioDeviceClass,
          dataLength: data.length,
        },
      });

      return hasAudioPattern || hasAudioCapabilityBytes || hasAudioDeviceClass;
    } catch (error) {
      logger.debug({
        message: 'Error in service data audio analysis',
        context: { error },
      });
      return false;
    }
  }

  private checkAudioCapabilityBytes(data: Buffer): boolean {
    // Check for common audio capability indicators in binary data
    if (data.length < 2) return false;

    try {
      // Check for Bluetooth device class indicators (if embedded in service data)
      // Major device class for Audio/Video devices is 0x04
      // Minor device classes include: 0x01 (headset), 0x02 (hands-free), 0x04 (microphone), 0x05 (speaker), etc.

      for (let i = 0; i < data.length - 1; i++) {
        const byte1 = data[i];
        const byte2 = data[i + 1];

        // Check for audio device class patterns
        if ((byte1 & 0x1f) === 0x04) {
          // Major class: Audio/Video
          const minorClass = (byte2 >> 2) & 0x3f;
          if ([0x01, 0x02, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a].includes(minorClass)) {
            logger.debug({
              message: 'Found audio device class in service data',
              context: {
                majorClass: byte1 & 0x1f,
                minorClass,
                position: i,
              },
            });
            return true;
          }
        }

        // Check for HID service class (some audio devices also support HID)
        if (byte1 === 0x05 && byte2 === 0x80) {
          // HID pointing device
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.debug({
        message: 'Error checking audio capability bytes',
        context: { error },
      });
      return false;
    }
  }

  private checkAudioDeviceClass(data: Buffer): boolean {
    // Look for Bluetooth Device Class (CoD) patterns that indicate audio devices
    if (data.length < 3) return false;

    try {
      // Device class is typically 3 bytes: service classes (2 bytes) + device class (1 byte)
      for (let i = 0; i <= data.length - 3; i++) {
        const cod = (data[i + 2] << 16) | (data[i + 1] << 8) | data[i];

        // Extract major and minor device class
        const majorDeviceClass = (cod >> 8) & 0x1f;
        const minorDeviceClass = (cod >> 2) & 0x3f;

        // Major device class 0x04 = Audio/Video devices
        if (majorDeviceClass === 0x04) {
          logger.debug({
            message: 'Found audio/video device class in service data',
            context: {
              cod: cod.toString(16),
              majorClass: majorDeviceClass,
              minorClass: minorDeviceClass,
              position: i,
            },
          });
          return true;
        }

        // Check service class bits for audio services
        // Service class bits are in bits 13-23 of the 24-bit CoD
        const serviceClasses = (cod >> 13) & 0x7ff;
        const hasAudioService = (serviceClasses & 0x200) !== 0; // Audio bit (bit 21 -> bit 8 in service class)
        const hasRenderingService = (serviceClasses & 0x40) !== 0; // Rendering bit (bit 18 -> bit 5 in service class)

        if (hasAudioService || hasRenderingService) {
          logger.debug({
            message: 'Found audio service class bits in service data',
            context: {
              cod: cod.toString(16),
              hasAudioService,
              hasRenderingService,
              position: i,
            },
          });
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.debug({
        message: 'Error checking audio device class',
        context: { error },
      });
      return false;
    }
  }

  private handleDeviceFound(device: Device): void {
    const audioDevice: BluetoothAudioDevice = {
      id: device.id,
      name: device.name || null,
      rssi: device.rssi || undefined,
      isConnected: false,
      hasAudioCapability: true,
      supportsMicrophoneControl: this.supportsMicrophoneControl(device),
      device,
    };

    logger.info({
      message: 'Audio device found',
      context: {
        deviceId: device.id,
        deviceName: device.name,
        rssi: device.rssi,
        supportsMicControl: audioDevice.supportsMicrophoneControl,
      },
    });

    useBluetoothAudioStore.getState().addDevice(audioDevice);

    // Check if this is the preferred device and auto-connect
    this.checkAndAutoConnectPreferredDevice(audioDevice);
  }

  private async checkAndAutoConnectPreferredDevice(device: BluetoothAudioDevice): Promise<void> {
    const { preferredDevice, connectedDevice } = useBluetoothAudioStore.getState();

    // Only auto-connect if:
    // 1. This is the preferred device
    // 2. No device is currently connected
    // 3. We're not already in the process of connecting
    if (preferredDevice?.id === device.id && !connectedDevice && !this.connectionTimeout) {
      try {
        logger.info({
          message: 'Auto-connecting to preferred Bluetooth device',
          context: { deviceId: device.id, deviceName: device.name },
        });

        await this.connectToDevice(device.id);
      } catch (error) {
        logger.warn({
          message: 'Failed to auto-connect to preferred Bluetooth device',
          context: { deviceId: device.id, error },
        });
      }
    }
  }

  private supportsMicrophoneControl(device: Device): boolean {
    // Check if device likely supports microphone control based on service UUIDs
    const advertisingData = device.advertising;
    const serviceUUIDs = advertisingData?.serviceUUIDs || [];
    return serviceUUIDs.some((uuid: string) => [HFP_SERVICE_UUID, HSP_SERVICE_UUID].includes(uuid.toUpperCase()));
  }

  stopScanning(): void {
    try {
      BleManager.stopScan();
    } catch (error) {
      logger.debug({
        message: 'Error stopping scan',
        context: { error },
      });
    }

    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    useBluetoothAudioStore.getState().setIsScanning(false);

    logger.info({
      message: 'Bluetooth scan stopped',
    });
  }

  async connectToDevice(deviceId: string): Promise<void> {
    try {
      useBluetoothAudioStore.getState().setIsConnecting(true);

      // Connect to the device
      await BleManager.connect(deviceId);

      logger.info({
        message: 'Connected to Bluetooth audio device',
        context: { deviceId },
      });

      // Get the connected peripheral info
      const connectedPeripherals = await BleManager.getConnectedPeripherals();
      const device = connectedPeripherals.find((p) => p.id === deviceId);

      if (!device) {
        throw new Error('Device not found after connection');
      }

      // Discover services and characteristics
      await BleManager.retrieveServices(deviceId);

      this.connectedDevice = device;
      useBluetoothAudioStore.getState().setConnectedDevice({
        id: device.id,
        name: device.name || null,
        rssi: device.rssi || undefined,
        isConnected: true,
        hasAudioCapability: true,
        supportsMicrophoneControl: this.supportsMicrophoneControl(device),
        device,
      });

      // Set up button event monitoring
      await this.setupButtonEventMonitoring(device);

      // Integrate with LiveKit audio routing
      await this.setupLiveKitAudioRouting(device);

      // Play connected device sound
      await audioService.playConnectedDeviceSound();

      useBluetoothAudioStore.getState().setIsConnecting(false);
    } catch (error) {
      logger.error({
        message: 'Failed to connect to Bluetooth audio device',
        context: { deviceId, error },
      });

      useBluetoothAudioStore.getState().setIsConnecting(false);
      useBluetoothAudioStore.getState().setConnectionError(error instanceof Error ? error.message : 'Unknown connection error');
      throw error;
    }
  }

  protected handleDeviceDisconnected(args: { peripheral: string }): void {
    logger.info({
      message: 'Bluetooth audio device disconnected',
      context: {
        deviceId: args.peripheral,
      },
    });

    // Only handle if this is our connected device
    if (this.connectedDevice && this.connectedDevice.id === args.peripheral) {
      this.connectedDevice = null;

      useBluetoothAudioStore.getState().setConnectedDevice(null);
      useBluetoothAudioStore.getState().clearConnectionError();

      // Revert LiveKit audio routing to default
      this.revertLiveKitAudioRouting();
    }
  }

  protected async setupButtonEventMonitoring(device: Device): Promise<void> {
    try {
      const peripheralInfo = await BleManager.getDiscoveredPeripherals();
      const deviceInfo = peripheralInfo.find((p) => p.id === device.id);

      if (!deviceInfo) {
        logger.warn({
          message: 'Device not found in discovered peripherals',
          context: { deviceId: device.id },
        });
        return;
      }

      logger.info({
        message: 'Setting up button event monitoring',
        context: {
          deviceId: device.id,
          deviceName: device.name,
        },
      });

      // Start notifications for known button control characteristics
      await this.startNotificationsForButtonControls(device.id);
    } catch (error) {
      logger.warn({
        message: 'Could not set up button event monitoring',
        context: { deviceId: device.id, error },
      });
    }
  }

  private async startNotificationsForButtonControls(deviceId: string): Promise<void> {
    // Try to start notifications for known button control service/characteristic combinations
    const buttonControlConfigs = [
      { service: AINA_HEADSET_SERVICE, characteristic: AINA_HEADSET_SVC_PROP },
      { service: B01INRICO_HEADSET_SERVICE, characteristic: B01INRICO_HEADSET_SERVICE_CHAR },
      { service: HYS_HEADSET_SERVICE, characteristic: HYS_HEADSET_SERVICE_CHAR },
      // Add generic button control UUIDs
      ...BUTTON_CONTROL_UUIDS.map((uuid) => ({ service: '00001800-0000-1000-8000-00805F9B34FB', characteristic: uuid })), // Generic service
    ];

    for (const config of buttonControlConfigs) {
      try {
        await BleManager.startNotification(deviceId, config.service, config.characteristic);
        logger.info({
          message: 'Started notifications for button control',
          context: {
            deviceId,
            service: config.service,
            characteristic: config.characteristic,
          },
        });
      } catch (error) {
        logger.debug({
          message: 'Failed to start notifications for characteristic',
          context: {
            deviceId,
            service: config.service,
            characteristic: config.characteristic,
            error,
          },
        });
      }
    }
  }

  private handleAinaButtonEvent(data: string): void {
    try {
      const buffer = Buffer.from(data, 'base64');
      logger.info({
        message: 'AINA button data received',
        context: {
          dataLength: buffer.length,
          rawData: buffer.toString('hex'),
        },
      });

      // AINA-specific button parsing
      const buttonEvent = this.parseAinaButtonData(buffer);
      if (buttonEvent) {
        this.processButtonEvent(buttonEvent);
      }
    } catch (error) {
      logger.error({
        message: 'Failed to handle AINA button event',
        context: { error },
      });
    }
  }

  private handleB01InricoButtonEvent(data: string): void {
    try {
      const buffer = Buffer.from(data, 'base64');
      logger.info({
        message: 'B01 Inrico button data received',
        context: {
          dataLength: buffer.length,
          rawData: buffer.toString('hex'),
        },
      });

      // B01 Inrico-specific button parsing
      const buttonEvent = this.parseB01InricoButtonData(buffer);
      if (buttonEvent) {
        this.processButtonEvent(buttonEvent);
      }
    } catch (error) {
      logger.error({
        message: 'Failed to handle B01 Inrico button event',
        context: { error },
      });
    }
  }

  private handleHYSButtonEvent(data: string): void {
    try {
      const buffer = Buffer.from(data, 'base64');
      logger.info({
        message: 'HYS button data received',
        context: {
          dataLength: buffer.length,
          rawData: buffer.toString('hex'),
        },
      });

      // HYS-specific button parsing
      const buttonEvent = this.parseHYSButtonData(buffer);
      if (buttonEvent) {
        this.processButtonEvent(buttonEvent);
      }
    } catch (error) {
      logger.error({
        message: 'Failed to handle HYS button event',
        context: { error },
      });
    }
  }

  private handleGenericButtonEvent(data: string): void {
    try {
      const buffer = Buffer.from(data, 'base64');
      logger.info({
        message: 'Generic button data received',
        context: {
          dataLength: buffer.length,
          rawData: buffer.toString('hex'),
        },
      });

      // Generic button parsing
      const buttonEvent = this.parseGenericButtonData(buffer);
      if (buttonEvent) {
        this.processButtonEvent(buttonEvent);
      }
    } catch (error) {
      logger.error({
        message: 'Failed to handle generic button event',
        context: { error },
      });
    }
  }

  private parseAinaButtonData(buffer: Buffer): AudioButtonEvent | null {
    if (buffer.length === 0) return null;

    // AINA-specific parsing logic
    const byte = buffer[0];

    let buttonType: AudioButtonEvent['button'] = 'unknown';
    let eventType: AudioButtonEvent['type'] = 'press';

    // AINA button mapping (adjust based on actual AINA protocol)
    switch (byte) {
      case 0x00:
        buttonType = 'ptt_stop';
        break;
      case 0x01:
        buttonType = 'ptt_start';
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

    // Check for long press (adjust based on AINA protocol)
    if (buffer.length > 1 && buffer[1] === 0xff) {
      eventType = 'long_press';
    }

    return {
      type: eventType,
      button: buttonType,
      timestamp: Date.now(),
    };
  }

  private parseB01InricoButtonData(buffer: Buffer): AudioButtonEvent | null {
    if (buffer.length === 0) return null;

    // Log all raw button data for debugging
    const rawHex = buffer.toString('hex');
    const allBytes = Array.from(buffer)
      .map((b) => `0x${b.toString(16).padStart(2, '0')}`)
      .join(', ');

    logger.info({
      message: 'B01 Inrico raw button data analysis',
      context: {
        bufferLength: buffer.length,
        rawHex,
        allBytes,
        firstByte: `0x${buffer[0].toString(16).padStart(2, '0')}`,
        secondByte: buffer.length > 1 ? `0x${buffer[1].toString(16).padStart(2, '0')}` : 'N/A',
      },
    });

    // B01 Inrico-specific parsing logic
    const byte = buffer[0];
    const byte2 = buffer[5] || 0; // Fallback to 0 if not present

    let buttonType: AudioButtonEvent['button'] = 'unknown';
    let eventType: AudioButtonEvent['type'] = 'press';

    // Updated B01 Inrico button mapping based on common protocols
    // Note: These mappings may need adjustment based on actual device protocol
    switch (byte) {
      case 0x00:
        buttonType = 'ptt_stop';
        break;
      case 0x01:
        buttonType = 'ptt_start';
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
      case 0x05:
        buttonType = 'unknown'; // Emergency or special button
        break;
      // Original mappings as fallback
      case 0x10:
        buttonType = 'ptt_start';
        break;
      case 0x11:
        buttonType = 'ptt_stop';
        break;
      case 0x20:
        buttonType = 'mute';
        break;
      case 0x30:
        buttonType = 'volume_up';
        break;
      case 0x40:
        buttonType = 'volume_down';
        break;
      case 43:
        if (byte2 === 80) {
          buttonType = 'ptt_start';
        } else if (byte2 === 82) {
          buttonType = 'ptt_stop';
        }
        break;
      default:
        logger.warn({
          message: 'Unknown B01 Inrico button code received',
          context: {
            byte: `0x${byte.toString(16).padStart(2, '0')}`,
            decimal: byte,
            binary: `0b${byte.toString(2).padStart(8, '0')}`,
            rawBuffer: rawHex,
          },
        });
        buttonType = 'unknown';
    }

    // Check for long press patterns
    if (buffer.length > 1) {
      const secondByte = buffer[1];
      if (secondByte === 0x01 || secondByte === 0xff) {
        eventType = 'long_press';
      } else if (secondByte === 0x02) {
        eventType = 'double_press';
      }
    }

    // Alternative long press detection using bit masking
    if ((byte & 0x80) === 0x80) {
      eventType = 'long_press';
      // Remove the long press bit to get the actual button code
      const actualButtonByte = byte & 0x7f;
      logger.info({
        message: 'B01 Inrico long press detected via bit mask',
        context: {
          originalByte: `0x${byte.toString(16).padStart(2, '0')}`,
          actualButtonByte: `0x${actualButtonByte.toString(16).padStart(2, '0')}`,
        },
      });

      // Re-check button mapping with the actual button byte (without long press flag)
      switch (actualButtonByte) {
        case 0x00:
          buttonType = 'ptt_stop';
          break;
        case 0x01:
          buttonType = 'ptt_start';
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
        case 0x05:
          buttonType = 'unknown'; // Emergency or special button
          break;
        // Original mappings as fallback for the masked byte
        case 0x10:
          buttonType = 'ptt_start';
          break;
        case 0x11:
          buttonType = 'ptt_stop';
          break;
        case 0x20:
          buttonType = 'mute';
          break;
        case 0x30:
          buttonType = 'volume_up';
          break;
        case 0x40:
          buttonType = 'volume_down';
          break;
      }
    }

    const result = {
      type: eventType,
      button: buttonType,
      timestamp: Date.now(),
    };

    logger.info({
      message: 'B01 Inrico button event parsed',
      context: {
        rawData: rawHex,
        parsedEvent: result,
        isKnownButton: buttonType !== 'unknown',
      },
    });

    return result;
  }

  private parseHYSButtonData(buffer: Buffer): AudioButtonEvent | null {
    if (buffer.length === 0) return null;

    // HYS-specific parsing logic
    const byte = buffer[0];

    let buttonType: AudioButtonEvent['button'] = 'unknown';
    let eventType: AudioButtonEvent['type'] = 'press';

    // HYS button mapping (adjust based on actual HYS protocol)
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
      case 0x05:
        buttonType = 'unknown'; // Emergency button - using unknown as placeholder
        break;
    }

    // Check for long press (adjust based on HYS protocol)
    if (buffer.length > 1 && buffer[1] === 0x01) {
      eventType = 'long_press';
    } else if (buffer.length > 1 && buffer[1] === 0x02) {
      eventType = 'double_press';
    }

    return {
      type: eventType,
      button: buttonType,
      timestamp: Date.now(),
    };
  }

  private parseGenericButtonData(buffer: Buffer): AudioButtonEvent | null {
    // This is a simplified parser - real implementation would depend on device specs
    if (buffer.length === 0) return null;

    const byte = buffer[0];

    // Example parsing logic (varies by manufacturer)
    let buttonType: AudioButtonEvent['button'] = 'unknown';
    let eventType: AudioButtonEvent['type'] = 'press';

    switch (byte & 0x0f) {
      case 0x00:
        buttonType = 'ptt_start';
        break;
      case 0x01:
        buttonType = 'ptt_stop';
        break;
      case 0x02:
        buttonType = 'volume_up';
        break;
      case 0x03:
        buttonType = 'volume_down';
        break;
      case 0x04:
        buttonType = 'mute';
        break;
    }

    if (byte & 0x80) {
      eventType = 'long_press';
    } else if (byte & 0x40) {
      eventType = 'double_press';
    }

    return {
      type: eventType,
      button: buttonType,
      timestamp: Date.now(),
    };
  }

  protected processButtonEvent(buttonEvent: AudioButtonEvent): void {
    logger.info({
      message: 'Button event processed',
      context: { buttonEvent },
    });

    useBluetoothAudioStore.getState().addButtonEvent(buttonEvent);

    // Handle mute/unmute events
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

    // Handle volume events
    if (buttonEvent.button === 'volume_up' || buttonEvent.button === 'volume_down') {
      this.handleVolumeChange(buttonEvent.button);
    }
  }

  protected async handleVolumeChange(direction: 'volume_up' | 'volume_down'): Promise<void> {
    logger.info({
      message: 'Volume change requested via Bluetooth button',
      context: { direction },
    });

    useBluetoothAudioStore.getState().setLastButtonAction({
      action: direction,
      timestamp: Date.now(),
    });

    // Add volume control logic here if needed
    // This would typically involve native audio controls
  }

  protected handleButtonEvent(data: string): void {
    // Keep the original method for backward compatibility
    this.handleGenericButtonEvent(data);
  }

  protected async handleMuteToggle(): Promise<void> {
    const liveKitStore = useLiveKitStore.getState();
    if (liveKitStore.currentRoom) {
      const currentMuteState = !liveKitStore.currentRoom.localParticipant.isMicrophoneEnabled;

      try {
        await liveKitStore.currentRoom.localParticipant.setMicrophoneEnabled(currentMuteState);

        logger.info({
          message: 'Microphone toggled via Bluetooth button',
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
          message: 'Failed to toggle microphone via Bluetooth button',
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
        if (enabled && !currentMuteState) return; // already enabled
        if (!enabled && currentMuteState) return; // already disabled

        await liveKitStore.currentRoom.localParticipant.setMicrophoneEnabled(currentMuteState);

        logger.info({
          message: 'Microphone toggled via Bluetooth button',
          context: { enabled: currentMuteState },
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
          message: 'Failed to toggle microphone via Bluetooth button',
          context: { error },
        });
      }
    }
  }

  protected async setupLiveKitAudioRouting(device: Device): Promise<void> {
    try {
      // Note: Audio routing in React Native/LiveKit typically requires native modules
      // This is a placeholder for the integration logic

      logger.info({
        message: 'Setting up LiveKit audio routing to Bluetooth device',
        context: { deviceId: device.id, deviceName: device.name },
      });

      const bluetoothStore = useBluetoothAudioStore.getState();
      const deviceName = device.name || 'Bluetooth Device';

      // Add Bluetooth device to available audio devices
      const bluetoothAudioDevice = {
        id: device.id,
        name: deviceName,
        type: 'bluetooth' as const,
        isAvailable: true,
      };

      // Update available audio devices list
      const currentDevices = bluetoothStore.availableAudioDevices.filter((d) => d.type !== 'bluetooth');
      bluetoothStore.setAvailableAudioDevices([...currentDevices, bluetoothAudioDevice]);

      // If device supports microphone, set it as selected microphone
      if (this.supportsMicrophoneControl(device)) {
        bluetoothStore.setSelectedMicrophone(bluetoothAudioDevice);
      }

      // Set as selected speaker
      bluetoothStore.setSelectedSpeaker(bluetoothAudioDevice);

      // In a real implementation, you would:
      // 1. Use native modules to route audio to the Bluetooth device
      // 2. Configure LiveKit's audio context to use the Bluetooth device as input/output
      // 3. Set audio session category and options appropriately

      bluetoothStore.setAudioRoutingActive(true);

      // Notify LiveKit store about audio device change
      // This would trigger any necessary audio context updates
    } catch (error) {
      logger.error({
        message: 'Failed to setup LiveKit audio routing',
        context: { error },
      });
      throw error;
    }
  }

  protected revertLiveKitAudioRouting(): void {
    try {
      logger.info({
        message: 'Reverting LiveKit audio routing to default',
      });

      const bluetoothStore = useBluetoothAudioStore.getState();

      // Remove Bluetooth devices from available audio devices
      const nonBluetoothDevices = bluetoothStore.availableAudioDevices.filter((d) => d.type !== 'bluetooth');
      bluetoothStore.setAvailableAudioDevices(nonBluetoothDevices);

      // Revert to default audio devices
      const defaultMic = nonBluetoothDevices.find((d) => d.type === 'default' && d.id.includes('mic'));
      const defaultSpeaker = nonBluetoothDevices.find((d) => d.type === 'default' && d.id.includes('speaker'));

      if (defaultMic) {
        bluetoothStore.setSelectedMicrophone(defaultMic);
      }
      if (defaultSpeaker) {
        bluetoothStore.setSelectedSpeaker(defaultSpeaker);
      }

      // Revert audio routing to default (phone speaker/microphone)
      bluetoothStore.setAudioRoutingActive(false);
    } catch (error) {
      logger.error({
        message: 'Failed to revert LiveKit audio routing',
        context: { error },
      });
    }
  }

  async disconnectDevice(): Promise<void> {
    if (this.connectedDevice && this.connectedDevice.id) {
      try {
        await BleManager.disconnect(this.connectedDevice.id);
        logger.info({
          message: 'Bluetooth audio device disconnected manually',
          context: { deviceId: this.connectedDevice.id },
        });
      } catch (error) {
        logger.error({
          message: 'Error disconnecting Bluetooth audio device',
          context: { error },
        });
      }

      this.handleDeviceDisconnected({ peripheral: this.connectedDevice.id });
    }
  }

  async getConnectedDevice(): Promise<BluetoothAudioDevice | null> {
    return useBluetoothAudioStore.getState().connectedDevice;
  }

  async isDeviceConnected(deviceId: string): Promise<boolean> {
    try {
      const connectedPeripherals = await BleManager.getConnectedPeripherals();
      return connectedPeripherals.some((p) => p.id === deviceId);
    } catch {
      return false;
    }
  }

  /**
   * Debug method to test B01 Inrico button mappings
   * Use this method to manually test button codes and determine the correct mapping
   */
  testButtonMapping(deviceType: string, hexString: string): AudioButtonEvent | null {
    if (deviceType.toLowerCase() !== 'b01inrico') {
      logger.warn({
        message: 'Button mapping test only supported for B01 Inrico devices in native implementation',
        context: { deviceType },
      });
      return null;
    }

    try {
      // Convert hex string to buffer (e.g., "01" -> Buffer([0x01]))
      const cleanHex = hexString.replace(/[^0-9A-Fa-f]/g, '');
      const buffer = Buffer.from(cleanHex, 'hex');

      logger.info({
        message: 'Testing B01 Inrico button mapping',
        context: {
          inputHex: hexString,
          cleanHex,
          buffer: Array.from(buffer).map((b) => `0x${b.toString(16).padStart(2, '0')}`),
        },
      });

      const result = this.parseB01InricoButtonData(buffer);

      logger.info({
        message: 'B01 Inrico button mapping test result',
        context: {
          inputHex: hexString,
          parsedResult: result,
        },
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Error testing B01 Inrico button mapping',
        context: { hexString, error },
      });
      return null;
    }
  }

  destroy(): void {
    this.stopScanning();
    this.disconnectDevice();

    // Remove all event listeners
    this.eventListeners.forEach((listener) => {
      listener.remove();
    });
    this.eventListeners = [];

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Reset initialization flags
    this.isInitialized = false;
    this.hasAttemptedPreferredDeviceConnection = false;
  }
}
