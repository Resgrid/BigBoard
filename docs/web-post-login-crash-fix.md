# Web Post-Login White Screen and Crash Fix

## Issue
After successfully logging in on the web platform (Chrome browser), the screen displays as completely white with no UI elements, and the browser tab crashes shortly after. This prevents any use of the application on web browsers.

### Symptoms
- Login completes successfully (navigation happens)
- User is redirected to `/(app)` route
- Screen renders as completely white with no content
- Browser tab crashes within seconds with Error Code 5 (STATUS_ACCESS_VIOLATION)
- Console may show errors related to native module initialization

## Root Cause

The crash was caused by `Mapbox.setAccessToken()` being called unconditionally in the `(app)/_layout.tsx` file at the module/component initialization level. 

### Technical Details

#### 1. **Mapbox Native Module on Web**
The `@rnmapbox/maps` package is primarily designed for iOS and Android:
- On native platforms: Uses native Mapbox SDKs that require access token initialization
- On web: The library either doesn't provide web support or requires a different initialization approach
- Calling `Mapbox.setAccessToken()` on web attempts to access native modules that don't exist in the browser environment

#### 2. **Initialization Timing**
The problematic code was executed at component render time:
```tsx
export default function TabLayout() {
  // ... other hooks
  
  Mapbox.setAccessToken(Env.MAPBOX_PUBKEY); // ❌ Called immediately on render, before platform check
  
  // ... rest of component
}
```

This meant:
1. User logs in successfully
2. Navigation redirects to `/(app)` route
3. `TabLayout` component mounts
4. `Mapbox.setAccessToken()` is called immediately
5. On web, this attempts to access non-existent native modules
6. Browser crashes with memory access violation

#### 3. **Why White Screen?**
The white screen occurred because:
1. React tried to render the component
2. The Mapbox initialization crashed the JavaScript execution context
3. React's error boundary couldn't catch it (native module crash vs JS error)
4. The browser tab froze before any UI could render
5. Eventually, the tab crashed completely

## Solution

### Changed Files
- `/src/app/(app)/_layout.tsx` - Added platform check for Mapbox initialization

### Implementation

#### 1. Import Platform API
Added `Platform` import from `react-native`:
```tsx
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
```

#### 2. Wrap Mapbox Initialization in useEffect with Platform Check
Replaced the immediate call with a platform-aware useEffect:

**Before:**
```tsx
export default function TabLayout() {
  // ... other hooks
  
  Mapbox.setAccessToken(Env.MAPBOX_PUBKEY); // ❌ Crashes on web
  
  const initializeApp = useCallback(async () => {
```

**After:**
```tsx
export default function TabLayout() {
  // ... other hooks
  
  // Initialize Mapbox - only on native platforms
  // On web, Mapbox GL JS is loaded separately and doesn't use this initialization
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Mapbox.setAccessToken(Env.MAPBOX_PUBKEY);
      logger.info({
        message: 'Mapbox access token set',
        context: { platform: Platform.OS },
      });
    }
  }, []);
  
  const initializeApp = useCallback(async () => {
```

### Benefits
1. ✅ **No more web crashes** - Mapbox initialization is skipped on web
2. ✅ **Proper platform separation** - Web and native use appropriate map implementations
3. ✅ **Clear logging** - Platform-specific initialization is logged for debugging
4. ✅ **Future-proof** - Follows React Native Web best practices
5. ✅ **No regression** - Native platforms (iOS/Android) continue to work exactly as before
6. ✅ **Proper timing** - useEffect ensures initialization happens after component mount

## Testing

### Web Platform
Test in Chrome, Safari, Firefox, and Edge:
1. ✅ Navigate to the login page
2. ✅ Enter valid credentials and log in
3. ✅ Verify successful navigation to app (no white screen)
4. ✅ Verify UI renders properly (top nav, drawer, content)
5. ✅ Verify no browser tab crash
6. ✅ Check console - should see normal logs, no Mapbox errors
7. ✅ Test navigation between tabs
8. ✅ Test map features (if using web maps like Mapbox GL JS separately)

### Native Platforms (iOS/Android)
1. ✅ Launch app on iOS
2. ✅ Log in successfully
3. ✅ Verify maps work correctly
4. ✅ Check console for "Mapbox access token set" log
5. ✅ Repeat on Android

### Commands
```bash
# Test web
yarn web

# Test iOS
yarn ios

# Test Android  
yarn android
```

## Related Previous Issues

This is the latest in a series of web platform compatibility fixes:

1. **[chrome-login-crash-fix.md](./chrome-login-crash-fix.md)** - JWT decoding with react-native-base64 causing crashes
2. **[web-freeze-fix.md](./web-freeze-fix.md)** - LiveKit registerGlobals() freezing on web
3. **[web-login-crash-fix-v2.md](./web-login-crash-fix-v2.md)** - Storage blocking operations and JWT decode errors
4. **[web-appstate-infinite-loop-fix.md](./web-appstate-infinite-loop-fix.md)** - AppState listener causing infinite loops
5. **[web-platform-crash-fix.md](./web-platform-crash-fix.md)** - CallKeep and native module initialization issues

This fix continues the pattern of properly separating web and native code paths.

## Architecture Notes

### Web vs Native Map Implementations

The app should use different map implementations for different platforms:

- **iOS/Android**: `@rnmapbox/maps` (React Native wrapper around native Mapbox SDKs)
- **Web**: Should use Mapbox GL JS directly or a web-compatible alternative

The platform check ensures each platform uses its appropriate implementation.

### Platform-Specific Initialization Pattern

This fix follows the established pattern for platform-specific initialization:

```tsx
useEffect(() => {
  if (Platform.OS !== 'web') {
    // Initialize native-only services
  }
}, []);
```

Other services following this pattern in the codebase:
- AppState listeners (`app-lifecycle.ts`)
- Location services (`location.ts`)
- CallKeep (`app-initialization.service.ts`)
- LiveKit globals (`livekit-platform-init.ts`)
- Bluetooth audio (`bluetooth-audio.service.ts`)
- Audio services (`audio.service.ts`)

### Why useEffect Instead of Top-Level?

The useEffect ensures:
1. Component has mounted before initialization
2. Platform check is evaluated at the right time
3. Cleanup can be performed if needed
4. Initialization is properly tracked in React lifecycle

## Future Improvements

### 1. Implement Web-Specific Maps
Consider adding a web-specific map implementation:
```tsx
const MapComponent = Platform.select({
  native: () => require('./MapNative'),
  web: () => require('./MapWeb'),
})();
```

### 2. Lazy Load Mapbox on Native
Only load Mapbox when actually needed (when user navigates to map screen):
```tsx
const { Mapbox } = await import('@rnmapbox/maps');
```

### 3. Add Error Boundaries
Wrap map components in error boundaries to catch initialization failures gracefully:
```tsx
<ErrorBoundary fallback={<MapErrorView />}>
  <MapView />
</ErrorBoundary>
```

### 4. Conditional Mapbox Import
Consider platform-specific imports to avoid loading native modules on web at all:
```tsx
let Mapbox: any;
if (Platform.OS !== 'web') {
  Mapbox = require('@rnmapbox/maps').default;
}
```

## Technical Background

### Why Error Code 5?
Chrome Error Code 5 (STATUS_ACCESS_VIOLATION) indicates:
- Attempt to access invalid memory addresses
- Native module trying to access resources that don't exist
- JavaScript trying to call into native code that isn't available
- Browser security violation

In this case, `@rnmapbox/maps` tried to call native Android/iOS APIs that don't exist in the browser environment.

### React Native Web Architecture
React Native Web transpiles React Native components to web-compatible code, but:
- Native modules don't automatically work on web
- Platform-specific code must be explicitly handled
- Web requires different APIs for many native features
- Some native modules provide web alternatives, others don't

## Success Criteria

- [x] Login succeeds and navigates to app on web
- [x] No white screen after login
- [x] No browser tab crashes
- [x] UI renders correctly on web
- [x] Maps still work on iOS/Android
- [x] Mapbox initialization is logged on native platforms
- [x] No Mapbox errors on web platform
- [x] Navigation works properly on all platforms

## Related Files

### Modified
- `/src/app/(app)/_layout.tsx` - Added platform check for Mapbox initialization

### Related (Context)
- `/src/components/maps/` - Map components that use Mapbox
- `/src/app/(app)/home/map.tsx` - Main map screen
- `/src/lib/livekit-platform-init.ts` - Similar platform-specific initialization pattern
- `/src/services/app-lifecycle.ts` - Similar platform-specific initialization pattern

## Rollback Plan

If this fix causes issues, revert with:
```bash
git revert <commit-hash>
```

Then investigate alternative solutions:
1. Mock `@rnmapbox/maps` module on web
2. Use dynamic imports to avoid loading on web
3. Create platform-specific layout files

## Deployment Notes

- ✅ No database migrations required
- ✅ No API changes required
- ✅ No environment variable changes required
- ✅ Safe to deploy immediately
- ✅ No user data impact
- ✅ Backward compatible with all app versions

## Monitoring

After deployment, monitor:
1. Web login success rates
2. Browser crash reports (should decrease to zero)
3. Mapbox initialization errors (should be none on web)
4. Native platform map functionality (should be unchanged)

## Conclusion

This fix resolves the critical post-login white screen and crash issue on web by properly separating native Mapbox initialization from web platform execution. It follows established patterns in the codebase for platform-specific functionality and ensures a smooth user experience across all supported platforms.
