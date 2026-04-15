import { Platform, useWindowDimensions } from 'react-native';

export type PlatformType = 'phone' | 'tablet' | 'desktop';

export interface GridConfig {
  baseWidth: number;
  baseHeight: number;
  numColumns: number;
  gridPadding: number;
  maxWidgetWidth: number;
  maxWidgetHeight: number;
  screenWidth: number;
  platform: PlatformType;
}

function getPlatformType(width: number): PlatformType {
  if (Platform.OS === 'web') {
    if (width > 1024) return 'desktop';
    if (width > 600) return 'tablet';
    return 'phone';
  }

  // Native: use width thresholds
  if (width > 1024) return 'desktop';
  if (width >= 600) return 'tablet';
  return 'phone';
}

function computeGridConfig(width: number): GridConfig {
  const platform = getPlatformType(width);
  const gridPadding = 8;
  const availableWidth = width - gridPadding * 2;

  let baseUnit: number;
  let maxWidgetHeight: number;

  if (width > 1920) {
    // Large desktop
    baseUnit = 100;
    maxWidgetHeight = 12;
  } else if (width > 1024) {
    // Desktop/Web
    baseUnit = 120;
    maxWidgetHeight = 10;
  } else if (width >= 600) {
    // Tablet
    baseUnit = 140;
    maxWidgetHeight = 6;
  } else {
    // Phone
    baseUnit = 140;
    maxWidgetHeight = 4;
  }

  const numColumns = Math.max(2, Math.floor(availableWidth / baseUnit));

  return {
    baseWidth: baseUnit,
    baseHeight: baseUnit,
    numColumns,
    gridPadding,
    maxWidgetWidth: numColumns,
    maxWidgetHeight,
    screenWidth: width,
    platform,
  };
}

export function useGridConfig(): GridConfig {
  const { width } = useWindowDimensions();
  return computeGridConfig(width);
}

// Non-hook version for use outside components (e.g., store actions)
export function getGridConfigForWidth(width: number): GridConfig {
  return computeGridConfig(width);
}
