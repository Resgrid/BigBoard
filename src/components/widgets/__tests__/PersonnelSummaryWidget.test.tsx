import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { ActionBaseTypes, StaffingBaseTypes } from '@/lib/base-types';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';

import { PersonnelSummaryWidget } from '../PersonnelSummaryWidget';

const mockPersonnelState = { personnel: [] as Partial<PersonnelInfoResultData>[], isLoading: false, error: null as string | null, init: jest.fn() };

jest.mock('@/stores/personnel/store', () => ({
  usePersonnelStore: (selector: (state: typeof mockPersonnelState) => unknown) => selector(mockPersonnelState),
}));
jest.mock('@/hooks/use-personnel-signalr-updates', () => ({ usePersonnelSignalRUpdates: jest.fn() }));
jest.mock('nativewind', () => ({ useColorScheme: () => ({ colorScheme: 'light' }) }));
jest.mock('@/components/ui/box', () => ({ Box: require('react-native').View }));
jest.mock('@/components/ui/vstack', () => ({ VStack: require('react-native').View }));
jest.mock('@/components/ui/text', () => ({ Text: require('react-native').Text }));
jest.mock('@/components/ui/spinner', () => ({ Spinner: require('react-native').ActivityIndicator }));
jest.mock('../WidgetContainer', () => ({ WidgetContainer: require('react-native').View }));

/** Each row renders its label then its count; read the count that follows the label. */
const rowValue = (label: string) => {
  const texts = screen.UNSAFE_getAllByType(Text).map((node) => node.props.children);
  const index = texts.indexOf(label);
  return index >= 0 ? texts[index + 1] : undefined;
};

describe('PersonnelSummaryWidget', () => {
  beforeEach(() => {
    mockPersonnelState.personnel = [];
    mockPersonnelState.isLoading = false;
    mockPersonnelState.error = null;
  });

  it('counts by what each status and staffing means, not by its name', () => {
    mockPersonnelState.personnel = [
      { UserId: '1', Status: 'IN QUARTERS', StatusBaseType: ActionBaseTypes.InQuarters, Staffing: 'Pager Only', StaffingBaseType: StaffingBaseTypes.OnCall },
      { UserId: '2', Status: 'Wheels Up', StatusBaseType: ActionBaseTypes.Enroute, Staffing: 'On Shift', StaffingBaseType: StaffingBaseTypes.OnShift },
      { UserId: '3', Status: 'Unavailable', StatusBaseType: ActionBaseTypes.Unavailable, Staffing: 'Off Duty', StaffingBaseType: StaffingBaseTypes.OffDuty },
    ];

    render(<PersonnelSummaryWidget />);

    expect(rowValue('Total')).toBe(3);
    expect(rowValue('On Duty')).toBe(2);
    expect(rowValue('Available')).toBe(1);
    expect(rowValue('Responding')).toBe(1);
  });

  it('falls back to whole-word label matching for an older server', () => {
    mockPersonnelState.personnel = [
      { UserId: '1', Status: 'Unavailable', Staffing: 'Off Duty' },
      { UserId: '2', Status: 'Not Responding', Staffing: 'On Duty' },
      { UserId: '3', Status: 'Available', Staffing: 'On Duty' },
      { UserId: '4', Status: 'Responding', Staffing: 'Committed' },
    ];

    render(<PersonnelSummaryWidget />);

    expect(rowValue('Total')).toBe(4);
    expect(rowValue('On Duty')).toBe(2);
    expect(rowValue('Available')).toBe(1);
    expect(rowValue('Responding')).toBe(1);
  });
});
