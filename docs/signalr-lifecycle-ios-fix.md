# SignalR Lifecycle iOS Hanging Issue - Fix Documentation

## Problem Summary

The `useSignalRLifecycle` hook was causing the React Native app to hang on iOS when built in release mode. This was particularly problematic during app state transitions (background/foreground).

## Root Causes Identified

### 1. **Race Conditions**
- Rapid app state changes could trigger multiple concurrent SignalR operations
- No protection against overlapping async operations
- Missing debouncing for rapid state transitions

### 2. **Unhandled Promise Rejections**
- Using `await` with multiple sequential promises that could fail
- One failing operation would block the entire chain
- Error handling was not preventing the hook from hanging

### 3. **Missing Operation Cancellation**
- No way to cancel pending operations when component unmounts
- No AbortController usage for async operations
- Potential memory leaks from uncanceled operations

### 4. **iOS-Specific Timing Issues**
- Release builds on iOS are more sensitive to timing issues
- JavaScript bridge optimizations in release mode can expose race conditions
- Missing debouncing made the app vulnerable to rapid state changes

## Solution Implementation

### 1. **Added Concurrency Protection**
```typescript
const isProcessing = useRef(false);
const pendingOperations = useRef<AbortController | null>(null);
```

### 2. **Implemented AbortController Pattern**
```typescript
// Cancel any pending operations
if (pendingOperations.current) {
  pendingOperations.current.abort();
}

isProcessing.current = true;
const controller = new AbortController();
pendingOperations.current = controller;
```

### 3. **Used Promise.allSettled for Error Handling**
```typescript
// Use Promise.allSettled to prevent one failure from blocking the other
const results = await Promise.allSettled([
  signalRStore.disconnectUpdateHub(), 
  signalRStore.disconnectGeolocationHub()
]);

// Log any failures without throwing
results.forEach((result, index) => {
  if (result.status === 'rejected') {
    const hubName = index === 0 ? 'UpdateHub' : 'GeolocationHub';
    logger.error({
      message: `Failed to disconnect ${hubName} on app background`,
      context: { error: result.reason },
    });
  }
});
```

### 4. **Added Debouncing**
```typescript
// Handle app going to background
useEffect(() => {
  if (!isActive && (appState === 'background' || appState === 'inactive') && hasInitialized) {
    // Debounce rapid state changes
    const timer = setTimeout(() => {
      if (!isActive && (appState === 'background' || appState === 'inactive')) {
        handleAppBackground();
      }
    }, 100);

    return () => clearTimeout(timer);
  }
}, [isActive, appState, hasInitialized, handleAppBackground]);
```

### 5. **Added Proper Cleanup**
```typescript
// Cleanup on unmount
useEffect(() => {
  return () => {
    if (pendingOperations.current) {
      pendingOperations.current.abort();
      pendingOperations.current = null;
    }
    isProcessing.current = false;
  };
}, []);
```

### 6. **Enhanced State Validation**
```typescript
// Double-check state before reconnecting
if (isActive && appState === 'active') {
  handleAppResume();
}
```

## Key Improvements

1. **Thread Safety**: Added concurrency protection to prevent multiple operations from running simultaneously
2. **Error Resilience**: Operations can fail individually without blocking others
3. **Memory Safety**: Proper cleanup prevents memory leaks
4. **Performance**: Debouncing reduces unnecessary operations
5. **iOS Compatibility**: Addresses iOS-specific timing sensitivities in release builds

## Testing

Added comprehensive tests covering:
- Basic disconnect/reconnect functionality
- Error handling scenarios
- Concurrency prevention
- Debouncing behavior
- Cleanup behavior

All tests pass and verify the robustness of the solution.

## Usage

The hook can now be safely enabled in the main app layout:

```typescript
// In _layout.tsx
useSignalRLifecycle({
  isSignedIn: status === 'signedIn',
  hasInitialized: hasInitialized.current,
});
```

## Impact

- ✅ Eliminates iOS hanging issues in release builds
- ✅ Improves app stability during state transitions
- ✅ Provides better error handling and logging
- ✅ Reduces unnecessary SignalR operations
- ✅ Maintains backward compatibility

## Future Considerations

1. Monitor app performance metrics to ensure the solution doesn't introduce new issues
2. Consider implementing similar patterns in other lifecycle-related hooks
3. Add telemetry to track SignalR connection health and state transition performance
