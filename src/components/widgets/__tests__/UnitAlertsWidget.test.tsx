import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { UnitStatusBaseType } from '@/lib/unit-status';
import { GetConfigResultData } from '@/models/v4/configs/getConfigResultData';
import { UnitStatusAlertAcknowledgedLevel, UnitStatusAlertAcknowledgementMode, UnitStatusAlertAcknowledgementResultData } from '@/models/v4/unitStatusAlerts/unitStatusAlertAcknowledgementResultData';
import { UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';

import { UnitAlertsWidget } from '../UnitAlertsWidget';

const mockCoreState: { config: GetConfigResultData | null; error: string | null } = { config: null, error: null };
const mockUnitsState = { units: [] as UnitInfoResultData[], isLoading: false, error: null, fetchUnits: jest.fn() };
const mockAcknowledgements: { current: Record<string, UnitStatusAlertAcknowledgementResultData> } = { current: {} };
const mockSecurity = { canUserCreateCalls: true as boolean | undefined };

jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: (selector: (state: typeof mockCoreState) => unknown) => selector(mockCoreState),
}));
jest.mock('@/stores/units/store', () => ({
  useUnitsStore: (selector: (state: typeof mockUnitsState) => unknown) => selector(mockUnitsState),
}));
jest.mock('@/hooks/use-units-signalr-updates', () => ({ useUnitsSignalRUpdates: jest.fn() }));
jest.mock('@/hooks/use-unit-alert-acknowledgements', () => ({ useUnitAlertAcknowledgements: () => mockAcknowledgements.current }));
jest.mock('@/stores/security/store', () => ({ useSecurityStore: () => mockSecurity }));
jest.mock('@/components/units/unit-alert-acknowledge-sheet', () => {
  const { Text } = require('react-native');
  return {
    UnitAlertAcknowledgeSheet: ({ isOpen, unit, acknowledgementState }: { isOpen: boolean; unit: { Name: string } | null; acknowledgementState: string }) =>
      isOpen ? <Text testID="unit-alert-acknowledge-sheet">{`${unit?.Name}:${acknowledgementState}`}</Text> : null,
  };
});
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('nativewind', () => ({ useColorScheme: () => ({ colorScheme: 'light' }) }));
jest.mock('lucide-react-native', () => ({
  AlertTriangleIcon: () => null,
  BellOffIcon: () => null,
  CheckCircleIcon: () => null,
  ChevronDownIcon: () => null,
  ChevronRightIcon: () => null,
}));
jest.mock('@/components/ui/pressable', () => ({ Pressable: require('react-native').Pressable }));
jest.mock('@/components/ui/box', () => ({ Box: require('react-native').View }));
jest.mock('@/components/ui/hstack', () => ({ HStack: require('react-native').View }));
jest.mock('@/components/ui/vstack', () => ({ VStack: require('react-native').View }));
jest.mock('@/components/ui/text', () => ({ Text: require('react-native').Text }));
jest.mock('@/components/ui/spinner', () => ({ Spinner: require('react-native').ActivityIndicator }));
jest.mock('../WidgetContainer', () => ({ WidgetContainer: require('react-native').View }));

describe('UnitAlertsWidget configuration and timers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-21T12:00:45Z'));
    mockCoreState.config = null;
    mockCoreState.error = null;
    mockUnitsState.units = [];
    mockAcknowledgements.current = {};
    mockSecurity.canUserCreateCalls = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits for configuration instead of claiming no timers are configured', () => {
    render(<UnitAlertsWidget />);

    expect(screen.queryByText('unitAlerts.noThresholds')).toBeNull();
    expect(screen.queryByText('unitAlerts.withinThresholds')).toBeNull();
    expect(screen.getByTestId('unit-alerts-loading')).toBeTruthy();
  });

  it('shows a configuration failure instead of claiming no timers are configured', () => {
    mockCoreState.error = 'Failed to init core app data';

    render(<UnitAlertsWidget />);

    expect(screen.getByText('unitAlerts.errorLoading')).toBeTruthy();
    expect(screen.queryByText('unitAlerts.noThresholds')).toBeNull();
  });

  it('does not interpret an omitted timer field as a confirmed empty list', () => {
    const { UnitStatusThresholds: _, ...configWithoutTimers } = new GetConfigResultData();
    mockCoreState.config = configWithoutTimers as GetConfigResultData;

    render(<UnitAlertsWidget />);

    expect(screen.getByText('unitAlerts.errorLoading')).toBeTruthy();
    expect(screen.queryByText('unitAlerts.noThresholds')).toBeNull();
  });

  it('shows no timers only after loading an explicitly empty list', () => {
    mockCoreState.config = new GetConfigResultData();

    render(<UnitAlertsWidget />);

    expect(screen.getByText('unitAlerts.noThresholds')).toBeTruthy();
  });

  it('picks up loaded settings and escalates an unchanged unit as time passes', () => {
    mockUnitsState.units = [
      Object.assign(new UnitInfoResultData(), {
        UnitId: 'ambulance-1',
        Name: 'Ambulance 1',
        CurrentStatus: 'Dispatched',
        CurrentStatusBaseType: UnitStatusBaseType.Dispatched,
        CurrentStatusTimestampUtc: '2026-09-21T12:00:00Z',
      }),
    ];
    const { rerender } = render(<UnitAlertsWidget />);
    mockCoreState.config = Object.assign(new GetConfigResultData(), {
      UnitStatusThresholds: [{ BaseType: UnitStatusBaseType.Dispatched, WarnSeconds: 60, AlertSeconds: 120 }],
    });

    rerender(<UnitAlertsWidget />);

    expect(screen.getByText('unitAlerts.withinThresholds')).toBeTruthy();
    act(() => jest.advanceTimersByTime(15000));
    expect(screen.getByTestId('unit-alert-warn')).toBeTruthy();
    expect(screen.getByText('Ambulance 1')).toBeTruthy();
    act(() => jest.advanceTimersByTime(60000));
    expect(screen.getByTestId('unit-alert-alert')).toBeTruthy();
    expect(screen.queryByTestId('unit-alert-warn')).toBeNull();
  });
});

describe('UnitAlertsWidget acknowledgements', () => {
  // Engine 5 dispatched 7 minutes ago (warning), Medic 2 dispatched 12 minutes ago (alert).
  const NOW = '2026-10-02T12:00:00Z';
  const timers = [{ BaseType: UnitStatusBaseType.Dispatched, WarnSeconds: 300, AlertSeconds: 600 }];

  const unit = (unitId: string, name: string, dispatchedAt: string, currentUnitStateId: number) =>
    Object.assign(new UnitInfoResultData(), {
      UnitId: unitId,
      Name: name,
      CurrentStatus: 'Dispatched',
      CurrentStatusBaseType: UnitStatusBaseType.Dispatched,
      CurrentStatusTimestampUtc: dispatchedAt,
      CurrentUnitStateId: currentUnitStateId,
    });

  const acknowledgement = (unitId: string, unitStateId: number, overrides: Partial<UnitStatusAlertAcknowledgementResultData> = {}) =>
    Object.assign(new UnitStatusAlertAcknowledgementResultData(), {
      UnitStatusAlertAcknowledgementId: `ack-${unitId}`,
      UnitId: unitId,
      UnitStateId: unitStateId,
      Level: UnitStatusAlertAcknowledgedLevel.Warn,
      Mode: UnitStatusAlertAcknowledgementMode.Acknowledged,
      AcknowledgedByName: 'Matt Casey',
      ...overrides,
    });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
    mockCoreState.error = null;
    mockCoreState.config = Object.assign(new GetConfigResultData(), { UnitStatusThresholds: timers });
    mockUnitsState.units = [unit('5', 'Engine 5', '2026-10-02T11:53:00Z', 501), unit('2', 'Medic 2', '2026-10-02T11:48:00Z', 502)];
    mockAcknowledgements.current = {};
    mockSecurity.canUserCreateCalls = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('marks an acknowledged alert as seen, with the note, below the ones nobody has handled', () => {
    mockAcknowledgements.current = { '2': acknowledgement('2', 502, { Level: UnitStatusAlertAcknowledgedLevel.Alert, Note: 'Second crew member unavailable' }) };

    render(<UnitAlertsWidget />);

    expect(screen.getByTestId('unit-alert-alert-acknowledged')).toBeTruthy();
    expect(screen.getByText('unitAlerts.acknowledgedBy: Second crew member unavailable')).toBeTruthy();
    const rows = screen.getAllByTestId(/^unit-alert-(warn|alert)/).map((node) => node.props.testID);
    expect(rows).toEqual(['unit-alert-warn', 'unit-alert-alert-acknowledged']);
  });

  it('brings a warning acknowledgement back once the unit escalates to an alert', () => {
    mockAcknowledgements.current = { '2': acknowledgement('2', 502, { Level: UnitStatusAlertAcknowledgedLevel.Warn }) };

    render(<UnitAlertsWidget />);

    expect(screen.getByTestId('unit-alert-alert')).toBeTruthy();
    expect(screen.queryByTestId('unit-alert-alert-acknowledged')).toBeNull();
  });

  it('ignores an acknowledgement from an earlier status', () => {
    mockAcknowledgements.current = { '5': acknowledgement('5', 400) };

    render(<UnitAlertsWidget />);

    expect(screen.getByTestId('unit-alert-warn')).toBeTruthy();
  });

  it('tucks muted alerts into a collapsed section', () => {
    mockAcknowledgements.current = { '5': acknowledgement('5', 501, { Mode: UnitStatusAlertAcknowledgementMode.Muted, MutedUntilUtc: null }) };

    render(<UnitAlertsWidget />);

    expect(screen.queryByText('Engine 5')).toBeNull();
    expect(screen.getByText('unitAlerts.mutedSection')).toBeTruthy();
    expect(screen.queryByText('unitAlerts.withinThresholds')).toBeNull();

    fireEvent.press(screen.getByTestId('unit-alerts-muted-toggle'));

    expect(screen.getByText('Engine 5')).toBeTruthy();
    expect(screen.getByTestId('unit-alert-warn-muted')).toBeTruthy();
  });

  it('returns a timed mute to the list when it runs out', () => {
    mockAcknowledgements.current = { '5': acknowledgement('5', 501, { Mode: UnitStatusAlertAcknowledgementMode.Muted, MutedUntilUtc: '2026-10-02T12:00:10.000Z' }) };

    render(<UnitAlertsWidget />);
    expect(screen.queryByText('Engine 5')).toBeNull();

    act(() => jest.advanceTimersByTime(15000));

    expect(screen.getByTestId('unit-alert-warn-acknowledged')).toBeTruthy();
  });

  it('opens the acknowledge sheet for dispatchers', () => {
    render(<UnitAlertsWidget />);

    fireEvent.press(screen.getByTestId('unit-alert-row-2'));

    expect(screen.getByTestId('unit-alert-acknowledge-sheet').props.children).toBe('Medic 2:none');
  });

  it('leaves the rows read-only for people who cannot dispatch', () => {
    mockSecurity.canUserCreateCalls = false;

    render(<UnitAlertsWidget />);

    expect(screen.queryByTestId('unit-alert-row-2')).toBeNull();
    expect(screen.getByText('Medic 2')).toBeTruthy();
  });

  it('leaves the rows read-only when the server does not send the status record id', () => {
    mockUnitsState.units = [unit('2', 'Medic 2', '2026-10-02T11:48:00Z', 0)];

    render(<UnitAlertsWidget />);

    expect(screen.queryByTestId('unit-alert-row-2')).toBeNull();
  });
});

