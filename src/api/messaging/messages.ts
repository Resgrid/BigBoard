import { type GetRecipientsResult } from '@/models/v4/messages/getRecipientsResult';

import { createCachedApiEndpoint } from '../common/cached-client';

const recipientsApi = createCachedApiEndpoint('/Messages/GetRecipients', {
  ttl: 60 * 1000 * 1440, // Cache for 1 day
  enabled: true,
});

export const getRecipients = async (disallowNoone: boolean, includeUnits: boolean) => {
  const response = await recipientsApi.get<GetRecipientsResult>({
    disallowNoone: disallowNoone,
    includeUnits: includeUnits,
  });
  return response.data;
};
