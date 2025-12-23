// Mock date-fns
jest.mock('date-fns', () => ({
	addDays: jest.fn(),
	endOfDay: jest.fn(),
	format: jest.fn(),
	startOfDay: jest.fn(),
	subDays: jest.fn(),
}));

// Mock the API module
jest.mock('@/api/calendar/calendar', () => ({
	getCalendarItems: jest.fn(),
	getCalendarItem: jest.fn(),
	getCalendarItemTypes: jest.fn(),
	getCalendarItemsForDateRange: jest.fn(),
	setCalendarAttending: jest.fn(),
}));

// Mock the utils module
jest.mock('@/lib/utils', () => ({
	isSameDate: jest.fn(),
}));

// Mock the logger
jest.mock('@/lib/logging', () => ({
	logger: {
		info: jest.fn(),
		error: jest.fn(),
	},
}));

// Mock storage
jest.mock('@/lib/storage', () => ({
	storage: {
		getItem: jest.fn(),
		setItem: jest.fn(),
		removeItem: jest.fn(),
	},
}));

import { renderHook, act } from '@testing-library/react-native';

import { useCalendarStore } from '../store';
import * as calendarApi from '@/api/calendar/calendar';
import { CalendarItemResultData } from '@/models/v4/calendar/calendarItemResultData';

const mockedApi = calendarApi as jest.Mocked<typeof calendarApi>;

// Import date-fns functions to mock them
import * as dateFns from 'date-fns';
const mockedDateFns = dateFns as jest.Mocked<typeof dateFns>;

// Import utils functions to mock them
import * as utils from '@/lib/utils';
const mockedUtils = utils as jest.Mocked<typeof utils>;

const mockCalendarItem = {
	CalendarItemId: '123',
	Title: 'Test Event',
	Start: '2024-01-15T10:00:00Z', // Same day as mocked date
	StartUtc: '2024-01-15T10:00:00Z', // Keep for completeness but not used in filtering
	End: '2024-01-15T12:00:00Z',
	EndUtc: '2024-01-15T12:00:00Z', // Keep for completeness but not used in filtering
	StartTimezone: 'UTC',
	EndTimezone: 'UTC',
	Description: 'Test description',
	RecurrenceId: '',
	RecurrenceRule: '',
	RecurrenceException: '',
	ItemType: 1,
	IsAllDay: false,
	Location: 'Test Location',
	SignupType: 1,
	Reminder: 0,
	LockEditing: false,
	Entities: '',
	RequiredAttendes: '',
	OptionalAttendes: '',
	IsAdminOrCreator: false,
	CreatorUserId: 'user123',
	Attending: false,
	TypeName: 'Meeting',
	TypeColor: '#3B82F6',
	Attendees: [],
};

const createMockBaseResponse = () => ({
	PageSize: 0,
	Timestamp: '2024-01-15T10:00:00Z',
	Version: '1.0',
	Node: 'test-node',
	RequestId: 'test-request',
	Status: 'success',
	Environment: 'test',
});

describe('Calendar Store', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		
		// Mock date-fns functions with consistent dates
		mockedDateFns.startOfDay.mockReturnValue(new Date('2024-01-15T00:00:00Z'));
		mockedDateFns.endOfDay.mockImplementation((date: string | number | Date) => {
			if (date instanceof Date && date.getTime() === new Date('2024-01-22T10:00:00Z').getTime()) {
				return new Date('2024-01-22T23:59:59Z');
			}
			return new Date('2024-01-15T23:59:59Z');
		});
		mockedDateFns.addDays.mockReturnValue(new Date('2024-01-22T10:00:00Z'));
		mockedDateFns.format.mockImplementation((date: string | number | Date, formatStr: string) => {
			if (formatStr === 'yyyy-MM-dd HH:mm:ss') {
				if (date instanceof Date) {
					if (date.getTime() === new Date('2024-01-15T00:00:00Z').getTime()) {
						return '2024-01-15 00:00:00';
					}
					if (date.getTime() === new Date('2024-01-15T23:59:59Z').getTime()) {
						return '2024-01-15 23:59:59';
					}
					if (date.getTime() === new Date('2024-01-22T23:59:59Z').getTime()) {
						return '2024-01-22 23:59:59';
					}
				}
			}
			return date instanceof Date ? date.toISOString() : String(date);
		});
		
		// Mock utils functions
		mockedUtils.isSameDate.mockImplementation((date1: string | Date, date2: string | Date) => {
			const d1 = new Date(date1);
			const d2 = new Date(date2);
			return d1.getFullYear() === d2.getFullYear() && 
				   d1.getMonth() === d2.getMonth() && 
				   d1.getDate() === d2.getDate();
		});
		
		// Reset store state
		useCalendarStore.setState({
			calendarItems: [],
			todayCalendarItems: [],
			upcomingCalendarItems: [],
			viewCalendarItem: null,
			itemTypes: [],
			selectedDate: null,
			selectedMonthItems: [],
			isLoading: false,
			isTodaysLoading: false,
			isUpcomingLoading: false,
			isItemLoading: false,
			isAttendanceLoading: false,
			isTypesLoading: false,
			error: null,
			attendanceError: null,
			updateCalendarItems: false,
		});
	});

	describe('loadTodaysCalendarItems', () => {
		beforeEach(() => {
			// Mock the current date to be consistent
			jest.useFakeTimers();
			jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('should fetch and filter today\'s items correctly', async () => {
			// Create test items: one for today, one for tomorrow, one for yesterday
			const todayItem = {
				...mockCalendarItem,
				CalendarItemId: 'today-item',
				Title: 'Today Event',
				Start: '2024-01-15T14:00:00Z', // Later today
				StartUtc: '2024-01-15T14:00:00Z', // Keep for completeness
				End: '2024-01-15T16:00:00Z',
				EndUtc: '2024-01-15T16:00:00Z',
			};
			
			const tomorrowItem = {
				...mockCalendarItem,
				CalendarItemId: 'tomorrow-item',
				Title: 'Tomorrow Event',
				Start: '2024-01-16T10:00:00Z', // Tomorrow
				StartUtc: '2024-01-16T10:00:00Z', // Keep for completeness
				End: '2024-01-16T12:00:00Z',
				EndUtc: '2024-01-16T12:00:00Z',
			};
			
			const yesterdayItem = {
				...mockCalendarItem,
				CalendarItemId: 'yesterday-item',
				Title: 'Yesterday Event',
				Start: '2024-01-14T10:00:00Z', // Yesterday
				StartUtc: '2024-01-14T10:00:00Z', // Keep for completeness
				End: '2024-01-14T12:00:00Z',
				EndUtc: '2024-01-14T12:00:00Z',
			};

			const mockResponse = {
				Data: [todayItem, tomorrowItem, yesterdayItem],
				...createMockBaseResponse(),
			};
			mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

			// Mock isSameDate to return true only for the today item
			mockedUtils.isSameDate.mockImplementation((date1: string | Date, date2: string | Date) => {
				const d1 = new Date(date1);
				const d2 = new Date(date2);
				// Only return true for items on 2024-01-15
				if (d1.getFullYear() === 2024 && d1.getMonth() === 0 && d1.getDate() === 15 &&
					d2.getFullYear() === 2024 && d2.getMonth() === 0 && d2.getDate() === 15) {
					return true;
				}
				return false;
			});

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.loadTodaysCalendarItems();
			});

			// The method calls getCalendarItemsForDateRange with today's ISO string
			expect(mockedApi.getCalendarItemsForDateRange).toHaveBeenCalledWith(
				'2024-01-15T10:00:00.000Z',
				'2024-01-15T10:00:00.000Z'
			);
			
			// Should only contain today's item after filtering
			expect(result.current.todayCalendarItems).toHaveLength(1);
			expect(result.current.todayCalendarItems[0]?.CalendarItemId).toBe('today-item');
			expect(result.current.isTodaysLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it('should handle empty response correctly', async () => {
			const mockResponse = {
				Data: [],
				...createMockBaseResponse(),
			};
			mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.loadTodaysCalendarItems();
			});

			expect(result.current.todayCalendarItems).toEqual([]);
			expect(result.current.isTodaysLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it('should handle timezone differences correctly', async () => {
			// Test with different timezone formats
			const todayItemUTC = {
				...mockCalendarItem,
				CalendarItemId: 'today-utc',
				Title: 'Today UTC Event',
				Start: '2024-01-15T23:30:00Z', // Late today UTC (local time)
				StartUtc: '2024-01-15T23:30:00Z', // Keep for completeness
				End: '2024-01-15T23:59:00Z',
				EndUtc: '2024-01-15T23:59:00Z',
			};
			
			const todayItemLocal = {
				...mockCalendarItem,
				CalendarItemId: 'today-local',
				Title: 'Today Local Event',
				Start: '2024-01-15T01:30:00-08:00', // Early today PST (local time)
				StartUtc: '2024-01-15T09:30:00Z', // Keep for completeness
				End: '2024-01-15T02:30:00-08:00',
				EndUtc: '2024-01-15T10:30:00Z',
			};

			const mockResponse = {
				Data: [todayItemUTC, todayItemLocal],
				...createMockBaseResponse(),
			};
			mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.loadTodaysCalendarItems();
			});

			// Both items should be included as they're on the same date when using UTC values
			expect(result.current.todayCalendarItems).toHaveLength(2);
		});

		it("should handle fetch today's items error", async () => {
			mockedApi.getCalendarItemsForDateRange.mockRejectedValue(new Error('API Error'));

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.loadTodaysCalendarItems();
			});

			expect(result.current.todayCalendarItems).toEqual([]);
			expect(result.current.isTodaysLoading).toBe(false);
			expect(result.current.error).toBe("Failed to load today's items");
		});
	});

	describe('loadUpcomingCalendarItems', () => {
		it('should fetch upcoming items successfully', async () => {
			const mockResponse = {
				Data: [mockCalendarItem],
				...createMockBaseResponse(),
			};
			mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.loadUpcomingCalendarItems();
			});

			expect(mockedApi.getCalendarItemsForDateRange).toHaveBeenCalledWith(
				'2024-01-15 00:00:00',
				'2024-01-22 23:59:59'
			);
			expect(result.current.upcomingCalendarItems).toEqual([mockCalendarItem]);
			expect(result.current.isUpcomingLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it('should handle fetch upcoming items error', async () => {
			mockedApi.getCalendarItemsForDateRange.mockRejectedValue(new Error('API Error'));

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.loadUpcomingCalendarItems();
			});

			expect(result.current.upcomingCalendarItems).toEqual([]);
			expect(result.current.isUpcomingLoading).toBe(false);
			expect(result.current.error).toBe('Failed to load upcoming items');
		});
	});

	describe('fetchCalendarItem', () => {
		it('should fetch calendar item successfully', async () => {
			const mockResponse = {
				Data: mockCalendarItem,
				...createMockBaseResponse(),
			};
			mockedApi.getCalendarItem.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.fetchCalendarItem('123');
			});

			expect(result.current.viewCalendarItem).toEqual(mockCalendarItem);
			expect(result.current.isItemLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it('should handle fetch calendar item error', async () => {
			mockedApi.getCalendarItem.mockRejectedValue(new Error('API Error'));

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.fetchCalendarItem('123');
			});

			expect(result.current.viewCalendarItem).toBeNull();
			expect(result.current.isItemLoading).toBe(false);
			expect(result.current.error).toBe('Failed to fetch calendar item');
		});
	});

	describe('setCalendarItemAttendingStatus', () => {
		it('should update attendance successfully', async () => {
			mockedApi.setCalendarAttending.mockResolvedValue({
				Id: '123',
				...createMockBaseResponse(),
			});

			// Set initial state with the item
			useCalendarStore.setState({
				todayCalendarItems: [mockCalendarItem],
				upcomingCalendarItems: [mockCalendarItem],
				selectedMonthItems: [mockCalendarItem],
				viewCalendarItem: mockCalendarItem,
			});

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.setCalendarItemAttendingStatus('123', 'Test note', 1);
			});

			expect(result.current.isAttendanceLoading).toBe(false);
			expect(result.current.attendanceError).toBeNull();

			// Check that attendance was updated in all arrays
			expect(result.current.todayCalendarItems[0]?.Attending).toBe(true);
			expect(result.current.upcomingCalendarItems[0]?.Attending).toBe(true);
			expect(result.current.selectedMonthItems[0]?.Attending).toBe(true);
			expect(result.current.viewCalendarItem?.Attending).toBe(true);
		});

		it('should handle attendance update error', async () => {
			mockedApi.setCalendarAttending.mockRejectedValue(new Error('API Error'));

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.setCalendarItemAttendingStatus('123', 'Test note', 1);
			});

			expect(result.current.isAttendanceLoading).toBe(false);
			expect(result.current.attendanceError).toBe('Failed to update attendance status');
		});
	});

	describe('loadCalendarItemsForDateRange', () => {
		it('should fetch items for date range successfully', async () => {
			const mockResponse = {
				Data: [mockCalendarItem],
				...createMockBaseResponse(),
			};
			mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.loadCalendarItemsForDateRange('2024-01-01', '2024-01-31');
			});

			expect(result.current.selectedMonthItems).toEqual([mockCalendarItem]);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});
	});

	describe('setSelectedDate', () => {
		it('should set selected date', () => {
			const { result } = renderHook(() => useCalendarStore());

			act(() => {
				result.current.setSelectedDate('2024-01-15');
			});

			expect(result.current.selectedDate).toBe('2024-01-15');
		});

		it('should clear selected date', () => {
			useCalendarStore.setState({ selectedDate: '2024-01-15' });
			const { result } = renderHook(() => useCalendarStore());

			act(() => {
				result.current.setSelectedDate(null);
			});

			expect(result.current.selectedDate).toBeNull();
		});
	});

	describe('clearSelectedItem', () => {
		it('should clear selected item', () => {
			useCalendarStore.setState({ viewCalendarItem: mockCalendarItem });
			const { result } = renderHook(() => useCalendarStore());

			act(() => {
				result.current.clearSelectedItem();
			});

			expect(result.current.viewCalendarItem).toBeNull();
		});
	});

	describe('clearError', () => {
		it('should clear all errors', () => {
			useCalendarStore.setState({
				error: 'Test error',
				attendanceError: 'Attendance error',
			});
			const { result } = renderHook(() => useCalendarStore());

			act(() => {
				result.current.clearError();
			});

			expect(result.current.error).toBeNull();
			expect(result.current.attendanceError).toBeNull();
		});
	});

	describe('init', () => {
		beforeEach(() => {
			// Mock the current date to be consistent
			jest.useFakeTimers();
			jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('should initialize store with all data', async () => {
			const mockTypesResponse = {
				Data: [{ CalendarItemTypeId: '1', Name: 'Meeting', Color: '#3B82F6' }],
				...createMockBaseResponse(),
			};
			const mockTodaysResponse = {
				Data: [mockCalendarItem],
				...createMockBaseResponse(),
			};
			const mockUpcomingResponse = {
				Data: [mockCalendarItem],
				...createMockBaseResponse(),
			};

			mockedApi.getCalendarItemTypes.mockResolvedValue(mockTypesResponse);
			// Mock different responses for different date ranges
			mockedApi.getCalendarItemsForDateRange
				.mockResolvedValueOnce(mockTodaysResponse) // First call for today's items
				.mockResolvedValueOnce(mockUpcomingResponse); // Second call for upcoming items

			// Mock isSameDate to always return true for simplicity in this test
			mockedUtils.isSameDate.mockReturnValue(true);

			const { result } = renderHook(() => useCalendarStore());

			await act(async () => {
				await result.current.init();
			});

			expect(result.current.itemTypes).toEqual(mockTypesResponse.Data);
			expect(result.current.todayCalendarItems).toEqual([mockCalendarItem]);
			expect(result.current.upcomingCalendarItems).toEqual([mockCalendarItem]);
		});
	});

	// Tests for the refactored store functionality
	describe('Refactored Store Methods', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			// Mock the current date to be consistent
			jest.useFakeTimers();
			jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		describe('loadTodaysCalendarItems', () => {
			it('should call getCalendarItemsForDateRange with correct date range', async () => {
				// Arrange
				const mockResponse = {
					Data: [mockCalendarItem],
					PageSize: 100,
					Timestamp: new Date().toISOString(),
					Version: '1.0',
					Node: 'test',
					RequestId: 'test-123',
					Status: 'Success',
					Environment: 'test'
				};
				mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

				// Mock isSameDate to return true for all items (simplifying test logic)
				mockedUtils.isSameDate.mockReturnValue(true);

				const { result } = renderHook(() => useCalendarStore());

				// Act
				await act(async () => {
					await result.current.loadTodaysCalendarItems();
				});

				// Assert
				expect(mockedApi.getCalendarItemsForDateRange).toHaveBeenCalledWith(
					'2024-01-15T10:00:00.000Z',
					'2024-01-15T10:00:00.000Z'
				);
				expect(result.current.todayCalendarItems).toEqual([mockCalendarItem]);
			});
		});

		describe('loadUpcomingCalendarItems', () => {
			it('should call getCalendarItemsForDateRange with correct upcoming date range', async () => {
				// Arrange
				const mockResponse = {
					Data: [mockCalendarItem],
					PageSize: 100,
					Timestamp: new Date().toISOString(),
					Version: '1.0',
					Node: 'test',
					RequestId: 'test-123',
					Status: 'Success',
					Environment: 'test'
				};
				mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

				const { result } = renderHook(() => useCalendarStore());

				// Act
				await act(async () => {
					await result.current.loadUpcomingCalendarItems();
				});

				// Assert
				expect(mockedApi.getCalendarItemsForDateRange).toHaveBeenCalledWith(
					expect.any(String),
					expect.any(String)
				);
				expect(result.current.upcomingCalendarItems).toEqual([mockCalendarItem]);
			});
		});

		describe('setCalendarItemAttendingStatus', () => {
			it('should call setCalendarAttending with correct parameters', async () => {
				// Arrange
				const mockResponse = {
					Id: 'attendance-123',
					PageSize: 0,
					Timestamp: new Date().toISOString(),
					Version: '1.0',
					Node: 'test',
					RequestId: 'test-123',
					Status: 'Success',
					Environment: 'test'
				};
				mockedApi.setCalendarAttending.mockResolvedValue(mockResponse);

				const { result } = renderHook(() => useCalendarStore());

				// Act
				await act(async () => {
					await result.current.setCalendarItemAttendingStatus('123', 'Test note', 1);
				});

				// Assert
				expect(mockedApi.setCalendarAttending).toHaveBeenCalledWith({
					calendarItemId: '123',
					note: 'Test note',
					attending: true
				});
			});

			it('should handle empty note parameter', async () => {
				// Arrange
				const mockResponse = {
					Id: 'attendance-123',
					PageSize: 0,
					Timestamp: new Date().toISOString(),
					Version: '1.0',
					Node: 'test',
					RequestId: 'test-123',
					Status: 'Success',
					Environment: 'test'
				};
				mockedApi.setCalendarAttending.mockResolvedValue(mockResponse);

				const { result } = renderHook(() => useCalendarStore());

				// Act
				await act(async () => {
					await result.current.setCalendarItemAttendingStatus('123', '', 0);
				});

				// Assert
				expect(mockedApi.setCalendarAttending).toHaveBeenCalledWith({
					calendarItemId: '123',
					note: '',
					attending: false
				});
			});
		});

		describe('viewCalendarItemAction', () => {
			it('should set viewCalendarItem', () => {
				// Arrange
				const { result } = renderHook(() => useCalendarStore());

				// Act
				act(() => {
					result.current.viewCalendarItemAction(mockCalendarItem);
				});

				// Assert
				expect(result.current.viewCalendarItem).toEqual(mockCalendarItem);
			});
		});

		describe('clearError', () => {
			it('should clear error state', () => {
				// Arrange
				const { result } = renderHook(() => useCalendarStore());
				
				// Set error state first
				act(() => {
					useCalendarStore.setState({ error: 'Test error' });
				});

				// Act
				act(() => {
					result.current.clearError();
				});

				// Assert
				expect(result.current.error).toBeNull();
			});
		});

		// Tests for legacy aliases
		describe('Legacy Aliases', () => {
			it('fetchTodaysItems should call loadTodaysCalendarItems', async () => {
				// Arrange
				const mockResponse = {
					Data: [mockCalendarItem],
					PageSize: 100,
					Timestamp: new Date().toISOString(),
					Version: '1.0',
					Node: 'test',
					RequestId: 'test-123',
					Status: 'Success',
					Environment: 'test'
				};
				mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);
				mockedUtils.isSameDate.mockReturnValue(true);

				const { result } = renderHook(() => useCalendarStore());

				// Act
				await act(async () => {
					await result.current.fetchTodaysItems();
				});

				// Assert
				expect(mockedApi.getCalendarItemsForDateRange).toHaveBeenCalled();
				expect(result.current.todayCalendarItems).toEqual([mockCalendarItem]);
			});

			it('fetchUpcomingItems should call loadUpcomingCalendarItems', async () => {
				// Arrange
				const mockResponse = {
					Data: [mockCalendarItem],
					PageSize: 100,
					Timestamp: new Date().toISOString(),
					Version: '1.0',
					Node: 'test',
					RequestId: 'test-123',
					Status: 'Success',
					Environment: 'test'
				};
				mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

				const { result } = renderHook(() => useCalendarStore());

				// Act
				await act(async () => {
					await result.current.fetchUpcomingItems();
				});

				// Assert
				expect(mockedApi.getCalendarItemsForDateRange).toHaveBeenCalled();
				expect(result.current.upcomingCalendarItems).toEqual([mockCalendarItem]);
			});

			it('fetchItemsForDateRange should call loadCalendarItemsForDateRange', async () => {
				// Arrange
				const mockResponse = {
					Data: [mockCalendarItem],
					PageSize: 100,
					Timestamp: new Date().toISOString(),
					Version: '1.0',
					Node: 'test',
					RequestId: 'test-123',
					Status: 'Success',
					Environment: 'test'
				};
				mockedApi.getCalendarItemsForDateRange.mockResolvedValue(mockResponse);

				const { result } = renderHook(() => useCalendarStore());

				// Act
				await act(async () => {
					await result.current.fetchItemsForDateRange('2024-01-01', '2024-01-31');
				});

				// Assert
				expect(mockedApi.getCalendarItemsForDateRange).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
				expect(result.current.selectedMonthItems).toEqual([mockCalendarItem]);
			});

			it('setAttendance should call setCalendarItemAttendingStatus', async () => {
				// Arrange
				const mockResponse = {
					Id: 'attendance-123',
					PageSize: 0,
					Timestamp: new Date().toISOString(),
					Version: '1.0',
					Node: 'test',
					RequestId: 'test-123',
					Status: 'Success',
					Environment: 'test'
				};
				mockedApi.setCalendarAttending.mockResolvedValue(mockResponse);

				const { result } = renderHook(() => useCalendarStore());

				// Act
				await act(async () => {
					await result.current.setAttendance('123', true, 'Test note');
				});

				// Assert
				expect(mockedApi.setCalendarAttending).toHaveBeenCalledWith({
					calendarItemId: '123',
					note: 'Test note',
					attending: true
				});
			});
		});
	});
});
