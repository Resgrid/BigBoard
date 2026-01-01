import { type AxiosResponse } from 'axios';
import { Platform } from 'react-native';

import { cacheManager } from '@/lib/cache/cache-manager';

import { createApiEndpoint } from './client';

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  enabled?: boolean; // Whether to use cache for this endpoint
}

export const createCachedApiEndpoint = (endpoint: string, cacheConfig: CacheConfig = { enabled: true }) => {
  const api = createApiEndpoint(endpoint);
  const defaultTTL = 5 * 60 * 1000; // 5 minutes

  // Disable caching on web platform for now to avoid MMKV issues
  const isCacheEnabled = cacheConfig.enabled && Platform.OS !== 'web';

  return {
    get: async <T>(params?: Record<string, unknown>): Promise<AxiosResponse<T>> => {
      if (!isCacheEnabled) {
        return api.get<T>(params);
      }

      try {
        const cached = cacheManager.get<T>(endpoint, params);
        if (cached) {
          return Promise.resolve({
            data: cached,
            status: 200,
            statusText: 'OK (cached)',
            headers: {},
            config: {},
          } as AxiosResponse<T>);
        }
      } catch (error) {
        console.error('Cache read error, continuing without cache:', error);
      }

      const response = await api.get<T>(params);

      try {
        cacheManager.set(endpoint, response.data, params, cacheConfig.ttl || defaultTTL);
      } catch (error) {
        console.error('Cache write error, continuing without caching:', error);
      }

      return response;
    },
    post: api.post,
    put: api.put,
    delete: api.delete,
  };
};
