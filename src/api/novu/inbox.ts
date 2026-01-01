import { createApiEndpoint } from '../common/client';

const getGroupsApi = createApiEndpoint('/Inbox/DeleteMessage');

export const deleteMessage = async (messageId: string) => {
  const response = await getGroupsApi.delete({
    messageId: encodeURIComponent(messageId),
  });
  return response.data;
};
