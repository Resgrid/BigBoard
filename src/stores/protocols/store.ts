import { create } from 'zustand';

import { getAllProtocols } from '@/api/protocols/protocols';
import { type CallProtocolsResultData } from '@/models/v4/callProtocols/callProtocolsResultData';

interface ProtocolsState {
  protocols: CallProtocolsResultData[];
  searchQuery: string;
  selectedProtocolId: string | null;
  isDetailsOpen: boolean;
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchProtocols: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  selectProtocol: (id: string) => void;
  closeDetails: () => void;
}

export const useProtocolsStore = create<ProtocolsState>((set) => ({
  protocols: [],
  searchQuery: '',
  selectedProtocolId: null,
  isDetailsOpen: false,
  isLoading: false,
  error: null,
  fetchProtocols: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getAllProtocols();
      set({ protocols: response.Data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectProtocol: (id) => set({ selectedProtocolId: id, isDetailsOpen: true }),
  closeDetails: () => set({ isDetailsOpen: false }),
}));
