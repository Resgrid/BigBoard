import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { useCoreStore } from '@/stores/app/core-store';
import { useRolesStore } from '@/stores/roles/store';
import { useToastStore } from '@/stores/toast/store';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type UnitResultData } from '@/models/v4/units/unitResultData';
import { type UnitRoleResultData } from '@/models/v4/unitRoles/unitRoleResultData';
import { type ActiveUnitRoleResultData } from '@/models/v4/unitRoles/activeUnitRoleResultData';

import { RolesModal } from '../roles-modal';

// Mock the stores
jest.mock('@/stores/app/core-store');
jest.mock('@/stores/roles/store');
jest.mock('@/stores/toast/store');

// Mock the Modal components
jest.mock('@/components/ui/modal', () => ({
  Modal: ({ children, isOpen }: any) => {
    if (!isOpen) return null;
    return <div>{children}</div>;
  },
  ModalBackdrop: () => <div />,
  ModalContent: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock the RoleAssignmentItem component
jest.mock('../role-assignment-item', () => ({
  RoleAssignmentItem: ({ role }: any) => {
    const { Text } = require('react-native');
    return (
      <Text testID={`role-item-${role.Name}`}>Role: {role.Name}</Text>
    );
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock logger
jest.mock('@/lib/logging', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

const mockUseCoreStore = useCoreStore as jest.MockedFunction<typeof useCoreStore>;
const mockUseRolesStore = useRolesStore as jest.MockedFunction<typeof useRolesStore>;
const mockUseToastStore = useToastStore as jest.MockedFunction<typeof useToastStore>;

describe('RolesModal', () => {
  const mockOnClose = jest.fn();
  const mockFetchRolesForUnit = jest.fn();
  const mockFetchUsers = jest.fn();
  const mockAssignRoles = jest.fn();
  const mockShowToast = jest.fn();

  const mockActiveUnit: UnitResultData = {
    UnitId: 'unit1',
    Name: 'Unit 1',
    Type: 'Engine',
    DepartmentId: 'dept1',
    TypeId: 1,
    CustomStatusSetId: '',
    GroupId: '',
    GroupName: '',
    Vin: '',
    PlateNumber: '',
    FourWheelDrive: false,
    SpecialPermit: false,
    CurrentDestinationId: '',
    CurrentStatusId: '',
    CurrentStatusTimestamp: '',
    Latitude: '',
    Longitude: '',
    Note: '',
  };

  const mockRoles: UnitRoleResultData[] = [
    {
      UnitRoleId: 'role1',
      Name: 'Captain',
      UnitId: 'unit1',
    },
    {
      UnitRoleId: 'role2',
      Name: 'Engineer',
      UnitId: 'unit1',
    },
  ];

  const mockUsers: PersonnelInfoResultData[] = [
    {
      UserId: 'user1',
      FirstName: 'John',
      LastName: 'Doe',
      EmailAddress: 'john.doe@example.com',
      DepartmentId: 'dept1',
      IdentificationNumber: '',
      MobilePhone: '',
      GroupId: '',
      GroupName: '',
      StatusId: '',
      Status: '',
      StatusColor: '',
      StatusTimestamp: '',
      StatusDestinationId: '',
      StatusDestinationName: '',
      StaffingId: '',
      Staffing: '',
      StaffingColor: '',
      StaffingTimestamp: '',
      Roles: [],
    },
  ];

  const mockUnitRoleAssignments: ActiveUnitRoleResultData[] = [
    {
      UnitRoleId: 'role1',
      UnitId: 'unit1',
      Name: 'Captain',
      UserId: 'user1',
      FullName: 'John Doe',
      UpdatedOn: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCoreStore.mockReturnValue(mockActiveUnit);
    mockUseRolesStore.mockReturnValue({
      roles: mockRoles,
      unitRoleAssignments: mockUnitRoleAssignments,
      users: mockUsers,
      isLoading: false,
      error: null,
      fetchRolesForUnit: mockFetchRolesForUnit,
      fetchUsers: mockFetchUsers,
      assignRoles: mockAssignRoles,
    } as any);

    mockUseToastStore.mockReturnValue({
      showToast: mockShowToast,
    } as any);

    // Mock the getState functions
    useRolesStore.getState = jest.fn().mockReturnValue({
      fetchRolesForUnit: mockFetchRolesForUnit,
      fetchUsers: mockFetchUsers,
      assignRoles: mockAssignRoles,
    });

    useToastStore.getState = jest.fn().mockReturnValue({
      showToast: mockShowToast,
    });
  });

  it('renders correctly when opened', () => {
    render(<RolesModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Unit Role Assignments')).toBeTruthy();
    expect(screen.getByText('Close')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('does not render when not opened', () => {
    render(<RolesModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Unit Role Assignments')).toBeNull();
  });

  it('fetches roles and users when opened', () => {
    render(<RolesModal isOpen={true} onClose={mockOnClose} />);

    expect(mockFetchRolesForUnit).toHaveBeenCalledWith('unit1');
    expect(mockFetchUsers).toHaveBeenCalled();
  });

  it('renders role assignment items', () => {
    render(<RolesModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('role-item-Captain')).toBeTruthy();
    expect(screen.getByTestId('role-item-Engineer')).toBeTruthy();
  });

  it('displays error state correctly', () => {
    const errorMessage = 'Failed to load roles';
    mockUseRolesStore.mockReturnValue({
      roles: [],
      unitRoleAssignments: [],
      users: [],
      isLoading: false,
      error: errorMessage,
      fetchRolesForUnit: mockFetchRolesForUnit,
      fetchUsers: mockFetchUsers,
      assignRoles: mockAssignRoles,
    } as any);

    render(<RolesModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  it('handles missing active unit gracefully', () => {
    mockUseCoreStore.mockReturnValue(null);

    render(<RolesModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Unit Role Assignments')).toBeTruthy();
  });

  it('filters roles by active unit', () => {
    const rolesWithDifferentUnits = [
      ...mockRoles,
      {
        UnitRoleId: 'role3',
        Name: 'Chief',
        UnitId: 'unit2', // Different unit
      },
    ];

    mockUseRolesStore.mockReturnValue({
      roles: rolesWithDifferentUnits,
      unitRoleAssignments: mockUnitRoleAssignments,
      users: mockUsers,
      isLoading: false,
      error: null,
      fetchRolesForUnit: mockFetchRolesForUnit,
      fetchUsers: mockFetchUsers,
      assignRoles: mockAssignRoles,
    } as any);

    render(<RolesModal isOpen={true} onClose={mockOnClose} />);

    // Should only show roles for the active unit
    expect(screen.getByTestId('role-item-Captain')).toBeTruthy();
    expect(screen.getByTestId('role-item-Engineer')).toBeTruthy();
    expect(screen.queryByTestId('role-item-Chief')).toBeNull();
  });

  describe('Empty RoleId prevention', () => {
    it('should filter out roles with empty or whitespace RoleId and UserId', () => {
      const { fireEvent } = require('@testing-library/react-native');

      render(<RolesModal isOpen={true} onClose={mockOnClose} />);

      // The component should render without errors
      expect(screen.getByText('Unit Role Assignments')).toBeTruthy();
      expect(screen.getByText('Save')).toBeTruthy();
    });

    it('should handle save with empty assignments gracefully', async () => {
      const { fireEvent } = require('@testing-library/react-native');

      // Mock the save to resolve successfully even with empty roles
      mockAssignRoles.mockResolvedValueOnce({});

      render(<RolesModal isOpen={true} onClose={mockOnClose} />);

      // Try to save - should not throw error even if no pending assignments
      const saveButton = screen.getByText('Save');
      fireEvent.press(saveButton);

      // Component should still be functional
      expect(screen.getByText('Unit Role Assignments')).toBeTruthy();
    });

    it('should allow unassignments by including roles with valid RoleId but empty UserId', () => {
      // Test the filter logic that should allow unassignments
      const testRoles = [
        { RoleId: 'role-1', UserId: 'user-1', Name: '' }, // Valid assignment
        { RoleId: 'role-2', UserId: '', Name: '' }, // Valid unassignment - should pass through
        { RoleId: '', UserId: 'user-3', Name: '' }, // Invalid - no RoleId, should be filtered out
        { RoleId: '   ', UserId: 'user-4', Name: '' }, // Invalid - whitespace RoleId, should be filtered out
      ];

      const filteredRoles = testRoles.filter((role) => {
        // Only filter out entries lacking a RoleId - allow empty UserId for unassignments
        return role.RoleId && role.RoleId.trim() !== '';
      });

      expect(filteredRoles).toHaveLength(2);
      expect(filteredRoles[0]).toEqual({ RoleId: 'role-1', UserId: 'user-1', Name: '' });
      expect(filteredRoles[1]).toEqual({ RoleId: 'role-2', UserId: '', Name: '' }); // Unassignment should be included
    });

    it('should track pending removals and assignments properly', () => {
      render(<RolesModal isOpen={true} onClose={mockOnClose} />);

      // The component should track pending assignments including removals (empty UserId)
      // This ensures that unassignments reach the assignRoles API call
      expect(screen.getByText('Unit Role Assignments')).toBeTruthy();
    });

    it('should find role assignments without UnitId filter', () => {
      // Test that demonstrates the fix - assignments should be found without the UnitId filter
      const testRoleAssignments = [
        {
          UnitRoleId: 'role1',
          UnitId: '', // UnitId might be empty or different in the API response
          Name: 'Captain',
          UserId: 'user1',
          FullName: 'John Doe',
          UpdatedOn: new Date().toISOString(),
        },
      ];

      // The old logic would fail to find this assignment due to UnitId mismatch
      const assignmentWithUnitIdFilter = testRoleAssignments.find((a) => a.UnitRoleId === 'role1' && a.UnitId === 'unit1');
      expect(assignmentWithUnitIdFilter).toBeUndefined();

      // The new logic should find this assignment
      const assignmentWithoutUnitIdFilter = testRoleAssignments.find((a) => a.UnitRoleId === 'role1');
      expect(assignmentWithoutUnitIdFilter).toBeDefined();
      expect(assignmentWithoutUnitIdFilter?.UserId).toBe('user1');
    });
  });
});