# LiveKit Store Permissions Refactoring

## Overview
The `requestPermissions` function in the LiveKit store has been refactored to use the `react-native-permissions` library instead of the built-in React Native permissions API.

## Changes Made

### 1. Import Changes
- **Removed**: `PermissionsAndroid` from React Native
- **Added**: `check`, `request`, `requestMultiple`, `PERMISSIONS`, `RESULTS`, and `Permission` types from `react-native-permissions`

### 2. Permission Request Logic

#### Android
- **Before**: Used `PermissionsAndroid.requestMultiple()` with Android-specific permission constants
- **After**: Uses `requestMultiple()` from `react-native-permissions` with cross-platform permission constants
- **Simplified**: Only requests `RECORD_AUDIO` permission as other foreground service permissions are handled at the manifest level

#### iOS
- **Added**: Proper iOS microphone permission handling using `check()` and `request()` functions
- **Improved**: Checks current permission status before requesting to avoid unnecessary prompts

#### Cross-platform
- **Enhanced**: Better error handling and logging for both platforms
- **Added**: Support for unsupported platforms (graceful degradation)

### 3. Benefits of the Refactoring

1. **Cross-platform Consistency**: Uses the same API for both Android and iOS
2. **Better Permission Management**: More granular control over permission states
3. **Improved Error Handling**: Better error messages and logging
4. **Type Safety**: Full TypeScript support with proper types
5. **Future-proof**: Uses a well-maintained third-party library that stays up-to-date with platform changes

### 4. Permission Details

#### Android Permissions
- `RECORD_AUDIO`: Required for microphone access during voice calls
- **Note**: Foreground service permissions (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, etc.) are declared in `AndroidManifest.xml` and don't require runtime requests

#### iOS Permissions
- `MICROPHONE`: Required for microphone access during voice calls

### 5. Testing
Comprehensive test suite added covering:
- Successful permission grants
- Permission denials
- Error scenarios
- Cross-platform compatibility
- Edge cases

## Usage
The `requestPermissions()` function can be called the same way as before:

```typescript
const { requestPermissions } = useLiveKitStore();
await requestPermissions();
```

The function will automatically handle platform-specific permission requests and provide appropriate logging for debugging purposes.

## Dependencies
- `react-native-permissions`: ^5.4.1 (already installed in the project)
