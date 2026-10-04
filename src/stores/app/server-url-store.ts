import { create } from 'zustand';

import { clearMapboxToken } from '@/lib/mapbox-token';
import { getBaseApiUrl, setBaseApiUrl } from '@/lib/storage/app';

interface ServerUrlState {
  url: string;
  setUrl: (url: string) => Promise<void>;
  getUrl: () => Promise<string>;
}

export const useServerUrlStore = create<ServerUrlState>((set) => ({
  url: '',
  setUrl: async (url: string) => {
    const previousUrl = getBaseApiUrl();
    await setBaseApiUrl(url);
    // The Mapbox token belongs to the old server's config; the new server supplies its own on config load
    if (getBaseApiUrl() !== previousUrl) {
      clearMapboxToken();
    }
    set({ url });
  },
  getUrl: async () => {
    const url = await getBaseApiUrl();
    set({ url });
    return url;
  },
}));
