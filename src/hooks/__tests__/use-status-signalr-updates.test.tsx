import { renderHook, waitFor } from '@testing-library/react-native';

import { getUnitStatus } from '@/api/units/unitStatuses';
import { useCoreStore } from '@/stores/app/core-store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

import { useStatusSignalRUpdates } from '../use-status-signalr-updates';

// Mock the dependencies
jest.mock('@/api/units/unitStatuses');
jest.mock('@/stores/app/core-store');
jest.mock('@/stores/signalr/signalr-store');

const mockGetUnitStatus = getUnitStatus as jest.MockedFunction<typeof getUnitStatus>;
const mockUseCoreStore = useCoreStore as jest.MockedFunction<typeof useCoreStore>;
const mockUseSignalRStore = useSignalRStore as jest.MockedFunction<typeof useSignalRStore>;

describe('useStatusSignalRUpdates', () => {
  const mockSetActiveUnitWithFetch = jest.fn();
  const mockCoreState = {
    activeUnitId: '123',
    setActiveUnitWithFetch: mockSetActiveUnitWithFetch,
  } as any;
  const mockSignalRState = {
    lastUpdateTimestamp: 0,
    lastUpdateMessage: null,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset state to default values
    mockCoreState.activeUnitId = '123';
    mockCoreState.setActiveUnitWithFetch = mockSetActiveUnitWithFetch;
    mockSignalRState.lastUpdateTimestamp = 0;
    mockSignalRState.lastUpdateMessage = null;

    // Mock core store with selector support
    mockUseCoreStore.mockImplementation((selector) => {
      if (selector) {
        return selector(mockCoreState);
      }
      return mockCoreState;
    });

    // Mock SignalR store with selector support
    mockUseSignalRStore.mockImplementation((selector) => {
      if (selector) {
        return selector(mockSignalRState);
      }
      return mockSignalRState;
    });
  });

  it('should not process updates when no active unit', () => {
    mockCoreState.activeUnitId = null;
    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = JSON.stringify({ UnitId: '123', State: 'Available' });

    renderHook(useStatusSignalRUpdates);

    expect(mockSetActiveUnitWithFetch).not.toHaveBeenCalled();
  });

  it('should not process updates when timestamp is 0', () => {
    mockSignalRState.lastUpdateTimestamp = 0;
    mockSignalRState.lastUpdateMessage = JSON.stringify({ UnitId: '123', State: 'Available' });

    renderHook(useStatusSignalRUpdates);

    expect(mockSetActiveUnitWithFetch).not.toHaveBeenCalled();
  });

  it('should not process updates when message is null', () => {
    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = null;

    renderHook(useStatusSignalRUpdates);

    expect(mockSetActiveUnitWithFetch).not.toHaveBeenCalled();
  });

  it('should process unit status update for active unit', async () => {
    const mockMessage = JSON.stringify({ UnitId: '123', State: 'Available' });

    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = mockMessage;

    renderHook(useStatusSignalRUpdates);

    await waitFor(() => {
      expect(mockSetActiveUnitWithFetch).toHaveBeenCalledWith('123');
    });
  });

  it('should not process updates for different unit', async () => {
    const mockMessage = JSON.stringify({ UnitId: '456', State: 'Available' });

    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = mockMessage;

    renderHook(useStatusSignalRUpdates);

    expect(mockSetActiveUnitWithFetch).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON message gracefully', async () => {
    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = 'invalid json';

    renderHook(useStatusSignalRUpdates);

    expect(mockSetActiveUnitWithFetch).not.toHaveBeenCalled();
  });

  it('should not process the same timestamp twice', async () => {
    const mockMessage = JSON.stringify({ UnitId: '123', State: 'Available' });

    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = mockMessage;

    const { rerender } = renderHook(useStatusSignalRUpdates);

    await waitFor(() => {
      expect(mockSetActiveUnitWithFetch).toHaveBeenCalledWith('123');
    });

    mockSetActiveUnitWithFetch.mockClear();

    // Rerender with same timestamp
    rerender({});

    expect(mockSetActiveUnitWithFetch).not.toHaveBeenCalled();
  });

  it('should process new timestamp after initial one', async () => {
    const mockMessage = JSON.stringify({ UnitId: '123', State: 'Available' });

    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = mockMessage;

    const { rerender } = renderHook(useStatusSignalRUpdates);

    await waitFor(() => {
      expect(mockSetActiveUnitWithFetch).toHaveBeenCalledWith('123');
    });

    mockSetActiveUnitWithFetch.mockClear();

    // Update with new timestamp
    mockSignalRState.lastUpdateTimestamp = 12346;
    mockSignalRState.lastUpdateMessage = JSON.stringify({ UnitId: '123', State: 'Busy' });

    rerender({});

    await waitFor(() => {
      expect(mockSetActiveUnitWithFetch).toHaveBeenCalledWith('123');
    });
  });

  it('should handle API errors gracefully', async () => {
    const mockMessage = JSON.stringify({ UnitId: '123', State: 'Available' });

    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = mockMessage;

    mockSetActiveUnitWithFetch.mockRejectedValue(new Error('API Error'));

    renderHook(useStatusSignalRUpdates);

    await waitFor(() => {
      expect(mockSetActiveUnitWithFetch).toHaveBeenCalledWith('123');
    });

    // Should not crash the hook
    expect(mockSetActiveUnitWithFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle activeUnitId changes', async () => {
    const mockMessage = JSON.stringify({ UnitId: '123', State: 'Available' });

    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = mockMessage;

    const { rerender } = renderHook(useStatusSignalRUpdates);

    await waitFor(() => {
      expect(mockSetActiveUnitWithFetch).toHaveBeenCalledWith('123');
    });

    mockSetActiveUnitWithFetch.mockClear();

    // Change active unit
    mockCoreState.activeUnitId = '456';

    // Same timestamp but different unit in message
    mockSignalRState.lastUpdateTimestamp = 12346;
    mockSignalRState.lastUpdateMessage = JSON.stringify({ UnitId: '456', State: 'Available' });

    rerender({});

    await waitFor(() => {
      expect(mockSetActiveUnitWithFetch).toHaveBeenCalledWith('456');
    });
  });

  it('should handle message with no UnitId', async () => {
    const mockMessage = JSON.stringify({ State: 'Available' });

    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = mockMessage;

    renderHook(useStatusSignalRUpdates);

    expect(mockSetActiveUnitWithFetch).not.toHaveBeenCalled();
  });

  it('should handle empty message object', async () => {
    const mockMessage = JSON.stringify({});

    mockSignalRState.lastUpdateTimestamp = 12345;
    mockSignalRState.lastUpdateMessage = mockMessage;

    renderHook(useStatusSignalRUpdates);

    expect(mockSetActiveUnitWithFetch).not.toHaveBeenCalled();
  });
}); 