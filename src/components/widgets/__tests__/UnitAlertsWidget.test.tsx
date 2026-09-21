import { act, render, screen } from '@testing-library/react-native';
import React from 'react';

import { UnitStatusBaseType } from '@/lib/unit-status';
import { GetConfigResultData } from '@/models/v4/configs/getConfigResultData';
import { UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';

import { UnitAlertsWidget } from '../UnitAlertsWidget';

const mockCoreState: { config: GetConfigResultData | null; error: string | null } = { config: null, error: null };
const mockUnitsState = { units: [] as UnitInfoResultData[], isLoading: false, error: null, fetchUnits: jest.fn() };

jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: (selector: (state: typeof mockCoreState) => unknown) => selector(mockCoreState),
}));
jest.mock('@/stores/units/store', () => ({
  useUnitsStore: (selector: (state: typeof mockUnitsState) => unknown) => selector(mockUnitsState),
}));
jest.mock('@/hooks/use-units-signalr-updates', () => ({ useUnitsSignalRUpdates: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('nativewind', () => ({ useColorScheme: () => ({ colorScheme: 'light' }) }));
jest.mock('lucide-react-native', () => ({ AlertTriangleIcon: () => null }));
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
