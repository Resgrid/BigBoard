// Mock implementation of react-native-ble-plx for testing

export enum State {
  Unknown = 'Unknown',
  Resetting = 'Resetting',
  Unsupported = 'Unsupported',
  Unauthorized = 'Unauthorized',
  PoweredOff = 'PoweredOff',
  PoweredOn = 'PoweredOn',
}

export interface Device {
  id: string;
  name: string | null;
  rssi?: number;
  isConnected(): Promise<boolean>;
  discoverAllServicesAndCharacteristics(): Promise<Device>;
  services(): Promise<Service[]>;
  onDisconnected(callback: (error: any, device: Device) => void): Subscription;
  cancelConnection(): Promise<void>;
  serviceUUIDs?: string[];
}

export interface Service {
  uuid: string;
  characteristics(): Promise<Characteristic[]>;
}

export interface Characteristic {
  uuid: string;
  isNotifiable: boolean;
  value?: string;
  monitor(callback: (error: any, characteristic: Characteristic) => void): Subscription;
}

export interface Subscription {
  remove(): void;
}

export interface BleError {
  message: string;
  code: number;
}

export class BleManager {
  private static mockState: State = State.PoweredOn;
  private static mockDevices: Device[] = [];
  private static stateListener: ((state: State) => void) | null = null;

  static setMockState(state: State) {
    this.mockState = state;
    if (this.stateListener) {
      this.stateListener(state);
    }
  }

  static setMockDevices(devices: Device[]) {
    this.mockDevices = devices;
  }

  static clearMocks() {
    this.mockState = State.PoweredOn;
    this.mockDevices = [];
    this.stateListener = null;
  }

  onStateChange(listener: (state: State) => void, emitCurrentValue: boolean = false): Subscription {
    BleManager.stateListener = listener;
    if (emitCurrentValue) {
      listener(BleManager.mockState);
    }
    return {
      remove: () => {
        BleManager.stateListener = null;
      },
    };
  }

  async state(): Promise<State> {
    return BleManager.mockState;
  }

  startDeviceScan(uuids: string[] | null, options: any, listener: (error: BleError | null, device: Device | null) => void): Subscription {
    // Simulate finding devices
    setTimeout(() => {
      BleManager.mockDevices.forEach((device) => {
        listener(null, device);
      });
    }, 100);

    return {
      remove: () => {},
    };
  }

  stopDeviceScan(): void {}

  async connectToDevice(deviceId: string): Promise<Device> {
    const device = BleManager.mockDevices.find((d) => d.id === deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    return device;
  }

  destroy(): void {
    BleManager.clearMocks();
  }
}

// Mock device creation helper
export const createMockDevice = (id: string, name: string | null = 'Mock Device', options: Partial<Device> = {}): Device => ({
  id,
  name,
  rssi: -60,
  serviceUUIDs: ['0000110A-0000-1000-8000-00805F9B34FB'],
  async isConnected() {
    return true;
  },
  async discoverAllServicesAndCharacteristics() {
    return this;
  },
  async services() {
    return [
      {
        uuid: '0000110A-0000-1000-8000-00805F9B34FB',
        async characteristics() {
          return [
            {
              uuid: '0000FE59-0000-1000-8000-00805F9B34FB',
              isNotifiable: true,
              monitor: (callback) => {
                // Simulate button press after a delay
                setTimeout(() => {
                  const mockChar = {
                    uuid: '0000FE59-0000-1000-8000-00805F9B34FB',
                    isNotifiable: true,
                    value: Buffer.from([0x01]).toString('base64'), // Mute button
                    monitor: () => ({ remove: () => {} }),
                  };
                  callback(null, mockChar);
                }, 1000);
                return { remove: () => {} };
              },
            },
          ];
        },
      },
    ];
  },
  onDisconnected(callback) {
    return { remove: () => {} };
  },
  async cancelConnection() {},
  ...options,
});
