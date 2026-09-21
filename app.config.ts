/* eslint-disable max-lines-per-function */
import type { ConfigContext, ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import { ClientEnv, Env } from './env';
const packageJSON = require('./package.json');

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.APP_ENV !== 'production',
  badges: [
    {
      text: Env.APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.NAME,
  description: `${Env.NAME} Resgrid BigBoard`,
  owner: Env.EXPO_ACCOUNT_OWNER,
  scheme: Env.SCHEME,
  slug: 'resgrid-bigboard',
  version: packageJSON.version,
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    icon: './assets/ios-icon.png',
    version: packageJSON.version,
    buildNumber: packageJSON.version,
    supportsTablet: true,
    bundleIdentifier: Env.BUNDLE_ID,
    requireFullScreen: true,
    infoPlist: {
      UIBackgroundModes: ['remote-notification', 'audio', 'bluetooth-central', 'voip'],
      ITSAppUsesNonExemptEncryption: false,
      UIViewControllerBasedStatusBarAppearance: false,
      NSBluetoothAlwaysUsageDescription:
        'Resgrid BigBoard uses Bluetooth to connect to wireless headsets and speaker-microphone accessories for Push-to-Talk audio. For example, when you pair a Bluetooth speaker-mic, pressing its talk button transmits your voice to your department audio channel.',
      LSApplicationQueriesSchemes: [Env.SCHEME.toLowerCase()],
    },
    entitlements: {
      ...((Env.APP_ENV === 'production' || Env.APP_ENV === 'internal') && {
        'com.apple.developer.usernotifications.critical-alerts': true,
        'com.apple.developer.usernotifications.time-sensitive': true,
      }),
    },
  },
  experiments: {
    typedRoutes: true,
  },
  android: {
    version: packageJSON.version,
    versionCode: parseInt(packageJSON.versionCode),
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2484c4',
    },
    softwareKeyboardLayoutMode: 'pan',
    package: Env.PACKAGE,
    googleServicesFile: 'google-services.json',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: Env.SCHEME.toLowerCase(), host: 'auth', pathPrefix: '/callback' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    permissions: [
      'android.permission.WAKE_LOCK',
      'android.permission.RECORD_AUDIO',
      'android.permission.CAPTURE_AUDIO_OUTPUT',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    ],
    // FOREGROUND_SERVICE_CONNECTED_DEVICE is blocked, not merely absent: Bluetooth PTT handsets
    // route through the microphone FGS session, so the type is unused, and Play rejects any
    // declared foreground-service type whose use case cannot be demonstrated in the app.
    blockedPermissions: ['android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        backgroundColor: '#2a7dd5',
        image: './assets/adaptive-icon.png',
        imageWidth: 250,
      },
    ],
    [
      'expo-font',
      {
        fonts: ['./assets/fonts/Inter.ttf'],
      },
    ],
    'expo-localization',
    'expo-router',
    ['react-native-edge-to-edge'],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#2a7dd5',
        permissions: {
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
          },
        },
        sounds: [
          'assets/audio/notification.wav',
          'assets/audio/callclosed.wav',
          'assets/audio/callupdated.wav',
          'assets/audio/callemergency.wav',
          'assets/audio/callhigh.wav',
          'assets/audio/calllow.wav',
          'assets/audio/callmedium.wav',
          'assets/audio/newcall.wav',
          'assets/audio/newchat.wav',
          'assets/audio/newmessage.wav',
          'assets/audio/newshift.wav',
          'assets/audio/newtraining.wav',
          'assets/audio/personnelstaffingupdated.wav',
          'assets/audio/personnelstatusupdated.wav',
          'assets/audio/troublealert.wav',
          'assets/audio/unitnotice.wav',
          'assets/audio/unitstatusupdated.wav',
          'assets/audio/upcomingshift.wav',
          'assets/audio/upcomingtraining.wav',
          // Modern notification sounds (bundled into Android res/raw and the iOS app bundle by the expo-notifications config plugin at prebuild)
          'assets/audio/modernavailabilityalert.wav',
          'assets/audio/moderncalendar.wav',
          'assets/audio/moderncallclosed.wav',
          'assets/audio/moderncallemergency.wav',
          'assets/audio/moderncallhigh.wav',
          'assets/audio/moderncalllow.wav',
          'assets/audio/moderncallmedium.wav',
          'assets/audio/moderncallupdated.wav',
          'assets/audio/modernchat.wav',
          'assets/audio/modernmessage.wav',
          'assets/audio/modernnotification.wav',
          'assets/audio/modernpersonnelstatus.wav',
          'assets/audio/modernresourceorder.wav',
          'assets/audio/modernshift.wav',
          'assets/audio/modernstaffing.wav',
          'assets/audio/moderntraining.wav',
          'assets/audio/moderntroublealert.wav',
          'assets/audio/modernunitnotice.wav',
          'assets/audio/modernunitstatus.wav',
          'assets/audio/modernweatheralert.wav',
          'assets/audio/custom/c1.wav',
          'assets/audio/custom/c2.wav',
          'assets/audio/custom/c3.wav',
          'assets/audio/custom/c4.wav',
          'assets/audio/custom/c5.wav',
          'assets/audio/custom/c6.wav',
          'assets/audio/custom/c7.wav',
          'assets/audio/custom/c8.wav',
          'assets/audio/custom/c9.wav',
          'assets/audio/custom/c10.wav',
          'assets/audio/custom/c11.wav',
          'assets/audio/custom/c12.wav',
          'assets/audio/custom/c13.wav',
          'assets/audio/custom/c14.wav',
          'assets/audio/custom/c15.wav',
          'assets/audio/custom/c16.wav',
          'assets/audio/custom/c17.wav',
          'assets/audio/custom/c18.wav',
          'assets/audio/custom/c19.wav',
          'assets/audio/custom/c20.wav',
          'assets/audio/custom/c21.wav',
          'assets/audio/custom/c22.wav',
          'assets/audio/custom/c23.wav',
          'assets/audio/custom/c24.wav',
          'assets/audio/custom/c25.wav',
        ],
        requestPermissions: true,
      },
    ],
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsVersion: '11.8.0',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Resgrid BigBoard uses your location while you use the app to center the map when you pick the address for a new call and to show local weather conditions on the board. For example, when you create a new call, the map starts at your current position so you can quickly pin the incident location.',
        // Background/Always location is not used: no location task or background
        // permission request exists in src/. Omit the Always usage keys.
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        // Motion activity APIs (getMotionActivityAsync) are not used; omit NSMotionUsageDescription.
        motionUsagePermission: false,
        // No background location tracking on iOS — do not add 'location' to UIBackgroundModes.
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        taskManager: {
          locationTaskName: 'location-updates',
          locationTaskOptions: {
            accuracy: 'balanced',
            distanceInterval: 10,
            timeInterval: 5000,
          },
        },
      },
    ],
    [
      'expo-task-manager',
      {
        taskManager: {
          taskName: 'location-updates',
        },
      },
    ],
    [
      'expo-screen-orientation',
      {
        initialOrientation: 'DEFAULT',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          extraProguardRules: '-keep class expo.modules.location.** { *; }',
          extraMavenRepos: ['../../node_modules/@notifee/react-native/android/libs'],
          targetSdkVersion: 35,
        },
        ios: {
          deploymentTarget: '18.1',
        },
      },
    ],
    [
      'expo-asset',
      {
        assets: [
          'assets/mapping',
          'assets/audio/ui/space_notification1.mp3',
          'assets/audio/ui/space_notification2.mp3',
          'assets/audio/ui/positive_interface_beep.mp3',
          'assets/audio/ui/software_interface_start.mp3',
          'assets/audio/ui/software_interface_back.mp3',
        ],
      },
    ],
    [
      'expo-document-picker',
      {
        iCloudContainerEnvironment: 'Production',
      },
    ],
    [
      // Listed explicitly (the module is otherwise autolinked) so the plugin's vague
      // 'Allow $(PRODUCT_NAME) to access your photos/camera' defaults are replaced.
      'expo-image-picker',
      {
        photosPermission:
          'Resgrid BigBoard uses your photo library so you can attach existing photos to calls. For example, you can select a saved photo of an incident scene and attach it to the active call for dispatchers and responders to see.',
        cameraPermission:
          'Resgrid BigBoard uses the camera to take photos that you attach to calls. For example, you can photograph an incident scene and attach the image to the active call for dispatchers and responders to see.',
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        organization: 'sentry',
        project: 'unit',
        url: 'https://sentry.resgrid.net/',
      },
    ],
    [
      'expo-navigation-bar',
      {
        position: 'relative',
        hidden: true,
        behavior: 'inset-touch',
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission:
          'Resgrid BigBoard uses the microphone to capture your voice for Push-to-Talk and voice calls with your department. For example, when you press and hold the talk button, your voice is transmitted live to other responders on the channel.',
      },
    ],
    'react-native-ble-manager',
    '@livekit/react-native-expo-plugin',
    [
      '@config-plugins/react-native-webrtc',
      {
        // Set explicitly so the plugin's vague 'Allow $(PRODUCT_NAME) to access your camera'
        // default can never end up in the Info.plist.
        cameraPermission:
          'Resgrid BigBoard uses the camera to take photos that you attach to calls. For example, you can photograph an incident scene and attach the image to the active call for dispatchers and responders to see.',
      },
    ],
    '@config-plugins/react-native-callkeep',
    '@sentry/react-native',
    'expo-image',
    'expo-sharing',
    'expo-status-bar',
    'expo-web-browser',
    './customGradle.plugin.js',
    './customManifest.plugin.js',
    ['./appIconBadge.plugin.js', appIconBadgeConfig],
  ],
  extra: {
    ...ClientEnv,
    eas: {
      projectId: Env.EAS_PROJECT_ID,
    },
  },
});
