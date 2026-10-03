import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { type UnitStatusAlert } from '@/lib/unit-status-thresholds';
import { UnitStatusAlertAcknowledgedLevel, UnitStatusAlertAcknowledgementMode, UnitStatusAlertAcknowledgementResultData } from '@/models/v4/unitStatusAlerts/unitStatusAlertAcknowledgementResultData';
import { UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';

import { UnitAlertAcknowledgeSheet } from '../unit-alert-acknowledge-sheet';

const mockAcknowledge = jest.fn();
const mockClear = jest.fn();
const mockShowToast = jest.fn();

jest.mock('@/stores/units/unit-alert-acknowledgements-store', () => ({
  useUnitAlertAcknowledgementsStore: (selector: (state: object) => unknown) => selector({ acknowledge: mockAcknowledge, clear: mockClear }),
}));
jest.mock('@/stores/toast/store', () => ({
  useToastStore: (selector: (state: object) => unknown) => selector({ showToast: mockShowToast }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => (options ? `${key}:${JSON.stringify(options)}` : key) }),
}));
jest.mock('nativewind', () => ({ useColorScheme: () => ({ colorScheme: 'light' }) }));
jest.mock('lucide-react-native', () => ({ BellOffIcon: () => null, CheckCircleIcon: () => null }));
jest.mock('@/components/ui/bottom-sheet', () => ({
  CustomBottomSheet: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => {
    const { View } = require('react-native');
    return isOpen ? <View testID="bottom-sheet">{children}</View> : null;
  },
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onPress, testID, disabled }: { children: React.ReactNode; onPress?: () => void; testID?: string; disabled?: boolean }) => {
    const { TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID} disabled={disabled}>
        {children}
      </TouchableOpacity>
    );
  },
  ButtonText: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));
jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
  TextareaInput: (props: object) => {
    const { TextInput } = require('react-native');
    return <TextInput {...props} />;
  },
}));
jest.mock('@/components/ui/form-control', () => {
  const { View, Text } = require('react-native');
  return { FormControl: View, FormControlLabel: View, FormControlLabelText: Text };
});
jest.mock('@/components/ui/box', () => ({ Box: require('react-native').View }));
jest.mock('@/components/ui/hstack', () => ({ HStack: require('react-native').View }));
jest.mock('@/components/ui/vstack', () => ({ VStack: require('react-native').View }));
jest.mock('@/components/ui/text', () => ({ Text: require('react-native').Text }));

const unit = Object.assign(new UnitInfoResultData(), { UnitId: '12', Name: 'MUG 1', CurrentStatus: 'Dispatched', CurrentUnitStateId: 77 });
const warn: UnitStatusAlert = { level: 'warn', secondsInStatus: 420, thresholdSeconds: 300 };
const alert: UnitStatusAlert = { level: 'alert', secondsInStatus: 720, thresholdSeconds: 600 };

const existing = Object.assign(new UnitStatusAlertAcknowledgementResultData(), {
  UnitStatusAlertAcknowledgementId: 'a1',
  UnitId: '12',
  UnitStateId: 77,
  Level: UnitStatusAlertAcknowledgedLevel.Warn,
  Mode: UnitStatusAlertAcknowledgementMode.Acknowledged,
  AcknowledgedByName: 'Matt Casey',
  Note: 'Technical malfunction reported',
});

const renderSheet = (props: Partial<React.ComponentProps<typeof UnitAlertAcknowledgeSheet>> = {}) => {
  const onClose = jest.fn();
  render(<UnitAlertAcknowledgeSheet isOpen onClose={onClose} unit={unit} alert={warn} acknowledgement={null} acknowledgementState="none" {...props} />);
  return { onClose };
};

describe('UnitAlertAcknowledgeSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAcknowledge.mockResolvedValue({ ok: true });
    mockClear.mockResolvedValue({ ok: true });
  });

  it('acknowledges the level on screen, for the status on screen, with the note', async () => {
    const { onClose } = renderSheet();

    fireEvent.changeText(screen.getByTestId('unit-alert-note-input'), '  MUG not departed, technical malfunction reported.  ');
    fireEvent.press(screen.getByTestId('unit-alert-acknowledge-button'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockAcknowledge).toHaveBeenCalledWith({
      unitId: '12',
      unitStateId: 77,
      level: UnitStatusAlertAcknowledgedLevel.Warn,
      mode: UnitStatusAlertAcknowledgementMode.Acknowledged,
      muteMinutes: 0,
      note: 'MUG not departed, technical malfunction reported.',
    });
    expect(mockShowToast).toHaveBeenCalledWith('success', 'unitAlerts.acknowledgeSuccess');
  });

  it('mutes for the chosen time', async () => {
    renderSheet({ alert });

    fireEvent.press(screen.getByTestId('unit-alert-mute-option-30'));
    fireEvent.press(screen.getByTestId('unit-alert-mute-button'));

    await waitFor(() => expect(mockAcknowledge).toHaveBeenCalled());
    expect(mockAcknowledge.mock.calls[0][0]).toMatchObject({ level: UnitStatusAlertAcknowledgedLevel.Alert, mode: UnitStatusAlertAcknowledgementMode.Muted, muteMinutes: 30 });
    expect(mockShowToast).toHaveBeenCalledWith('success', 'unitAlerts.muteSuccess');
  });

  it('mutes until the status changes by default', async () => {
    renderSheet();

    fireEvent.press(screen.getByTestId('unit-alert-mute-button'));

    await waitFor(() => expect(mockAcknowledge).toHaveBeenCalled());
    expect(mockAcknowledge.mock.calls[0][0]).toMatchObject({ mode: UnitStatusAlertAcknowledgementMode.Muted, muteMinutes: 0 });
  });

  it('shows who already saw it and starts from their note', () => {
    renderSheet({ acknowledgement: existing, acknowledgementState: 'acknowledged' });

    expect(screen.getByTestId('unit-alert-current-acknowledgement')).toBeTruthy();
    expect(screen.getByText('unitAlerts.acknowledgedBy:{"name":"Matt Casey"}')).toBeTruthy();
    expect(screen.getByTestId('unit-alert-note-input').props.value).toBe('Technical malfunction reported');
  });

  it('keeps what the dispatcher is typing when acknowledgements refresh underneath', () => {
    const onClose = jest.fn();
    const { rerender } = render(<UnitAlertAcknowledgeSheet isOpen onClose={onClose} unit={unit} alert={warn} acknowledgement={existing} acknowledgementState="acknowledged" />);

    fireEvent.changeText(screen.getByTestId('unit-alert-note-input'), 'Alternative ambulance dispatched');
    // A push from another board refetches every acknowledgement, so this one arrives as a new object.
    rerender(<UnitAlertAcknowledgeSheet isOpen onClose={onClose} unit={unit} alert={warn} acknowledgement={Object.assign(new UnitStatusAlertAcknowledgementResultData(), existing)} acknowledgementState="acknowledged" />);

    expect(screen.getByTestId('unit-alert-note-input').props.value).toBe('Alternative ambulance dispatched');
  });

  it('starts empty when the acknowledgement on file no longer covers the alert', () => {
    renderSheet({ alert, acknowledgement: existing, acknowledgementState: 'none' });

    expect(screen.queryByTestId('unit-alert-current-acknowledgement')).toBeNull();
    expect(screen.getByTestId('unit-alert-note-input').props.value).toBe('');
  });

  it('clears an acknowledgement', async () => {
    const { onClose } = renderSheet({ acknowledgement: existing, acknowledgementState: 'acknowledged' });

    fireEvent.press(screen.getByTestId('unit-alert-clear-button'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockClear).toHaveBeenCalledWith(existing);
    expect(mockShowToast).toHaveBeenCalledWith('success', 'unitAlerts.clearSuccess');
  });

  it('closes and explains when the unit has already moved on', async () => {
    mockAcknowledge.mockResolvedValue({ ok: false, error: 'unit_alert_status_changed' });
    const { onClose } = renderSheet();

    fireEvent.press(screen.getByTestId('unit-alert-acknowledge-button'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockShowToast).toHaveBeenCalledWith('info', 'unitAlerts.errorStatusChanged');
  });

  it('stays open on an unexpected failure so the note is not lost', async () => {
    mockAcknowledge.mockResolvedValue({ ok: false, error: 'unknown' });
    const { onClose } = renderSheet();

    fireEvent.changeText(screen.getByTestId('unit-alert-note-input'), 'Alternative ambulance dispatched');
    fireEvent.press(screen.getByTestId('unit-alert-acknowledge-button'));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'unitAlerts.errorGeneric'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('unit-alert-note-input').props.value).toBe('Alternative ambulance dispatched');
  });

  it('caps the note at the server limit', () => {
    renderSheet();

    expect(screen.getByTestId('unit-alert-note-input').props.maxLength).toBe(500);
  });
});
