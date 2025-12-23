# NotificationInbox Multi-Select Refactor

## Overview

The NotificationInbox component has been refactored to support multi-select functionality with bulk delete operations. Users can now select multiple notifications and delete them all at once with a confirmation modal.

## Features Added

### 1. Multi-Select Mode
- **Long Press to Enter**: Long press any notification to enter selection mode
- **Visual Indicators**: Selected notifications are highlighted with a blue background and checkmark icon
- **Selection Counter**: Shows the count of selected notifications in the header

### 2. Selection Controls
- **Select All/Deselect All**: Toggle button to select or deselect all notifications at once
- **Individual Toggle**: Tap notifications to toggle their selection state in selection mode
- **Cancel**: Exit selection mode without performing any actions

### 3. Bulk Delete
- **Delete Button**: Trash icon button that's only enabled when notifications are selected
- **Confirmation Modal**: Shows a confirmation dialog before deleting multiple notifications
- **Batch Processing**: Iterates through selected notifications and calls the `deleteMessage` API for each
- **Loading State**: Shows loading indicator while deletion is in progress
- **Error Handling**: Displays appropriate toast messages for success/failure

### 4. Enhanced UI/UX
- **Responsive Header**: Changes layout based on normal vs selection mode
- **Loading States**: Visual feedback during delete operations
- **Toast Notifications**: Success/error messages for user feedback
- **Clean State Management**: Resets selection state when component closes

## Technical Implementation

### New State Variables
```typescript
const [isSelectionMode, setIsSelectionMode] = useState(false);
const [selectedNotificationIds, setSelectedNotificationIds] = useState<Set<string>>(new Set());
const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
const [isDeletingSelected, setIsDeletingSelected] = useState(false);
```

### Key Functions
- `enterSelectionMode()`: Enters multi-select mode
- `exitSelectionMode()`: Exits multi-select mode and clears selections
- `toggleNotificationSelection(id)`: Toggles selection state of a notification
- `selectAllNotifications()`: Selects all visible notifications
- `deselectAllNotifications()`: Clears all selections
- `handleBulkDelete()`: Shows confirmation modal for bulk delete
- `confirmBulkDelete()`: Executes the bulk delete operation

### Component Structure

#### Header Modes
1. **Normal Mode**: Shows "Notifications" title with close and menu buttons
2. **Selection Mode**: Shows selection count with Select All, Delete, and Cancel buttons

#### Notification Items
- **Normal Mode**: Tap to view details, long press to enter selection
- **Selection Mode**: Tap to toggle selection, shows checkmark/circle icons

#### Confirmation Modal
- Uses the existing `Modal` component from `@/components/ui/modal`
- Displays count of notifications to be deleted
- Provides Cancel and Delete buttons

## Usage

### Entering Selection Mode
1. Long press any notification item
2. Or tap the menu (three dots) button in the header (future enhancement)

### Selecting Notifications
1. In selection mode, tap individual notifications to toggle selection
2. Use "Select All" to select all visible notifications
3. Use "Deselect All" to clear all selections

### Bulk Delete
1. Select one or more notifications
2. Tap the trash icon button
3. Confirm deletion in the modal dialog
4. Wait for completion and see success/error toast

### Exiting Selection Mode
1. Tap "Cancel" button
2. Complete a bulk delete operation
3. Close the notification inbox

## API Integration

The component uses the existing `deleteMessage` API function:
```typescript
import { deleteMessage } from '@/api/novu/inbox';
```

Each selected notification is deleted individually using Promise.all:
```typescript
const deletePromises = Array.from(selectedNotificationIds).map((id) => deleteMessage(id));
await Promise.all(deletePromises);
```

## Error Handling

- Network errors during deletion show error toast
- Individual notification delete failures are handled gracefully
- Loading states prevent multiple simultaneous operations
- State is properly reset on errors

## Accessibility

- Visual indicators for selection state
- Clear labeling of actions
- Confirmation dialogs for destructive actions
- Loading states for better user feedback

## Testing

Comprehensive test suite includes:
- Component rendering in different states
- Selection mode entry/exit
- Multi-select functionality
- Bulk delete operations
- Error handling
- State management
- API integration

Run tests with:
```bash
npm test -- --testPathPattern="NotificationInbox.test.tsx"
```

## Styling

New styles added:
- `selectedNotificationItem`: Blue background for selected items
- `selectionIndicator`: Spacing for checkmark/circle icons
- `selectionHeader`: Layout for selection mode header
- `selectionCount`: Styling for selection counter
- `selectionActions`: Layout for selection mode buttons
- `headerActions`: Layout for normal mode header buttons
- `actionButton`: Styling for menu button

## Dependencies

- `lucide-react-native`: Added CheckCircle, Circle, MoreVertical, Trash2 icons
- `@/components/ui/modal`: Used for confirmation dialog
- Existing dependencies: Button, Text, animations, etc.

## Future Enhancements

1. **Keyboard Shortcuts**: Add keyboard support for desktop usage
2. **Swipe Actions**: Swipe to delete individual notifications
3. **Filtering**: Select notifications by type or status
4. **Archive Functionality**: Bulk archive instead of delete
5. **Undo Feature**: Allow undoing bulk deletions
6. **Performance**: Virtual scrolling for large notification lists
