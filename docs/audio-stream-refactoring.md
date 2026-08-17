# Audio Stream Store Refactoring

## Overview

The audio stream store uses `expo-audio`. It was briefly moved to `expo-av` to work around remote MP3
streaming issues under the new architecture, but `expo-av` was removed from the Expo SDK and no longer
compiles against `expo-modules-core@56` (its legacy `EXEventEmitter.h` header is gone), so the store —
and `src/services/audio.service.ts` — were migrated back to `expo-audio`.

## Key Changes

### 1. Replaced expo-av with expo-audio

**Before:**
```typescript
import { Audio, type AVPlaybackSource, type AVPlaybackStatus } from 'expo-av';
```

**After:**
```typescript
import { type AudioPlayer, type AudioStatus, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
```

### 2. Updated Audio Player Management

**Before:**
- Used `Audio.Sound.createAsync()`, which returned `{ sound }` and took a status callback
- Audio player instance stored as `Audio.Sound`

**After:**
- Uses the synchronous `createAudioPlayer()` function
- Audio player instance stored as `AudioPlayer`
- Status updates arrive through `player.addListener('playbackStatusUpdate', ...)`; the returned
  subscription is removed in `stopStream()` before `player.remove()`

### 3. Audio Configuration

`setAudioModeAsync` is now a top-level export and its option names changed:

```typescript
await setAudioModeAsync({
  allowsRecording: false,
  shouldPlayInBackground: true,
  playsInSilentMode: true,
  interruptionMode: 'doNotMix',
  shouldRouteThroughEarpiece: false,
});
```

`interruptionMode` must be `'doNotMix'` for the OS to associate lock screen controls with the player.
The store calls `player.setActiveForLockScreen(true, { title: stream.Name })` before `play()` and
`player.clearLockScreenControls()` in `stopStream()` — without the lock screen session, Android stops
background playback after roughly three minutes.

| expo-av | expo-audio |
| --- | --- |
| `allowsRecordingIOS` | `allowsRecording` |
| `staysActiveInBackground` | `shouldPlayInBackground` |
| `playsInSilentModeIOS` | `playsInSilentMode` |
| `shouldDuckAndroid` / `interruptionModeIOS` | `interruptionMode` (`'mixWithOthers' \| 'doNotMix' \| 'duckOthers'`) |
| `playThroughEarpieceAndroid` | `shouldRouteThroughEarpiece` (applies on iOS too when `allowsRecording` is `true`) |

### 4. Playback Method Mapping

| expo-av | expo-audio |
| --- | --- |
| `sound.playAsync()` | `player.play()` (synchronous) |
| `sound.pauseAsync()` | `player.pause()` (synchronous) |
| `sound.setPositionAsync(0)` | `await player.seekTo(0)` |
| `sound.replayAsync()` | `await player.seekTo(0)` then `player.play()` |
| `sound.unloadAsync()` | `player.remove()` (synchronous) |
| status `isPlaying` | status `playing` |
| status `!isLoaded` as error signal | status `error` (a `string \| null`) |

`isLoaded` is `false` while a source is still loading in `expo-audio`, so error handling keys off
`status.error` rather than treating "not loaded" as a failure.

### 5. State Management

```typescript
interface AudioStreamState {
  // ... existing properties
  isLoading: boolean;        // Track loading state
  isBuffering: boolean;      // Track buffering state
  soundObject: AudioPlayer | null; // Player instance
}
```

## Usage Example

```typescript
import { useAudioStreamStore } from '@/stores/app/audio-stream-store';

const MyComponent = () => {
  const {
    availableStreams,
    isLoadingStreams,
    currentStream,
    isPlaying,
    isLoading,
    isBuffering,
    fetchAvailableStreams,
    playStream,
    stopStream,
  } = useAudioStreamStore();

  useEffect(() => {
    fetchAvailableStreams();
  }, []);

  const handlePlay = async (stream) => {
    try {
      await playStream(stream);
    } catch (error) {
      console.error('Failed to play stream:', error);
    }
  };

  // ... render logic
};
```

## Migration Notes

1. The store API is unchanged — `soundObject` is still the exposed field, it just holds an `AudioPlayer`
2. `expo-av` is no longer a dependency; do not reintroduce it, it cannot build on SDK 56
3. Tests mock `expo-audio` (`createAudioPlayer`, `setAudioModeAsync`); a default player mock lives in `jest-setup.ts`

## Troubleshooting

### Common Issues

1. **Audio not playing on iOS in silent mode**: Make sure `playsInSilentMode: true` is set
2. **Buffering issues**: The store tracks buffering state — use `isBuffering` to show loading indicators
3. **Background playback**: Ensure your app has proper background audio permissions configured

### Audio Permissions

Make sure your app's configuration includes proper audio permissions:

**app.json/app.config.js:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO"
      ]
    }
  }
}
```
