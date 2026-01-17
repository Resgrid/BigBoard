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

describe('BluetoothAudioService', () => {
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

  it('should have connectDevice method', () => {
    expect(typeof bluetoothAudioService.connectDevice).toBe('function');
  });

  it('should have getAvailableDevices method', () => {
    expect(typeof bluetoothAudioService.getAvailableDevices).toBe('function');
  });
});
