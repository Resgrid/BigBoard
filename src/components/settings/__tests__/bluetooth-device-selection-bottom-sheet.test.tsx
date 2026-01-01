// Mock Platform first, before any other imports
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn().mockImplementation((obj) => obj.ios || obj.default),
}));

// Mock react-native-svg before anything else
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  G: 'G',
  Text: 'Text',
  TSpan: 'TSpan',
  TextPath: 'TextPath',
  Path: 'Path',
  Polygon: 'Polygon',
  Polyline: 'Polyline',
  Line: 'Line',
  Rect: 'Rect',
  Use: 'Use',
  Image: 'Image',
  Symbol: 'Symbol',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  RadialGradient: 'RadialGradient',
  Stop: 'Stop',
  ClipPath: 'ClipPath',
  Pattern: 'Pattern',
  Mask: 'Mask',
  default: 'Svg',
}));

// Mock @expo/html-elements
jest.mock('@expo/html-elements', () => ({
  H1: 'H1',
  H2: 'H2',
  H3: 'H3',
  H4: 'H4',
  H5: 'H5',
  H6: 'H6',
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import { bluetoothAudioService } from '@/services/bluetooth-audio.service';
import { State, useBluetoothAudioStore } from '@/stores/app/bluetooth-audio-store';

import { BluetoothDeviceSelectionBottomSheet } from '../bluetooth-device-selection-bottom-sheet';

// Mock dependencies
jest.mock('@/services/bluetooth-audio.service', () => ({
  bluetoothAudioService: {
    startScanning: jest.fn(),
    stopScanning: jest.fn(),
    connectToDevice: jest.fn(),
    disconnectDevice: jest.fn(),
  },
}));

const mockSetPreferredDevice = jest.fn();
jest.mock('@/lib/hooks/use-preferred-bluetooth-device', () => ({
  usePreferredBluetoothDevice: () => ({
    preferredDevice: null,
    setPreferredDevice: mockSetPreferredDevice,
  }),
}));

jest.mock('@/stores/app/bluetooth-audio-store', () => ({
  State: {
    PoweredOn: 'poweredOn',
    PoweredOff: 'poweredOff',
    Unauthorized: 'unauthorized',
  },
  useBluetoothAudioStore: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  useWindowDimensions: () => ({
    width: 400,
    height: 800,
  }),
  Platform: {
    OS: 'ios',
    select: jest.fn().mockImplementation((obj) => obj.ios || obj.default),
  },
  ActivityIndicator: 'ActivityIndicator',
}));

// Mock lucide icons to avoid SVG issues in tests
jest.mock('lucide-react-native', () => ({
  BluetoothIcon: 'BluetoothIcon',
  RefreshCwIcon: 'RefreshCwIcon',
  WifiIcon: 'WifiIcon',
}));

// Mock gluestack UI components
jest.mock('@/components/ui/bottom-sheet', () => ({
  CustomBottomSheet: ({ children, isOpen }: any) => isOpen ? children : null,
}));

jest.mock('@/components/ui/pressable', () => ({
  Pressable: ({ children, onPress, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { onPress, testID: props.testID || 'pressable' }, children);
  },
}));

jest.mock('@/components/ui/spinner', () => ({
  Spinner: (props: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: 'spinner' }, 'Loading...');
  },
}));

jest.mock('@/components/ui/box', () => ({
  Box: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: props.testID || 'box' }, children);
  },
}));

jest.mock('@/components/ui/vstack', () => ({
  VStack: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: props.testID || 'vstack' }, children);
  },
}));

jest.mock('@/components/ui/hstack', () => ({
  HStack: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: props.testID || 'hstack' }, children);
  },
}));

jest.mock('@/components/ui/text', () => ({
  Text: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: props.testID || 'text' }, children);
  },
}));

jest.mock('@/components/ui/heading', () => ({
  Heading: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: props.testID || 'heading' }, children);
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onPress, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { onPress, testID: props.testID || 'button' }, children);
  },
  ButtonText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: props.testID || 'button-text' }, children);
  },
  ButtonIcon: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: props.testID || 'button-icon' }, children);
  },
}));

jest.mock('@/components/ui/flat-list', () => ({
  FlatList: ({ data, renderItem, keyExtractor, ...props }: any) => {
    const React = require('react');
    if (!data || !renderItem) return null;

    return React.createElement(
      'View',
      { testID: props.testID || 'flat-list' },
      data.map((item: any, index: number) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        return React.createElement(
          'View',
          { key, testID: `flat-list-item-${key}` },
          renderItem({ item, index })
        );
      })
    );
  },
}));

const mockUseBluetoothAudioStore = useBluetoothAudioStore as jest.MockedFunction<typeof useBluetoothAudioStore>;

describe('BluetoothDeviceSelectionBottomSheet', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBluetoothAudioStore.mockReturnValue({
      availableDevices: [
        {
          id: 'test-device-1',
          name: 'Test Headset',
          rssi: -50,
          isConnected: false,
          hasAudioCapability: true,
          supportsMicrophoneControl: true,
          device: {} as any,
        },
        {
          id: 'test-device-2',
          name: 'Test Speaker',
          rssi: -70,
          isConnected: true,
          hasAudioCapability: true,
          supportsMicrophoneControl: false,
          device: {} as any,
        },
      ],
      isScanning: false,
      bluetoothState: State.PoweredOn,
      connectedDevice: {
        id: 'test-device-2',
        name: 'Test Speaker',
        rssi: -70,
        isConnected: true,
        hasAudioCapability: true,
        supportsMicrophoneControl: false,
        device: {} as any,
      },
      connectionError: null,
    } as any);
  });

  it('renders correctly when open', () => {
    render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('bluetooth.select_device')).toBeTruthy();
    expect(screen.getByText('bluetooth.available_devices')).toBeTruthy();
    expect(screen.getByText('Test Headset')).toBeTruthy();
    expect(screen.getByText('Test Speaker')).toBeTruthy();
  });

  it('starts scanning when opened', async () => {
    render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

    await waitFor(() => {
      expect(bluetoothAudioService.startScanning).toHaveBeenCalledWith(10000);
    });
  });

  it('displays microphone control capability', () => {
    render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

    // Should show microphone control capability
    expect(screen.getByText('bluetooth.supports_mic_control')).toBeTruthy();
  });

  it('displays bluetooth state warnings', () => {
    mockUseBluetoothAudioStore.mockReturnValue({
      availableDevices: [],
      isScanning: false,
      bluetoothState: State.PoweredOff,
      connectedDevice: null,
      connectionError: null,
    } as any);

    render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('bluetooth.bluetooth_disabled')).toBeTruthy();
  });

  it('displays connection errors', () => {
    mockUseBluetoothAudioStore.mockReturnValue({
      availableDevices: [],
      isScanning: false,
      bluetoothState: State.PoweredOn,
      connectedDevice: null,
      connectionError: 'Failed to connect to device',
    } as any);

    render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('Failed to connect to device')).toBeTruthy();
  });

  it('shows scanning state', () => {
    mockUseBluetoothAudioStore.mockReturnValue({
      availableDevices: [],
      isScanning: true,
      bluetoothState: State.PoweredOn,
      connectedDevice: null,
      connectionError: null,
    } as any);

    render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('bluetooth.scanning')).toBeTruthy();
  });

  describe('Device Selection Flow', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('clears preferred device and disconnects before connecting to new device', async () => {
      const mockConnectedDevice = {
        id: 'current-device',
        name: 'Current Device',
        rssi: -40,
        isConnected: true,
        hasAudioCapability: true,
        supportsMicrophoneControl: true,
        device: {} as any,
      };

      mockUseBluetoothAudioStore.mockReturnValue({
        availableDevices: [
          {
            id: 'test-device-1',
            name: 'Test Headset',
            rssi: -50,
            isConnected: false,
            hasAudioCapability: true,
            supportsMicrophoneControl: true,
            device: {} as any,
          },
        ],
        isScanning: false,
        bluetoothState: State.PoweredOn,
        connectedDevice: mockConnectedDevice,
        connectionError: null,
      } as any);

      render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

      // Find and tap on the test device
      const deviceItem = screen.getByText('Test Headset');
      fireEvent.press(deviceItem);

      await waitFor(() => {
        // Should first clear the preferred device
        expect(mockSetPreferredDevice).toHaveBeenCalledWith(null);
      });

      await waitFor(() => {
        // Should disconnect from current device
        expect(bluetoothAudioService.disconnectDevice).toHaveBeenCalled();
      });

      await waitFor(() => {
        // Should set the new preferred device
        expect(mockSetPreferredDevice).toHaveBeenCalledWith({
          id: 'test-device-1',
          name: 'Test Headset',
        });
      });

      await waitFor(() => {
        // Should connect to the new device
        expect(bluetoothAudioService.connectToDevice).toHaveBeenCalledWith('test-device-1');
      });

      // Should close the modal
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('handles disconnect failure gracefully and continues with new connection', async () => {
      const mockConnectedDevice = {
        id: 'current-device',
        name: 'Current Device',
        rssi: -40,
        isConnected: true,
        hasAudioCapability: true,
        supportsMicrophoneControl: true,
        device: {} as any,
      };

      // Make disconnect fail
      (bluetoothAudioService.disconnectDevice as jest.Mock).mockRejectedValue(new Error('Disconnect failed'));

      mockUseBluetoothAudioStore.mockReturnValue({
        availableDevices: [
          {
            id: 'test-device-1',
            name: 'Test Headset',
            rssi: -50,
            isConnected: false,
            hasAudioCapability: true,
            supportsMicrophoneControl: true,
            device: {} as any,
          },
        ],
        isScanning: false,
        bluetoothState: State.PoweredOn,
        connectedDevice: mockConnectedDevice,
        connectionError: null,
      } as any);

      render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

      // Find and tap on the test device
      const deviceItem = screen.getByText('Test Headset');
      fireEvent.press(deviceItem);

      await waitFor(() => {
        // Should still attempt disconnect
        expect(bluetoothAudioService.disconnectDevice).toHaveBeenCalled();
      });

      await waitFor(() => {
        // Should still continue with setting preferred device
        expect(mockSetPreferredDevice).toHaveBeenCalledWith({
          id: 'test-device-1',
          name: 'Test Headset',
        });
      });

      await waitFor(() => {
        // Should still attempt to connect to new device
        expect(bluetoothAudioService.connectToDevice).toHaveBeenCalledWith('test-device-1');
      });
    });

    it('handles connection failure gracefully', async () => {
      // Make connect fail
      (bluetoothAudioService.connectToDevice as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      mockUseBluetoothAudioStore.mockReturnValue({
        availableDevices: [
          {
            id: 'test-device-1',
            name: 'Test Headset',
            rssi: -50,
            isConnected: false,
            hasAudioCapability: true,
            supportsMicrophoneControl: true,
            device: {} as any,
          },
        ],
        isScanning: false,
        bluetoothState: State.PoweredOn,
        connectedDevice: null,
        connectionError: null,
      } as any);

      render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

      // Find and tap on the test device
      const deviceItem = screen.getByText('Test Headset');
      fireEvent.press(deviceItem);

      await waitFor(() => {
        // Should still set preferred device
        expect(mockSetPreferredDevice).toHaveBeenCalledWith({
          id: 'test-device-1',
          name: 'Test Headset',
        });
      });

      await waitFor(() => {
        // Should attempt connection
        expect(bluetoothAudioService.connectToDevice).toHaveBeenCalledWith('test-device-1');
      });

      // Should still close the modal even if connection fails
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('processes device selection when no device is currently connected', async () => {
      mockUseBluetoothAudioStore.mockReturnValue({
        availableDevices: [
          {
            id: 'test-device-1',
            name: 'Test Headset',
            rssi: -50,
            isConnected: false,
            hasAudioCapability: true,
            supportsMicrophoneControl: true,
            device: {} as any,
          },
        ],
        isScanning: false,
        bluetoothState: State.PoweredOn,
        connectedDevice: null,
        connectionError: null,
      } as any);

      render(<BluetoothDeviceSelectionBottomSheet {...mockProps} />);

      // Find and tap on the test device
      const deviceItem = screen.getByText('Test Headset');
      fireEvent.press(deviceItem);

      await waitFor(() => {
        // Should clear preferred device first
        expect(mockSetPreferredDevice).toHaveBeenCalledWith(null);
      });

      // Should not call disconnect since no device is connected
      expect(bluetoothAudioService.disconnectDevice).not.toHaveBeenCalled();

      await waitFor(() => {
        // Should set new preferred device
        expect(mockSetPreferredDevice).toHaveBeenCalledWith({
          id: 'test-device-1',
          name: 'Test Headset',
        });
      });

      await waitFor(() => {
        // Should connect to new device
        expect(bluetoothAudioService.connectToDevice).toHaveBeenCalledWith('test-device-1');
      });
    });
  });
});
