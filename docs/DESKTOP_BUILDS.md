# Building for Desktop Platforms

This project supports building desktop applications for Windows, macOS, and Linux using **Electron** to wrap the existing Expo web export.

## Platform Feature Support

| Feature | iOS | Android | Web | Desktop (Electron) |
|---------|-----|---------|-----|--------------------|
| LiveKit VoIP | ✅ | ✅ | ✅ | ✅ |
| Mapbox | ✅ | ✅ | ✅ | ✅ |
| Bluetooth PTT | ✅ | ✅ | ✅* | ✅* |
| CallKeep | ✅ | ❌ | ❌ | ❌ |
| Notifee | ✅ | ✅ | ❌ | ❌ |
| Background Location | ✅ | ✅ | ❌ | ❌ |

*Bluetooth on web/desktop uses Web Bluetooth API (requires Chromium-based browser)

## Prerequisites

- Node.js 18+ and Yarn
- For Windows builds: Windows 10/11
- For macOS builds: macOS 10.15+ with Xcode Command Line Tools
- For Linux builds: Ubuntu 18.04+ or equivalent

## Development

Run the app in development mode with hot-reload:

```bash
# Install dependencies (if not already done)
yarn install

# Start Electron development mode
yarn electron:dev
```

This starts the Expo web dev server and launches Electron pointing to it.

## Production Builds

### Build for All Platforms

```bash
# Build for all platforms (run on macOS for best results)
yarn electron:build
```

### Platform-Specific Builds

```bash
# Windows only (NSIS installer + portable)
yarn electron:build:win

# macOS only (DMG + ZIP)
yarn electron:build:mac

# Linux only (AppImage + DEB)
yarn electron:build:linux
```

Build outputs are placed in the `electron-dist/` directory.

## Architecture Notes

### How It Works

1. `expo export --platform web` builds the React Native app to static web files in `dist/`
2. Electron serves these static files from `http://127.0.0.1:29317` and loads them in a native desktop window
3. All web-compatible features work identically to the browser

The port is fixed because it is part of the page origin, and localStorage (sign-in, dashboard layout, preferences) is keyed by origin. Only one instance runs at a time; launching again focuses the open window. If another program already holds port 29317, the app falls back to a random port for that session, and data saved in earlier sessions is unavailable until the port is free again. The selected server URL is also kept in `settings.json` under the app's userData directory, so it survives even that case.

The Resgrid API only allows cross-origin requests from origins on its CORS allowlist, so `http://127.0.0.1:29317` must be on that list for the desktop app to reach the API.

### Bluetooth on Desktop

Desktop uses the **Web Bluetooth API** via `BluetoothAudioServiceWeb`:

- Works with Chromium's Web Bluetooth (which Electron uses)
- Supports BLE device discovery, connection, and PTT button events
- Same PTT button mapping as mobile platforms (AINA, Inrico, HYS devices)

### Mapbox on Desktop

Uses `mapbox-gl` (web library) via existing `.web.tsx` files. Same functionality as the web platform.

### LiveKit on Desktop

Uses `livekit-client` (web SDK) directly. Full audio/video support, identical to the web platform.

## Configuration

Electron build settings are in `package.json` under the `"build"` key:

```json
{
  "build": {
    "appId": "com.resgrid.bigboard",
    "productName": "BigBoard",
    "directories": {
      "output": "electron-dist"
    },
    "mac": {
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

See [electron-builder documentation](https://www.electron.build/configuration) for more options.
