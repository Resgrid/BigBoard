# Android Tablet Safe Area Handling Fix

## Problem
On Android tablets, the new call view did not hide or properly handle the bottom Android system navigation bar, causing it to overlap with the bottom buttons of the form.

## Root Cause
The new call screen was not using proper safe area handling for Android devices, specifically:
1. Missing `FocusAwareStatusBar` component for edge-to-edge experience
2. No safe area insets applied to prevent overlap with system UI
3. Bottom buttons were positioned without considering system navigation bar

## Solution

### 1. Added FocusAwareStatusBar Component
Added `FocusAwareStatusBar` import and usage to ensure proper edge-to-edge handling on Android:

```tsx
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';

// In component render:
<FocusAwareStatusBar />
```

The `FocusAwareStatusBar` component automatically:
- Makes the navigation bar transparent with overlay behavior
- Sets system UI flags to hide navigation bar when needed
- Provides a seamless edge-to-edge experience

### 2. Added Safe Area Insets
Imported and used `useSafeAreaInsets` from `react-native-safe-area-context`:

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
```

### 3. Applied Safe Area Padding
Applied safe area insets to both top and bottom of the screen:

**Top Padding (ScrollView):**
```tsx
<ScrollView 
  className="flex-1 px-4 py-6" 
  contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }} 
  style={{ paddingTop: Math.max(insets.top, 16) }}
>
```

**Bottom Padding (Button Container):**
```tsx
<Box 
  className="mb-6 flex-row space-x-4" 
  style={{ paddingBottom: Math.max(insets.bottom, 16) }}
>
```

### 4. Safe Area Implementation Details

- **Minimum Padding**: Uses `Math.max(insets.bottom, 16)` to ensure at least 16px of padding even when insets are smaller
- **Dynamic Padding**: Adapts to different device configurations and orientations
- **Android Tablets**: Typical navigation bar height is ~48px, which gets properly handled
- **Cross-Platform**: Works on both iOS and Android devices

## Benefits

1. **No UI Overlap**: Bottom buttons are no longer hidden behind the system navigation bar
2. **Professional Appearance**: Provides a seamless edge-to-edge experience
3. **Device Compatibility**: Works across different Android tablet sizes and configurations
4. **Accessibility**: Ensures all interactive elements are accessible to users
5. **Consistent UX**: Matches the behavior of other screens in the app

## Files Modified

- `/src/app/call/new/index.tsx`: Added safe area handling and FocusAwareStatusBar

## Testing

The fix should be tested on:
1. Android tablets with different screen sizes
2. Devices with different navigation bar heights
3. Both portrait and landscape orientations
4. Light and dark themes

## Future Considerations

This pattern should be applied to other screens that might have similar issues with system UI overlap on Android devices.