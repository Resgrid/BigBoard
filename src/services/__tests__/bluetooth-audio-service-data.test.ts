import { bluetoothAudioService } from '../bluetooth-audio.service';
import { logger } from '@/lib/logging';

// Mock the logger
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the stores
jest.mock('@/stores/app/bluetooth-audio-store', () => ({
  useBluetoothAudioStore: {
    getState: jest.fn(() => ({
      setIsScanning: jest.fn(),
      clearDevices: jest.fn(),
      addDevice: jest.fn(),
      setBluetoothState: jest.fn(),
      availableDevices: [],
      preferredDevice: null,
      availableAudioDevices: [],
    })),
  },
}));

jest.mock('@/stores/app/livekit-store', () => ({
  useLiveKitStore: {
    getState: jest.fn(() => ({
      currentRoom: null,
    })),
  },
}));

describe('BluetoothAudioService - Service Data Analysis', () => {
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = bluetoothAudioService;
  });

  describe('hasAudioServiceData', () => {
    it('should detect audio device from service UUID in service data object', () => {
      const serviceData = {
        '0000110A-0000-1000-8000-00805F9B34FB': '0102', // A2DP service with data
        '0000180F-0000-1000-8000-00805F9B34FB': '64', // Battery service
      };

      const result = service.hasAudioServiceData(serviceData);
      expect(result).toBe(true);
    });

    it('should detect audio device from HFP service UUID', () => {
      const serviceData = {
        '0000111E-0000-1000-8000-00805F9B34FB': '01', // HFP service
      };

      const result = service.hasAudioServiceData(serviceData);
      expect(result).toBe(true);
    });

    it('should detect audio device from known manufacturer service data', () => {
      const serviceData = {
        '127FACE1-CB21-11E5-93D0-0002A5D5C51B': '010203', // AINA service
      };

      const result = service.hasAudioServiceData(serviceData);
      expect(result).toBe(true);
    });

    it('should return false for non-audio service data', () => {
      const serviceData = {
        '00001801-0000-1000-8000-00805F9B34FB': '00', // Generic Attribute service
        '00001800-0000-1000-8000-00805F9B34FB': '01', // Generic Access service
      };

      const result = service.hasAudioServiceData(serviceData);
      expect(result).toBe(false);
    });

    it('should handle string service data with audio patterns', () => {
      const serviceData = '110a0001'; // A2DP service class indicator

      const result = service.hasAudioServiceData(serviceData);
      expect(result).toBe(true);
    });

    it('should handle empty or invalid service data', () => {
      expect(service.hasAudioServiceData('')).toBe(false);
      expect(service.hasAudioServiceData(null)).toBe(false);
      expect(service.hasAudioServiceData(undefined)).toBe(false);
      expect(service.hasAudioServiceData({})).toBe(false);
    });
  });

  describe('decodeServiceDataString', () => {
    it('should decode hex string service data', () => {
      const hexData = '110a0001';
      const result = service.decodeServiceDataString(hexData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString('hex')).toBe('110a0001');
    });

    it('should decode base64 service data', () => {
      const base64Data = 'EQoAAQ=='; // '110a0001' in base64
      const result = service.decodeServiceDataString(base64Data);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString('hex')).toBe('110a0001');
    });

    it('should handle invalid data gracefully', () => {
      const invalidData = 'invalid-data-!@#';
      const result = service.decodeServiceDataString(invalidData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeServiceDataForAudio', () => {
    it('should detect A2DP service class in hex data', () => {
      const buffer = Buffer.from('110a', 'hex');
      const result = service.analyzeServiceDataForAudio(buffer);
      
      expect(result).toBe(true);
    });

    it('should detect HFP service class in hex data', () => {
      const buffer = Buffer.from('111e', 'hex');
      const result = service.analyzeServiceDataForAudio(buffer);
      
      expect(result).toBe(true);
    });

    it('should detect AINA pattern in hex data', () => {
      // Use actual hex representation of 'aina' in ASCII
      const buffer = Buffer.from('61696e61', 'hex'); // 'aina' in ASCII hex
      const result = service.analyzeServiceDataForAudio(buffer);
      
      expect(result).toBe(true);
    });

    it('should return false for non-audio data', () => {
      const buffer = Buffer.from([0x01, 0x02, 0x03]); // Simple non-audio bytes that won't match any patterns
      const result = service.analyzeServiceDataForAudio(buffer);
      
      expect(result).toBe(false);
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const result = service.analyzeServiceDataForAudio(buffer);
      
      expect(result).toBe(false);
    });
  });

  describe('checkAudioCapabilityBytes', () => {
    it('should detect audio device class (major class 0x04)', () => {
      // Create a buffer with audio device class: major class 0x04, minor class 0x01 (headset)
      const buffer = Buffer.from([0x04, 0x04]); // Major class audio, minor class headset
      const result = service.checkAudioCapabilityBytes(buffer);
      
      expect(result).toBe(true);
    });

    it('should detect HID pointing device pattern', () => {
      const buffer = Buffer.from([0x05, 0x80]); // HID pointing device
      const result = service.checkAudioCapabilityBytes(buffer);
      
      expect(result).toBe(true);
    });

    it('should return false for non-audio patterns', () => {
      const buffer = Buffer.from([0x01, 0x02]); // Non-audio pattern
      const result = service.checkAudioCapabilityBytes(buffer);
      
      expect(result).toBe(false);
    });

    it('should handle short buffer gracefully', () => {
      const buffer = Buffer.from([0x04]); // Too short
      const result = service.checkAudioCapabilityBytes(buffer);
      
      expect(result).toBe(false);
    });
  });

  describe('checkAudioDeviceClass', () => {
    it('should detect audio/video device class (CoD)', () => {
      // Create a Class of Device with major device class 0x04 (Audio/Video)
      const cod = (0x04 << 8) | 0x01; // Major class 0x04, minor class 0x01
      const buffer = Buffer.from([
        cod & 0xff,
        (cod >> 8) & 0xff,
        (cod >> 16) & 0xff,
      ]);
      
      const result = service.checkAudioDeviceClass(buffer);
      expect(result).toBe(true);
    });

    it('should return false for non-audio device class', () => {
      // Create a CoD with non-audio device class
      const cod = (0x01 << 8) | 0x01; // Computer major class
      const buffer = Buffer.from([
        cod & 0xff,
        (cod >> 8) & 0xff,
        (cod >> 16) & 0xff,
      ]);
      
      const result = service.checkAudioDeviceClass(buffer);
      expect(result).toBe(false);
    });

    it('should handle short buffer gracefully', () => {
      const buffer = Buffer.from([0x04, 0x01]); // Too short for CoD
      const result = service.checkAudioDeviceClass(buffer);
      
      expect(result).toBe(false);
    });
  });

  describe('isAudioDevice integration', () => {
    it('should identify device as audio when service data indicates audio capability', () => {
      const device = {
        id: 'test-device',
        name: 'Unknown Device',
        advertising: {
          isConnectable: true,
          serviceData: {
            '0000110A-0000-1000-8000-00805F9B34FB': '0001', // A2DP service
          },
        },
        rssi: -50,
      };

      const result = service.isAudioDevice(device);
      expect(result).toBe(true);
    });

    it('should identify device as audio when multiple indicators are present', () => {
      const device = {
        id: 'test-device',
        name: 'Generic Headset', // Audio keyword
        advertising: {
          isConnectable: true,
          serviceUUIDs: ['0000111E-0000-1000-8000-00805F9B34FB'], // HFP service
          serviceData: {
            '0000110A-0000-1000-8000-00805F9B34FB': '0001', // A2DP service data
          },
          manufacturerData: {
            '0x004C': 'audio-device-data', // Apple manufacturer with audio indicator
          },
        },
        rssi: -45,
      };

      const result = service.isAudioDevice(device);
      expect(result).toBe(true);
    });

    it('should reject device when no audio indicators are present', () => {
      const device = {
        id: 'test-device',
        name: 'Generic Device',
        advertising: {
          isConnectable: true,
          serviceData: {
            '00001800-0000-1000-8000-00805F9B34FB': '01', // Generic Access service
          },
        },
        rssi: -40,
      };

      const result = service.isAudioDevice(device);
      expect(result).toBe(false);
    });
  });
});
