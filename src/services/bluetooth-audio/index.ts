/**
 * Bluetooth Audio Module
 *
 * This module provides platform-agnostic Bluetooth audio device management.
 */

import { createBluetoothAudioService } from './factory.service';

export * from './base.service';
export * from './factory.service';
export * from './native.service';
export * from './web.service';

// Create and export a singleton instance
export const bluetoothAudioService = createBluetoothAudioService();
