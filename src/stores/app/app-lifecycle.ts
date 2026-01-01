import { AppState, type AppStateStatus, Platform } from 'react-native';
import { create } from 'zustand';

interface AppLifecycleState {
  appState: AppStateStatus;
  isActive: boolean;
  isBackground: boolean;
  lastActiveTimestamp: number | null;
}

interface AppLifecycleStore extends AppLifecycleState {
  setAppState: (state: AppStateStatus) => void;
  updateLastActiveTimestamp: () => void;
}

// Get initial state safely - on web, always return 'active'
const getInitialState = (): AppStateStatus => {
  if (Platform.OS === 'web') {
    return 'active';
  }
  try {
    return AppState.currentState;
  } catch (error) {
    console.warn('Failed to get AppState.currentState, defaulting to active', error);
    return 'active';
  }
};

const initialState = getInitialState();

const useAppLifecycleStore = create<AppLifecycleStore>((set) => ({
  appState: initialState,
  isActive: initialState === 'active',
  isBackground: initialState === 'background',
  lastActiveTimestamp: null,
  setAppState: (state: AppStateStatus) =>
    set({
      appState: state,
      isActive: state === 'active',
      isBackground: state === 'background',
    }),
  updateLastActiveTimestamp: () => set({ lastActiveTimestamp: Date.now() }),
}));

export { useAppLifecycleStore };
