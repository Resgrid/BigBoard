import { ChevronDownIcon } from 'lucide-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type UnitRoleResultData } from '@/models/v4/unitRoles/unitRoleResultData';

import { VStack } from '../ui/vstack';

type RoleAssignmentItemProps = {
  role: UnitRoleResultData;
  assignedUser?: PersonnelInfoResultData;
  availableUsers: PersonnelInfoResultData[];
  onAssignUser: (userId?: string) => void;
  currentAssignments: { roleId: string; userId: string }[];
};

export const RoleAssignmentItem: React.FC<RoleAssignmentItemProps> = ({ role, assignedUser, availableUsers, onAssignUser, currentAssignments }) => {
  const { t } = useTranslation();

  const filteredUsers = availableUsers.filter((user) => {
    const isAssignedToOtherRole = currentAssignments.some((assignment) => assignment.userId === user.UserId && assignment.roleId !== role.UnitRoleId);
    return !isAssignedToOtherRole;
  });

  return (
    <VStack className="rounded-lg p-4" space="xs">
      <Text className="text-base font-medium">{role.Name}</Text>
      <Select selectedValue={assignedUser?.UserId || ''} onValueChange={(value) => onAssignUser(value || undefined)}>
        <SelectTrigger>
          <SelectInput placeholder={t('roles.selectUser', 'Select user')} className="px-3 py-2" value={assignedUser ? `${assignedUser.FirstName} ${assignedUser.LastName}` : ''} />
          <SelectIcon as={ChevronDownIcon} />
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent>
            <SelectDragIndicatorWrapper>
              <SelectDragIndicator />
            </SelectDragIndicatorWrapper>
            <SelectItem label={t('roles.unassigned', 'Unassigned')} value="" />
            {filteredUsers.map((user) => (
              <SelectItem key={user.UserId} label={`${user.FirstName} ${user.LastName}`} value={user.UserId} />
            ))}
          </SelectContent>
        </SelectPortal>
      </Select>
    </VStack>
  );
};
