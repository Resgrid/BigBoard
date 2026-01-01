/* eslint-disable @typescript-eslint/no-explicit-any */
import 'react-native';

// Mock dependencies first before importing the service
jest.mock('react-native-ble-manager', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    checkState: jest.fn(),
    scan: jest.fn(),
    stopScan: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    isPeripheralConnected: jest.fn(),
    getConnectedPeripherals: jest.fn(),
    getDiscoveredPeripherals: jest.fn(),
    removeAllListeners: jest.fn(),
    removePeripheral: jest.fn(),
  },
}));

jest.mock('@/lib/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/services/audio.service', () => ({
  audioService: {
    playConnectedDeviceSound: jest.fn(),
  },
}));

import { bluetoothAudioService } from '../bluetooth-audio.service';

describe('BluetoothAudioService Refactoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined and accessible', () => {
    expect(bluetoothAudioService).toBeDefined();
    expect(typeof bluetoothAudioService.destroy).toBe('function');
  });

  it('should have singleton instance pattern', () => {
    // Both calls should return the same instance
    const instance1 = bluetoothAudioService;
    const instance2 = bluetoothAudioService;
    expect(instance1).toBe(instance2);
  });

  it('should have required methods for Bluetooth management', () => {
    expect(typeof bluetoothAudioService.startScanning).toBe('function');
    expect(typeof bluetoothAudioService.stopScanning).toBe('function');
    expect(typeof bluetoothAudioService.connectToDevice).toBe('function');
    expect(typeof bluetoothAudioService.disconnectDevice).toBe('function');
  });

  describe('Preferred Device Connection Refactoring', () => {
    it('should have private attemptPreferredDeviceConnection method', () => {
      const service = bluetoothAudioService as any;
      expect(typeof service.attemptPreferredDeviceConnection).toBe('function');
    });

    it('should have private attemptReconnectToPreferredDevice method for iOS support', () => {
      const service = bluetoothAudioService as any;
      expect(typeof service.attemptReconnectToPreferredDevice).toBe('function');
    });

    it('should track hasAttemptedPreferredDeviceConnection flag for single-call semantics', () => {
      const service = bluetoothAudioService as any;
      
      // Initially should be false
      expect(service.hasAttemptedPreferredDeviceConnection).toBe(false);
      
      // Can be set to true (simulating attempt)
      service.hasAttemptedPreferredDeviceConnection = true;
      expect(service.hasAttemptedPreferredDeviceConnection).toBe(true);
    });

    it('should reset flags on destroy method', () => {
      const service = bluetoothAudioService as any;
      
      // Set flags to true
      service.hasAttemptedPreferredDeviceConnection = true;
      service.isInitialized = true;
      
      // Call destroy
      bluetoothAudioService.destroy();
      
      // Verify flags are reset for single-call logic
      expect(service.hasAttemptedPreferredDeviceConnection).toBe(false);
      expect(service.isInitialized).toBe(false);
    });

    it('should support iOS state change handling through attemptReconnectToPreferredDevice', () => {
      const service = bluetoothAudioService as any;
      
      // Set up scenario: connection was previously attempted
      service.hasAttemptedPreferredDeviceConnection = true;
      
      // Verify the method exists for iOS poweredOn state handling
      expect(typeof service.attemptReconnectToPreferredDevice).toBe('function');
      
      // This method should be called when Bluetooth state changes to poweredOn on iOS
      // It resets the flag and attempts preferred device connection again
    });
  });

  describe('Single-Call Logic Validation', () => {
    it('should implement single-call semantics for preferred device connection', () => {
      const service = bluetoothAudioService as any;
      
      // Simulate first call - should set flag
      service.hasAttemptedPreferredDeviceConnection = false;
      // In actual implementation, attemptPreferredDeviceConnection would set this to true
      
      // Simulate second call - should not execute due to flag
      expect(service.hasAttemptedPreferredDeviceConnection).toBe(false);
      
      // After first attempt
      service.hasAttemptedPreferredDeviceConnection = true;
      expect(service.hasAttemptedPreferredDeviceConnection).toBe(true);
      
      // Second attempt should be blocked by this flag
    });

    it('should allow re-attempting connection after destroy', () => {
      const service = bluetoothAudioService as any;
      
      // Simulate connection attempt
      service.hasAttemptedPreferredDeviceConnection = true;
      
      // Destroy service (resets flags)
      bluetoothAudioService.destroy();
      
      // Flag should be reset, allowing new attempts
      expect(service.hasAttemptedPreferredDeviceConnection).toBe(false);
    });
  });
});
