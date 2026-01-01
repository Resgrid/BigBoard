import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Widget, WidgetLayout, WidgetType } from '@/types/widget';
import { DEFAULT_WIDGET_SIZES, WIDGET_LABELS } from '@/types/widget';

interface DashboardState {
  widgets: Widget[];
  isEditMode: boolean;
  showAddMenu: boolean;
  setEditMode: (isEditMode: boolean) => void;
  setShowAddMenu: (showAddMenu: boolean) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidgetLayout: (id: string, layout: Partial<WidgetLayout>) => void;
  updateWidgets: (widgets: Widget[]) => void;
  resetWidgets: () => void;
}

const STORAGE_KEY = 'dashboard-widgets';

// Create MMKV storage instance
const storage = new MMKV();

// Generate a unique ID for widgets
const generateWidgetId = () => `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// MMKV storage adapter for Zustand
const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: [],
      isEditMode: false,
      showAddMenu: false,

      setEditMode: (isEditMode: boolean) => set({ isEditMode }),

      setShowAddMenu: (showAddMenu: boolean) => set({ showAddMenu }),

      addWidget: (type: WidgetType) => {
        const { widgets } = get();
        const size = DEFAULT_WIDGET_SIZES[type];
        const id = generateWidgetId();

        const newWidget: Widget = {
          id,
          key: id, // Required by react-native-draggable-grid
          type,
          name: WIDGET_LABELS[type],
          x: 0,
          y: 0,
          w: size.w,
          h: size.h,
        };

        set({ widgets: [...widgets, newWidget], showAddMenu: false });
      },

      removeWidget: (id: string) => {
        const { widgets } = get();
        set({ widgets: widgets.filter((w) => w.id !== id) });
      },

      updateWidgetLayout: (id: string, layout: Partial<WidgetLayout>) => {
        const { widgets } = get();
        set({
          widgets: widgets.map((w) => (w.id === id ? { ...w, ...layout } : w)),
        });
      },

      updateWidgets: (widgets: Widget[]) => {
        set({ widgets });
      },

      resetWidgets: () => set({ widgets: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
