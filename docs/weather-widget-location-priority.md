# Weather Widget Location Priority

## Overview

The Weather Widget now supports multiple sources for determining the location to fetch weather data for. This enhancement allows for more flexible configuration and better fallback behavior.

## Location Priority Order

The widget uses the following priority order to determine the location:

### 1. Widget Metadata (Highest Priority)
If the weather widget has `lat` and `lon` metadata set (and they are non-zero), those coordinates will be used.

**Example:**
```typescript
const weatherWidget: Widget = {
  id: 'weather-1',
  type: WidgetType.WEATHER,
  name: 'Weather',
  x: 0,
  y: 0,
  w: 1,
  h: 1,
  key: 'weather-1',
  data: {
    lat: 40.7128,  // New York City latitude
    lon: -74.0060  // New York City longitude
  }
};
```

### 2. Map Center Coordinates
If widget metadata is not set, the widget will use the `CenterLat` and `CenterLon` from the map data (fetched via `getMapDataAndMarkers` API and stored in the map store).

This is useful when you want the weather widget to show weather for the center of your map view.

### 3. Location Store
If neither widget metadata nor map center coordinates are available, the widget will check the location store for previously saved coordinates.

### 4. Device/Browser Location (Fallback)
As a final fallback, the widget will request location permissions from the device/browser and use the current device location.

If location permissions are denied, the widget will attempt to fetch map data and use those coordinates as a last resort.

## Map Store

A new Zustand store has been created to manage map data across widgets:

**Location:** `src/stores/mapping/map-store.ts`

The store provides:
- `mapData`: The current map data including center coordinates
- `fetchMapData()`: Function to fetch map data from the API
- `setMapData()`: Function to set map data (used by MapWidget)

## Implementation Details

### MapWidget Integration
The MapWidget automatically populates the map store when it loads map data. This allows other widgets (like the Weather Widget) to access the map center coordinates without making additional API calls.

### Weather Widget Changes
The WeatherWidget now:
- Accepts optional `metadata` prop with `lat` and `lon` properties
- Uses the map store to access map center coordinates
- Falls back gracefully through all priority levels
- Provides detailed console logging for debugging location resolution

## Usage Example

To configure a weather widget with specific coordinates:

```typescript
// In your widget configuration
const widgets: Widget[] = [
  {
    id: 'weather-1',
    type: WidgetType.WEATHER,
    name: 'Weather - HQ',
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    key: 'weather-1',
    data: {
      lat: 37.7749,  // San Francisco
      lon: -122.4194
    }
  }
];
```

## Benefits

1. **Flexibility**: Configure specific locations per widget instance
2. **Efficiency**: Reuse map data without additional API calls
3. **Graceful Fallback**: Multiple fallback options ensure the widget works in various scenarios
4. **Better UX**: Reduces location permission prompts by using alternative sources first

## Related Files

- `src/components/widgets/WeatherWidget.tsx` - Weather widget implementation
- `src/components/widgets/MapWidget.tsx` - Map widget with store integration
- `src/components/widgets/WidgetRenderer.tsx` - Widget renderer with metadata passing
- `src/stores/mapping/map-store.ts` - New map data store
- `src/api/mapping/mapping.ts` - Map data API functions
