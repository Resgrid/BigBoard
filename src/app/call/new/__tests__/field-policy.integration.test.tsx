import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import NewCall from '../index';
import { getNewCallFieldPolicy } from '@/api/calls/newCallFieldPolicy';
import { createCall } from '@/api/calls/calls';
import { NewCallFieldKeys, type NewCallFieldRuleData } from '@/models/v4/calls/newCallFieldPolicyResultData';

// A complete, valid submission. react-hook-form is stubbed below so pressing Create hands these
// straight to onSubmit — the policy check is what is under test, not zod.
const mockFormValues = {
  name: 'Structure fire',
  nature: 'Smoke showing',
  note: '',
  address: '',
  coordinates: '',
  what3words: '',
  plusCode: '',
  latitude: undefined,
  longitude: undefined,
  priority: 'High',
  type: 'Fire',
  contactName: '',
  contactInfo: '',
  dispatchSelection: { everyone: false, users: [], groups: [], roles: [], units: [] },
};

jest.mock('@/api/calls/newCallFieldPolicy', () => ({
  getNewCallFieldPolicy: jest.fn(),
}));

jest.mock('@/api/calls/calls', () => ({
  createCall: jest.fn().mockResolvedValue({ Id: 'call-1' }),
}));

const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess, show: jest.fn(), warning: jest.fn(), info: jest.fn() }),
}));

jest.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({ trackEvent: jest.fn() }),
}));

jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: () => ({ config: { GoogleMapsKey: 'key', W3WKey: 'key' } }),
}));

jest.mock('@/stores/calls/store', () => ({
  useCallsStore: () => ({
    callPriorities: [{ Id: 1, Name: 'High' }],
    callTypes: [{ Id: 2, Name: 'Fire' }],
    isLoading: false,
    error: null,
    fetchCallPriorities: jest.fn(),
    fetchCallTypes: jest.fn(),
  }),
}));

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (onValid: (values: unknown) => unknown) => () => onValid(mockFormValues),
    formState: { errors: {} },
    setValue: jest.fn(),
    watch: jest.fn(),
  }),
  Controller: ({ render: renderField }: { render: (arg: unknown) => React.ReactElement }) => renderField({ field: { onChange: jest.fn(), onBlur: jest.fn(), value: '', name: 'stub' } }),
}));

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => jest.fn(),
}));

// The screen builds its zod schema at module scope, but `import * as z from 'zod'` resolves to just
// `{ z }` under Jest's CJS interop, so the real module cannot satisfy it. The schema is not what is
// under test: zodResolver and handleSubmit are both stubbed above.
jest.mock('zod', () => {
  const chainable: Record<string, unknown> = new Proxy({}, { get: () => () => chainable });

  return { __esModule: true, object: () => chainable, string: () => chainable, number: () => chainable, boolean: () => chainable, array: () => chainable };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => (options?.fields ? `${key}:${options.fields}` : key) }),
}));

jest.mock('nativewind', () => ({
  styled: jest.fn((Component: unknown) => Component),
  useColorScheme: () => ({ colorScheme: 'light' }),
}));

jest.mock('lucide-react-native', () => ({
  ChevronDownIcon: () => null,
  PlusIcon: () => null,
  SearchIcon: () => null,
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 0, longitude: 0 } }),
}));

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-keyboard-controller', () => {
  const { View } = require('react-native');
  return { KeyboardAvoidingView: View };
});

jest.mock('@/components/calls/dispatch-selection-modal', () => ({
  DispatchSelectionModal: () => null,
}));

jest.mock('@/components/maps/location-picker', () => ({ __esModule: true, default: () => null }));

jest.mock('@/components/maps/full-screen-location-picker', () => ({ __esModule: true, default: () => null }));

jest.mock('@/components/ui/bottom-sheet', () => ({ CustomBottomSheet: () => null }));

jest.mock('@/components/ui/focus-aware-status-bar', () => ({ FocusAwareStatusBar: () => null }));

jest.mock('@/components/common/loading', () => ({ Loading: () => null }));

const mockedGetPolicy = getNewCallFieldPolicy as jest.MockedFunction<typeof getNewCallFieldPolicy>;
const mockedCreateCall = createCall as jest.MockedFunction<typeof createCall>;

const withRules = (rules: NewCallFieldRuleData[]) => {
  mockedGetPolicy.mockResolvedValue({ Rules: rules });
};

// The policy loads asynchronously and the Create button stays disabled until it lands.
const renderAndSettle = async () => {
  const view = render(<NewCall />);
  await waitFor(() => expect(screen.getByTestId('create-call-button')).toBeEnabled());
  return view;
};

describe('NewCall field policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateCall.mockResolvedValue({ Id: 'call-1' } as never);
    withRules([]);
  });

  describe('required keys this screen cannot collect', () => {
    it('does not block submission on a required key with no input on this screen', async () => {
      // externalId is a web-only field. Blocking here would leave the department unable to create
      // any call at all, naming a field the dispatcher cannot see.
      withRules([{ Key: NewCallFieldKeys.ExternalId, Visible: true, Required: true }]);

      await renderAndSettle();
      fireEvent.press(screen.getByTestId('create-call-button'));

      await waitFor(() => expect(mockedCreateCall).toHaveBeenCalled());
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('ignores every unsupported key at once', async () => {
      withRules([
        { Key: NewCallFieldKeys.DestinationPoi, Visible: true, Required: true },
        { Key: NewCallFieldKeys.IndoorLocation, Visible: true, Required: true },
        { Key: NewCallFieldKeys.IncidentId, Visible: true, Required: true },
        { Key: NewCallFieldKeys.ReferenceId, Visible: true, Required: true },
        { Key: NewCallFieldKeys.Protocols, Visible: true, Required: true },
        { Key: NewCallFieldKeys.LinkedCall, Visible: true, Required: true },
        { Key: NewCallFieldKeys.DispatchOn, Visible: true, Required: true },
      ]);

      await renderAndSettle();
      fireEvent.press(screen.getByTestId('create-call-button'));

      await waitFor(() => expect(mockedCreateCall).toHaveBeenCalled());
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('still enforces a required key this screen does render', async () => {
      withRules([
        { Key: NewCallFieldKeys.ExternalId, Visible: true, Required: true },
        { Key: NewCallFieldKeys.ContactName, Visible: true, Required: true },
      ]);

      await renderAndSettle();
      fireEvent.press(screen.getByTestId('create-call-button'));

      // Named by its form label, and externalId is not mentioned alongside it.
      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('calls.required_fields_missing:calls.contact_name'));
      expect(mockedCreateCall).not.toHaveBeenCalled();
    });
  });

  describe('location field visibility', () => {
    it('renders every locator when the department has no policy', async () => {
      await renderAndSettle();

      expect(screen.getByTestId('address-input')).toBeOnTheScreen();
      expect(screen.getByTestId('coordinates-input')).toBeOnTheScreen();
      expect(screen.getByTestId('what3words-input')).toBeOnTheScreen();
      expect(screen.getByTestId('plus-code-input')).toBeOnTheScreen();
      expect(screen.getByTestId('select-location-button')).toBeOnTheScreen();
    });

    it('hides each locator the department turned off', async () => {
      withRules([
        { Key: NewCallFieldKeys.Address, Visible: false, Required: false },
        { Key: NewCallFieldKeys.PlusCode, Visible: false, Required: false },
      ]);

      await renderAndSettle();

      expect(screen.queryByTestId('address-input')).toBeNull();
      expect(screen.queryByTestId('plus-code-input')).toBeNull();
      expect(screen.getByTestId('coordinates-input')).toBeOnTheScreen();
      expect(screen.getByTestId('what3words-input')).toBeOnTheScreen();
    });

    it('drops the map picker with geolocation, since it writes latitude and longitude', async () => {
      withRules([{ Key: NewCallFieldKeys.Geolocation, Visible: false, Required: false }]);

      await renderAndSettle();

      expect(screen.queryByTestId('coordinates-input')).toBeNull();
      expect(screen.queryByTestId('select-location-button')).toBeNull();
      expect(screen.getByTestId('address-input')).toBeOnTheScreen();
    });

    it('drops the whole location section when every locator is hidden', async () => {
      withRules([
        { Key: NewCallFieldKeys.Address, Visible: false, Required: false },
        { Key: NewCallFieldKeys.Geolocation, Visible: false, Required: false },
        { Key: NewCallFieldKeys.What3Words, Visible: false, Required: false },
        { Key: NewCallFieldKeys.PlusCode, Visible: false, Required: false },
      ]);

      await renderAndSettle();

      expect(screen.queryByText('calls.call_location')).toBeNull();
      expect(screen.queryByTestId('address-input')).toBeNull();
      expect(screen.queryByTestId('coordinates-input')).toBeNull();
      expect(screen.queryByTestId('what3words-input')).toBeNull();
      expect(screen.queryByTestId('plus-code-input')).toBeNull();
    });
  });
});
