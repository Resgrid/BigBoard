import { create } from 'zustand';

import { getContactNotes } from '@/api/contacts/contactNotes';
import { getAllContacts } from '@/api/contacts/contacts';
import { type ContactNoteResultData } from '@/models/v4/contacts/contactNoteResultData';
import { type ContactResultData } from '@/models/v4/contacts/contactResultData';

interface ContactsState {
  contacts: ContactResultData[];
  contactNotes: Record<string, ContactNoteResultData[]>;
  searchQuery: string;
  selectedContactId: string | null;
  isDetailsOpen: boolean;
  isLoading: boolean;
  isNotesLoading: boolean;
  error: string | null;
  // Actions
  fetchContacts: (forceRefresh?: boolean) => Promise<void>;
  fetchContactNotes: (contactId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  selectContact: (id: string) => void;
  closeDetails: () => void;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  contactNotes: {},
  searchQuery: '',
  selectedContactId: null,
  isDetailsOpen: false,
  isLoading: false,
  isNotesLoading: false,
  error: null,

  fetchContacts: async (forceRefresh: boolean = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getAllContacts(forceRefresh);
      set({ contacts: response.Data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  },

  fetchContactNotes: async (contactId: string) => {
    const { contactNotes } = get();

    // Don't fetch if we already have notes for this contact
    if (contactNotes[contactId]) {
      return;
    }

    set({ isNotesLoading: true, error: null });
    try {
      const response = await getContactNotes(contactId);
      set({
        contactNotes: {
          ...contactNotes,
          [contactId]: response.Data || [],
        },
        isNotesLoading: false,
      });
    } catch (error) {
      set({
        isNotesLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contact notes',
      });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  selectContact: (id) => set({ selectedContactId: id, isDetailsOpen: true }),

  closeDetails: () => set({ isDetailsOpen: false }),
}));
