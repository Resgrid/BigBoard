import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { CustomBottomSheet } from '@/components/ui/bottom-sheet';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useAnalytics } from '@/hooks/use-analytics';
import { logger } from '@/lib/logging';
import { useCoreStore } from '@/stores/app/core-store';
import { useRolesStore } from '@/stores/roles/store';
import { useToastStore } from '@/stores/toast/store';

import { Button, ButtonText } from '../ui/button';
import { HStack } from '../ui/hstack';
import { ScrollView } from '../ui/scroll-view';
import { VStack } from '../ui/vstack';
import { RoleAssignmentItem } from './role-assignment-item';

type RolesBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const RolesBottomSheet: React.FC<RolesBottomSheetProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { trackEvent } = useAnalytics();
  const activeUnit = useCoreStore((state) => state.activeUnit);
  const { roles, unitRoleAssignments, users, isLoading, error } = useRolesStore();

  // Add state to track pending changes
  const [pendingAssignments, setPendingAssignments] = React.useState<{ roleId: string; userId?: string }[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && activeUnit) {
      useRolesStore.getState().fetchRolesForUnit(activeUnit.UnitId);
      useRolesStore.getState().fetchUsers();
      // Reset pending assignments when bottom sheet opens
      setPendingAssignments([]);
    }
  }, [isOpen, activeUnit]);

  // Track when roles bottom sheet is opened/rendered
  React.useEffect(() => {
    if (isOpen) {
      trackEvent('roles_bottom_sheet_opened', {
        unitId: activeUnit?.UnitId || '',
        unitName: activeUnit?.Name || '',
        rolesCount: roles.length,
        usersCount: users.length,
        hasError: !!error,
      });
    }
  }, [isOpen, trackEvent, activeUnit, roles.length, users.length, error]);

  // Handle user assignment changes
  const handleAssignUser = React.useCallback((roleId: string, userId?: string) => {
    setPendingAssignments((current) => {
      const filtered = current.filter((a) => a.roleId !== roleId);
      // Only add to pending assignments if a user is actually selected
      if (userId && userId.trim() !== '') {
        return [...filtered, { roleId, userId }];
      }
      // If no user selected (unassigned), just return filtered array
      return filtered;
    });
  }, []);

  const filteredRoles = React.useMemo(() => {
    return roles.filter((role) => role.UnitId === activeUnit?.UnitId);
  }, [roles, activeUnit]);

  // Handle save button
  const handleSave = React.useCallback(async () => {
    if (!activeUnit) return;

    setIsSaving(true);
    try {
      // Get all roles for this unit and filter out ones without valid assignments
      const allUnitRoles = filteredRoles
        .map((role) => {
          const pendingAssignment = pendingAssignments.find((a) => a.roleId === role.UnitRoleId);
          const currentAssignment = unitRoleAssignments.find((a) => a.UnitRoleId === role.UnitRoleId);
          const assignedUserId = pendingAssignment?.userId || currentAssignment?.UserId || '';

          return {
            RoleId: role.UnitRoleId,
            UserId: assignedUserId,
            Name: '',
          };
        })
        .filter((role) => {
          // Only include roles that have valid RoleId and assigned UserId
          return role.RoleId && role.RoleId.trim() !== '' && role.UserId && role.UserId.trim() !== '';
        });

      // Save only valid role assignments
      await useRolesStore.getState().assignRoles({
        UnitId: activeUnit.UnitId,
        Roles: allUnitRoles,
      });

      // Refresh role assignments after all updates
      await useRolesStore.getState().fetchRolesForUnit(activeUnit.UnitId);
      useToastStore.getState().showToast('success', t('roles.saved_successfully', 'Role assignments saved successfully'));
      onClose();
    } catch (err) {
      logger.error({
        message: 'Error saving role assignments',
        context: {
          error: err,
        },
      });
      useToastStore.getState().showToast('error', t('roles.save_error', 'Error saving role assignments'));
    } finally {
      setIsSaving(false);
    }
  }, [activeUnit, pendingAssignments, onClose, t, filteredRoles, unitRoleAssignments]);

  const handleClose = React.useCallback(() => {
    setPendingAssignments([]);
    onClose();
  }, [onClose]);

  const hasChanges = pendingAssignments.length > 0;

  return (
    <CustomBottomSheet isOpen={isOpen} onClose={handleClose} isLoading={isLoading} loadingText={t('common.loading')} snapPoints={[80]} minHeight="min-h-[600px]" testID="roles-bottom-sheet">
      <VStack space="md" className="w-full flex-1">
        <HStack className="items-center justify-between">
          <Text className="text-xl font-bold">{t('roles.title', 'Unit Role Assignments')}</Text>
          {activeUnit && <Text className="text-sm text-gray-500">{activeUnit.Name}</Text>}
        </HStack>

        {error ? (
          <Text className="py-4 text-center text-red-500" {...(Platform.OS === 'web' ? { 'data-testid': 'error-message' } : { testID: 'error-message' })}>
            {error}
          </Text>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} {...(Platform.OS === 'web' ? { 'data-testid': 'roles-scroll-view' } : { testID: 'roles-scroll-view' })}>
            <VStack space="sm" className="pb-4">
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
                      ...unitRoleAssignments
                        .filter((a) => a.UserId && a.UserId.trim() !== '')
                        .map((a) => ({
                          roleId: a.UnitRoleId,
                          userId: a.UserId,
                        })),
                      ...pendingAssignments
                        .filter((a) => a.userId && a.userId.trim() !== '')
                        .map((a) => ({
                          roleId: a.roleId,
                          userId: a.userId!,
                        })),
                    ]}
                  />
                );
              })}
            </VStack>
          </ScrollView>
        )}

        <HStack space="md" className="pt-4">
          <Button variant="outline" action="secondary" className="flex-1" onPress={handleClose} isDisabled={isSaving} {...(Platform.OS === 'web' ? { 'data-testid': 'cancel-button' } : { testID: 'cancel-button' })}>
            <ButtonText>{t('common.cancel')}</ButtonText>
          </Button>
          <Button variant="solid" action="primary" className="flex-1" onPress={handleSave} isDisabled={isSaving || !hasChanges} {...(Platform.OS === 'web' ? { 'data-testid': 'save-button' } : { testID: 'save-button' })}>
            {isSaving ? <Spinner size="small" /> : <ButtonText>{t('common.save', 'Save')}</ButtonText>}
          </Button>
        </HStack>
      </VStack>
    </CustomBottomSheet>
  );
};
