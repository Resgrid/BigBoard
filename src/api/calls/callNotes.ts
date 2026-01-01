import { createApiEndpoint } from '@/api/common/client';
import { type CallNotesResult } from '@/models/v4/callNotes/callNotesResult';
import { type SaveCallNoteResult } from '@/models/v4/callNotes/saveCallNoteResult';

const getCallNotesApi = createApiEndpoint('/CallNotes/GetCallNotes');
const saveCallNoteApi = createApiEndpoint('/CallNotes/SaveCallNote');

export const getCallNotes = async (callId: string) => {
  const response = await getCallNotesApi.get<CallNotesResult>({
    callId: callId,
  });
  return response.data;
};

export const saveCallNote = async (callId: string, userId: string, note: string, latitude: number | null, longitude: number | null) => {
  let data = {
    CallId: callId,
    UserId: userId,
    Note: note,
    Latitude: '',
    Longitude: '',
  };

  if (latitude && longitude) {
    data.Latitude = latitude?.toString();
    data.Longitude = longitude?.toString();
  }

  const response = await saveCallNoteApi.post<SaveCallNoteResult>({
    ...data,
  });
  return response.data;
};
