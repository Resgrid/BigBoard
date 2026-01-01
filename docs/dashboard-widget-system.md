# Dashboard Widget System Implementation

## Overview

The home view has been refactored into a customizable dashboard system that allows users to compose their own view by adding, removing, and rearranging widgets. This implementation is inspired by the Angular2 BigBoard (https://github.com/Resgrid/BigBoard) but built for React Native using modern React patterns.

## Architecture

### Core Components

1. **Dashboard** (`src/components/Dashboard.tsx`)
   - Main container component that manages the grid layout
   - Uses `react-native-draggable-grid` for drag-and-drop functionality
   - Handles widget management (add/remove/reorder)
   - Provides edit mode toggle

2. **Widget Types** (`src/types/widget.ts`)
   - Defines all available widget types
   - Widget layout interface with position and size
   - Default widget sizes configuration
   - Widget labels for UI display

3. **Dashboard Store** (`src/stores/dashboard/store.ts`)
   - Zustand store for state management
   - Persists widget configuration using MMKV storage
   - Handles widget CRUD operations
   - Manages edit mode state

### Available Widgets

1. **TimeWidget** - Displays current time and date with live updates
2. **PersonnelWidget** - Shows personnel status and availability
3. **UnitsWidget** - Displays unit status and assignments
4. **CallsWidget** - Shows active calls and priorities
5. **MapWidget** - Interactive map view (placeholder for full implementation)
6. **WeatherWidget** - Current weather conditions
7. **NotesWidget** - Quick notes and task list

## Features

### User Capabilities

- **Add Widgets**: Click the '+' button to see available widgets and add them to the dashboard
- **Remove Widgets**: Enable edit mode and click the 'X' on any widget to remove it
- **Rearrange Widgets**: Drag and drop widgets to reorder them on the dashboard
- **Persistent Layout**: Widget configuration is saved automatically and restored on app restart
- **Edit Mode**: Toggle between view and edit modes for safe widget management

### Technical Features

- **Responsive Grid**: Automatically adjusts number of columns based on screen width
- **Dark Mode Support**: All widgets adapt to system color scheme
- **Persistent Storage**: Uses MMKV for fast, synchronous storage
- **Type Safety**: Full TypeScript support throughout the implementation
- **Modular Design**: Each widget is independent and easy to extend

## File Structure

```
src/
├── components/
│   ├── Dashboard.tsx                 # Main dashboard container
│   └── widgets/
│       ├── WidgetContainer.tsx       # Base container for all widgets
│       ├── WidgetRenderer.tsx        # Widget type renderer
│       ├── TimeWidget.tsx            # Time widget implementation
│       ├── PersonnelWidget.tsx       # Personnel widget implementation
│       ├── UnitsWidget.tsx           # Units widget implementation
│       ├── CallsWidget.tsx           # Calls widget implementation
│       ├── MapWidget.tsx             # Map widget implementation
│       ├── WeatherWidget.tsx         # Weather widget implementation
│       └── NotesWidget.tsx           # Notes widget implementation
├── stores/
│   └── dashboard/
│       └── store.ts                  # Dashboard state management
├── types/
│   └── widget.ts                     # Widget type definitions
└── app/
    └── (app)/
        └── home.tsx                  # Home screen using Dashboard
```

## Widget Development

### Creating a New Widget

1. Define the widget type in `src/types/widget.ts`:
```typescript
export enum WidgetType {
  // ... existing types
  NEW_WIDGET = 'new-widget',
}
```

2. Add default size and label:
```typescript
export const DEFAULT_WIDGET_SIZES: Record<WidgetType, { w: number; h: number }> = {
  // ... existing sizes
  [WidgetType.NEW_WIDGET]: { w: 2, h: 2 },
};

export const WIDGET_LABELS: Record<WidgetType, string> = {
  // ... existing labels
  [WidgetType.NEW_WIDGET]: 'New Widget',
};
```

3. Create the widget component in `src/components/widgets/`:
```typescript
import React from 'react';
import { WidgetContainer } from './WidgetContainer';

interface NewWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
}

export const NewWidget: React.FC<NewWidgetProps> = ({ onRemove, isEditMode }) => {
  return (
    <WidgetContainer
      title="New Widget"
      onRemove={onRemove}
      isEditMode={isEditMode}
      testID="new-widget"
    >
      {/* Widget content */}
    </WidgetContainer>
  );
};
```

4. Add to `WidgetRenderer.tsx`:
```typescript
import { NewWidget } from './NewWidget';

// In switch statement:
case WidgetType.NEW_WIDGET:
  return <NewWidget onRemove={onRemove} isEditMode={isEditMode} />;
```

## Data Integration

Currently, widgets display mock data. To integrate with real APIs:

1. **Personnel Widget**: Connect to personnel API endpoints
2. **Units Widget**: Connect to units API endpoints
3. **Calls Widget**: Connect to calls API endpoints
4. **Map Widget**: Integrate with Mapbox or similar mapping library
5. **Weather Widget**: Connect to weather API service
6. **Notes Widget**: Connect to notes storage API

Example integration pattern:
```typescript
import { usePersonnel } from '@/api/personnel/use-personnel';

export const PersonnelWidget: React.FC<PersonnelWidgetProps> = ({ onRemove, isEditMode }) => {
  const { data: personnel, isLoading } = usePersonnel();
  
  // Render logic using real data
};
```

## Configuration

### Grid Layout
- Default widget width: 180px
- Default widget height: 180px
- Columns: Auto-calculated based on screen width
- Gap: 5px between widgets

### Storage
- Storage key: `dashboard-widgets`
- Storage engine: MMKV
- Auto-save: On every widget change

## Testing

Test IDs are provided for all interactive elements:
- `home-screen`: Main dashboard container
- `dashboard-edit-button`: Edit mode toggle
- `dashboard-add-button`: Add widget button
- `add-widget-{type}`: Add specific widget buttons
- `{widget-type}-widget`: Individual widgets
- `{widget-type}-widget-remove-button`: Remove widget buttons

## Future Enhancements

1. **Resizable Widgets**: Add ability to resize widgets individually
2. **Widget Settings**: Per-widget configuration options
3. **Widget Templates**: Pre-configured dashboard layouts
4. **Export/Import**: Share dashboard configurations
5. **Multi-Device Sync**: Sync dashboard across devices
6. **Custom Widgets**: User-defined widget types
7. **Widget Marketplace**: Share widgets with community

## Migration from Old Home Screen

The old home screen with quick action buttons has been replaced with the new dashboard. Users will need to:
1. Add their preferred widgets on first launch
2. Arrange widgets to their preference
3. Configuration is saved automatically

To restore quick actions functionality, you can create a "Quick Actions" widget that displays the previous button layout.

## Dependencies

- `react-native-draggable-grid`: Grid layout and drag-drop functionality
- `zustand`: State management
- `react-native-mmkv`: Fast persistent storage
- `lucide-react-native`: Icons

## Performance Considerations

- Widgets render independently to prevent unnecessary re-renders
- MMKV provides synchronous, fast storage operations
- Drag operations use native gesture handlers for smooth performance
- Widget data can be lazy-loaded for better initial load times

## Troubleshooting

### Widgets not persisting
- Check MMKV storage permissions
- Verify storage key uniqueness
- Check for storage quota issues

### Drag performance issues
- Reduce number of widgets
- Optimize widget render functions
- Check for memory leaks in widget components

### Layout issues
- Verify screen dimensions calculation
- Check responsive breakpoints
- Test on different screen sizes

## References

- Original Angular BigBoard: https://github.com/Resgrid/BigBoard
- React Native Draggable Grid: https://github.com/SHISME/react-native-draggable-grid
- Zustand Documentation: https://zustand-demo.pmnd.rs/
- MMKV Documentation: https://github.com/mrousavy/react-native-mmkv
