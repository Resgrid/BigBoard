<p align="center">
  <img src="assets/images/Resgrid_JustText-300width.png" alt="Resgrid" />
</p>

<h1 align="center">BigBoard</h1>

<p align="center">
  <strong>Real-time situational awareness dashboard for first responders</strong>
</p>

<p align="center">
  <a href="https://github.com/Resgrid/BigBoard/actions"><img src="https://img.shields.io/github/actions/workflow/status/Resgrid/BigBoard/ci.yml?branch=master&style=flat-square" alt="Build Status" /></a>
  <a href="https://github.com/Resgrid/BigBoard/blob/master/LICENSE.txt"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/expo-54-000020?style=flat-square&logo=expo" alt="Expo 54" />
  <img src="https://img.shields.io/badge/react--native-0.81-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/typescript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web%20%7C%20Electron-lightgrey?style=flat-square" alt="Platforms" />
</p>

---

BigBoard is a cross-platform dashboard that connects to the [Resgrid](https://resgrid.com) platform, giving fire departments, EMS, search & rescue, CERT, HAZMAT, and other emergency services a live operational picture — right on a wall-mounted display, tablet, or phone.

## Features

### Customizable Widget Dashboard

Drag-and-drop grid of resizable widgets, each independently configurable:

| Widget | Description |
|--------|-------------|
| **Personnel** | Live roster with status and staffing levels |
| **Personnel Status Summary** | At-a-glance status breakdown across all personnel |
| **Personnel Staffing Summary** | Staffing level overview with counts per category |
| **Units** | Apparatus and vehicle tracking with current status |
| **Units Summary** | Aggregated unit status counts |
| **Calls** | Active dispatch calls with priority and type info |
| **Calls Summary** | Call volume and status breakdown |
| **Scheduled Calls** | Upcoming scheduled calls with urgency color coding, filtering, and sorting |
| **Map** | Interactive Mapbox-powered map with personnel and unit markers |
| **Weather** | Current conditions for your station area |
| **Weather Alerts** | Active NWS weather alerts and warnings |
| **Notes** | Shared notes and shift information |
| **Time** | Clock and date display |

### Real-Time Updates

- **SignalR** push connection keeps every widget in sync without polling
- Automatic reconnection and lifecycle management

### Multi-Platform

| Platform | How to run |
|----------|-----------|
| **iOS** | `yarn ios` |
| **Android** | `yarn android` |
| **Web** | `yarn web` |
| **Electron** (macOS, Windows, Linux) | `yarn electron:dev` |

### Additional Capabilities

- **SSO & OAuth** authentication
- **Push notifications** via Expo Notifications & Notifee
- **i18n** — fully internationalized UI
- **Dark mode** support
- **BLE** device integration
- **LiveKit** real-time audio/video
- **Sentry** error monitoring
- **Mapbox** mapping with GeoJSON support

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Yarn** 1.22+
- For native builds: Xcode (iOS) or Android Studio (Android)

### Install

```bash
git clone https://github.com/Resgrid/BigBoard.git
cd BigBoard
yarn install
```

### Run

```bash
# Start the Expo dev server
yarn start

# Or target a specific platform
yarn ios
yarn android
yarn web

# Electron (desktop)
yarn electron:dev
```

### Build for Production

```bash
# Electron desktop builds
yarn electron:build:mac
yarn electron:build:win
yarn electron:build:linux

# EAS cloud builds (iOS / Android)
yarn build:production:ios
yarn build:production:android
```

## Project Structure

```
src/
├── app/              # Expo Router screens (file-based routing)
├── api/              # API clients (calls, personnel, units, weather, etc.)
├── components/       # Reusable components & dashboard widgets
├── hooks/            # Custom React hooks (SignalR, queries, etc.)
├── stores/           # Zustand state management
├── translations/     # i18n locale files
├── types/            # TypeScript type definitions
└── core/             # Core utilities and providers
electron/             # Electron main process & preload
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo 54 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (Tailwind CSS) |
| State | Zustand |
| Data Fetching | TanStack React Query |
| Real-Time | SignalR |
| UI Components | Gluestack UI |
| Maps | Mapbox GL |
| Forms | React Hook Form + Zod |
| Desktop | Electron |

## About Resgrid

[Resgrid](https://resgrid.com) is a software-as-a-service logistics, management, and communications platform for first responders — volunteer and career fire departments, EMS, search and rescue, public safety, HAZMAT, CERT, disaster response, and more.

[Sign up for your free Resgrid account](https://resgrid.com)

## Authors

- **Shawn Jackson** — [@DesignLimbo](https://twitter.com/DesignLimbo)
- **Jason Jarrett** — [@staxmanade](https://twitter.com/staxmanade)

## License

Apache 2.0 — see [LICENSE.txt](LICENSE.txt) for details.
