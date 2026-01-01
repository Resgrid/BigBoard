import { type ContactsNotesResult } from '@/models/v4/contacts/contactNotesResult';

import { createApiEndpoint } from '../common/client';

const getContactNotesApi = createApiEndpoint('/Contacts/GetContactNotesByContactId');

export const getContactNotes = async (contactId: string) => {
  const response = await getContactNotesApi.get<ContactsNotesResult>({
    contactId,
  });
  return response.data;
};
