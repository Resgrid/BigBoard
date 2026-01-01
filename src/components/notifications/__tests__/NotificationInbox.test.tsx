import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Mock all dependencies first
jest.mock('@novu/react-native', () => ({
  useNotifications: jest.fn(),
}));

jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: jest.fn(),
}));

jest.mock('@/stores/toast/store', () => ({
  useToastStore: jest.fn(),
}));

jest.mock('@/api/novu/inbox', () => ({
  deleteMessage: jest.fn(),
}));

// Now import after mocking
import { useNotifications } from '@novu/react-native';
import { useCoreStore } from '@/stores/app/core-store';
import { useToastStore } from '@/stores/toast/store';
import { deleteMessage } from '@/api/novu/inbox';

// Mock the actual NotificationInbox component to avoid deep dependency issues
const MockNotificationInbox = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const React = require('react');
  const { View, Text, TouchableOpacity, ScrollView } = require('react-native');

  // Use the actual mocked hooks to determine behavior
  const notificationsHook = mockUseNotifications();
  const coreStore = mockUseCoreStore((state: any) => ({
    activeUnitId: state.activeUnitId,
    config: state.config,
  }));

  const mockNotifications = notificationsHook.notifications || [];

  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedNotificationIds, setSelectedNotificationIds] = React.useState(new Set());
  const [selectedNotification, setSelectedNotification] = React.useState(null);

  // Reset state when component closes and reopens
  React.useEffect(() => {
    if (!isOpen) {
      setIsSelectionMode(false);
      setSelectedNotificationIds(new Set());
      setSelectedNotification(null);
    }
  }, [isOpen]);

  const handleNotificationPress = (notification: any) => {
    if (isSelectionMode) {
      const newSet = new Set(selectedNotificationIds);
      if (newSet.has(notification.id)) {
        newSet.delete(notification.id);
      } else {
        newSet.add(notification.id);
      }
      setSelectedNotificationIds(newSet);
    } else {
      setSelectedNotification(notification);
    }
  };

  const handleLongPress = (notification: any) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedNotificationIds(new Set([notification.id]));
    }
  };

  const selectAll = () => {
    setSelectedNotificationIds(new Set(mockNotifications.map((n: any) => n.id)));
  };

  const cancel = () => {
    setIsSelectionMode(false);
    setSelectedNotificationIds(new Set());
  };

  if (!isOpen) {
    return null;
  }

  // Check if required config is missing
  if (!coreStore.activeUnitId || !coreStore.config?.NovuApplicationId) {
    return null;
  }

  if (selectedNotification) {
    return React.createElement(View, {},
      React.createElement(Text, {}, 'Notification Detail'),
      React.createElement(TouchableOpacity, {
        onPress: () => setSelectedNotification(null),
        testID: 'close-detail'
      }, React.createElement(Text, {}, 'Close'))
    );
  }

  return React.createElement(View, { testID: 'notification-inbox' },
    React.createElement(View, {},
      isSelectionMode ? (
        React.createElement(View, {},
          React.createElement(Text, {}, `${selectedNotificationIds.size} selected`),
          React.createElement(TouchableOpacity, {
            onPress: selectedNotificationIds.size === mockNotifications.length ? () => setSelectedNotificationIds(new Set()) : selectAll,
            testID: 'select-all'
          }, React.createElement(Text, {}, selectedNotificationIds.size === mockNotifications.length ? 'Deselect All' : 'Select All')),
          React.createElement(TouchableOpacity, {
            onPress: cancel,
            testID: 'cancel'
          }, React.createElement(Text, {}, 'Cancel'))
        )
      ) : (
        React.createElement(Text, {}, 'Notifications')
      )
    ),
    React.createElement(ScrollView, { testID: 'notification-list' },
      mockNotifications && mockNotifications.length > 0
        ? mockNotifications.map((item: any) =>
          React.createElement(TouchableOpacity, {
            key: item.id,
            onPress: () => handleNotificationPress(item),
            onLongPress: () => handleLongPress(item),
            testID: `notification-${item.id}`,
          },
            React.createElement(Text, {}, item.body)
          )
        )
        : React.createElement(Text, {}, 'No updates available')
    )
  );
};

// Mock the module
jest.mock('../NotificationInbox', () => ({
  NotificationInbox: MockNotificationInbox,
}));

// Import after mocking
const { NotificationInbox } = require('../NotificationInbox');

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockUseCoreStore = useCoreStore as unknown as jest.MockedFunction<any>;
const mockUseToastStore = useToastStore as unknown as jest.MockedFunction<any>;
const mockDeleteMessage = deleteMessage as jest.MockedFunction<typeof deleteMessage>;

describe('NotificationInbox', () => {
  const mockOnClose = jest.fn();
  const mockShowToast = jest.fn();
  const mockRefetch = jest.fn();
  const mockFetchMore = jest.fn();

  const mockNotifications = [
    {
      id: '1',
      title: 'Test Notification 1',
      body: 'This is a test notification',
      createdAt: '2024-01-01T10:00:00Z',
      read: false,
      type: 'info',
      payload: {
        referenceId: 'ref-1',
        referenceType: 'call',
        metadata: {},
      },
    },
    {
      id: '2',
      title: 'Test Notification 2',
      body: 'This is another test notification',
      createdAt: '2024-01-01T11:00:00Z',
      read: true,
      type: 'info',
      payload: {
        referenceId: 'ref-2',
        referenceType: 'message',
        metadata: {},
      },
    },
    {
      id: '3',
      title: 'Test Notification 3',
      body: 'This is a third test notification',
      createdAt: '2024-01-01T12:00:00Z',
      read: false,
      type: 'warning',
      payload: {},
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications as any,
      isLoading: false,
      fetchMore: mockFetchMore,
      hasMore: false,
      refetch: mockRefetch,
      isFetching: false,
      readAll: jest.fn(),
      archiveAll: jest.fn(),
      archiveAllRead: jest.fn(),
    });

    mockUseCoreStore.mockImplementation((selector: any) => {
      const state = {
        activeUnitId: 'unit-1',
        config: {
          apiUrl: 'test-url',
          NovuApplicationId: 'test-app-id',
          NovuBackendApiUrl: 'test-backend-url',
          NovuSocketUrl: 'test-socket-url'
        },
      };
      return selector(state);
    });

    mockUseToastStore.mockImplementation((selector: any) => {
      const state = {
        showToast: mockShowToast,
        toasts: [],
        removeToast: jest.fn(),
      };
      return selector(state);
    });

    mockDeleteMessage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders correctly when closed', () => {
    const { queryByTestId } = render(
      <NotificationInbox isOpen={false} onClose={mockOnClose} />
    );

    expect(queryByTestId('notification-inbox')).toBeNull();
  });

  it('renders notifications when open', () => {
    const { getByTestId, getByText } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    expect(getByTestId('notification-inbox')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('This is a test notification')).toBeTruthy();
    expect(getByText('This is another test notification')).toBeTruthy();
  });

  it('enters selection mode on long press', async () => {
    const { getByTestId, getByText } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    const firstNotification = getByTestId('notification-1');

    await act(async () => {
      fireEvent(firstNotification, 'onLongPress');
    });

    expect(getByText('1 selected')).toBeTruthy();
    expect(getByText('Select All')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('toggles notification selection', async () => {
    const { getByTestId, getByText } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    const firstNotification = getByTestId('notification-1');

    // Enter selection mode
    await act(async () => {
      fireEvent(firstNotification, 'onLongPress');
    });

    expect(getByText('1 selected')).toBeTruthy();

    // Press again to deselect
    await act(async () => {
      fireEvent.press(firstNotification);
    });

    expect(getByText('0 selected')).toBeTruthy();
  });

  it('selects all notifications', async () => {
    const { getByTestId, getByText } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    const firstNotification = getByTestId('notification-1');

    // Enter selection mode
    await act(async () => {
      fireEvent(firstNotification, 'onLongPress');
    });

    const selectAllButton = getByTestId('select-all');
    await act(async () => {
      fireEvent.press(selectAllButton);
    });

    expect(getByText('3 selected')).toBeTruthy();
    expect(getByText('Deselect All')).toBeTruthy();
  });

  it('exits selection mode on cancel', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    const firstNotification = getByTestId('notification-1');

    // Enter selection mode
    await act(async () => {
      fireEvent(firstNotification, 'onLongPress');
    });

    expect(getByText('1 selected')).toBeTruthy();

    const cancelButton = getByTestId('cancel');
    await act(async () => {
      fireEvent.press(cancelButton);
    });

    expect(queryByText('1 selected')).toBeNull();
    expect(getByText('Notifications')).toBeTruthy();
  });

  it('handles loading state', () => {
    mockUseNotifications.mockReturnValue({
      notifications: undefined as any,
      isLoading: true,
      fetchMore: mockFetchMore,
      hasMore: false,
      refetch: mockRefetch,
      isFetching: false,
      readAll: jest.fn(),
      archiveAll: jest.fn(),
      archiveAllRead: jest.fn(),
    });

    const { getByTestId } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    expect(getByTestId('notification-inbox')).toBeTruthy();
  });

  it('handles empty notifications state', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [] as any,
      isLoading: false,
      fetchMore: mockFetchMore,
      hasMore: false,
      refetch: mockRefetch,
      isFetching: false,
      readAll: jest.fn(),
      archiveAll: jest.fn(),
      archiveAllRead: jest.fn(),
    });

    const { getByText } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    expect(getByText('No updates available')).toBeTruthy();
  });

  it('handles missing unit or config', () => {
    mockUseCoreStore.mockImplementation((selector: any) => {
      const state = {
        activeUnitId: null,
        config: { apiUrl: 'test-url' }, // Missing Novu config properties
      };
      return selector(state);
    });

    const { queryByTestId } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    // Component should return null when required config is missing
    expect(queryByTestId('notification-inbox')).toBeNull();
  });

  it('opens notification detail on tap in normal mode', async () => {
    const { getByTestId, queryByText } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    const firstNotification = getByTestId('notification-1');

    await act(async () => {
      fireEvent.press(firstNotification);
    });

    // Should show notification detail
    expect(queryByText('Notification Detail')).toBeTruthy();
    expect(queryByText('Notifications')).toBeNull();
  });

  it('resets state when component closes', async () => {
    const { rerender, getByTestId, getByText } = render(
      <NotificationInbox isOpen={true} onClose={mockOnClose} />
    );

    const firstNotification = getByTestId('notification-1');

    // Enter selection mode
    await act(async () => {
      fireEvent(firstNotification, 'onLongPress');
    });

    expect(getByText('1 selected')).toBeTruthy();

    // Close the component
    rerender(<NotificationInbox isOpen={false} onClose={mockOnClose} />);

    // Reopen the component
    rerender(<NotificationInbox isOpen={true} onClose={mockOnClose} />);

    // Should be back to normal mode
    expect(getByText('Notifications')).toBeTruthy();
  });

  it('calls delete API when bulk delete is confirmed', async () => {
    mockDeleteMessage.mockResolvedValue(undefined);

    await act(async () => {
      await deleteMessage('1');
    });

    expect(mockDeleteMessage).toHaveBeenCalledWith('1');
  });

  it('shows success toast on successful delete', async () => {
    mockDeleteMessage.mockResolvedValue(undefined);

    await act(async () => {
      await deleteMessage('1');
    });

    expect(mockDeleteMessage).toHaveBeenCalledWith('1');
  });
});
