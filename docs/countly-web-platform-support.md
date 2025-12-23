# Countly Web Platform Support

## Overview

This document describes the changes made to add web platform support for the Countly analytics SDK in the React Native/Expo app.

## Problem

The `countly-sdk-react-native-bridge` package is a native module that only works on iOS and Android. When running the app on web, it would throw an error:

```
Cannot read properties of undefined (reading 'get')
```

This error occurred because the native bridge tried to access native modules that don't exist in the web environment.

## Solution

Created a platform-aware wrapper that conditionally loads the Countly SDK based on the platform:

### 1. Platform-Aware Wrapper (`src/lib/countly.ts`)

A new module that:
- Detects the current platform using React Native's `Platform.OS`
- For web: Provides a no-op implementation of the Countly SDK
- For iOS/Android: Dynamically requires the actual `countly-sdk-react-native-bridge` module

```typescript
if (Platform.OS === 'web') {
  // No-op implementation for web
  Countly = {
    events: {
      recordEvent: () => { /* no-op */ },
    },
    // ... other no-op methods
  };
} else {
  // Native implementation
  Countly = require('countly-sdk-react-native-bridge').default;
}
```

### 2. Updated Import Statements

Updated all files that import Countly to use the new wrapper:

- `src/services/analytics.service.ts`
- `src/services/aptabase.service.ts`
- `src/components/common/countly-provider.tsx`

Changed from:
```typescript
import Countly from 'countly-sdk-react-native-bridge';
```

To:
```typescript
import Countly from '@/lib/countly';
```

### 3. CountlyProvider Updates

Updated the `CountlyProvider` component to:
- Skip initialization on web platform
- Conditionally import `CountlyConfig` only on native platforms
- Use optional chaining when calling Countly methods

### 4. Test Updates

Updated test files to mock the new wrapper instead of the native module directly:

- `src/services/__tests__/countly.service.test.ts`: Updated to mock `@/lib/countly`
- Created `src/lib/__tests__/countly.test.ts`: Tests for the platform-aware wrapper

## Benefits

1. **Cross-Platform Compatibility**: App now runs on web without Countly-related errors
2. **Graceful Degradation**: Web analytics are silently skipped (or can be replaced with web-specific analytics)
3. **No Breaking Changes**: Native platforms continue to use Countly as before
4. **Type Safety**: TypeScript interfaces ensure consistent API across platforms
5. **Testability**: Platform behavior can be easily tested and mocked

## Future Enhancements

If web analytics are needed in the future, the no-op implementation can be replaced with:

1. **Google Analytics**: Using `react-ga` or similar
2. **Segment**: Using `@segment/analytics-next`
3. **Custom Analytics**: Direct API calls to a web analytics service
4. **Countly Web SDK**: Using the web-specific Countly package

Example:
```typescript
if (Platform.OS === 'web') {
  // Use web analytics instead of no-op
  Countly = {
    events: {
      recordEvent: (eventName, properties) => {
        // Send to Google Analytics, Segment, etc.
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', eventName, properties);
        }
      },
    },
  };
}
```

## Testing

To verify the fix:

1. **Web**: Run `yarn web` and verify no Countly errors in console
2. **iOS**: Run `yarn ios` and verify analytics still work
3. **Android**: Run `yarn android` and verify analytics still work
4. **Tests**: Run `yarn test` to verify all tests pass

## Files Modified

- ✅ `src/lib/countly.ts` (new file)
- ✅ `src/services/analytics.service.ts`
- ✅ `src/services/aptabase.service.ts`
- ✅ `src/components/common/countly-provider.tsx`
- ✅ `src/services/__tests__/countly.service.test.ts`
- ✅ `src/lib/__tests__/countly.test.ts` (new file)
- ✅ `__mocks__/countly-sdk-react-native-bridge.ts`

## Related Documentation

- [Countly Migration Guide](./countly-migration.md)
- [Analytics Migration](./analytics-migration.md)
