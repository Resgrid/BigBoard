// Mock for react-native-ble-manager
export type BleState = 'on' | 'off' | 'turning_on' | 'turning_off' | 'unsupported' | 'unknown';

export interface Peripheral {
  id: string;
  name?: string;
  rssi?: number;
  advertising?: {
    isConnectable?: boolean;
    localName?: string;
    manufacturerData?: any;
    serviceUUIDs?: string[];
    txPowerLevel?: number;
  };
}

export interface BleManagerDidUpdateValueForCharacteristicEvent {
  peripheral: string;
  characteristic: string;
  service: string;
  value: number[];
}

const mockPeripherals: Peripheral[] = [];
let mockState: BleState = 'on';
let mockIsScanning = false;

const BleManager = {
  start: jest.fn().mockResolvedValue(undefined),

  checkState: jest.fn().mockImplementation(() => Promise.resolve(mockState)),

  scan: jest.fn().mockImplementation((serviceUUIDs: string[], duration: number, allowDuplicates: boolean = false) => {
    mockIsScanning = true;
    // Simulate scanning timeout
    setTimeout(() => {
      mockIsScanning = false;
    }, duration * 1000);
    return Promise.resolve();
  }),

  stopScan: jest.fn().mockImplementation(() => {
    mockIsScanning = false;
    return Promise.resolve();
  }),

  connect: jest.fn().mockResolvedValue(undefined),

  disconnect: jest.fn().mockResolvedValue(undefined),

  retrieveServices: jest.fn().mockResolvedValue(undefined),

  startNotification: jest.fn().mockResolvedValue(undefined),

  stopNotification: jest.fn().mockResolvedValue(undefined),

  getConnectedPeripherals: jest.fn().mockResolvedValue([]),

  getDiscoveredPeripherals: jest.fn().mockResolvedValue(mockPeripherals),

  isPeripheralConnected: jest.fn().mockResolvedValue(false),

  // Mock utilities for testing
  setMockState: (state: BleState) => {
    mockState = state;
  },

  addMockPeripheral: (peripheral: Peripheral) => {
    mockPeripherals.push(peripheral);
  },

  clearMockPeripherals: () => {
    mockPeripherals.length = 0;
  },

  getMockPeripherals: () => [...mockPeripherals],

  isMockScanning: () => mockIsScanning,
};

// Set up as any for easier mocking
(BleManager as any).setMockState = BleManager.setMockState;
(BleManager as any).addMockPeripheral = BleManager.addMockPeripheral;
(BleManager as any).clearMockPeripherals = BleManager.clearMockPeripherals;
(BleManager as any).getMockPeripherals = BleManager.getMockPeripherals;
(BleManager as any).isMockScanning = BleManager.isMockScanning;

export default BleManager;
