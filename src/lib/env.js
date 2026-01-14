/*
 * This file should not be modified; use `env.js` in the project root to add your client environment variables.
 * If you import `Env` from `@env`, this is the file that will be loaded.
 * You can only access the client environment variables here.
 * NOTE: We use js file so we can load the client env types
 * 
 * For web platform, runtime environment variables can be injected via window.__ENV__
 * which is populated by env-config.js (substituted at container startup via envsubst).
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get runtime environment variables for web platform
 * These are injected at container startup via env-config.js
 * @returns {Partial<typeof import('../../env.js').ClientEnv>}
 */
const getWebRuntimeEnv = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return {};
  }

  const runtimeEnv = window.__ENV__;
  if (!runtimeEnv) {
    return {};
  }

  // Filter out unsubstituted placeholders (values that still contain ${...})
  const filteredEnv = {};
  for (const [key, value] of Object.entries(runtimeEnv)) {
    if (typeof value === 'string' && value.includes('${')) {
      // Skip unsubstituted placeholder values
      continue;
    }
    // Handle boolean conversion for MAINTENANCE_MODE
    if (key === 'MAINTENANCE_MODE') {
      filteredEnv[key] = value === 'true' || value === true;
    } else {
      filteredEnv[key] = value;
    }
  }

  return filteredEnv;
};

/**
 *  @type {typeof import('../../env.js').ClientEnv}
 */
//@ts-ignore // Don't worry about TypeScript here; we know we're passing the correct environment variables to `extra` in `app.config.ts`.
const buildTimeEnv = Constants.expoConfig?.extra ?? {};

// Merge build-time env with runtime env (runtime takes precedence on web)
const webRuntimeEnv = getWebRuntimeEnv();

/**
 *  @type {typeof import('../../env.js').ClientEnv}
 */
//@ts-ignore
export const Env = {
  ...buildTimeEnv,
  ...webRuntimeEnv,
};
