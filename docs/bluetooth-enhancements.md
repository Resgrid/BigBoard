# Bluetooth Audio Enhancements

This document outlines the enhancements made to the Bluetooth audio system, including microphone muting on connection, audio device selection, and connection sounds.

## Key Features Implemented

### 1. Microphone Muted by Default on Connection

**Location**: `src/stores/app/livekit-store.ts`

- Modified the LiveKit connection logic to start with microphone muted
- Changed `setMicrophoneEnabled(true)` to `setMicrophoneEnabled(false)` on initial connection
- Users must manually unmute to start speaking

```typescript
// Set microphone to muted by default, camera to disabled (audio-only call)
await room.localParticipant.setMicrophoneEnabled(false);
await room.localParticipant.setCameraEnabled(false);
```

### 2. Audio Device Selection System

**Location**: `src/stores/app/bluetooth-audio-store.ts`

Enhanced the Bluetooth audio store with comprehensive audio device management:

#### New Types Added

- `AudioDeviceInfo`: Represents an audio device (microphone/speaker)
- `AudioDeviceSelection`: Tracks selected microphone and speaker
- Device types: `bluetooth`, `wired`, `speaker`, `default`

#### New Store Properties

- `availableAudioDevices`: List of all available audio devices
- `selectedAudioDevices`: Currently selected microphone and speaker

#### New Store Actions

- `setAvailableAudioDevices()`: Update available devices list
- `setSelectedMicrophone()`: Select a microphone device
- `setSelectedSpeaker()`: Select a speaker device
- `updateAudioDeviceAvailability()`: Update device availability status

### 3. Priority-Based Audio Routing

**Location**: `src/services/bluetooth-audio.service.ts`

Implemented intelligent audio device selection:

1. **Bluetooth Device Priority**: When a Bluetooth device connects, it automatically becomes the preferred audio device
2. **Fallback to Default**: When Bluetooth disconnects, system reverts to default audio devices
3. **Microphone Control**: Only Bluetooth devices with microphone capability are used for input

```typescript
// Add Bluetooth device to available audio devices
const bluetoothAudioDevice = {
  id: device.id,
  name: deviceName,
  type: 'bluetooth' as const,
  isAvailable: true,
};

// If device supports microphone, set it as selected microphone
if (this.supportsMicrophoneControl(device)) {
  bluetoothStore.setSelectedMicrophone(bluetoothAudioDevice);
}

// Set as selected speaker
bluetoothStore.setSelectedSpeaker(bluetoothAudioDevice);
```

### 4. Connection/Disconnection Audio Notifications

**Location**: `src/services/audio.service.ts`

Created a new audio service for playing connection sounds:

#### Features

- Plays notification sounds when participants join/leave LiveKit rooms
- Uses existing audio assets from the project
- Cross-platform support (iOS/Android)
- Leverages Expo Notifications API for sound playback

#### Sound Files Used

- Connection: `space_notification1.mp3`
- Disconnection: `space_notification2.mp3`

#### Integration with LiveKit

**Location**: `src/stores/app/livekit-store.ts`

```typescript
room.on(RoomEvent.ParticipantConnected, (participant) => {
  console.log('A participant connected', participant.identity);
  // Play connection sound when others join
  if (participant.identity !== room.localParticipant.identity) {
    audioService.playConnectionSound();
  }
});

room.on(RoomEvent.ParticipantDisconnected, (participant) => {
  console.log('A participant disconnected', participant.identity);
  // Play disconnection sound when others leave
  audioService.playDisconnectionSound();
});
```

### 5. Audio Device Selection UI Component

**Location**: `src/components/settings/audio-device-selection.tsx`

Created a comprehensive UI component for manual audio device selection:

#### Features

- Visual representation of available microphones and speakers
- Device type icons (Bluetooth, wired, speaker, default)
- Selection indicators
- Availability status display
- Current selection summary
- Responsive design with proper styling

#### Usage

```typescript
import { AudioDeviceSelection } from '@/components/settings/audio-device-selection';

// In your component
<AudioDeviceSelection showTitle={true} />
```

## Technical Implementation Details

### Audio Routing Logic

1. **On Bluetooth Connection**:

   - Device is added to `availableAudioDevices`
   - If device supports microphone → set as selected microphone
   - Device is set as selected speaker
   - Audio routing is activated

2. **On Bluetooth Disconnection**:
   - Bluetooth devices are removed from `availableAudioDevices`
   - System reverts to default microphone and speaker
   - Audio routing is deactivated

### State Management Flow

```
Bluetooth Connection → Update Available Devices → Update Selected Devices → Setup Audio Routing
Bluetooth Disconnection → Remove Bluetooth Devices → Revert to Defaults → Cleanup Audio Routing
```

### Error Handling

- Graceful fallback to default devices on connection failures
- Comprehensive logging for debugging
- User-friendly error messages in UI components

## Configuration Requirements

### Audio Assets

Ensure the following audio files are available:

- `assets/audio/ui/space_notification1.mp3`
- `assets/audio/ui/space_notification2.mp3`

### App Configuration

The audio files should be registered in `app.config.ts` under the notification sounds section.

## Future Enhancements

1. **Native Audio Routing**: Implement actual audio routing via native modules
2. **Audio Quality Settings**: Add bitrate and sample rate configuration
3. **Multiple Device Support**: Support for multiple Bluetooth devices simultaneously
4. **Voice Activity Detection**: Enhance with VAD for better microphone control
5. **Customizable Sounds**: Allow users to select their own connection/disconnection sounds

## Testing

The system includes comprehensive error handling and logging. Test scenarios should include:

1. Bluetooth device connection/disconnection
2. Multiple participant LiveKit sessions
3. Audio device selection changes
4. Network connectivity issues
5. Permission handling

## Dependencies

- `expo-notifications`: For audio notification playback
- `react-native-ble-plx`: For Bluetooth device management
- `livekit-client`: For real-time communication
- `zustand`: For state management
