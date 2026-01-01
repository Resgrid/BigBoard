import { create } from 'zustand';

import { getAllGroups } from '@/api/groups/groups';
import { getRecipients } from '@/api/messaging/messages';
import { getAllPersonnelInfos } from '@/api/personnel/personnel';
import { getAllUnitRolesAndAssignmentsForDepartment } from '@/api/units/unitRoles';
import { getUnits } from '@/api/units/units';
import { type GroupResultData } from '@/models/v4/groups/groupsResultData';
import { type RecipientsResultData } from '@/models/v4/messages/recipientsResultData';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type UnitRoleResultData } from '@/models/v4/unitRoles/unitRoleResultData';
import { type UnitResultData } from '@/models/v4/units/unitResultData';

export interface DispatchSelection {
  everyone: boolean;
  users: string[];
  groups: string[];
  roles: string[];
  units: string[];
}

export interface DispatchData {
  users: RecipientsResultData[];
  groups: RecipientsResultData[];
  roles: RecipientsResultData[];
  units: RecipientsResultData[];
}

interface DispatchState {
  data: DispatchData;
  selection: DispatchSelection;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  fetchDispatchData: () => Promise<void>;
  setSelection: (selection: DispatchSelection) => void;
  toggleEveryone: () => void;
  toggleUser: (userId: string) => void;
  toggleGroup: (groupId: string) => void;
  toggleRole: (roleId: string) => void;
  toggleUnit: (unitId: string) => void;
  setSearchQuery: (query: string) => void;
  clearSelection: () => void;
  getFilteredData: () => DispatchData;
}

const initialSelection: DispatchSelection = {
  everyone: false,
  users: [],
  groups: [],
  roles: [],
  units: [],
};

export const useDispatchStore = create<DispatchState>((set, get) => ({
  data: {
    users: [],
    groups: [],
    roles: [],
    units: [],
  },
  selection: initialSelection,
  isLoading: false,
  error: null,
  searchQuery: '',

  fetchDispatchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const recipients = await getRecipients(false, true);

      // Initialize arrays for categorized recipients
      const categorizedUsers: RecipientsResultData[] = [];
      const categorizedGroups: RecipientsResultData[] = [];
      const categorizedRoles: RecipientsResultData[] = [];
      const categorizedUnits: RecipientsResultData[] = [];

      // Categorize recipients based on Type field
      recipients.Data.forEach((recipient) => {
        if (recipient.Type === 'Personnel') {
          categorizedUsers.push(recipient);
        } else if (recipient.Type === 'Groups') {
          categorizedGroups.push(recipient);
        } else if (recipient.Type === 'Roles') {
          categorizedRoles.push(recipient);
        } else if (recipient.Type === 'Unit') {
          categorizedUnits.push(recipient);
        }
      });

      set({
        data: {
          users: categorizedUsers,
          groups: categorizedGroups,
          roles: categorizedRoles,
          units: categorizedUnits,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to fetch dispatch data',
        isLoading: false,
      });
    }
  },

  setSelection: (selection: DispatchSelection) => {
    set({ selection });
  },

  toggleEveryone: () => {
    const { selection } = get();
    if (selection.everyone) {
      // If everyone was selected, deselect it
      set({
        selection: {
          ...selection,
          everyone: false,
        },
      });
    } else {
      // If everyone wasn't selected, select it and clear all others
      set({
        selection: {
          everyone: true,
          users: [],
          groups: [],
          roles: [],
          units: [],
        },
      });
    }
  },

  toggleUser: (userId: string) => {
    const { selection } = get();
    const isSelected = selection.users.includes(userId);

    set({
      selection: {
        ...selection,
        everyone: false, // Deselect everyone when selecting specific items
        users: isSelected ? selection.users.filter((id) => id !== userId) : [...selection.users, userId],
      },
    });
  },

  toggleGroup: (groupId: string) => {
    const { selection } = get();
    const isSelected = selection.groups.includes(groupId);

    set({
      selection: {
        ...selection,
        everyone: false, // Deselect everyone when selecting specific items
        groups: isSelected ? selection.groups.filter((id) => id !== groupId) : [...selection.groups, groupId],
      },
    });
  },

  toggleRole: (roleId: string) => {
    const { selection } = get();
    const isSelected = selection.roles.includes(roleId);

    set({
      selection: {
        ...selection,
        everyone: false, // Deselect everyone when selecting specific items
        roles: isSelected ? selection.roles.filter((id) => id !== roleId) : [...selection.roles, roleId],
      },
    });
  },

  toggleUnit: (unitId: string) => {
    const { selection } = get();
    const isSelected = selection.units.includes(unitId);

    set({
      selection: {
        ...selection,
        everyone: false, // Deselect everyone when selecting specific items
        units: isSelected ? selection.units.filter((id) => id !== unitId) : [...selection.units, unitId],
      },
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearSelection: () => {
    set({ selection: initialSelection });
  },

  getFilteredData: () => {
    const { data, searchQuery } = get();
    if (!searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return {
      users: data.users.filter((user) => user.Name.toLowerCase().includes(query)),
      groups: data.groups.filter((group) => group.Name.toLowerCase().includes(query)),
      roles: data.roles.filter((role) => role.Name.toLowerCase().includes(query)),
      units: data.units.filter((unit) => unit.Name.toLowerCase().includes(query)),
    };
  },
}));
