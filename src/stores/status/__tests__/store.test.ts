// Mock Platform first before any imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((specifics) => specifics.ios || specifics.default),
    Version: 17,
  },
}));

// Mock MMKV storage
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
  })),
  useMMKVBoolean: jest.fn(() => [false, jest.fn()]),
}));

import { act, renderHook } from '@testing-library/react-native';

import { getCalls } from '@/api/calls/calls';
import { getAllGroups } from '@/api/groups/groups';
import { saveUnitStatus } from '@/api/units/unitStatuses';
import { ActiveCallsResult } from '@/models/v4/calls/activeCallsResult';
import { CustomStatusResultData } from '@/models/v4/customStatuses/customStatusResultData';
import { GroupsResult } from '@/models/v4/groups/groupsResult';
import { UnitTypeStatusesResult } from '@/models/v4/statuses/unitTypeStatusesResult';
import { SaveUnitStatusInput, SaveUnitStatusRoleInput } from '@/models/v4/unitStatus/saveUnitStatusInput';
import { offlineEventManager } from '@/services/offline-event-manager.service';
import { useCoreStore } from '@/stores/app/core-store';

import { useStatusBottomSheetStore, useStatusesStore } from '../store';

// Mock the API calls
jest.mock('@/api/calls/calls');
jest.mock('@/api/groups/groups');
jest.mock('@/api/units/unitStatuses');
jest.mock('@/stores/app/core-store');
jest.mock('@/stores/app/location-store', () => ({
  useLocationStore: {
    getState: jest.fn(() => ({
      latitude: null,
      longitude: null,
      accuracy: null,
      altitude: null,
      speed: null,
      heading: null,
    })),
  },
}));
jest.mock('@/stores/roles/store', () => ({
  useRolesStore: {
    getState: jest.fn(() => ({
      roles: [],
    })),
  },
}));
jest.mock('@/services/offline-event-manager.service', () => ({
  offlineEventManager: {
    queueUnitStatusEvent: jest.fn(),
  },
}));
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockGetCalls = getCalls as jest.MockedFunction<typeof getCalls>;
const mockGetAllGroups = getAllGroups as jest.MockedFunction<typeof getAllGroups>;
const mockSaveUnitStatus = saveUnitStatus as jest.MockedFunction<typeof saveUnitStatus>;
const mockUseCoreStore = useCoreStore as jest.MockedFunction<typeof useCoreStore>;
const mockOfflineEventManager = offlineEventManager as jest.Mocked<typeof offlineEventManager>;

describe('StatusBottomSheetStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useStatusBottomSheetStore());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentStep).toBe('select-destination');
    expect(result.current.selectedCall).toBe(null);
    expect(result.current.selectedStation).toBe(null);
    expect(result.current.selectedDestinationType).toBe('none');
    expect(result.current.selectedStatus).toBe(null);
    expect(result.current.note).toBe('');
    expect(result.current.availableCalls).toEqual([]);
    expect(result.current.availableStations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('updates isOpen and selectedStatus when setIsOpen is called', () => {
    const { result } = renderHook(() => useStatusBottomSheetStore());

    const testStatus = new CustomStatusResultData();
    testStatus.Id = '1';
    testStatus.Text = 'Responding';
    testStatus.Note = 1;
    testStatus.Detail = 3;

    act(() => {
      result.current.setIsOpen(true, testStatus);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedStatus).toEqual(testStatus);
  });

  it('fetches destination data successfully', async () => {
    const mockCallsResponse = new ActiveCallsResult();
    mockCallsResponse.Data = [
      {
        CallId: '1',
        Number: 'CALL001',
        Name: 'Test Call',
        Address: '123 Test St',
      } as any,
    ];

    const mockGroupsResponse = new GroupsResult();
    mockGroupsResponse.Data = [
      {
        GroupId: '1',
        Name: 'Station 1',
        Address: '456 Station Ave',
      } as any,
    ];

    mockGetCalls.mockResolvedValueOnce(mockCallsResponse);
    mockGetAllGroups.mockResolvedValueOnce(mockGroupsResponse);

    const { result } = renderHook(() => useStatusBottomSheetStore());

    await act(async () => {
      await result.current.fetchDestinationData('unit1');
    });

    expect(mockGetCalls).toHaveBeenCalledWith();
    expect(mockGetAllGroups).toHaveBeenCalledWith();
    expect(result.current.availableCalls).toEqual(mockCallsResponse.Data);
    expect(result.current.availableStations).toEqual(mockGroupsResponse.Data);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('resets all state when reset is called', () => {
    const { result } = renderHook(() => useStatusBottomSheetStore());

    const testStatus = new CustomStatusResultData();
    testStatus.Id = '1';
    testStatus.Text = 'Test';
    testStatus.Note = 1;
    testStatus.Detail = 3;

    // Set some state
    act(() => {
      result.current.setIsOpen(true, testStatus);
      result.current.setCurrentStep('add-note');
      result.current.setNote('Test note');
      result.current.setSelectedDestinationType('call');
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentStep).toBe('select-destination');
    expect(result.current.selectedCall).toBe(null);
    expect(result.current.selectedStation).toBe(null);
    expect(result.current.selectedDestinationType).toBe('none');
    expect(result.current.selectedStatus).toBe(null);
    expect(result.current.note).toBe('');
  });
});

describe('StatusesStore', () => {
  const mockActiveUnit = {
    UnitId: 'unit1',
  };

  const mockSetActiveUnitWithFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the zustand store pattern
    const mockStore = {
      activeUnit: mockActiveUnit,
      setActiveUnitWithFetch: mockSetActiveUnitWithFetch,
    };
    
    mockUseCoreStore.mockImplementation(() => mockStore);
    
    // Mock the getState() method as well
    (mockUseCoreStore as any).getState = jest.fn(() => mockStore);
  });

  it('saves unit status successfully', async () => {
    const mockResult = new UnitTypeStatusesResult();
    mockSaveUnitStatus.mockResolvedValueOnce(mockResult);
    mockSetActiveUnitWithFetch.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useStatusesStore());

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';
    input.Note = 'Test note';

    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    expect(mockSaveUnitStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        Id: 'unit1',
        Type: '1',
        Note: 'Test note',
        Timestamp: expect.any(String),
        TimestampUtc: expect.any(String),
      })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should queue unit status event when direct save fails', async () => {
    const { result } = renderHook(() => useStatusesStore());

    mockSaveUnitStatus.mockRejectedValue(new Error('Network error'));
    mockOfflineEventManager.queueUnitStatusEvent.mockResolvedValue(undefined);
    mockUseCoreStore.mockReturnValue({
      activeUnit: { UnitId: 'unit1' },
      setActiveUnitWithFetch: jest.fn(),
    } as any);

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';
    input.Note = 'Test note';
    input.RespondingTo = 'call1';

    const role = new SaveUnitStatusRoleInput();
    role.RoleId = 'role1';
    role.UserId = 'user1';
    input.Roles = [role];

    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    expect(mockOfflineEventManager.queueUnitStatusEvent).toHaveBeenCalledWith(
      'unit1',
      '1',
      'Test note',
      'call1',
      [{ roleId: 'role1', userId: 'user1' }],
      undefined
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle successful save and refresh active unit', async () => {
    const { result } = renderHook(() => useStatusesStore());

    const mockSetActiveUnitWithFetch = jest.fn();
    const mockCoreStore = {
      activeUnit: { UnitId: 'unit1' },
      setActiveUnitWithFetch: mockSetActiveUnitWithFetch,
    };
    
    mockSaveUnitStatus.mockResolvedValue({} as UnitTypeStatusesResult);
    mockUseCoreStore.mockReturnValue(mockCoreStore as any);
    
    // Mock the getState method to return our mock store
    (mockUseCoreStore as any).getState = jest.fn().mockReturnValue(mockCoreStore);

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';

    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    expect(mockSaveUnitStatus).toHaveBeenCalled();
    expect(mockSetActiveUnitWithFetch).toHaveBeenCalledWith('unit1');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle input without roles when queueing', async () => {
    const { result } = renderHook(() => useStatusesStore());

    mockSaveUnitStatus.mockRejectedValue(new Error('Network error'));
    mockOfflineEventManager.queueUnitStatusEvent.mockResolvedValue(undefined);
    mockUseCoreStore.mockReturnValue({
      activeUnit: { UnitId: 'unit1' },
      setActiveUnitWithFetch: jest.fn(),
    } as any);

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';
    // Don't set Roles, Note, or RespondingTo to test their default values

    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    expect(mockOfflineEventManager.queueUnitStatusEvent).toHaveBeenCalledWith(
      'unit1',
      '1',
      '', // Note defaults to empty string
      '', // RespondingTo defaults to empty string  
      [], // Roles defaults to empty array which maps to empty array
      undefined
    );
  });

  it('should handle critical errors during processing', async () => {
    const { result } = renderHook(() => useStatusesStore());

    mockSaveUnitStatus.mockRejectedValue(new Error('Network error'));
    mockOfflineEventManager.queueUnitStatusEvent.mockImplementation(() => {
      throw new Error('Critical error');
    });
    mockUseCoreStore.mockReturnValue({
      activeUnit: { UnitId: 'unit1' },
      setActiveUnitWithFetch: jest.fn(),
    } as any);

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';

    await act(async () => {
      try {
        await result.current.saveUnitStatus(input);
      } catch (error) {
        // Expected to throw now since we re-throw critical errors
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to save unit status');
  });
});
