import { create } from 'zustand';

import { getBaseApiUrl, setBaseApiUrl } from '@/lib/storage/app';

interface ServerUrlState {
  url: string;
  setUrl: (url: string) => Promise<void>;
  getUrl: () => Promise<string>;
}

export const useServerUrlStore = create<ServerUrlState>((set) => ({
  url: '',
  setUrl: async (url: string) => {
    await setBaseApiUrl(url);
    set({ url });
  },
  getUrl: async () => {
    const url = await getBaseApiUrl();
    set({ url });
    return url;
  },
}));
