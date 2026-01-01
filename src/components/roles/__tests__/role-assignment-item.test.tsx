import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type UnitRoleResultData } from '@/models/v4/unitRoles/unitRoleResultData';

import { RoleAssignmentItem } from '../role-assignment-item';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock the Select components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, selectedValue, onValueChange }: any) => {
    const { View } = require('react-native');
    return (
      <View testID="select" onPress={() => onValueChange && onValueChange('user1')}>
        {children}
      </View>
    );
  },
  SelectTrigger: ({ children }: any) => {
    const { View } = require('react-native');
    return <View testID="select-trigger">{children}</View>;
  },
  SelectInput: ({ value, placeholder }: any) => {
    const { Text } = require('react-native');
    return <Text testID="select-input">{value || placeholder}</Text>;
  },
  SelectIcon: () => {
    const { View } = require('react-native');
    return <View testID="select-icon" />;
  },
  SelectPortal: ({ children }: any) => children,
  SelectBackdrop: () => {
    const { View } = require('react-native');
    return <View testID="select-backdrop" />;
  },
  SelectContent: ({ children }: any) => {
    const { View } = require('react-native');
    return <View testID="select-content">{children}</View>;
  },
  SelectDragIndicatorWrapper: ({ children }: any) => children,
  SelectDragIndicator: () => {
    const { View } = require('react-native');
    return <View testID="select-drag-indicator" />;
  },
  SelectItem: ({ label, value }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`select-item-${value}`}>{label}</Text>;
  },
}));

// Mock other UI components
jest.mock('@/components/ui/text', () => ({
  Text: ({ children, className }: any) => {
    const { Text } = require('react-native');
    return <Text testID="text">{children}</Text>;
  },
}));

jest.mock('@/components/ui/vstack', () => ({
  VStack: ({ children }: any) => {
    const { View } = require('react-native');
    return <View testID="vstack">{children}</View>;
  },
}));

describe('RoleAssignmentItem', () => {
  const mockOnAssignUser = jest.fn();

  const mockRole: UnitRoleResultData = {
    UnitRoleId: 'role1',
    Name: 'Captain',
    UnitId: 'unit1',
  };

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
    {
      UserId: 'user2',
      FirstName: 'Jane',
      LastName: 'Smith',
      EmailAddress: 'jane.smith@example.com',
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the role name', () => {
    render(
      <RoleAssignmentItem
        role={mockRole}
        availableUsers={mockUsers}
        onAssignUser={mockOnAssignUser}
        currentAssignments={[]}
      />
    );

    expect(screen.getByText('Captain')).toBeTruthy();
  });

  it('displays placeholder when no user is assigned', () => {
    render(
      <RoleAssignmentItem
        role={mockRole}
        availableUsers={mockUsers}
        onAssignUser={mockOnAssignUser}
        currentAssignments={[]}
      />
    );

    expect(screen.getByText('Select user')).toBeTruthy();
  });

  it('displays assigned user name when user is assigned', () => {
    const assignedUser = mockUsers[0];

    render(
      <RoleAssignmentItem
        role={mockRole}
        assignedUser={assignedUser}
        availableUsers={mockUsers}
        onAssignUser={mockOnAssignUser}
        currentAssignments={[]}
      />
    );

    expect(screen.getAllByText('John Doe')).toHaveLength(2); // One in input, one in options
  });

  it('filters out users assigned to other roles', () => {
    const currentAssignments = [
      { roleId: 'role2', userId: 'user2' }, // user2 is assigned to a different role
    ];

    render(
      <RoleAssignmentItem
        role={mockRole}
        availableUsers={mockUsers}
        onAssignUser={mockOnAssignUser}
        currentAssignments={currentAssignments}
      />
    );

    // Should show unassigned option
    expect(screen.getByTestId('select-item-')).toBeTruthy();
    // Should show user1 (not assigned to other roles)
    expect(screen.getByTestId('select-item-user1')).toBeTruthy();
    // Should NOT show user2 (assigned to other role)
    expect(screen.queryByTestId('select-item-user2')).toBeNull();
  });

  it('includes user assigned to the same role in available users', () => {
    const assignedUser = mockUsers[0];
    const currentAssignments = [
      { roleId: 'role1', userId: 'user1' }, // user1 is assigned to this role
      { roleId: 'role2', userId: 'user2' }, // user2 is assigned to a different role
    ];

    render(
      <RoleAssignmentItem
        role={mockRole}
        assignedUser={assignedUser}
        availableUsers={mockUsers}
        onAssignUser={mockOnAssignUser}
        currentAssignments={currentAssignments}
      />
    );

    // Should show assigned user name
    expect(screen.getAllByText('John Doe')).toHaveLength(2); // One in input, one in options
    // Should show user1 in options (assigned to this role)
    expect(screen.getByTestId('select-item-user1')).toBeTruthy();
    // Should NOT show user2 (assigned to other role)
    expect(screen.queryByTestId('select-item-user2')).toBeNull();
  });

  it('shows unassigned option', () => {
    render(
      <RoleAssignmentItem
        role={mockRole}
        availableUsers={mockUsers}
        onAssignUser={mockOnAssignUser}
        currentAssignments={[]}
      />
    );

    expect(screen.getByTestId('select-item-')).toBeTruthy();
    expect(screen.getByText('Unassigned')).toBeTruthy();
  });
});