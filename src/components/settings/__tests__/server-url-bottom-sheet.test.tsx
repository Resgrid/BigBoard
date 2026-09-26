import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ServerUrlBottomSheet } from '../server-url-bottom-sheet';

const mockSetUrl = jest.fn().mockResolvedValue(undefined);
const mockGetUrl = jest.fn().mockResolvedValue('https://test.com/api/v4');
const mockGetSystemConfig = jest.fn();
const mockFormSetValue = jest.fn();
let mockFormValues: { url: string } = { url: 'https://test.com' };
let mockSelectOnValueChange: ((value: string) => void) | undefined;
const mockOnUrlChanged = jest.fn().mockResolvedValue(undefined);
const mockIsAuthenticated = jest.fn(() => false);

const SERVER_LOCATIONS = {
  Data: {
    Locations: [
      { Name: 'US-West', ApiUrl: 'https://api.resgrid.com', DisplayName: '', LocationInfo: '', IsDefault: true, AllowsFreeAccounts: true },
      { Name: 'EU-Central', ApiUrl: 'https://api-eu-central.resgrid.com/api/v4', DisplayName: '', LocationInfo: '', IsDefault: false, AllowsFreeAccounts: false },
    ],
  },
};

jest.mock('@/api/config', () => ({
  getSystemConfig: (signal?: AbortSignal) => mockGetSystemConfig(signal),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.server_url': 'Server URL',
        'settings.server': 'Server',
        'settings.custom': 'Custom',
        'settings.enter_server_url': 'Enter Resgrid API URL',
        'settings.server_url_note': 'Note: This is the URL of the Resgrid API',
        'loading.loadingData': 'Loading data...',
        'form.required': 'This field is required',
        'form.invalid_url': 'Please enter a valid URL',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('nativewind', () => ({
  useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
  cssInterop: jest.fn(),
  styled: jest.fn((Component: any) => Component),
}));

jest.mock('lucide-react-native', () => ({ ChevronDownIcon: 'ChevronDownIcon' }));

jest.mock('react-hook-form', () => ({
  useForm: () => {
    const React = require('react');
    const [, forceRender] = React.useState(0);

    // Stable across renders, like react-hook-form's own setValue (the load effect depends on it)
    const setValue = React.useCallback((name: 'url', value: string) => {
      mockFormValues = { ...mockFormValues, [name]: value };
      mockFormSetValue(name, value);
      forceRender((current: number) => current + 1);
    }, []);

    return {
      control: {},
      handleSubmit: (fn: Function) => () => fn({ ...mockFormValues }),
      setValue,
      setError: jest.fn(),
      formState: { errors: {} },
    };
  },
  Controller: ({ name, render }: any) =>
    render({
      field: {
        onChange: (value: string) => {
          mockFormValues = { ...mockFormValues, [name]: value };
        },
        value: mockFormValues[name as keyof typeof mockFormValues] ?? '',
      },
    }),
}));

jest.mock('@/stores/app/server-url-store', () => ({
  useServerUrlStore: () => ({
    getUrl: mockGetUrl,
    setUrl: mockSetUrl,
  }),
}));

jest.mock('@/stores/auth/store', () => ({
  __esModule: true,
  default: (selector: (state: { isAuthenticated: () => boolean }) => boolean) => selector({ isAuthenticated: mockIsAuthenticated }),
}));

jest.mock('@/lib/env', () => ({
  Env: { API_VERSION: 'v4' },
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../ui/actionsheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Actionsheet: ({ children, isOpen }: any) => (isOpen ? React.createElement(View, { testID: 'actionsheet' }, children) : null),
    ActionsheetBackdrop: ({ children }: any) => React.createElement(View, {}, children),
    ActionsheetContent: ({ children }: any) => React.createElement(View, {}, children),
    ActionsheetDragIndicator: () => React.createElement(View, {}),
    ActionsheetDragIndicatorWrapper: ({ children }: any) => React.createElement(View, {}, children),
  };
});

jest.mock('../../ui/button', () => {
  const React = require('react');
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    Button: ({ children, onPress }: any) => React.createElement(TouchableOpacity, { testID: 'button', onPress }, children),
    ButtonText: ({ children }: any) => React.createElement(Text, {}, children),
    ButtonSpinner: () => React.createElement(View, { testID: 'button-spinner' }),
  };
});

jest.mock('../../ui/form-control', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    FormControl: ({ children }: any) => React.createElement(View, {}, children),
    FormControlLabel: ({ children }: any) => React.createElement(View, {}, children),
    FormControlLabelText: ({ children }: any) => React.createElement(Text, {}, children),
    FormControlHelperText: ({ children }: any) => React.createElement(Text, {}, children),
    FormControlError: ({ children }: any) => React.createElement(View, {}, children),
    FormControlErrorText: ({ children }: any) => React.createElement(Text, {}, children),
  };
});

jest.mock('../../ui/center', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Center: ({ children }: any) => React.createElement(View, {}, children),
  };
});

jest.mock('../../ui/hstack', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HStack: ({ children }: any) => React.createElement(View, {}, children),
  };
});

jest.mock('../../ui/input', () => {
  const React = require('react');
  const { View, TextInput } = require('react-native');
  return {
    Input: ({ children }: any) => React.createElement(View, {}, children),
    InputField: (props: any) => React.createElement(TextInput, { testID: 'input-field', ...props }),
  };
});

jest.mock('../../ui/select', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    Select: ({ children, onValueChange }: any) => {
      mockSelectOnValueChange = onValueChange;
      return React.createElement(View, { testID: 'server-select' }, children);
    },
    SelectBackdrop: ({ children }: any) => React.createElement(View, {}, children),
    SelectContent: ({ children }: any) => React.createElement(View, {}, children),
    SelectDragIndicator: () => React.createElement(View, {}),
    SelectDragIndicatorWrapper: ({ children }: any) => React.createElement(View, {}, children),
    SelectIcon: () => React.createElement(View, {}),
    SelectInput: ({ value, placeholder }: any) => React.createElement(Text, { testID: 'select-input' }, value || placeholder),
    SelectItem: ({ label, value }: any) => React.createElement(TouchableOpacity, { testID: `select-item-${value}`, onPress: () => mockSelectOnValueChange?.(value) }, React.createElement(Text, {}, label)),
    SelectPortal: ({ children }: any) => React.createElement(View, {}, children),
    SelectTrigger: ({ children }: any) => React.createElement(View, {}, children),
  };
});

jest.mock('../../ui/text', () => {
  const React = require('react');
  const { Text: RNText } = require('react-native');
  return {
    Text: ({ children }: any) => React.createElement(RNText, {}, children),
  };
});

jest.mock('../../ui/vstack', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VStack: ({ children }: any) => React.createElement(View, {}, children),
  };
});

describe('ServerUrlBottomSheet', () => {
  const mockOnClose = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onUrlChanged: mockOnUrlChanged,
  };

  const waitForOptions = () => waitFor(() => expect(screen.getByTestId('select-input')).toBeTruthy());

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUrl.mockResolvedValue('https://test.com/api/v4');
    mockGetSystemConfig.mockResolvedValue(SERVER_LOCATIONS);
    mockIsAuthenticated.mockReturnValue(false);
    mockFormValues = { url: 'https://test.com' };
    mockSelectOnValueChange = undefined;
  });

  describe('loading server options', () => {
    it('shows a loading state until the options are loaded', async () => {
      render(<ServerUrlBottomSheet {...defaultProps} />);

      expect(screen.getByText('Loading data...')).toBeTruthy();

      await waitForOptions();
      expect(screen.queryByText('Loading data...')).toBeNull();
    });

    it('does not load options while closed', () => {
      render(<ServerUrlBottomSheet {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('actionsheet')).toBeNull();
      expect(mockGetSystemConfig).not.toHaveBeenCalled();
    });

    it('lists the US-West and EU-Central sites plus Custom', async () => {
      render(<ServerUrlBottomSheet {...defaultProps} />);

      await waitForOptions();

      expect(screen.getByTestId('select-item-US-West')).toBeTruthy();
      expect(screen.getByTestId('select-item-EU-Central')).toBeTruthy();
      expect(screen.getByTestId('select-item-__custom__')).toBeTruthy();
    });

    it('falls back to the built-in Resgrid sites when the system config cannot be loaded', async () => {
      mockGetSystemConfig.mockRejectedValueOnce(new Error('Network Error'));
      mockGetUrl.mockResolvedValueOnce('https://api-eu-central.resgrid.com/api/v4');

      render(<ServerUrlBottomSheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('select-input').props.children).toBe('EU-Central');
      });
      expect(screen.getByTestId('select-item-US-West')).toBeTruthy();
    });

    it('falls back to the built-in Resgrid sites when the server returns no locations', async () => {
      mockGetSystemConfig.mockResolvedValueOnce({ Data: { Locations: [] } });

      render(<ServerUrlBottomSheet {...defaultProps} />);

      await waitForOptions();
      expect(screen.getByTestId('select-item-US-West')).toBeTruthy();
      expect(screen.getByTestId('select-item-EU-Central')).toBeTruthy();
    });

    it('passes an abort signal so a hung server cannot leave the sheet loading forever', async () => {
      render(<ServerUrlBottomSheet {...defaultProps} />);

      await waitForOptions();
      expect(mockGetSystemConfig.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
    });

    it('selects Custom and shows the domain only when the url matches no site', async () => {
      mockGetUrl.mockResolvedValueOnce('https://custom.resgrid.dev/api/v4/');

      render(<ServerUrlBottomSheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('select-input').props.children).toBe('Custom');
        expect(screen.getByTestId('input-field').props.value).toBe('https://custom.resgrid.dev');
      });
      expect(screen.getByTestId('input-field').props.editable).toBe(true);
    });

    it('selects the matching site and locks the text input', async () => {
      mockGetUrl.mockResolvedValueOnce('https://api-eu-central.resgrid.com/api/v4');

      render(<ServerUrlBottomSheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('select-input').props.children).toBe('EU-Central');
      });
      expect(screen.getByTestId('input-field').props.editable).toBe(false);
    });
  });

  describe('choosing a server', () => {
    it('fills the text box with the selected site ApiUrl', async () => {
      render(<ServerUrlBottomSheet {...defaultProps} />);
      await waitForOptions();

      fireEvent.press(screen.getByTestId('select-item-US-West'));

      await waitFor(() => {
        expect(screen.getByTestId('select-input').props.children).toBe('US-West');
        expect(screen.getByTestId('input-field').props.value).toBe('https://api.resgrid.com');
      });
    });

    it('re-enables the text input when Custom is selected', async () => {
      mockGetUrl.mockResolvedValueOnce('https://api.resgrid.com/api/v4');

      render(<ServerUrlBottomSheet {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByTestId('select-input').props.children).toBe('US-West');
      });

      fireEvent.press(screen.getByTestId('select-item-__custom__'));

      await waitFor(() => {
        expect(screen.getByTestId('select-input').props.children).toBe('Custom');
      });
      expect(screen.getByTestId('input-field').props.editable).toBe(true);
    });
  });

  describe('saving', () => {
    it('saves a custom url normalized with the api suffix', async () => {
      render(<ServerUrlBottomSheet {...defaultProps} />);
      await waitForOptions();

      fireEvent.changeText(screen.getByTestId('input-field'), ' https://my.server.test/ ');
      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockSetUrl).toHaveBeenCalledWith('https://my.server.test/api/v4');
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not double the api suffix when the site ApiUrl already includes it', async () => {
      render(<ServerUrlBottomSheet {...defaultProps} />);
      await waitForOptions();

      fireEvent.press(screen.getByTestId('select-item-EU-Central'));
      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockSetUrl).toHaveBeenCalledWith('https://api-eu-central.resgrid.com/api/v4');
      });
    });

    it('does not call onUrlChanged when signed out', async () => {
      render(<ServerUrlBottomSheet {...defaultProps} />);
      await waitForOptions();

      fireEvent.press(screen.getByTestId('select-item-US-West'));
      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockSetUrl).toHaveBeenCalledWith('https://api.resgrid.com/api/v4');
      });
      expect(mockOnUrlChanged).not.toHaveBeenCalled();
    });

    it('calls onUrlChanged when a signed-in user moves to a different server', async () => {
      mockIsAuthenticated.mockReturnValue(true);

      render(<ServerUrlBottomSheet {...defaultProps} />);
      await waitForOptions();

      fireEvent.press(screen.getByTestId('select-item-EU-Central'));
      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockOnUrlChanged).toHaveBeenCalledTimes(1);
      });
    });

    it('keeps the session when a signed-in user saves the server they are already on', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUrl.mockResolvedValueOnce('https://api.resgrid.com/api/v4');

      render(<ServerUrlBottomSheet {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByTestId('select-input').props.children).toBe('US-West');
      });

      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockSetUrl).toHaveBeenCalledWith('https://api.resgrid.com/api/v4');
      });
      expect(mockOnUrlChanged).not.toHaveBeenCalled();
    });
  });
});
