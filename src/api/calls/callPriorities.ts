import { type CallPrioritiesResult } from '@/models/v4/callPriorities/callPrioritiesResult';

import { createCachedApiEndpoint } from '../common/cached-client';

const callsPrioritesApi = createCachedApiEndpoint('/CallPriorities/GetAllCallPriorites', {
  ttl: 60 * 1000 * 2880, // Cache for 2 days
  enabled: true,
});

export const getCallPriorities = async () => {
  const response = await callsPrioritesApi.get<CallPrioritiesResult>();
  return response.data;
};
