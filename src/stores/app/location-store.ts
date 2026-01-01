import type * as Location from 'expo-location';
import { create } from 'zustand';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  accuracy: number | null;
  speed: number | null;
  altitude: number | null;
  timestamp: number | null;
  isBackgroundEnabled: boolean;
  isMapLocked: boolean;
  setLocation: (location: Location.LocationObject) => void;
  setBackgroundEnabled: (enabled: boolean) => void;
  setMapLocked: (locked: boolean) => void;
}

export const useLocationStore = create<LocationState>()((set) => ({
  latitude: null,
  longitude: null,
  heading: null,
  accuracy: null,
  speed: null,
  altitude: null,
  timestamp: null,
  isBackgroundEnabled: false,
  isMapLocked: false,
  setLocation: (location) =>
    set({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      altitude: location.coords.altitude,
      timestamp: location.timestamp,
    }),
  setBackgroundEnabled: (enabled) => set({ isBackgroundEnabled: enabled }),
  setMapLocked: (locked) => set({ isMapLocked: locked }),
}));
