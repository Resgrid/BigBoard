import { type CallExtraDataResult } from '@/models/v4/calls/callExtraDataResult';
import { type ScheduledCallsResult } from '@/models/v4/calls/scheduledCallsResult';

import { createApiEndpoint } from '../common/client';

const scheduledCallsApi = createApiEndpoint('/Calls/GetAllPendingScheduledCalls');
const getCallExtraDataApi = createApiEndpoint('/Calls/GetCallExtraData');

export const getScheduledCalls = async () => {
  const response = await scheduledCallsApi.get<ScheduledCallsResult>();
  return response.data;
};

export const getScheduledCallExtraData = async (callId: string) => {
  const response = await getCallExtraDataApi.get<CallExtraDataResult>({
    callId: encodeURIComponent(callId),
  });
  return response.data;
};
