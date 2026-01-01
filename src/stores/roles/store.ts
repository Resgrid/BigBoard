import { create } from 'zustand';

import { getAllPersonnelInfos } from '@/api/personnel/personnel';
import { getAllUnitRolesAndAssignmentsForDepartment, getRoleAssignmentsForUnit, setRoleAssignmentsForUnit } from '@/api/units/unitRoles';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type ActiveUnitRoleResultData } from '@/models/v4/unitRoles/activeUnitRoleResultData';
import { type SetUnitRolesInput } from '@/models/v4/unitRoles/setUnitRolesInput';
import { type UnitRoleResultData } from '@/models/v4/unitRoles/unitRoleResultData';

import { useCoreStore } from '../app/core-store';

interface RolesState {
  roles: UnitRoleResultData[];
  unitRoleAssignments: ActiveUnitRoleResultData[];
  users: PersonnelInfoResultData[];
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchRolesForUnit: (unitId: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  assignRoles: (data: SetUnitRolesInput) => Promise<void>;
}

export const useRolesStore = create<RolesState>((set) => ({
  roles: [],
  unitRoleAssignments: [],
  users: [],
  isLoading: false,
  error: null,
  init: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getAllUnitRolesAndAssignmentsForDepartment();
      const personnelResponse = await getAllPersonnelInfos('');

      set({
        roles: response.Data,
        users: personnelResponse.Data,
        isLoading: false,
      });

      const activeUnit = useCoreStore.getState().activeUnit;
      if (activeUnit) {
        const unitRoles = await getRoleAssignmentsForUnit(activeUnit.UnitId);
        set({ unitRoleAssignments: unitRoles.Data });
      }
    } catch (error) {
      set({
        error: 'Failed to fetch unit roles and assignments',
        isLoading: false,
      });
    }
  },
  fetchRolesForUnit: async (unitId: string) => {
    set({ isLoading: true, error: null });
    try {
      const unitRoles = await getRoleAssignmentsForUnit(unitId);
      set({ unitRoleAssignments: unitRoles.Data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch unit roles', isLoading: false });
    }
  },
  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getAllUnitRolesAndAssignmentsForDepartment();
      set({ roles: response.Data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch all unit roles', isLoading: false });
    }
  },
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const personnelResponse = await getAllPersonnelInfos('');
      set({ users: personnelResponse.Data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch personnel', isLoading: false });
    }
  },
  assignRoles: async (data: SetUnitRolesInput) => {
    set({ isLoading: true, error: null });
    try {
      await setRoleAssignmentsForUnit(data);
    } catch (error) {
      set({ error: 'Failed to assign user to role', isLoading: false });
    }
  },
}));
