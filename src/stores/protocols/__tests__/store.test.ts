import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { CallProtocolsResultData } from '@/models/v4/callProtocols/callProtocolsResultData';
import { CallProtocolsResult } from '@/models/v4/callProtocols/callProtocolsResult';

import { useProtocolsStore } from '../store';

// Mock the API
jest.mock('@/api/protocols/protocols', () => ({
  getAllProtocols: jest.fn(),
}));

// Mock protocols test data
const mockProtocols: CallProtocolsResultData[] = [
  {
    Id: '1',
    DepartmentId: 'dept1',
    Name: 'Fire Emergency Response',
    Code: 'FIRE001',
    Description: 'Standard fire emergency response protocol',
    ProtocolText: '<p>Fire emergency response protocol content</p>',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '2023-01-02T00:00:00Z',
    UpdatedByUserId: 'user1',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  },
  {
    Id: '2',
    DepartmentId: 'dept1',
    Name: 'Medical Emergency',
    Code: 'MED001',
    Description: 'Medical emergency response protocol',
    ProtocolText: '<p>Medical emergency response protocol content</p>',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '2023-01-02T00:00:00Z',
    UpdatedByUserId: 'user1',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  },
];

const mockApiResponse: CallProtocolsResult = {
  Data: mockProtocols,
  PageSize: 0,
  Timestamp: '2023-01-01T00:00:00Z',
  Version: '1.0',
  Node: 'test-node',
  RequestId: 'test-request-id',
  Status: 'success',
  Environment: 'test',
};

describe('useProtocolsStore', () => {
  const { getAllProtocols } = require('@/api/protocols/protocols');

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store state
    useProtocolsStore.setState({
      protocols: [],
      searchQuery: '',
      selectedProtocolId: null,
      isDetailsOpen: false,
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProtocolsStore());

      expect(result.current.protocols).toEqual([]);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedProtocolId).toBe(null);
      expect(result.current.isDetailsOpen).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('fetchProtocols', () => {
    it('should fetch protocols successfully', async () => {
      getAllProtocols.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useProtocolsStore());

      await act(async () => {
        await result.current.fetchProtocols();
      });

      expect(getAllProtocols).toHaveBeenCalledTimes(1);
      expect(result.current.protocols).toEqual(mockProtocols);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should set loading state during fetch', async () => {
      getAllProtocols.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockApiResponse), 100)));

      const { result } = renderHook(() => useProtocolsStore());

      act(() => {
        result.current.fetchProtocols();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error';
      getAllProtocols.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProtocolsStore());

      await act(async () => {
        await result.current.fetchProtocols();
      });

      expect(result.current.protocols).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle fetch error with unknown error type', async () => {
      getAllProtocols.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useProtocolsStore());

      await act(async () => {
        await result.current.fetchProtocols();
      });

      expect(result.current.protocols).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('An unknown error occurred');
    });

    it('should clear previous error on successful fetch', async () => {
      // First, set an error
      getAllProtocols.mockRejectedValue(new Error('Initial error'));

      const { result } = renderHook(() => useProtocolsStore());

      await act(async () => {
        await result.current.fetchProtocols();
      });

      expect(result.current.error).toBe('Initial error');

      // Then, make a successful fetch
      getAllProtocols.mockResolvedValue(mockApiResponse);

      await act(async () => {
        await result.current.fetchProtocols();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.protocols).toEqual(mockProtocols);
    });
  });

  describe('setSearchQuery', () => {
    it('should set search query', () => {
      const { result } = renderHook(() => useProtocolsStore());

      act(() => {
        result.current.setSearchQuery('fire');
      });

      expect(result.current.searchQuery).toBe('fire');
    });

    it('should update search query multiple times', () => {
      const { result } = renderHook(() => useProtocolsStore());

      act(() => {
        result.current.setSearchQuery('fire');
      });

      expect(result.current.searchQuery).toBe('fire');

      act(() => {
        result.current.setSearchQuery('medical');
      });

      expect(result.current.searchQuery).toBe('medical');
    });

    it('should handle empty search query', () => {
      const { result } = renderHook(() => useProtocolsStore());

      act(() => {
        result.current.setSearchQuery('fire');
      });

      expect(result.current.searchQuery).toBe('fire');

      act(() => {
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('selectProtocol', () => {
    it('should select protocol and open details', () => {
      const { result } = renderHook(() => useProtocolsStore());

      act(() => {
        result.current.selectProtocol('1');
      });

      expect(result.current.selectedProtocolId).toBe('1');
      expect(result.current.isDetailsOpen).toBe(true);
    });

    it('should select different protocols', () => {
      const { result } = renderHook(() => useProtocolsStore());

      act(() => {
        result.current.selectProtocol('1');
      });

      expect(result.current.selectedProtocolId).toBe('1');

      act(() => {
        result.current.selectProtocol('2');
      });

      expect(result.current.selectedProtocolId).toBe('2');
      expect(result.current.isDetailsOpen).toBe(true);
    });

    it('should handle empty protocol ID', () => {
      const { result } = renderHook(() => useProtocolsStore());

      act(() => {
        result.current.selectProtocol('');
      });

      expect(result.current.selectedProtocolId).toBe('');
      expect(result.current.isDetailsOpen).toBe(true);
    });
  });

  describe('closeDetails', () => {
    it('should close details sheet', () => {
      const { result } = renderHook(() => useProtocolsStore());

      // First, open details
      act(() => {
        result.current.selectProtocol('1');
      });

      expect(result.current.isDetailsOpen).toBe(true);

      // Then close details
      act(() => {
        result.current.closeDetails();
      });

      expect(result.current.isDetailsOpen).toBe(false);
    });

    it('should close details when already closed', () => {
      const { result } = renderHook(() => useProtocolsStore());

      expect(result.current.isDetailsOpen).toBe(false);

      act(() => {
        result.current.closeDetails();
      });

      expect(result.current.isDetailsOpen).toBe(false);
    });
  });

  describe('Store State Persistence', () => {
    it('should maintain state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useProtocolsStore());
      const { result: result2 } = renderHook(() => useProtocolsStore());

      act(() => {
        result1.current.setSearchQuery('fire');
      });

      expect(result2.current.searchQuery).toBe('fire');

      act(() => {
        result2.current.selectProtocol('1');
      });

      expect(result1.current.selectedProtocolId).toBe('1');
      expect(result1.current.isDetailsOpen).toBe(true);
    });
  });

  describe('Complex State Interactions', () => {
    it('should handle multiple state changes in sequence', async () => {
      getAllProtocols.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useProtocolsStore());

      // Fetch protocols
      await act(async () => {
        await result.current.fetchProtocols();
      });

      expect(result.current.protocols).toEqual(mockProtocols);

      // Set search query
      act(() => {
        result.current.setSearchQuery('fire');
      });

      expect(result.current.searchQuery).toBe('fire');

      // Select protocol
      act(() => {
        result.current.selectProtocol('1');
      });

      expect(result.current.selectedProtocolId).toBe('1');
      expect(result.current.isDetailsOpen).toBe(true);

      // Close details
      act(() => {
        result.current.closeDetails();
      });

      expect(result.current.isDetailsOpen).toBe(false);
      expect(result.current.selectedProtocolId).toBe('1'); // Should remain selected
    });

    it('should handle concurrent fetchProtocols calls', async () => {
      getAllProtocols.mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useProtocolsStore());

      // Start two fetch operations concurrently within a single act
      await act(async () => {
        const promise1 = result.current.fetchProtocols();
        const promise2 = result.current.fetchProtocols();
        await Promise.all([promise1, promise2]);
      });

      expect(getAllProtocols).toHaveBeenCalledTimes(2);
      expect(result.current.protocols).toEqual(mockProtocols);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty protocols response', async () => {
      const emptyResponse: CallProtocolsResult = {
        ...mockApiResponse,
        Data: [],
      };

      getAllProtocols.mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => useProtocolsStore());

      await act(async () => {
        await result.current.fetchProtocols();
      });

      expect(result.current.protocols).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should handle null protocol ID selection', () => {
      const { result } = renderHook(() => useProtocolsStore());

      act(() => {
        result.current.selectProtocol(null as any);
      });

      expect(result.current.selectedProtocolId).toBe(null);
      expect(result.current.isDetailsOpen).toBe(true);
    });
  });
});
