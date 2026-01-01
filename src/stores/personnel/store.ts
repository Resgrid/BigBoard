import { create } from 'zustand';

import { getAllPersonnelInfos, getPersonnelFilterOptions } from '@/api/personnel/personnel';
import { loadPersonnelFilterOptions, savePersonnelFilterOptions } from '@/lib/storage/personnel-filter';
import { type FilterResultData } from '@/models/v4/personnel/filterResultData';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import type { ApiResponse } from '@/types/api';

interface PersonnelState {
  personnel: PersonnelInfoResultData[];
  searchQuery: string;
  selectedPersonnelId: string | null;
  isDetailsOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Filter-related state
  filterOptions: FilterResultData[];
  selectedFilters: string[];
  isFilterSheetOpen: boolean;
  isLoadingFilters: boolean;

  // Actions
  fetchPersonnel: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  selectPersonnel: (id: string) => void;
  closeDetails: () => void;
  init: () => Promise<void>;

  // Filter actions
  fetchFilterOptions: () => Promise<void>;
  toggleFilter: (filterId: string) => void;
  openFilterSheet: () => void;
  closeFilterSheet: () => void;
  loadSavedFilters: () => Promise<void>;
}

export const usePersonnelStore = create<PersonnelState>((set, get) => ({
  personnel: [],
  searchQuery: '',
  selectedPersonnelId: null,
  isDetailsOpen: false,
  isLoading: false,
  error: null,

  // Filter-related state
  filterOptions: [],
  selectedFilters: [],
  isFilterSheetOpen: false,
  isLoadingFilters: false,

  fetchPersonnel: async () => {
    try {
      set({ isLoading: true, error: null });
      const { selectedFilters } = get();
      const filterString = selectedFilters.length > 0 ? selectedFilters.join(',') : '';
      const response = (await getAllPersonnelInfos(filterString)) as ApiResponse<PersonnelInfoResultData[]>;
      set({ personnel: response.Data || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch personnel',
        isLoading: false,
      });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  selectPersonnel: (id: string) => {
    set({ selectedPersonnelId: id, isDetailsOpen: true });
  },

  closeDetails: () => {
    set({ isDetailsOpen: false, selectedPersonnelId: null });
  },

  init: async () => {
    const { personnel, loadSavedFilters } = get();
    await loadSavedFilters();
    if (personnel.length === 0) {
      await get().fetchPersonnel();
    }
  },

  // Filter actions
  fetchFilterOptions: async () => {
    try {
      set({ isLoadingFilters: true });
      const response = await getPersonnelFilterOptions();
      set({ filterOptions: response.Data || [], isLoadingFilters: false });
    } catch (error) {
      set({ isLoadingFilters: false });
    }
  },

  toggleFilter: async (filterId: string) => {
    const { selectedFilters } = get();
    const newFilters = selectedFilters.includes(filterId) ? selectedFilters.filter((id) => id !== filterId) : [...selectedFilters, filterId];

    set({ selectedFilters: newFilters });
    savePersonnelFilterOptions(newFilters);

    // Refetch personnel with new filters
    await get().fetchPersonnel();
  },

  openFilterSheet: () => {
    set({ isFilterSheetOpen: true });
    get().fetchFilterOptions();
  },

  closeFilterSheet: () => {
    set({ isFilterSheetOpen: false });
  },

  loadSavedFilters: async () => {
    const savedFilters = await loadPersonnelFilterOptions();
    set({ selectedFilters: savedFilters });
  },
}));
