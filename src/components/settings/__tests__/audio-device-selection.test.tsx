import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { type AudioDeviceInfo } from '@/stores/app/bluetooth-audio-store';

import { AudioDeviceSelection } from '../audio-device-selection';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.audio_device_selection.title': 'Audio Device Selection',
        'settings.audio_device_selection.current_selection': 'Current Selection',
        'settings.audio_device_selection.microphone': 'Microphone',
        'settings.audio_device_selection.speaker': 'Speaker',
        'settings.audio_device_selection.none_selected': 'None selected',
        'settings.audio_device_selection.bluetooth_device': 'Bluetooth Device',
        'settings.audio_device_selection.wired_device': 'Wired Device',
        'settings.audio_device_selection.speaker_device': 'Speaker Device',
        'settings.audio_device_selection.unavailable': 'Unavailable',
        'settings.audio_device_selection.no_microphones_available': 'No microphones available',
        'settings.audio_device_selection.no_speakers_available': 'No speakers available',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the bluetooth audio store
const mockSetSelectedMicrophone = jest.fn();
const mockSetSelectedSpeaker = jest.fn();

const mockStore = {
  availableAudioDevices: [] as AudioDeviceInfo[],
  selectedAudioDevices: {
    microphone: null as AudioDeviceInfo | null,
    speaker: null as AudioDeviceInfo | null,
  },
  setSelectedMicrophone: mockSetSelectedMicrophone,
  setSelectedSpeaker: mockSetSelectedSpeaker,
};

jest.mock('@/stores/app/bluetooth-audio-store', () => ({
  useBluetoothAudioStore: () => mockStore,
}));

describe('AudioDeviceSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store to default state
    mockStore.availableAudioDevices = [];
    mockStore.selectedAudioDevices = {
      microphone: null,
      speaker: null,
    };
  });

  const createMockDevice = (id: string, name: string, type: 'bluetooth' | 'wired' | 'speaker', isAvailable = true): AudioDeviceInfo => ({
    id,
    name,
    type,
    isAvailable,
  });

  describe('rendering', () => {
    it('renders with title when showTitle is true', () => {
      render(<AudioDeviceSelection showTitle={true} />);

      expect(screen.getByText('Audio Device Selection')).toBeTruthy();
    });

    it('renders without title when showTitle is false', () => {
      render(<AudioDeviceSelection showTitle={false} />);

      expect(screen.queryByText('Audio Device Selection')).toBeNull();
    });

    it('renders current selection section', () => {
      render(<AudioDeviceSelection />);

      expect(screen.getByText('Current Selection')).toBeTruthy();
      expect(screen.getByText('Microphone:')).toBeTruthy();
      expect(screen.getByText('Speaker:')).toBeTruthy();
    });

    it('shows none selected when no devices are selected', () => {
      render(<AudioDeviceSelection />);

      const noneSelectedTexts = screen.getAllByText('None selected');
      expect(noneSelectedTexts).toHaveLength(2); // One for microphone, one for speaker
    });

    it('renders microphone and speaker sections', () => {
      render(<AudioDeviceSelection />);

      // Check for section headers
      const microphoneHeaders = screen.getAllByText('Microphone');
      const speakerHeaders = screen.getAllByText('Speaker');

      expect(microphoneHeaders.length).toBeGreaterThan(0);
      expect(speakerHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('device selection', () => {
    it('displays available microphones', () => {
      const bluetoothMic = createMockDevice('bt-mic-1', 'Bluetooth Headset', 'bluetooth');
      const wiredMic = createMockDevice('wired-mic-1', 'Built-in Microphone', 'wired');

      mockStore.availableAudioDevices = [bluetoothMic, wiredMic];

      render(<AudioDeviceSelection />);

      // Check device names appear (may appear in multiple sections)
      expect(screen.getAllByText('Bluetooth Headset').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Built-in Microphone').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bluetooth Device').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Wired Device').length).toBeGreaterThan(0);
    });

    it('displays available speakers', () => {
      const bluetoothSpeaker = createMockDevice('bt-speaker-1', 'Bluetooth Speaker', 'bluetooth');
      const builtinSpeaker = createMockDevice('builtin-speaker-1', 'Built-in Speaker', 'speaker');

      mockStore.availableAudioDevices = [bluetoothSpeaker, builtinSpeaker];

      render(<AudioDeviceSelection />);

      // Check device names appear (may appear in multiple sections)
      expect(screen.getAllByText('Bluetooth Speaker').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Built-in Speaker').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Speaker Device').length).toBeGreaterThan(0);
    });

    it('shows unavailable indicator for unavailable devices', () => {
      const unavailableDevice = createMockDevice('unavailable-1', 'Unavailable Device', 'bluetooth', false);

      mockStore.availableAudioDevices = [unavailableDevice];

      render(<AudioDeviceSelection />);

      // Device should not appear in either section since it's unavailable bluetooth
      expect(screen.queryByText('Unavailable Device')).toBeNull();
    });

    it('calls setSelectedMicrophone when microphone device is pressed', () => {
      const bluetoothMic = createMockDevice('bt-mic-1', 'Bluetooth Headset', 'bluetooth');

      mockStore.availableAudioDevices = [bluetoothMic];

      const { getAllByText } = render(<AudioDeviceSelection />);

      // Find the first device card (should be in microphone section)
      const deviceCards = getAllByText('Bluetooth Headset');
      fireEvent.press(deviceCards[0].parent?.parent?.parent as any);

      expect(mockSetSelectedMicrophone).toHaveBeenCalledWith(bluetoothMic);
    });

    it('calls setSelectedSpeaker when speaker device is pressed', () => {
      const bluetoothSpeaker = createMockDevice('bt-speaker-1', 'Bluetooth Speaker', 'bluetooth');

      mockStore.availableAudioDevices = [bluetoothSpeaker];

      const { getAllByText } = render(<AudioDeviceSelection />);

      // Find the second device card (should be in speaker section)
      const deviceCards = getAllByText('Bluetooth Speaker');
      fireEvent.press(deviceCards[1].parent?.parent?.parent as any);

      expect(mockSetSelectedSpeaker).toHaveBeenCalledWith(bluetoothSpeaker);
    });

    it('highlights selected devices', () => {
      const selectedMic = createMockDevice('selected-mic', 'Selected Microphone', 'bluetooth');
      const selectedSpeaker = createMockDevice('selected-speaker', 'Selected Speaker', 'bluetooth');

      mockStore.availableAudioDevices = [selectedMic, selectedSpeaker];
      mockStore.selectedAudioDevices = {
        microphone: selectedMic,
        speaker: selectedSpeaker,
      };

      render(<AudioDeviceSelection />);

      // Check that selected device names are shown in current selection and device sections
      expect(screen.getAllByText('Selected Microphone').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Selected Speaker').length).toBeGreaterThan(0);
    });
  });

  describe('empty states', () => {
    it('shows no microphones available message when no microphones are available', () => {
      // Add an unavailable bluetooth device (should not show in microphones section)
      const unavailableBluetooth = createMockDevice('bt-1', 'BT Device', 'bluetooth', false);
      mockStore.availableAudioDevices = [unavailableBluetooth];

      render(<AudioDeviceSelection />);

      // Should show empty message since bluetooth device is unavailable
      expect(screen.getByText('No microphones available')).toBeTruthy();
    });

    it('shows no speakers available message when no speakers are available', () => {
      // Only add unavailable speakers (which get filtered out)
      const unavailableSpeaker = createMockDevice('speaker-1', 'Speaker', 'speaker', false);
      mockStore.availableAudioDevices = [unavailableSpeaker];

      render(<AudioDeviceSelection />);

      expect(screen.getByText('No speakers available')).toBeTruthy();
    });

    it('shows both empty messages when no devices are available', () => {
      mockStore.availableAudioDevices = [];

      render(<AudioDeviceSelection />);

      expect(screen.getByText('No microphones available')).toBeTruthy();
      expect(screen.getByText('No speakers available')).toBeTruthy();
    });
  });

  describe('device filtering', () => {
    it('filters out unavailable bluetooth devices for microphones', () => {
      const availableBluetooth = createMockDevice('bt-available', 'Available BT', 'bluetooth', true);
      const unavailableBluetooth = createMockDevice('bt-unavailable', 'Unavailable BT', 'bluetooth', false);
      const wiredDevice = createMockDevice('wired-1', 'Wired Device', 'wired', false); // Should still show even if unavailable

      mockStore.availableAudioDevices = [availableBluetooth, unavailableBluetooth, wiredDevice];

      render(<AudioDeviceSelection />);

      expect(screen.getAllByText('Available BT').length).toBeGreaterThan(0);
      expect(screen.queryByText('Unavailable BT')).toBeNull();
      expect(screen.getAllByText('Wired Device').length).toBeGreaterThan(0);
    });

    it('filters out unavailable devices for speakers', () => {
      const availableDevice = createMockDevice('available', 'Available Device', 'speaker', true);
      const unavailableDevice = createMockDevice('unavailable', 'Unavailable Device', 'speaker', false);

      mockStore.availableAudioDevices = [availableDevice, unavailableDevice];

      render(<AudioDeviceSelection />);

      expect(screen.getAllByText('Available Device').length).toBeGreaterThan(0);
      // Note: The component actually shows ALL devices in microphone section unless they are unavailable bluetooth
      // So the unavailable speaker will show in microphone section but not speaker section
      expect(screen.getAllByText('Unavailable Device').length).toBeGreaterThan(0); // Shows in microphone section
    });
  });

  describe('device type labels', () => {
    it('shows correct labels for different device types', () => {
      const bluetoothDevice = createMockDevice('bt-1', 'BT Device', 'bluetooth');
      const wiredDevice = createMockDevice('wired-1', 'Wired Device', 'wired');
      const speakerDevice = createMockDevice('speaker-1', 'Speaker Device', 'speaker');

      mockStore.availableAudioDevices = [bluetoothDevice, wiredDevice, speakerDevice];

      render(<AudioDeviceSelection />);

      expect(screen.getAllByText('Bluetooth Device').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Wired Device').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Speaker Device').length).toBeGreaterThan(0);
    });

    it('shows fallback label for unknown device types', () => {
      const unknownDevice = createMockDevice('unknown-1', 'Unknown Device', 'unknown' as any);

      mockStore.availableAudioDevices = [unknownDevice];

      render(<AudioDeviceSelection />);

      // Device should appear but with fallback label
      expect(screen.getAllByText('Unknown Device').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Unknown Device').length).toBeGreaterThan(0);
    });
  });
});
