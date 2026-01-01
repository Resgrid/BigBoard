import { getAllPersonnelInfos } from '@/api/personnel/personnel';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';

import { usePersonnelStore } from '../store';

// Mock the API
jest.mock('@/api/personnel/personnel');
const mockGetAllPersonnelInfos = getAllPersonnelInfos as jest.MockedFunction<typeof getAllPersonnelInfos>;

describe('Personnel Store', () => {
	beforeEach(() => {
		// Reset store state before each test
		usePersonnelStore.setState({
			personnel: [],
			searchQuery: '',
			selectedPersonnelId: null,
			isDetailsOpen: false,
			isLoading: false,
			error: null,
		});

		jest.clearAllMocks();
	});

	const mockPersonnelData: PersonnelInfoResultData[] = [
		{
			UserId: '1',
			IdentificationNumber: 'EMP001',
			DepartmentId: 'dept1',
			FirstName: 'John',
			LastName: 'Doe',
			EmailAddress: 'john.doe@example.com',
			MobilePhone: '+1234567890',
			GroupId: 'group1',
			GroupName: 'Fire Department',
			StatusId: 'status1',
			Status: 'Available',
			StatusColor: '#22C55E',
			StatusTimestamp: '2023-12-01T10:00:00Z',
			StatusDestinationId: '',
			StatusDestinationName: '',
			StaffingId: 'staff1',
			Staffing: 'On Duty',
			StaffingColor: '#3B82F6',
			StaffingTimestamp: '2023-12-01T08:00:00Z',
			Roles: ['Firefighter', 'EMT'],
		},
		{
			UserId: '2',
			IdentificationNumber: 'EMP002',
			DepartmentId: 'dept1',
			FirstName: 'Jane',
			LastName: 'Smith',
			EmailAddress: 'jane.smith@example.com',
			MobilePhone: '+1234567891',
			GroupId: 'group2',
			GroupName: 'EMS',
			StatusId: 'status2',
			Status: 'Busy',
			StatusColor: '#EF4444',
			StatusTimestamp: '2023-12-01T09:30:00Z',
			StatusDestinationId: 'dest1',
			StatusDestinationName: 'Hospital A',
			StaffingId: 'staff2',
			Staffing: 'Off Duty',
			StaffingColor: '#6B7280',
			StaffingTimestamp: '2023-12-01T09:00:00Z',
			Roles: ['Paramedic', 'Driver'],
		},
		{
			UserId: '3',
			IdentificationNumber: 'EMP003',
			DepartmentId: 'dept1',
			FirstName: 'Bob',
			LastName: 'Johnson',
			EmailAddress: 'bob.johnson@example.com',
			MobilePhone: '',
			GroupId: 'group1',
			GroupName: 'Fire Department',
			StatusId: 'status3',
			Status: 'Unavailable',
			StatusColor: '#94A3B8',
			StatusTimestamp: '2023-12-01T07:00:00Z',
			StatusDestinationId: '',
			StatusDestinationName: '',
			StaffingId: 'staff3',
			Staffing: 'On Duty',
			StaffingColor: '#3B82F6',
			StaffingTimestamp: '2023-12-01T08:30:00Z',
			Roles: ['Captain', 'Firefighter'],
		},
	];

	describe('Initial State', () => {
		it('should have correct initial state', () => {
			const state = usePersonnelStore.getState();

			expect(state.personnel).toEqual([]);
			expect(state.searchQuery).toBe('');
			expect(state.selectedPersonnelId).toBeNull();
			expect(state.isDetailsOpen).toBe(false);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
		});
	});

	describe('fetchPersonnel', () => {
		it('should fetch personnel successfully', async () => {
			mockGetAllPersonnelInfos.mockResolvedValue({
				Data: mockPersonnelData,
			} as any);

			const { fetchPersonnel } = usePersonnelStore.getState();
			await fetchPersonnel();

			const state = usePersonnelStore.getState();
			expect(state.personnel).toEqual(mockPersonnelData);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
		});

		it('should set loading state during fetch', async () => {
			jest.useRealTimers(); // Use real timers for this test to avoid timing issues
			
			mockGetAllPersonnelInfos.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ Data: mockPersonnelData } as any), 100)));

			const { fetchPersonnel } = usePersonnelStore.getState();
			const fetchPromise = fetchPersonnel();

			// Check loading state is set immediately
			expect(usePersonnelStore.getState().isLoading).toBe(true);

			await fetchPromise;

			// Check loading state is cleared after completion
			expect(usePersonnelStore.getState().isLoading).toBe(false);
			
			jest.useFakeTimers(); // Restore fake timers
		});

		it('should handle fetch error', async () => {
			const errorMessage = 'Network error';
			mockGetAllPersonnelInfos.mockRejectedValue(new Error(errorMessage));

			const { fetchPersonnel } = usePersonnelStore.getState();
			await fetchPersonnel();

			const state = usePersonnelStore.getState();
			expect(state.personnel).toEqual([]);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBe(errorMessage);
		});

		it('should handle non-Error objects', async () => {
			mockGetAllPersonnelInfos.mockRejectedValue('String error');

			const { fetchPersonnel } = usePersonnelStore.getState();
			await fetchPersonnel();

			const state = usePersonnelStore.getState();
			expect(state.error).toBe('Failed to fetch personnel');
		});

		it('should handle empty data response', async () => {
			mockGetAllPersonnelInfos.mockResolvedValue({
				Data: null,
			} as any);

			const { fetchPersonnel } = usePersonnelStore.getState();
			await fetchPersonnel();

			const state = usePersonnelStore.getState();
			expect(state.personnel).toEqual([]);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
		});
	});

	describe('setSearchQuery', () => {
		it('should update search query', () => {
			const { setSearchQuery } = usePersonnelStore.getState();
			setSearchQuery('john');

			const state = usePersonnelStore.getState();
			expect(state.searchQuery).toBe('john');
		});

		it('should handle empty search query', () => {
			const { setSearchQuery } = usePersonnelStore.getState();
			setSearchQuery('test');
			setSearchQuery('');

			const state = usePersonnelStore.getState();
			expect(state.searchQuery).toBe('');
		});
	});

	describe('selectPersonnel', () => {
		it('should select personnel and open details', () => {
			const { selectPersonnel } = usePersonnelStore.getState();
			selectPersonnel('user123');

			const state = usePersonnelStore.getState();
			expect(state.selectedPersonnelId).toBe('user123');
			expect(state.isDetailsOpen).toBe(true);
		});

		it('should handle selecting different personnel', () => {
			const { selectPersonnel } = usePersonnelStore.getState();

			selectPersonnel('user1');
			expect(usePersonnelStore.getState().selectedPersonnelId).toBe('user1');

			selectPersonnel('user2');
			expect(usePersonnelStore.getState().selectedPersonnelId).toBe('user2');
			expect(usePersonnelStore.getState().isDetailsOpen).toBe(true);
		});
	});

	describe('closeDetails', () => {
		it('should close details and clear selected personnel', () => {
			// First select a personnel
			const { selectPersonnel, closeDetails } = usePersonnelStore.getState();
			selectPersonnel('user123');

			// Verify it's selected and details are open
			expect(usePersonnelStore.getState().selectedPersonnelId).toBe('user123');
			expect(usePersonnelStore.getState().isDetailsOpen).toBe(true);

			// Close details
			closeDetails();

			const state = usePersonnelStore.getState();
			expect(state.selectedPersonnelId).toBeNull();
			expect(state.isDetailsOpen).toBe(false);
		});
	});

	describe('init', () => {
		it('should fetch personnel when store is empty', async () => {
			mockGetAllPersonnelInfos.mockResolvedValue({
				Data: mockPersonnelData,
			} as any);

			const { init } = usePersonnelStore.getState();
			await init();

			const state = usePersonnelStore.getState();
			expect(state.personnel).toEqual(mockPersonnelData);
			expect(mockGetAllPersonnelInfos).toHaveBeenCalledTimes(1);
		});

		it('should not fetch personnel when store already has data', async () => {
			// Pre-populate store with data
			usePersonnelStore.setState({
				personnel: mockPersonnelData,
			});

			const { init } = usePersonnelStore.getState();
			await init();

			// Should not call API since data already exists
			expect(mockGetAllPersonnelInfos).not.toHaveBeenCalled();
		});

		it('should handle init with existing partial data', async () => {
		// Pre-populate store with one item
		usePersonnelStore.setState({
			personnel: mockPersonnelData[0] ? [mockPersonnelData[0]] : [],
		});			const { init } = usePersonnelStore.getState();
			await init();

			// Should not call API since data already exists (length > 0)
			expect(mockGetAllPersonnelInfos).not.toHaveBeenCalled();
		});
	});

	describe('Integration Tests', () => {
		it('should handle complete workflow', async () => {
			mockGetAllPersonnelInfos.mockResolvedValue({
				Data: mockPersonnelData,
			} as any);

			const { init, setSearchQuery, selectPersonnel, closeDetails } = usePersonnelStore.getState();

			// Initialize
			await init();
			expect(usePersonnelStore.getState().personnel).toEqual(mockPersonnelData);

			// Search
			setSearchQuery('john');
			expect(usePersonnelStore.getState().searchQuery).toBe('john');

			// Select personnel
			selectPersonnel('1');
			expect(usePersonnelStore.getState().selectedPersonnelId).toBe('1');
			expect(usePersonnelStore.getState().isDetailsOpen).toBe(true);

			// Close details
			closeDetails();
			expect(usePersonnelStore.getState().selectedPersonnelId).toBeNull();
			expect(usePersonnelStore.getState().isDetailsOpen).toBe(false);
		});

		it('should maintain search query when selecting personnel', async () => {
			mockGetAllPersonnelInfos.mockResolvedValue({
				Data: mockPersonnelData,
			} as any);

			const { init, setSearchQuery, selectPersonnel } = usePersonnelStore.getState();

			await init();
			setSearchQuery('john');
			selectPersonnel('1');

			const state = usePersonnelStore.getState();
			expect(state.searchQuery).toBe('john'); // Search should be preserved
			expect(state.selectedPersonnelId).toBe('1');
			expect(state.isDetailsOpen).toBe(true);
		});
	});
});
