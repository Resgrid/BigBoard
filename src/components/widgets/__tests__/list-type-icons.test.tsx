import { act, render, screen } from '@testing-library/react-native';
import React from 'react';

import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';

import { CallsWidget } from '../CallsWidget';
import { PersonnelWidget } from '../PersonnelWidget';
import { UnitsWidget } from '../UnitsWidget';

// Stand-in for the icon that keeps what each list hands it, so the tests check the wiring, not the image loading
// (type-icon.test covers that).
jest.mock('@/components/common/type-icon', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    TypeIcon: (props: Record<string, unknown>) => mockReact.createElement(View, { testID: props.testID, iconUrl: props.iconUrl, mapIcon: props.mapIcon, size: props.size }),
  };
});

const mockUnitsState = {
  units: [] as Partial<UnitInfoResultData>[],
  unitStatuses: [],
  isLoading: false,
  error: null as string | null,
  fetchUnits: jest.fn(),
};
const mockCallsState = {
  calls: [] as Partial<CallResultData>[],
  callPriorities: [],
  callExtraDataMap: {},
  isLoading: false,
  error: null as string | null,
  init: jest.fn(),
};
const mockPersonnelState = {
  personnel: [] as Partial<PersonnelInfoResultData>[],
  isLoading: false,
  error: null as string | null,
  init: jest.fn(),
};
const mockUnitsSettings = { fontSize: 14, columnOrder: ['name'] };
const mockCallsSettings = { fontSize: 14, columnOrder: ['name'], showName: true };
const mockPersonnelSettings = { fontSize: 14, columnOrder: ['name'] };

jest.mock('@/stores/units/store', () => ({
  useUnitsStore: (selector: (state: typeof mockUnitsState) => unknown) => selector(mockUnitsState),
}));
jest.mock('@/stores/calls/store', () => ({
  useCallsStore: (selector: (state: typeof mockCallsState) => unknown) => selector(mockCallsState),
}));
jest.mock('@/stores/personnel/store', () => ({
  usePersonnelStore: (selector: (state: typeof mockPersonnelState) => unknown) => selector(mockPersonnelState),
}));
jest.mock('@/stores/widget-settings/units-settings-store', () => ({
  DEFAULT_UNITS_COLUMN_ORDER: ['name'],
  useUnitsSettingsStore: (selector: (state: { settings: typeof mockUnitsSettings }) => unknown) => selector({ settings: mockUnitsSettings }),
}));
jest.mock('@/stores/widget-settings/calls-settings-store', () => ({
  DEFAULT_CALLS_COLUMN_ORDER: ['name'],
  CALLS_COLUMN_LABELS: { name: 'Name' },
  useCallsSettingsStore: (selector: (state: { settings: typeof mockCallsSettings }) => unknown) => selector({ settings: mockCallsSettings }),
}));
jest.mock('@/stores/widget-settings/personnel-settings-store', () => ({
  DEFAULT_PERSONNEL_COLUMN_ORDER: ['name'],
  usePersonnelSettingsStore: (selector: (state: { settings: typeof mockPersonnelSettings }) => unknown) => selector({ settings: mockPersonnelSettings }),
}));
jest.mock('@/stores/security/store', () => ({ useSecurityStore: () => ({ canUserCreateCalls: false }) }));
jest.mock('@/lib/unit-status-thresholds', () => ({
  ...jest.requireActual('@/lib/unit-status-thresholds'),
  useUnitStatusThresholds: () => [],
  useUnitAlertNoteRequirement: () => 0,
}));
jest.mock('@/hooks/use-unit-alert-acknowledgements', () => ({ useUnitAlertAcknowledgements: () => [] }));
jest.mock('@/hooks/use-units-signalr-updates', () => ({ useUnitsSignalRUpdates: jest.fn() }));
jest.mock('@/hooks/use-calls-signalr-updates', () => ({ useCallsSignalRUpdates: jest.fn() }));
jest.mock('@/hooks/use-personnel-signalr-updates', () => ({ usePersonnelSignalRUpdates: jest.fn() }));
jest.mock('@/components/units/unit-alert-acknowledge-sheet', () => ({ UnitAlertAcknowledgeSheet: () => null }));
jest.mock('@/api/groups/groups', () => ({ getAllGroups: jest.fn(() => Promise.resolve({ Data: [] })) }));
jest.mock('@/api/messaging/messages', () => ({ getRecipients: jest.fn(() => Promise.resolve({ Data: [] })) }));
jest.mock('@/components/calls/auto-scrolling-dispatches', () => ({ AutoScrollingDispatches: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('nativewind', () => ({ useColorScheme: () => ({ colorScheme: 'light' }) }));
jest.mock('lucide-react-native', () => ({ BellOffIcon: () => null, CheckCircleIcon: () => null }));
jest.mock('@/components/ui/pressable', () => ({ Pressable: require('react-native').Pressable }));
jest.mock('@/components/ui/box', () => ({ Box: require('react-native').View }));
jest.mock('@/components/ui/hstack', () => ({ HStack: require('react-native').View }));
jest.mock('@/components/ui/vstack', () => ({ VStack: require('react-native').View }));
jest.mock('@/components/ui/text', () => ({ Text: require('react-native').Text }));
jest.mock('@/components/ui/spinner', () => ({ Spinner: require('react-native').ActivityIndicator }));
jest.mock('../WidgetContainer', () => ({ WidgetContainer: require('react-native').View }));

const ICON_URL = 'https://api.resgrid.dev/api/v4/TypeIcons/0123456789abcdef0123456789abcdef';

describe('board lists show the type and role icons', () => {
  it("puts each unit's type icon (uploaded, else built-in) beside its name", () => {
    mockUnitsState.units = [
      { UnitId: '4', Name: 'Medic 4', Type: 'ALS', TypeIconUrl: ICON_URL, TypeMapIcon: 'ambulance' },
      { UnitId: '5', Name: 'Engine 5', Type: 'Engine' },
    ];

    render(<UnitsWidget />);

    expect(screen.getByText('Medic 4')).toBeTruthy();
    const medic = screen.getByTestId('unit-type-icon-4');
    expect(medic.props.iconUrl).toBe(ICON_URL);
    expect(medic.props.mapIcon).toBe('ambulance');
    expect(medic.props.size).toBe(18);
    // A unit from an older server (no icon fields) still gets the slot, which renders nothing.
    expect(screen.getByTestId('unit-type-icon-5').props.iconUrl).toBeUndefined();
  });

  it("puts each active call's type icon beside its name", async () => {
    mockCallsState.calls = [{ CallId: '42', Name: 'House fire', TypeIconUrl: null, TypeMapIcon: 'fire' }];

    render(<CallsWidget />);
    // Let the widget's group and role lookups settle.
    await act(async () => {});

    expect(screen.getByText('House fire')).toBeTruthy();
    const icon = screen.getByTestId('call-type-icon-42');
    expect(icon.props.iconUrl).toBeNull();
    expect(icon.props.mapIcon).toBe('fire');
  });

  it("puts each person's role icon beside their name, with no built-in stand-in", () => {
    mockPersonnelState.personnel = [{ UserId: 'u1', FirstName: 'Sam', LastName: 'Lee', GroupId: '', RoleIconUrl: ICON_URL }];

    render(<PersonnelWidget />);

    const icon = screen.getByTestId('personnel-role-icon-u1');
    expect(icon.props.iconUrl).toBe(ICON_URL);
    expect(icon.props.mapIcon).toBeUndefined();
  });
});
