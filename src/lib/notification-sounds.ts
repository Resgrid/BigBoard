import { storage } from './storage';

/**
 * MMKV key for the Android-only "use modern notification sounds" preference.
 * When set (or unset, since the default is on) Android notification channels use the
 * modern sound set; when explicitly disabled they fall back to their legacy behaviour.
 */
export const USE_MODERN_NOTIFICATION_SOUNDS = 'USE_MODERN_NOTIFICATION_SOUNDS';

/**
 * Definition of an Android notification channel whose sound follows the user's
 * "modern notification sounds" preference.
 *
 * - `modernSound`: played when the preference is enabled (the default). Every channel
 *   gets a modern tone here — including ones that were silent before.
 * - `legacySound`: played when the preference is disabled; `undefined` keeps the channel
 *   on its original behaviour (no custom sound), matching how it worked pre-modern.
 *
 * Custom call channels (c1–c25) are intentionally excluded — they keep their own tones.
 */
export interface NotificationSoundChannel {
  id: string;
  name: string;
  description: string;
  modernSound: string;
  legacySound?: string;
  vibration: boolean;
}

/**
 * All non-custom Android notification channels and their modern/legacy sounds.
 *
 * When modern sounds are enabled (the default) every one of these plays its modern tone —
 * including the generic call, notification and message channels that previously had no
 * custom sound. When disabled, each reverts to its original sound (or silence).
 *
 * `.wav` files are bundled into `res/raw` by the expo-notifications config plugin; the
 * sound value here is the file name without extension, matching the plugin's behaviour.
 */
export const NOTIFICATION_SOUND_CHANNELS: NotificationSoundChannel[] = [
  // Generic call — was silent before; now gets a modern tone.
  { id: 'calls', name: 'Generic Call', description: 'Generic Call', modernSound: 'modernnotification', legacySound: undefined, vibration: true },
  // Priority call channels — had legacy tones, now mapped to their modern equivalents.
  { id: '0', name: 'Emergency Call', description: 'Emergency Call', modernSound: 'moderncallemergency', legacySound: 'callemergency', vibration: true },
  { id: '1', name: 'High Call', description: 'High Call', modernSound: 'moderncallhigh', legacySound: 'callhigh', vibration: true },
  { id: '2', name: 'Medium Call', description: 'Medium Call', modernSound: 'moderncallmedium', legacySound: 'callmedium', vibration: true },
  { id: '3', name: 'Low Call', description: 'Low Call', modernSound: 'moderncalllow', legacySound: 'calllow', vibration: true },
  // Notification + message — were silent before; now play modern audio.
  { id: 'notif', name: 'Notification', description: 'Notifications', modernSound: 'modernnotification', legacySound: undefined, vibration: false },
  { id: 'message', name: 'Message', description: 'Messages', modernSound: 'modernmessage', legacySound: undefined, vibration: false },
];

/**
 * Reads the persisted "use modern notification sounds" preference directly from MMKV.
 * Defaults to `true` (modern sounds) when the preference has never been set.
 *
 * Safe to call from non-React code (e.g. the push notification service when creating
 * Android notification channels), since it reads MMKV synchronously.
 */
export const getModernNotificationSoundsEnabled = (): boolean => {
  return storage.getBoolean(USE_MODERN_NOTIFICATION_SOUNDS) ?? true;
};

/**
 * Version of the sound-channel configuration above. Bump this whenever the sounds in
 * NOTIFICATION_SOUND_CHANNELS change so existing installs recreate their (immutable)
 * channels and pick up the new sounds.
 *
 * v2: every non-custom channel now uses a modern sound, including the generic call,
 *     notification and message channels that were previously silent.
 */
export const NOTIFICATION_SOUND_CHANNELS_VERSION = 2;
const NOTIFICATION_SOUND_CHANNELS_VERSION_KEY = 'NOTIFICATION_SOUND_CHANNELS_VERSION';

/**
 * True when the device's notification channels predate the current sound configuration
 * (e.g. an upgrade from a build whose `notif`/`message`/`calls` channels were silent).
 * Android channels are immutable, so the service must delete and recreate them.
 */
export const needsSoundChannelMigration = (): boolean => {
  return (storage.getNumber(NOTIFICATION_SOUND_CHANNELS_VERSION_KEY) ?? 0) < NOTIFICATION_SOUND_CHANNELS_VERSION;
};

/** Records that the notification channels have been (re)created for the current config version. */
export const markSoundChannelsMigrated = (): void => {
  storage.set(NOTIFICATION_SOUND_CHANNELS_VERSION_KEY, NOTIFICATION_SOUND_CHANNELS_VERSION);
};
