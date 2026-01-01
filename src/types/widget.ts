// Widget types for the dashboard
export enum WidgetType {
  PERSONNEL = 'personnel',
  UNITS = 'units',
  CALLS = 'calls',
  MAP = 'map',
  WEATHER = 'weather',
  NOTES = 'notes',
  TIME = 'time',
  PERSONNEL_STATUS_SUMMARY = 'personnel_status_summary',
  PERSONNEL_STAFFING_SUMMARY = 'personnel_staffing_summary',
  UNITS_SUMMARY = 'units_summary',
  CALLS_SUMMARY = 'calls_summary',
}

export interface WidgetLayout {
  id: string;
  type: WidgetType;
  name: string;
  x: number;
  y: number;
  w: number; // width in grid units
  h: number; // height in grid units
}

export interface Widget extends WidgetLayout {
  key: string; // Required by react-native-draggable-grid
  data?: any; // Widget-specific data
  settings?: any; // Widget-specific settings
}

// Note: react-native-draggable-grid requires all items to be the same size
// All widgets are set to 1x1 grid units (actual size determined by screen width and BASE_WIDGET_HEIGHT)
export const DEFAULT_WIDGET_SIZES: Record<WidgetType, { w: number; h: number }> = {
  [WidgetType.PERSONNEL]: { w: 1, h: 1 },
  [WidgetType.UNITS]: { w: 1, h: 1 },
  [WidgetType.CALLS]: { w: 1, h: 1 },
  [WidgetType.MAP]: { w: 1, h: 1 },
  [WidgetType.WEATHER]: { w: 1, h: 1 },
  [WidgetType.NOTES]: { w: 1, h: 1 },
  [WidgetType.TIME]: { w: 1, h: 1 },
  [WidgetType.PERSONNEL_STATUS_SUMMARY]: { w: 1, h: 1 },
  [WidgetType.PERSONNEL_STAFFING_SUMMARY]: { w: 1, h: 1 },
  [WidgetType.UNITS_SUMMARY]: { w: 1, h: 1 },
  [WidgetType.CALLS_SUMMARY]: { w: 1, h: 1 },
};

export const WIDGET_LABELS: Record<WidgetType, string> = {
  [WidgetType.PERSONNEL]: 'Personnel',
  [WidgetType.UNITS]: 'Units',
  [WidgetType.CALLS]: 'Calls',
  [WidgetType.MAP]: 'Map',
  [WidgetType.WEATHER]: 'Weather',
  [WidgetType.NOTES]: 'Notes',
  [WidgetType.TIME]: 'Time',
  [WidgetType.PERSONNEL_STATUS_SUMMARY]: 'Personnel Status Summary',
  [WidgetType.PERSONNEL_STAFFING_SUMMARY]: 'Personnel Staffing Summary',
  [WidgetType.UNITS_SUMMARY]: 'Units Summary',
  [WidgetType.CALLS_SUMMARY]: 'Calls Summary',
};
