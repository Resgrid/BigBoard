const mockStore = new Map<string, string>();

jest.mock('@env', () => ({
  Env: { BASE_API_URL: 'https://default.resgrid.test', API_VERSION: 'v4' },
}));

jest.mock('@/lib/storage', () => ({
  getItem: (key: string) => (mockStore.has(key) ? JSON.parse(mockStore.get(key)!) : null),
  setItem: async (key: string, value: unknown) => {
    mockStore.set(key, JSON.stringify(value));
  },
  removeItem: async (key: string) => {
    mockStore.delete(key);
  },
}));

import { getBaseApiUrl, removeBaseApiUrl, setBaseApiUrl } from '../app';

describe('base API url storage', () => {
  beforeEach(() => {
    mockStore.clear();
    delete (window as { electronAPI?: unknown }).electronAPI;
  });

  it('falls back to the build default when nothing is stored', () => {
    expect(getBaseApiUrl()).toBe('https://default.resgrid.test/api/v4');
  });

  it('persists the chosen url without a trailing slash', async () => {
    await setBaseApiUrl(' https://api-eu-central.resgrid.com/api/v4/ ');

    expect(getBaseApiUrl()).toBe('https://api-eu-central.resgrid.com/api/v4');
  });

  it('returns to the default once removed', async () => {
    await setBaseApiUrl('https://api-eu-central.resgrid.com/api/v4');
    await removeBaseApiUrl();

    expect(getBaseApiUrl()).toBe('https://default.resgrid.test/api/v4');
  });

  describe('in the Electron shell', () => {
    const desktopSettings = new Map<string, string | null>();
    const electronAPI = {
      getSetting: jest.fn((key: string) => desktopSettings.get(key) ?? null),
      setSetting: jest.fn((key: string, value: string | null) => {
        desktopSettings.set(key, value);
        return true;
      }),
    };

    beforeEach(() => {
      desktopSettings.clear();
      jest.clearAllMocks();
      (window as { electronAPI?: unknown }).electronAPI = electronAPI;
    });

    it('also writes the url to the main-process settings', async () => {
      await setBaseApiUrl('https://api-eu-central.resgrid.com/api/v4');

      expect(electronAPI.setSetting).toHaveBeenCalledWith('baseUrl', 'https://api-eu-central.resgrid.com/api/v4');
    });

    it('survives a relaunch that starts with empty localStorage (new loopback origin)', async () => {
      await setBaseApiUrl('https://api-eu-central.resgrid.com/api/v4');
      mockStore.clear();

      expect(getBaseApiUrl()).toBe('https://api-eu-central.resgrid.com/api/v4');
    });

    it('uses the local value when the desktop settings have none yet', async () => {
      mockStore.set('baseUrl', JSON.stringify('https://api.resgrid.com/api/v4'));

      expect(getBaseApiUrl()).toBe('https://api.resgrid.com/api/v4');
    });

    it('clears the main-process setting on remove', async () => {
      await setBaseApiUrl('https://api-eu-central.resgrid.com/api/v4');
      await removeBaseApiUrl();

      expect(electronAPI.setSetting).toHaveBeenLastCalledWith('baseUrl', null);
      expect(getBaseApiUrl()).toBe('https://default.resgrid.test/api/v4');
    });
  });
});
