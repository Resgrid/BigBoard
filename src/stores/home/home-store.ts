import { create } from 'zustand';

import { getPersonnelInfo } from '@/api/personnel/personnel';
import { getAllPersonnelStaffings, getAllPersonnelStatuses } from '@/api/satuses';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type GetCurrentStaffingResultData } from '@/models/v4/personnelStaffing/getCurrentStaffingResultData';
import { type GetCurrentStatusResultData } from '@/models/v4/personnelStatuses/getCurrentStatusResultData';
import { type StatusesResultData } from '@/models/v4/statuses/statusesResultData';
import type { ApiResponse } from '@/types/api';

import useAuthStore from '../auth/store';
import { useCallsStore } from '../calls/store';
import { useRolesStore } from '../roles/store';
import { useUnitsStore } from '../units/store';

export interface DepartmentStats {
  openCalls: number;
  personnelInService: number;
  unitsInService: number;
}

interface HomeState {
  // Department statistics
  departmentStats: DepartmentStats;
  isLoadingStats: boolean;

  // Current user data
  currentUser: PersonnelInfoResultData | null;
  currentUserStatus: GetCurrentStatusResultData | null;
  currentUserStaffing: GetCurrentStaffingResultData | null;
  isLoadingUser: boolean;

  // Available statuses and staffings
  availableStatuses: StatusesResultData[];
  availableStaffings: StatusesResultData[];
  isLoadingOptions: boolean;

  // Actions
  fetchDepartmentStats: () => Promise<void>;
  fetchCurrentUserInfo: () => Promise<void>;
  fetchStatusOptions: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Errors
  error: string | null;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  // Initial state
  departmentStats: {
    openCalls: 0,
    personnelInService: 0,
    unitsInService: 0,
  },
  isLoadingStats: false,
  currentUser: null,
  currentUserStatus: null,
  currentUserStaffing: null,
  isLoadingUser: false,
  availableStatuses: [],
  availableStaffings: [],
  isLoadingOptions: false,
  error: null,

  // Fetch department statistics
  fetchDepartmentStats: async () => {
    set({ isLoadingStats: true, error: null });
    try {
      // Get open calls count
      const calls = useCallsStore.getState().calls;
      const openCalls = calls.filter((call) => call.State === 'Active').length;

      // Get personnel in service count
      const users = useRolesStore.getState().users;
      const personnelInService = users.filter((user) => user.Status && user.Status !== 'Available' && user.Status !== 'Off Duty').length;

      // Get units in service count
      const units = useUnitsStore.getState().units;
      const unitsInService = units.filter((unit) => unit.Name && unit.Name !== '').length;

      set({
        departmentStats: {
          openCalls,
          personnelInService,
          unitsInService,
        },
        isLoadingStats: false,
      });
    } catch (error) {
      set({
        error: 'Failed to fetch department statistics',
        isLoadingStats: false,
      });
    }
  },

  // Fetch current user information
  fetchCurrentUserInfo: async () => {
    set({ isLoadingUser: true, error: null });
    try {
      const userId = useAuthStore.getState().userId;
      if (!userId) {
        throw new Error('No user ID available');
      }

      // Fetch user info, status, and staffing in parallel
      const [userInfo] = await Promise.all([getPersonnelInfo(userId) as Promise<ApiResponse<PersonnelInfoResultData>>]);

      set({
        currentUser: userInfo.Data,
        isLoadingUser: false,
      });
    } catch (error) {
      set({
        error: 'Failed to fetch current user information',
        isLoadingUser: false,
      });
    }
  },

  // Fetch available status and staffing options
  fetchStatusOptions: async () => {
    set({ isLoadingOptions: true, error: null });
    try {
      const [statusesResponse, staffingsResponse] = await Promise.all([
        getAllPersonnelStatuses() as Promise<ApiResponse<StatusesResultData[]>>,
        getAllPersonnelStaffings() as Promise<ApiResponse<StatusesResultData[]>>,
      ]);

      set({
        availableStatuses: statusesResponse.Data || [],
        availableStaffings: staffingsResponse.Data || [],
        isLoadingOptions: false,
      });
    } catch (error) {
      set({
        error: 'Failed to fetch status options',
        isLoadingOptions: false,
      });
    }
  },

  // Refresh all data
  refreshAll: async () => {
    const { fetchDepartmentStats, fetchCurrentUserInfo, fetchStatusOptions } = get();
    await Promise.all([fetchDepartmentStats(), fetchCurrentUserInfo(), fetchStatusOptions()]);
  },
}));
