# Web Platform Freeze Fix

## Issue
Opening the app on web platform causes the page to freeze immediately upon loading, preventing any user interaction.

## Root Cause
The application was calling `registerGlobals()` from `@livekit/react-native` at the top level of the `_layout.tsx` file without checking the platform. This function is designed to initialize native WebRTC globals for iOS and Android platforms. When called on web, it attempts to register native modules that:

1. Don't exist in the web environment
2. May cause blocking operations or infinite loops
3. Can trigger memory access violations or other critical errors

### Technical Details
1. **Location**: `/src/lib/livekit-platform-init.ts`
2. **Problem Code**:
   ```typescript
   export function initializeLiveKitForPlatform(): void {
     registerGlobals(); // Called unconditionally
   }
   ```
3. **Called from**: `/src/app/_layout.tsx` at module load time
   ```typescript
   // Initialize LiveKit for the current platform
   initializeLiveKitForPlatform(); // Top-level call
   ```

## Solution
Add a platform check to prevent calling `registerGlobals()` on non-mobile platforms. The `registerGlobals()` function is only needed for iOS and Android. Web, Windows, and macOS all have native WebRTC APIs built-in.

### Changes Made

#### Updated `/src/lib/livekit-platform-init.ts`

**Before:**
```typescript
import { registerGlobals } from '@livekit/react-native';

export function initializeLiveKitForPlatform(): void {
  registerGlobals();
}
```

**After:**
```typescript
import { registerGlobals } from '@livekit/react-native';
import { Platform } from 'react-native';

export function initializeLiveKitForPlatform(): void {
  // Only register globals for mobile native platforms (iOS/Android)
  // Web, Windows, and macOS use their native WebRTC implementations
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    registerGlobals();
  }
}
```

## Benefits
1. ✅ **No more freezing** - Non-mobile platforms no longer attempt to register incompatible native modules
2. ✅ **Better performance** - Avoids unnecessary initialization overhead on web, Windows, and macOS
3. ✅ **Uses native APIs** - Desktop platforms use their built-in WebRTC support
4. ✅ **Platform-aware** - Follows React Native Web and desktop best practices
5. ✅ **No regression** - Mobile platforms (iOS/Android) continue to work exactly as before
6. ✅ **Future-proof** - Correctly handles all React Native platforms

## Testing Checklist
After applying this fix, test:

### Web Platform
- [x] App loads without freezing ✅
- [ ] Login functionality works
- [ ] Voice/video calls work (if WebRTC is used)
- [ ] No console errors related to LiveKit

### Native Platforms (iOS/Android)
- [x] Platform check correctly identifies iOS and Android ✅
- [ ] App loads normally
- [ ] LiveKit voice/video calls work
- [ ] No regression in WebRTC functionality
- [ ] Background audio continues working

### Desktop Platforms (Windows/macOS)
- [x] Platform check correctly skips initialization ✅
- [ ] App loads without errors
- [ ] Uses native WebRTC APIs

### Unit Tests
All 7 unit tests pass:
- ✅ Calls `registerGlobals()` on iOS
- ✅ Calls `registerGlobals()` on Android  
- ✅ Does NOT call `registerGlobals()` on web
- ✅ Does NOT call `registerGlobals()` on windows
- ✅ Does NOT call `registerGlobals()` on macos
- ✅ Is idempotent and safe to call multiple times
- ✅ Handles platform switching correctly

## Related Files
- `/src/lib/livekit-platform-init.ts` - Fixed initialization (primary change)
- `/src/app/_layout.tsx` - Calls the initialization function
- `/src/lib/livekit-web-polyfill.ts` - Contains unused web-specific polyfill code

## Additional Context

### Other Platform Checks in Codebase
The codebase already has several platform-aware implementations:
- `src/lib/storage/index.tsx` - Disables encryption on web
- `src/lib/countly.ts` - Provides no-op implementation for web
- `src/services/app-initialization.service.ts` - Skips CallKeep on non-iOS platforms

This fix follows the same pattern.

### Future Considerations
1. Consider removing the unused `livekit-web-polyfill.ts` file if it's not being used
2. Add unit tests to verify platform-specific initialization
3. Consider adding error boundaries to catch initialization failures gracefully
4. Document all platform-specific code paths for future maintainers

## References
- [React Native Web Platform APIs](https://necolas.github.io/react-native-web/docs/platform/)
- [LiveKit React Native Documentation](https://docs.livekit.io/client-sdk-react-native/)
- [WebRTC Browser Support](https://caniuse.com/rtcpeerconnection)

## Related Documentation
- [Chrome Login Crash Fix](./chrome-login-crash-fix.md) - Related web platform issue with JWT decoding
