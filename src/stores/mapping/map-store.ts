import { create } from 'zustand';

import { getMapDataAndMarkers } from '@/api/mapping/mapping';
import { type MapDataAndMarkersData } from '@/models/v4/mapping/getMapDataAndMarkersData';

interface MapState {
  mapData: MapDataAndMarkersData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMapData: () => Promise<void>;
  setMapData: (data: MapDataAndMarkersData) => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapData: null,
  isLoading: false,
  error: null,

  fetchMapData: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await getMapDataAndMarkers();
      if (result?.Data) {
        set({ mapData: result.Data, isLoading: false });
      } else {
        set({ error: 'No map data returned', isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch map data',
        isLoading: false,
      });
    }
  },

  setMapData: (data: MapDataAndMarkersData) => {
    set({ mapData: data });
  },
}));
