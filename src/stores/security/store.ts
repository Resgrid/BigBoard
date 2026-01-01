import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getCurrentUsersRights } from '@/api/security/security';
import { logger } from '@/lib/logging';
import { type DepartmentRightsResultData } from '@/models/v4/security/departmentRightsResultData';

export interface SecurityState {
  error: string | null;
  getRights: () => Promise<void>;
  rights: DepartmentRightsResultData | null;
}

// Create MMKV storage instance for security persistence
const securityStorage = new MMKV({
  id: 'security-storage',
  encryptionKey: Platform.OS === 'web' ? undefined : '9f066882-5c07-47a4-9bf3-783074b590d5',
});

// MMKV storage adapter for Zustand
const mmkvStorage = {
  getItem: (name: string) => {
    const value = securityStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    securityStorage.set(name, value);
  },
  removeItem: (name: string) => {
    securityStorage.delete(name);
  },
};

export const securityStore = create<SecurityState>()(
  persist(
    (set, _get) => ({
      error: null,
      rights: null,
      getRights: async () => {
        try {
          const response = await getCurrentUsersRights();

          set({
            rights: response.Data,
          });
        } catch (error) {
          logger.error({
            message: 'Failed to get user rights',
            context: { error },
          });
          // If refresh fails, log the error but don't throw
        }
      },
    }),
    {
      name: 'security-storage',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist rights data
      partialize: (state) => ({
        rights: state.rights,
      }),
    }
  )
);

export const useSecurityStore = () => {
  const store = securityStore();
  return {
    getRights: store.getRights,
    isUserDepartmentAdmin: store.rights?.IsAdmin,
    isUserGroupAdmin: (groupId: number) => store.rights?.Groups?.some((right) => right.GroupId === groupId && right.IsGroupAdmin) ?? false,
    canUserCreateCalls: store.rights?.CanCreateCalls,
    canUserCreateNotes: store.rights?.CanAddNote,
    canUserCreateMessages: store.rights?.CanCreateMessage,
    canUserViewPII: store.rights?.CanViewPII,
    departmentCode: store.rights?.DepartmentCode,
    rights: store.rights,
  };
};
