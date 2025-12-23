# Bluetooth Audio Service Refactoring

## Overview

The Bluetooth Audio Service has been refactored to support multiple platforms through an abstraction layer. This allows the same interface to work seamlessly across Native (iOS/Android) and Web platforms.

## Architecture

### File Structure

```
src/services/
├── bluetooth-audio.service.ts          # Main entry point (singleton)
└── bluetooth-audio/
    ├── base.service.ts                 # Abstract base class
    ├── native.service.ts               # iOS/Android implementation
    ├── web.service.ts                  # Web Bluetooth API implementation
    ├── factory.service.ts              # Platform detection & factory
    └── index.ts                        # Module exports
```

### Components

#### 1. BluetoothAudioServiceBase (base.service.ts)
Abstract base class defining the interface for all implementations:
- Device scanning and discovery
- Connection management
- Button event handling
- Audio routing integration with LiveKit
- Platform capability queries

#### 2. BluetoothAudioServiceNative (native.service.ts)
Native implementation for iOS and Android platforms:
- Uses `react-native-ble-manager` for BLE functionality
- Full support for device-specific button mappings (AINA, B01 Inrico, HYS)
- Native audio routing
- Background scanning capabilities

#### 3. BluetoothAudioServiceWeb (web.service.ts)
Web implementation using Web Bluetooth API:
- Browser-based Bluetooth Low Energy support
- User gesture-based device pairing
- Limited to supported browsers (Chrome, Edge, Opera)
- Simplified audio routing for web audio context

#### 4. Factory Service (factory.service.ts)
Platform detection and service instantiation:
- `createBluetoothAudioService()`: Creates appropriate implementation
- `isBluetoothSupported()`: Checks platform support
- `getAvailableBluetoothImplementations()`: Lists available implementations
- `getBluetoothCapabilityDescription()`: Human-readable capability info

## Usage

### Basic Usage

```typescript
import { bluetoothAudioService } from '@/services/bluetooth-audio.service';

// Initialize the service (automatically selects correct implementation)
await bluetoothAudioService.initialize();

// Start scanning for devices
await bluetoothAudioService.startScanning(10000); // 10 seconds

// Connect to a device
await bluetoothAudioService.connectToDevice(deviceId);

// Disconnect
await bluetoothAudioService.disconnectDevice();
```

### Platform Detection

```typescript
import { 
  isBluetoothSupported, 
  getAvailableBluetoothImplementations,
  getBluetoothCapabilityDescription 
} from '@/services/bluetooth-audio.service';

// Check if Bluetooth is supported
if (isBluetoothSupported()) {
  console.log('Bluetooth is supported');
}

// Get available implementations
const implementations = getAvailableBluetoothImplementations();
console.log('Native support:', implementations.native);
console.log('Web support:', implementations.web);
console.log('Recommended:', implementations.recommended);

// Get capability description
const description = getBluetoothCapabilityDescription();
console.log(description); // e.g., "Native Bluetooth support available (ios)"
```

### Custom Implementation

```typescript
import { createBluetoothAudioService } from '@/services/bluetooth-audio.service';

// Create a new instance manually
const bluetoothService = createBluetoothAudioService();

// Check platform
console.log(bluetoothService.getPlatform()); // 'native' | 'web' | 'mock'

// Check support
console.log(bluetoothService.isSupported()); // boolean
```

## Platform-Specific Features

### Native (iOS/Android)

- ✅ Full BLE scanning and connection management
- ✅ Device-specific button mappings (AINA, Inrico, HYS)
- ✅ PTT (Push-to-Talk) button support
- ✅ Audio routing to Bluetooth devices
- ✅ Background scanning
- ✅ RSSI-based device filtering
- ✅ Auto-reconnect to preferred devices

### Web

- ✅ User-initiated device pairing
- ✅ Basic audio device detection
- ✅ Button event handling (where supported)
- ⚠️ Requires user gesture for device selection
- ⚠️ Limited to supported browsers
- ❌ Background scanning not available
- ❌ RSSI filtering not available

## Migration from Old Code

The refactoring maintains backward compatibility. Existing code using:

```typescript
import { bluetoothAudioService } from '@/services/bluetooth-audio.service';
```

Will continue to work without changes. The service automatically selects the appropriate implementation based on the platform.

## Testing

The abstraction makes it easier to:
- Mock the service for unit tests
- Test platform-specific behavior in isolation
- Create test implementations

Example test setup:

```typescript
import { BluetoothAudioServiceBase } from '@/services/bluetooth-audio/base.service';

class MockBluetoothService extends BluetoothAudioServiceBase {
  // Implement abstract methods for testing
}
```

## Benefits

1. **Platform Independence**: Same API works across Native and Web platforms
2. **Maintainability**: Platform-specific code is isolated and easier to maintain
3. **Extensibility**: Easy to add new platform implementations
4. **Testing**: Simplified mocking and testing
5. **Type Safety**: Full TypeScript support with proper typing
6. **Documentation**: Clear separation of concerns and interfaces

## Future Enhancements

Potential additions to the abstraction:
- Mock implementation for testing
- Desktop implementation (Electron)
- Alternative Bluetooth protocols (Classic Bluetooth)
- Enhanced Web Bluetooth capabilities
- Platform-specific optimizations
