import { Buffer } from 'buffer';
import { bluetoothAudioService } from '../bluetooth-audio.service';

// Mock the dependencies
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/stores/app/bluetooth-audio-store', () => ({
  useBluetoothAudioStore: {
    getState: jest.fn(() => ({
      setBluetoothState: jest.fn(),
      setIsScanning: jest.fn(),
      clearDevices: jest.fn(),
      addDevice: jest.fn(),
      setConnectedDevice: jest.fn(),
      setIsConnecting: jest.fn(),
      setConnectionError: jest.fn(),
      clearConnectionError: jest.fn(),
      addButtonEvent: jest.fn(),
      setLastButtonAction: jest.fn(),
      setAvailableAudioDevices: jest.fn(),
      setSelectedMicrophone: jest.fn(),
      setSelectedSpeaker: jest.fn(),
      setAudioRoutingActive: jest.fn(),
      availableDevices: [],
      connectedDevice: null,
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

describe('BluetoothAudioService - B01 Inrico Button Parsing', () => {
  let service: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get the service instance and expose private methods for testing
    service = bluetoothAudioService;
  });

  describe('parseB01InricoButtonData', () => {
    it('should parse PTT start button (0x01)', () => {
      const buffer = Buffer.from([0x01]);
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'press',
        button: 'ptt_start',
        timestamp: expect.any(Number),
      });
    });

    it('should parse PTT stop button (0x00)', () => {
      const buffer = Buffer.from([0x00]);
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'press',
        button: 'ptt_stop',
        timestamp: expect.any(Number),
      });
    });

    it('should parse mute button (0x02)', () => {
      const buffer = Buffer.from([0x02]);
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'press',
        button: 'mute',
        timestamp: expect.any(Number),
      });
    });

    it('should parse volume up button (0x03)', () => {
      const buffer = Buffer.from([0x03]);
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'press',
        button: 'volume_up',
        timestamp: expect.any(Number),
      });
    });

    it('should parse volume down button (0x04)', () => {
      const buffer = Buffer.from([0x04]);
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'press',
        button: 'volume_down',
        timestamp: expect.any(Number),
      });
    });

    it('should parse original PTT start mapping (0x10)', () => {
      const buffer = Buffer.from([0x10]);
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'press',
        button: 'ptt_start',
        timestamp: expect.any(Number),
      });
    });

    it('should parse original PTT stop mapping (0x11)', () => {
      const buffer = Buffer.from([0x11]);
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'press',
        button: 'ptt_stop',
        timestamp: expect.any(Number),
      });
    });

    it('should detect long press via second byte (0x01)', () => {
      const buffer = Buffer.from([0x01, 0x01]); // PTT start with long press indicator
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'long_press',
        button: 'ptt_start',
        timestamp: expect.any(Number),
      });
    });

    it('should detect long press via second byte (0xff)', () => {
      const buffer = Buffer.from([0x02, 0xff]); // Mute with long press indicator
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'long_press',
        button: 'mute',
        timestamp: expect.any(Number),
      });
    });

    it('should detect double press via second byte (0x02)', () => {
      const buffer = Buffer.from([0x02, 0x02]); // Mute with double press indicator
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'double_press',
        button: 'mute',
        timestamp: expect.any(Number),
      });
    });

    it('should detect long press via bit masking (0x80 flag)', () => {
      const buffer = Buffer.from([0x81]); // PTT start (0x01) with long press flag (0x80)
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'long_press',
        button: 'ptt_start',
        timestamp: expect.any(Number),
      });
    });

    it('should handle unknown button codes gracefully', () => {
      const buffer = Buffer.from([0x7F]); // Unknown button code without long press flag
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'press',
        button: 'unknown',
        timestamp: expect.any(Number),
      });
    });

    it('should return null for empty buffer', () => {
      const buffer = Buffer.from([]);
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toBeNull();
    });

    it('should handle multi-byte complex patterns', () => {
      const buffer = Buffer.from([0x05, 0x01, 0x02]); // Emergency button with additional data
      
      const result = service.parseB01InricoButtonData(buffer);
      
      expect(result).toEqual({
        type: 'long_press',
        button: 'unknown',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('handleB01InricoButtonEvent', () => {
    it('should process base64 encoded button data', () => {
      const mockAddButtonEvent = jest.fn();
      const mockSetLastButtonAction = jest.fn();
      const mockProcessButtonEvent = jest.fn();
      
      // Mock the processButtonEvent method
      service.processButtonEvent = mockProcessButtonEvent;

      const base64Data = Buffer.from([0x01]).toString('base64'); // PTT start
      
      service.handleB01InricoButtonEvent(base64Data);
      
      expect(mockProcessButtonEvent).toHaveBeenCalledWith({
        type: 'press',
        button: 'ptt_start',
        timestamp: expect.any(Number),
      });
    });

    it('should handle invalid base64 data gracefully', () => {
      const invalidBase64 = 'invalid-base64-data';
      
      // This should not throw an error
      expect(() => {
        service.handleB01InricoButtonEvent(invalidBase64);
      }).not.toThrow();
    });
  });
});
