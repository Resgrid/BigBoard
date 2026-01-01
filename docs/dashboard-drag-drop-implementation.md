# Dashboard Drag & Drop Widget Placement

## Overview
This document describes the implementation of press-and-hold drag-and-drop functionality for dashboard widgets with persistent storage.

## Implementation Details

### Features
- **Edit Mode Gated**: Drag-and-drop only works when edit mode is enabled
- **Long Press to Drag**: Users press and hold for 200ms to initiate dragging (edit mode only)
- **Visual Grip Indicator**: GripVertical icon appears in widget headers during edit mode
- **Header as Drag Handle**: Entire widget header acts as the drag grip area
- **Visual Feedback**: Widgets scale to 1.1x when being dragged, header background changes in edit mode
- **Header Protection**: Widgets prevented from rendering under the top application header
- **Persistent Storage**: Widget positions are automatically saved to MMKV storage
- **Automatic Restoration**: Widget layout is restored when the app reloads

### Components Modified

#### Dashboard.tsx
- Added `delayLongPress` prop to DraggableGrid (200ms in edit mode, effectively disabled otherwise)
- Added `dragStartAnimation` for visual feedback during drag
- Updated `handleDragRelease` to properly type the widget array
- Added `contentContainerStyle={{ paddingTop: 8 }}` to ScrollView to prevent widgets from rendering under header
- Drag functionality only active when `isEditMode` is true

#### WidgetContainer.tsx
- Added `GripVertical` icon from lucide-react-native
- Grip icon appears on the left side of header in edit mode
- Header background changes in edit mode (darker shade to indicate interactivity)
- Title text uses `flex-1` to allow proper spacing with grip and remove button
- Entire header area acts as the drag handle

#### Store (dashboard/store.ts)
- Uses Zustand with persist middleware
- MMKV storage backend for fast, persistent storage
- `updateWidgets` function automatically saves new positions
- All widget state (including positions) persisted under key `dashboard-widgets`

### User Flow

1. **Enter Edit Mode**: User taps "Edit" button in the header
2. **Visual Changes**: Widget headers display grip icons and change background color
3. **Rearrange Widgets**: 
   - Press and hold any widget header for 200ms
   - Widget scales up to indicate it's draggable
   - Drag to desired position on the grid
   - Release to place
4. **Exit Edit Mode**: Tap "Done" button
5. **Persistence**: Layout is automatically saved and restored on app restart

### Technical Details

#### Drag Configuration
```typescript
delayLongPress={isEditMode ? 200 : 999999}
dragStartAnimation={isEditMode ? { scale: 1.1, duration: 200 } : undefined}
```

- In edit mode: 200ms delay enables comfortable drag initiation
- Outside edit mode: 999999ms delay effectively disables dragging
- Scale animation provides clear visual feedback

#### Widget Header Design
```typescript
{isEditMode && <GripVertical size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />}
```

- GripVertical icon shown only in edit mode
- Header background changes to indicate draggability
- Entire header area acts as drag handle (not just the icon)
- Icon provides clear affordance for drag interaction

#### Header Protection
```typescript
contentContainerStyle={{ paddingTop: 8 }}
```

- ScrollView content padding prevents widgets from rendering under app header
- Ensures widgets remain below the top navigation bar
- 8px padding provides visual separation

#### Storage
- **Engine**: MMKV (fast, synchronous key-value storage)
- **Key**: `dashboard-widgets`
- **Format**: JSON serialization via Zustand persist middleware
- **Persistence**: Automatic on every state change

#### Grid Layout
- Dynamic column calculation based on screen width
- Base widget size: 180x180 pixels
- All widgets currently use 1x1 grid units for uniformity

### Testing
To test the implementation:
1. Launch the app
2. Navigate to the Dashboard tab
3. Tap "Edit" in the header
4. Verify grip icons appear in widget headers
5. Verify header backgrounds change to indicate edit mode
6. Press and hold any widget header
7. Drag to a new position
8. Verify widget doesn't overlap with top app header
9. Tap "Done"
10. Close and restart the app
11. Verify widgets remain in their new positions

### Future Enhancements
- Variable widget sizes (2x2, 1x2, etc.)
- Haptic feedback on drag start
- Grid snap guides during drag
- Undo/redo for layout changes
- Export/import layout configurations
