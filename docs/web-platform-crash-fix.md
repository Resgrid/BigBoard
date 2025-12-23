# Web Platform Crash Fix

## Issue
The app was crashing Chrome tabs with 5+ second function calls during initialization, causing the browser to hang and become unresponsive.

## Root Cause
Multiple issues were causing the web platform to hang:

1. **Native module imports**: The `react-native-callkeep` module was being imported at the module level in `callkeep.service.ios.ts`, which caused issues on web even though the code had platform checks.

2. **Improper platform checks**: The `_layout.tsx` file was using `require('react-native').Platform.OS` inside conditions rather than importing Platform properly, and had nested redundant checks.

3. **Initialization on wrong platforms**: Native-only services (badge clearing, keep-alive, background geolocation, app initialization) were all attempting to run on web platform.

## Solution

### 1. Created Web-Specific CallKeep Service
Created `src/services/callkeep.service.web.ts` as a no-op implementation for web platform:
- All methods return immediately without attempting to load native modules
- Maintains the same interface as the iOS version for compatibility

### 2. Platform-Specific Dynamic Imports
Updated imports in:
- `src/services/app-initialization.service.ts`
- `src/features/livekit-call/store/useLiveKitCallStore.ts`

Changed from:
```typescript
import { callKeepService } from './callkeep.service.ios';
```

To:
```typescript
let callKeepService: any;
if (Platform.OS === 'ios') {
  callKeepService = require('./callkeep.service.ios').callKeepService;
} else {
  callKeepService = require('./callkeep.service.web').callKeepService;
}
```

This ensures the native CallKeep module is never loaded on web platform.

### 3. Fixed Platform Checks in _layout.tsx
Updated the initialization logic to:
- Import `Platform` from `react-native` properly at the top of the file
- Add early return for web platform before any native operations
- Add early return for Expo Go
- Removed nested platform checks
- Simplified the conditional logic

Changed from:
```typescript
if (!isRunningInExpoGo() && require('react-native').Platform.OS !== 'web') {
  // nested checks
  if (require('react-native').Platform.OS !== 'web') {
    // ...
  }
}
```

To:
```typescript
// Skip all native initialization on web platform
if (Platform.OS === 'web') {
  return;
}

// Skip initialization in Expo Go
if (isRunningInExpoGo()) {
  return;
}

// All native operations here
```

## Impact
- Web platform no longer attempts to load or initialize native modules
- Chrome tabs no longer hang during app initialization
- iOS functionality remains unchanged
- Proper separation of platform-specific code

## Testing
1. Test web platform in Chrome - should load without hanging
2. Test iOS platform - CallKeep should still work for background audio
3. Test Android platform - should use web no-op version safely
4. Verify no TypeScript compilation errors

## Related Files
- `src/app/_layout.tsx`
- `src/services/callkeep.service.ios.ts`
- `src/services/callkeep.service.web.ts` (new)
- `src/services/app-initialization.service.ts`
- `src/features/livekit-call/store/useLiveKitCallStore.ts`
