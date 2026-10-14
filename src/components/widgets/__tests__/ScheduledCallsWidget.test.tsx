import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { CallPriorityBaseTypes } from '@/lib/base-types';
import { type CallPriorityResultData } from '@/models/v4/callPriorities/callPriorityResultData';
import { type CallResultData } from '@/models/v4/calls/callResultData';

import { ScheduledCallsWidget } from '../ScheduledCallsWidget';

const mockScheduledState = {
  scheduledCalls: [] as Partial<CallResultData>[],
  callPriorities: [] as Partial<CallPriorityResultData>[],
  callExtraDataMap: {},
  isLoading: false,
  error: null as string | null,
  init: jest.fn(),
};
const mockSettings = {
  showName: true,
  showScheduledTime: false,
  showPriority: false,
  showAddress: false,
  showDispatched: false,
  dispatchScrollSpeed: 40,
  fontSize: 12,
  columnOrder: ['name'],
  sortBy: 'priority',
  sortOrder: 'desc' as 'asc' | 'desc',
  filterGroupIds: [],
  filterUnitIds: [],
  filterPersonnelIds: [],
  filterRoleIds: [],
  colorThresholdRedMinutes: 15,
  colorThresholdYellowMinutes: 60,
  colorThresholdGreenMinutes: 240,
  colorRedHex: '#EF4444',
  colorYellowHex: '#F59E0B',
  colorGreenHex: '#10B981',
  colorDefaultHex: '#6B7280',
};
const mockPersonnelState = { personnel: [], init: jest.fn() };
const mockUnitsState = { units: [], fetchUnits: jest.fn() };

jest.mock('@/stores/scheduledCalls/store', () => ({
  useScheduledCallsStore: (selector: (state: typeof mockScheduledState) => unknown) => selector(mockScheduledState),
}));
jest.mock('@/stores/widget-settings/scheduled-calls-settings-store', () => ({
  DEFAULT_SCHEDULED_CALLS_COLUMN_ORDER: ['name', 'scheduledTime', 'priority', 'address', 'dispatched'],
  SCHEDULED_CALLS_COLUMN_LABELS: { name: 'Name', scheduledTime: 'Scheduled Time', priority: 'Priority', address: 'Address', dispatched: 'Dispatched' },
  useScheduledCallsSettingsStore: (selector: (state: { settings: typeof mockSettings }) => unknown) => selector({ settings: mockSettings }),
}));
jest.mock('@/stores/personnel/store', () => ({
  usePersonnelStore: (selector: (state: typeof mockPersonnelState) => unknown) => selector(mockPersonnelState),
}));
jest.mock('@/stores/units/store', () => ({
  useUnitsStore: (selector: (state: typeof mockUnitsState) => unknown) => selector(mockUnitsState),
}));
jest.mock('@/api/groups/groups', () => ({ getAllGroups: jest.fn(() => Promise.resolve({ Data: [] })) }));
jest.mock('@/api/messaging/messages', () => ({ getRecipients: jest.fn(() => Promise.resolve({ Data: [] })) }));
jest.mock('@/components/calls/auto-scrolling-dispatches', () => ({ AutoScrollingDispatches: () => null }));
jest.mock('nativewind', () => ({ useColorScheme: () => ({ colorScheme: 'light' }) }));
jest.mock('@/components/ui/box', () => ({ Box: require('react-native').View }));
jest.mock('@/components/ui/hstack', () => ({ HStack: require('react-native').View }));
jest.mock('@/components/ui/vstack', () => ({ VStack: require('react-native').View }));
jest.mock('@/components/ui/text', () => ({ Text: require('react-native').Text }));
jest.mock('@/components/ui/spinner', () => ({ Spinner: require('react-native').ActivityIndicator }));
jest.mock('../WidgetContainer', () => ({ WidgetContainer: require('react-native').View }));

const renderedCallNames = () =>
  screen
    .UNSAFE_getAllByType(Text)
    .map((node) => node.props.children)
    .filter((text) => typeof text === 'string' && text.startsWith('Call '));

describe('ScheduledCallsWidget priority sort', () => {
  beforeEach(() => {
    mockSettings.sortOrder = 'desc';
    mockScheduledState.scheduledCalls = [
      { CallId: 'a', Name: 'Call Routine', Priority: 58 },
      { CallId: 'b', Name: 'Call Code 3', Priority: 57 },
      { CallId: 'c', Name: 'Call Urgent', Priority: 59 },
    ];
  });

  it('puts the most urgent department priority first when descending, whatever its id', async () => {
    // Department priority ids are creation order: sorting on them put "Routine" (58) above "Code 3" (57).
    mockScheduledState.callPriorities = [
      { Id: 57, Name: 'Code 3', BaseType: CallPriorityBaseTypes.Emergency, Sort: 0 },
      { Id: 58, Name: 'Routine', BaseType: CallPriorityBaseTypes.Low, Sort: 1 },
      { Id: 59, Name: 'Urgent', BaseType: CallPriorityBaseTypes.High, Sort: 2 },
    ];

    render(<ScheduledCallsWidget />);

    await waitFor(() => expect(renderedCallNames()).toEqual(['Call Code 3', 'Call Urgent', 'Call Routine']));
  });

  it('keeps the raw id order when the server sends no priority meanings', async () => {
    mockScheduledState.callPriorities = [
      { Id: 57, Name: 'Code 3' },
      { Id: 58, Name: 'Routine' },
      { Id: 59, Name: 'Urgent' },
    ];

    render(<ScheduledCallsWidget />);

    await waitFor(() => expect(renderedCallNames()).toEqual(['Call Urgent', 'Call Routine', 'Call Code 3']));
  });
});
