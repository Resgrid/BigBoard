import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { logger } from '@/lib/logging';
import { useCoreStore } from '@/stores/app/core-store';
import { useRolesStore } from '@/stores/roles/store';
import { useToastStore } from '@/stores/toast/store';

import { Button, ButtonText } from '../ui/button';
import { HStack } from '../ui/hstack';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '../ui/modal';
import { ScrollView } from '../ui/scroll-view';
import { VStack } from '../ui/vstack';
import { RoleAssignmentItem } from './role-assignment-item';

type RolesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const RolesModal: React.FC<RolesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const activeUnit = useCoreStore((state) => state.activeUnit);
  const { roles, unitRoleAssignments, users, isLoading, error } = useRolesStore();

  // Add state to track pending changes
  const [pendingAssignments, setPendingAssignments] = React.useState<{ roleId: string; userId?: string }[]>([]);

  React.useEffect(() => {
    if (isOpen && activeUnit) {
      useRolesStore.getState().fetchRolesForUnit(activeUnit.UnitId);
      useRolesStore.getState().fetchUsers();
      // Reset pending assignments when modal opens
      setPendingAssignments([]);
    }
  }, [isOpen, activeUnit]);

  // Replace handleAssignUser to update pending assignments instead of making API calls
  const handleAssignUser = React.useCallback((roleId: string, userId?: string) => {
    setPendingAssignments((current) => {
      const filtered = current.filter((a) => a.roleId !== roleId);
      // Always add to pending assignments to track both assignments and removals
      return [...filtered, { roleId, userId }];
    });
  }, []);

  const filteredRoles = React.useMemo(() => {
    return roles.filter((role) => role.UnitId === activeUnit?.UnitId);
  }, [roles, activeUnit]);

  const hasChanges = pendingAssignments.length > 0;

  // Add handler for save button
  const handleSave = React.useCallback(async () => {
    if (!activeUnit) return;

    try {
      // Get all roles for this unit and create assignments/removals
      const allUnitRoles = filteredRoles
        .map((role) => {
          const pendingAssignment = pendingAssignments.find((a) => a.roleId === role.UnitRoleId);
          const currentAssignment = unitRoleAssignments.find((a) => a.UnitRoleId === role.UnitRoleId && a.UnitId === activeUnit.UnitId);
          const assignedUserId = pendingAssignment?.userId || currentAssignment?.UserId || '';

          return {
            RoleId: role.UnitRoleId,
            UserId: assignedUserId,
            Name: '',
          };
        })
        .filter((role) => {
          // Only filter out entries lacking a RoleId - allow empty UserId for unassignments
          return role.RoleId && role.RoleId.trim() !== '';
        });

      await useRolesStore.getState().assignRoles({
        UnitId: activeUnit.UnitId,
        Roles: allUnitRoles,
      });

      // Refresh role assignments after all updates
      await useRolesStore.getState().fetchRolesForUnit(activeUnit.UnitId);
      onClose();
    } catch (err) {
      logger.error({
        message: 'Error saving role assignments',
        context: {
          error: err,
        },
      });
      useToastStore.getState().showToast('error', 'Error saving role assignments');
    }
  }, [activeUnit, pendingAssignments, onClose, filteredRoles, unitRoleAssignments]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalBackdrop />
      <ModalContent className="m-4 w-full max-w-3xl rounded-2xl">
        <ModalHeader>
          <Text className="text-xl font-semibold">{t('roles.modal.title', 'Unit Role Assignments')}</Text>
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <VStack space="md" className="items-center py-4">
              <Spinner size="large" />
              <Text>{t('common.loading', 'Loading...')}</Text>
            </VStack>
          ) : error ? (
            <Text className="py-4 text-center text-red-500">{error}</Text>
          ) : (
            <ScrollView className="max-h-[70vh]">
              <VStack space="sm">
                {filteredRoles.map((role) => {
                  const pendingAssignment = pendingAssignments.find((a) => a.roleId === role.UnitRoleId);
                  const assignment = unitRoleAssignments.find((a) => a.UnitRoleId === role.UnitRoleId);
                  const assignedUser = users.find((u) => u.UserId === (pendingAssignment?.userId ?? assignment?.UserId));

                  return (
                    <RoleAssignmentItem
                      key={role.UnitRoleId}
                      role={role}
                      assignedUser={assignedUser}
                      availableUsers={users}
                      onAssignUser={(userId) => handleAssignUser(role.UnitRoleId, userId)}
                      currentAssignments={[
                        ...unitRoleAssignments.map((a) => ({
                          roleId: a.UnitRoleId,
                          userId: a.UserId,
                        })),
                        ...pendingAssignments.map((a) => ({
                          roleId: a.roleId,
                          userId: a.userId ?? '',
                        })),
                      ]}
                    />
                  );
                })}
              </VStack>
            </ScrollView>
          )}
        </ModalBody>
        <ModalFooter>
          <HStack space="md">
            <Button variant="outline" action="secondary" className="w-1/2" onPress={onClose} isDisabled={isLoading}>
              <ButtonText>{t('common.close', 'Close')}</ButtonText>
            </Button>
            <Button variant="solid" action="primary" className="w-1/2" onPress={handleSave} isDisabled={isLoading || !hasChanges}>
              <ButtonText>{t('common.save', 'Save')}</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
