# SignalR Service and Map Hook Refactoring

## Summary of Changes

This refactoring addresses multiple issues with the SignalR service and map updates to prevent concurrent API calls, improve performance, and ensure thread safety.

## Key Issues Addressed

1. **Multiple concurrent calls to GetMapDataAndMarkers**: SignalR events were triggering multiple simultaneous API calls
2. **Lack of singleton enforcement**: SignalR service singleton pattern wasn't thread-safe
3. **No request cancellation**: In-flight requests weren't being cancelled when new events came in
4. **No debouncing**: Rapid consecutive SignalR events caused unnecessary API calls
5. **No connection locking**: Multiple concurrent connection attempts to the same hub were possible

## Changes Made

### 1. Enhanced SignalR Service (`src/services/signalr.service.ts`)

#### Thread-Safe Singleton Pattern
- Added proper singleton instance management with race condition protection
- Added `resetInstance()` method for testing purposes
- Improved singleton creation with polling mechanism to prevent multiple instances

#### Connection Locking
- Added `connectionLocks` Map to prevent concurrent connections to the same hub
- Added locking for `connectToHubWithEventingUrl()` and `connectToHub()` methods
- Added waiting logic for `disconnectFromHub()` and `invoke()` methods to wait for ongoing connections

#### Improved Reconnection Logic
- Enhanced `handleConnectionClose()` with better error handling and logging
- Added proper cleanup on max reconnection attempts reached
- Improved connection state management during reconnection attempts
- Added check to prevent reconnection if connection was re-established during delay

#### Better Error Handling
- Enhanced logging for all connection states
- Improved error context in log messages
- Added proper cleanup on connection failures

### 2. Refactored Map Hook (`src/hooks/use-map-signalr-updates.ts`)

#### Debouncing
- Added 1-second debounce delay to prevent rapid consecutive API calls
- Uses `setTimeout` to debounce SignalR update events

#### Concurrency Prevention
- Added `isUpdating` ref to prevent multiple concurrent API calls
- Only one `getMapDataAndMarkers` call can be active at a time

#### Request Cancellation
- Added `AbortController` support to cancel in-flight requests
- Previous requests are automatically cancelled when new updates come in
- Proper cleanup of abort controllers

#### Enhanced Error Handling
- Added special handling for `AbortError` (logged as debug, not error)
- Improved error context in log messages
- Better error recovery mechanisms

#### Proper Cleanup
- Added cleanup for debounce timers on unmount
- Added cleanup for abort controllers on unmount
- Proper cleanup in useEffect dependency arrays

## Performance Improvements

1. **Reduced API Calls**: Debouncing prevents excessive API calls during rapid SignalR events
2. **Request Cancellation**: Prevents unnecessary processing of outdated requests
3. **Singleton Enforcement**: Ensures only one SignalR service instance exists
4. **Connection Reuse**: Prevents duplicate connections to the same hub
5. **Better Memory Management**: Proper cleanup prevents memory leaks

## Testing

### New Test Coverage
- Comprehensive test suite for `useMapSignalRUpdates` hook (14 tests)
- Tests for debouncing, concurrency prevention, error handling, and cleanup
- Tests for AbortController integration
- Tests for edge cases and error scenarios

### Enhanced SignalR Service Tests
- Added tests for singleton behavior
- Added tests for connection locking
- Enhanced existing test coverage
- Added tests for improved reconnection logic

## Configuration

### Debounce Timing
- Default debounce delay: 1000ms (configurable via `DEBOUNCE_DELAY` constant)
- Can be adjusted based on performance requirements

### Reconnection Settings
- Max reconnection attempts: 5 (unchanged)
- Reconnection interval: 5000ms (unchanged)
- Enhanced with better cleanup and state management

## Backward Compatibility

All changes are backward compatible:
- Public API of SignalR service remains unchanged
- Map hook interface remains the same
- Existing functionality is preserved with performance improvements

## Usage

The refactored components work transparently with existing code:

```typescript
// SignalR service usage remains the same
const signalRService = SignalRService.getInstance();
await signalRService.connectToHubWithEventingUrl(config);

// Map hook usage remains the same
useMapSignalRUpdates(onMarkersUpdate);
```

## Benefits

1. **Improved Performance**: Fewer unnecessary API calls, better request management
2. **Better User Experience**: Faster map updates, reduced server load
3. **Enhanced Reliability**: Better error handling, improved connection management
4. **Memory Efficiency**: Proper cleanup prevents memory leaks
5. **Thread Safety**: Singleton pattern prevents race conditions
6. **Testability**: Comprehensive test coverage ensures reliability

## Future Considerations

1. **Configurable Debounce**: Could make debounce delay configurable via environment variables
2. **Request Priority**: Could implement priority system for different types of updates
3. **Caching**: Could add intelligent caching for map data
4. **Health Monitoring**: Could add connection health monitoring and reporting
