/**
 * API exposed to the renderer by electron/preload.js. Only present in the desktop (Electron) build.
 */

interface ElectronAPI {
  platform: string;
  isElectron: true;
  getVersion: () => Promise<string>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  /** Reads a setting persisted by the main process (see PERSISTED_SETTING_KEYS in electron/main.js). */
  getSetting: (key: string) => string | null;
  /** Persists a setting in the main process; null removes it. Returns false when it could not be written. */
  setSetting: (key: string, value: string | null) => boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
