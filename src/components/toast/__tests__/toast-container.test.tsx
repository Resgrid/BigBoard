import { render } from '@testing-library/react-native';
import React from 'react';

import { useToastStore } from '@/stores/toast/store';

import { ToastContainer } from '../toast-container';

// Mock the toast store
jest.mock('@/stores/toast/store', () => ({
  useToastStore: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

// Mock the ToastMessage component
jest.mock('../toast', () => ({
  ToastMessage: ({ type, message, title }: any) => {
    const { Text } = require('react-native');
    return (
      <Text testID={`toast-${type}`}>
        {title && `${title}: `}
        {message}
      </Text>
    );
  },
}));

describe('ToastContainer', () => {
  const mockUseToastStore = useToastStore as jest.MockedFunction<typeof useToastStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when no toasts are present', () => {
    mockUseToastStore.mockReturnValue([]);

    const { queryByTestId } = render(<ToastContainer />);

    expect(queryByTestId('toast-success')).toBeNull();
    expect(queryByTestId('toast-error')).toBeNull();
  });

  it('renders toasts when they are present in the store', () => {
    const mockToasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
      { id: '2', type: 'error' as const, message: 'Error message', title: 'Error Title' },
    ];

    mockUseToastStore.mockReturnValue(mockToasts);

    const { getByTestId } = render(<ToastContainer />);

    expect(getByTestId('toast-success')).toBeTruthy();
    expect(getByTestId('toast-error')).toBeTruthy();
  });

  it('renders toast with title and message correctly', () => {
    const mockToasts = [
      { id: '1', type: 'warning' as const, message: 'Warning message', title: 'Warning Title' },
    ];

    mockUseToastStore.mockReturnValue(mockToasts);

    const { getByTestId } = render(<ToastContainer />);

    const toastElement = getByTestId('toast-warning');
    expect(toastElement.props.children).toEqual(['Warning Title: ', 'Warning message']);
  });
});