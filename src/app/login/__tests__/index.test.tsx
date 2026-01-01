import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';

import Login from '../index';

const mockPush = jest.fn();

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock UI components
jest.mock('@/components/ui', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    FocusAwareStatusBar: () => React.createElement(View, { testID: 'focus-aware-status-bar' }),
  };
});

jest.mock('@/components/ui/modal', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Modal: ({ children, isOpen }: any) => (isOpen ? React.createElement(View, { testID: 'modal' }, children) : null),
    ModalBackdrop: ({ children }: any) => React.createElement(View, { testID: 'modal-backdrop' }, children),
    ModalContent: ({ children, className }: any) => React.createElement(View, { testID: 'modal-content', className }, children),
    ModalHeader: ({ children }: any) => React.createElement(View, { testID: 'modal-header' }, children),
    ModalBody: ({ children }: any) => React.createElement(View, { testID: 'modal-body' }, children),
    ModalFooter: ({ children }: any) => React.createElement(View, { testID: 'modal-footer' }, children),
  };
});

jest.mock('@/components/ui/text', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Text: ({ children, className }: any) => React.createElement(Text, { className }, children),
  };
});

jest.mock('@/components/ui/button', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');

  return {
    Button: ({ children, onPress, variant, size, action }: any) =>
      React.createElement(TouchableOpacity, { onPress, testID: 'button' }, children),
    ButtonText: ({ children }: any) => React.createElement(Text, {}, children),
  };
});

jest.mock('@/components/settings/server-url-bottom-sheet', () => {
  const React = require('react');
  const { View, TouchableOpacity } = require('react-native');

  return {
    ServerUrlBottomSheet: ({ isOpen, onClose }: any) =>
      isOpen ? React.createElement(View, { testID: 'server-url-bottom-sheet' },
        React.createElement(TouchableOpacity, { onPress: onClose, testID: 'close-server-url' }, 'Close')
      ) : null,
  };
});

jest.mock('../login-form', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');

  return {
    LoginForm: ({ onSubmit, isLoading, error, onServerUrlPress }: any) =>
      React.createElement(View, { testID: 'login-form' }, [
        React.createElement(Text, { key: 'loading' }, isLoading ? 'Loading...' : 'Not Loading'),
        error && React.createElement(Text, { key: 'error' }, error),
        React.createElement(TouchableOpacity, {
          key: 'submit',
          onPress: () => onSubmit({ username: 'test', password: 'test' }),
          testID: 'submit-login'
        }, 'Submit'),
        onServerUrlPress && React.createElement(TouchableOpacity, {
          key: 'server-url',
          onPress: onServerUrlPress,
          testID: 'server-url-button'
        }, 'Server URL'),
      ])
  };
});

// Mock hooks
const mockUseAuth = jest.fn();
const mockUseAnalytics = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'login.errorModal.title': 'Error',
        'login.errorModal.message': 'Login failed',
        'login.errorModal.confirmButton': 'OK',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => mockUseAnalytics(),
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set default mock return values
    mockUseAuth.mockReturnValue({
      login: jest.fn(),
      status: 'idle',
      error: null,
      isAuthenticated: false,
    });

    mockUseAnalytics.mockReturnValue({
      trackEvent: jest.fn(),
    });
  });

  it('renders login form and server URL button', () => {
    render(<Login />);

    expect(screen.getByTestId('login-form')).toBeTruthy();
    expect(screen.getByTestId('server-url-button')).toBeTruthy();
  });

  it('opens server URL bottom sheet when server URL button is pressed', async () => {
    render(<Login />);

    const serverUrlButton = screen.getByTestId('server-url-button');
    fireEvent.press(serverUrlButton);

    await waitFor(() => {
      expect(screen.getByTestId('server-url-bottom-sheet')).toBeTruthy();
    });
  });

  it('closes server URL bottom sheet when close is pressed', async () => {
    render(<Login />);

    // Open the bottom sheet
    const serverUrlButton = screen.getByTestId('server-url-button');
    fireEvent.press(serverUrlButton);

    await waitFor(() => {
      expect(screen.getByTestId('server-url-bottom-sheet')).toBeTruthy();
    });

    // Close the bottom sheet
    const closeButton = screen.getByTestId('close-server-url');
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('server-url-bottom-sheet')).toBeNull();
    });
  });

  it('shows error modal when status is error', () => {
    mockUseAuth.mockReturnValue({
      login: jest.fn(),
      status: 'error',
      error: 'Invalid credentials',
      isAuthenticated: false,
    });

    render(<Login />);

    expect(screen.getByTestId('modal')).toBeTruthy();
    expect(screen.getByText('Login failed')).toBeTruthy();
  });

  it('redirects to app when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      login: jest.fn(),
      status: 'signedIn',
      error: null,
      isAuthenticated: true,
    });

    render(<Login />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/(app)');
    });
  });

  it('tracks analytics when login view is rendered', () => {
    const mockTrackEvent = jest.fn();
    mockUseAnalytics.mockReturnValue({
      trackEvent: mockTrackEvent,
    });

    render(<Login />);

    expect(mockTrackEvent).toHaveBeenCalledWith('login_view_rendered', {
      hasError: false,
      status: 'idle',
    });
  });

  it('calls login function when form is submitted', () => {
    const mockLogin = jest.fn();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      status: 'idle',
      error: null,
      isAuthenticated: false,
    });

    render(<Login />);

    const submitButton = screen.getByTestId('submit-login');
    fireEvent.press(submitButton);

    expect(mockLogin).toHaveBeenCalledWith({ username: 'test', password: 'test' });
  });
});
