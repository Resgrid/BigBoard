import { type CallTypesResult } from '@/models/v4/callTypes/callTypesResult';

import { createCachedApiEndpoint } from '../common/cached-client';

const callsTypesApi = createCachedApiEndpoint('/CallTypes/GetAllCallTypes', {
  ttl: 60 * 1000 * 2880, // Cache for 2 days
  enabled: true,
});

export const getCallTypes = async () => {
  const response = await callsTypesApi.get<CallTypesResult>();
  return response.data;
};
