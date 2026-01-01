# SignalR Service Reconnection Self-Blocking Fix

## Problem

The SignalR service had a self-blocking issue where reconnection attempts would prevent direct connection attempts. Specifically:

1. When a hub was in "reconnecting" state, direct connection attempts would be blocked
2. This could lead to scenarios where:
   - A reconnection attempt was in progress
   - A user tried to manually connect
   - The manual connection would be rejected
   - If the reconnection failed, the hub would be stuck in reconnecting state
   - Future manual connection attempts would continue to be blocked

## Root Cause

The service used a single `reconnectingHubs` Set to track both:
- Automatic reconnection attempts 
- Direct connection attempts

This caused the guard logic in `_connectToHubInternal` (lines 240-246) to block direct connections when hubs were in reconnecting state.

## Solution

Implemented a more granular state management system:

### 1. New State Enum

```typescript
export enum HubConnectingState {
  IDLE = 'idle',
  RECONNECTING = 'reconnecting', 
  DIRECT_CONNECTING = 'direct-connecting',
}
```

### 2. State Management

- Added `hubStates: Map<string, HubConnectingState>` to track individual hub states
- Added `setHubState()` method to manage state transitions and maintain backward compatibility
- Added helper methods: `isHubConnecting()`, `isHubReconnecting()`

### 3. Updated Connection Logic

**Direct Connections (`_connectToHubInternal` and `_connectToHubWithEventingUrlInternal`):**
- Only block duplicate direct connections (same `DIRECT_CONNECTING` state)
- Allow direct connections even when hub is in `RECONNECTING` state  
- Log reconnecting state but proceed with connection attempt
- Set state to `DIRECT_CONNECTING` during connection attempt
- Clean up state on both success and failure

**Automatic Reconnections:**
- Set state to `RECONNECTING` during reconnection attempts
- Clean up state on both success and failure
- Maintain existing reconnection logic and limits

### 4. Backward Compatibility

- Maintained the `reconnectingHubs` Set for existing API compatibility
- `setHubState()` automatically manages the legacy set alongside the new state map
- All existing methods continue to work as expected

## Key Changes

1. **Lines 240-246**: Changed from blocking all connections during reconnect to only blocking duplicate direct connections
2. **State Management**: Added proper state tracking with cleanup in success/failure paths
3. **Connection Isolation**: Reconnection attempts and direct connections now operate independently
4. **Cleanup**: Ensured state cleanup happens in all code paths to prevent stuck states

## Testing

- Updated existing tests to use new state management system
- All existing tests continue to pass
- Tests verify that direct connections are allowed during reconnection
- Tests verify proper state cleanup in success and failure scenarios

## Benefits

- Eliminates self-blocking behavior during reconnections
- Allows users to manually retry connections even during automatic reconnection
- Prevents permanent stuck states 
- Maintains full backward compatibility
- Provides better separation of concerns between automatic and manual connections
