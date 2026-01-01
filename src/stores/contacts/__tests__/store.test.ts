// Mock Platform first before any imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((specifics: any) => specifics.ios || specifics.default),
    Version: 17,
  },
}));

// Mock MMKV storage
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
  })),
  useMMKVBoolean: jest.fn(() => [false, jest.fn()]),
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getAllContacts } from '@/api/contacts/contacts';
import { getContactNotes } from '@/api/contacts/contactNotes';
import { cacheManager } from '@/lib/cache/cache-manager';
import { type ContactResultData } from '@/models/v4/contacts/contactResultData';
import { type ContactNoteResultData } from '@/models/v4/contacts/contactNoteResultData';
import { type ContactsResult } from '@/models/v4/contacts/contactsResult';
import { type ContactsNotesResult } from '@/models/v4/contacts/contactNotesResult';

import { useContactsStore } from '../store';

// Mock the API functions
jest.mock('@/api/contacts/contacts');
jest.mock('@/api/contacts/contactNotes');
jest.mock('@/lib/cache/cache-manager');

const mockGetAllContacts = getAllContacts as jest.MockedFunction<typeof getAllContacts>;
const mockGetContactNotes = getContactNotes as jest.MockedFunction<typeof getContactNotes>;
const mockCacheManager = cacheManager as jest.Mocked<typeof cacheManager>;

// Sample test data
const mockContact: ContactResultData = {
  ContactId: 'contact-1',
  Name: 'John Doe',
  FirstName: 'John',
  LastName: 'Doe',
  Email: 'john@example.com',
  Phone: '123-456-7890',
  ContactType: 0, // Person
  IsImportant: false,
  AddedOn: '2023-01-01',
  AddedByUserName: 'Admin',
} as ContactResultData;

const mockContactNote: ContactNoteResultData = {
  ContactNoteId: 'note-1',
  ContactId: 'contact-1',
  ContactNoteTypeId: 'type-1',
  Note: 'Test note content',
  NoteType: 'General',
  ShouldAlert: false,
  Visibility: 0,
  ExpiresOnUtc: new Date('2024-12-31'),
  ExpiresOn: '2024-12-31',
  IsDeleted: false,
  AddedOnUtc: new Date('2023-01-01'),
  AddedOn: '2023-01-01',
  AddedByUserId: 'user-1',
  AddedByName: 'John Admin',
  EditedOnUtc: new Date('2023-01-01'),
  EditedOn: '2023-01-01',
  EditedByUserId: 'user-1',
  EditedByName: 'John Admin',
};

const mockContactsResult: ContactsResult = {
  Data: [mockContact],
  PageSize: 10,
  Timestamp: '',
  Version: '',
  Node: '',
  RequestId: '',
  Status: 'Success',
  Environment: '',
};

const mockContactNotesResult: ContactsNotesResult = {
  Data: [mockContactNote],
  PageSize: 10,
  Timestamp: '',
  Version: '',
  Node: '',
  RequestId: '',
  Status: 'Success',
  Environment: '',
};

describe('useContactsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useContactsStore.setState({
      contacts: [],
      contactNotes: {},
      searchQuery: '',
      selectedContactId: null,
      isDetailsOpen: false,
      isLoading: false,
      isNotesLoading: false,
      error: null,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useContactsStore());

      expect(result.current.contacts).toEqual([]);
      expect(result.current.contactNotes).toEqual({});
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedContactId).toBe(null);
      expect(result.current.isDetailsOpen).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isNotesLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('fetchContacts', () => {
    it('should fetch contacts successfully', async () => {
      mockGetAllContacts.mockResolvedValueOnce(mockContactsResult);

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContacts();
      });

      expect(mockGetAllContacts).toHaveBeenCalledTimes(1);
      expect(mockGetAllContacts).toHaveBeenCalledWith(false);
      expect(result.current.contacts).toEqual([mockContact]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should fetch contacts with force refresh', async () => {
      mockGetAllContacts.mockResolvedValueOnce(mockContactsResult);

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContacts(true);
      });

      expect(mockGetAllContacts).toHaveBeenCalledTimes(1);
      expect(mockGetAllContacts).toHaveBeenCalledWith(true);
      expect(result.current.contacts).toEqual([mockContact]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch contacts error', async () => {
      const errorMessage = 'Failed to fetch contacts';
      mockGetAllContacts.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContacts();
      });

      expect(result.current.contacts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should set loading state during fetch', async () => {
      mockGetAllContacts.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockContactsResult), 100)));

      const { result } = renderHook(() => useContactsStore());

      act(() => {
        result.current.fetchContacts();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('fetchContactNotes', () => {
    it('should fetch contact notes successfully', async () => {
      mockGetContactNotes.mockResolvedValueOnce(mockContactNotesResult);

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContactNotes('contact-1');
      });

      expect(mockGetContactNotes).toHaveBeenCalledWith('contact-1');
      expect(result.current.contactNotes['contact-1']).toEqual([mockContactNote]);
      expect(result.current.isNotesLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch contact notes error', async () => {
      const errorMessage = 'Failed to fetch contact notes';
      mockGetContactNotes.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContactNotes('contact-1');
      });

      expect(result.current.contactNotes['contact-1']).toBeUndefined();
      expect(result.current.isNotesLoading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch contact notes');
    });

    it('should not fetch notes if already exists for contact', async () => {
      // Pre-populate notes for contact
      useContactsStore.setState({
        contactNotes: {
          'contact-1': [mockContactNote],
        },
      });

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContactNotes('contact-1');
      });

      expect(mockGetContactNotes).not.toHaveBeenCalled();
      expect(result.current.contactNotes['contact-1']).toEqual([mockContactNote]);
    });

    it('should set loading state during fetch', async () => {
      mockGetContactNotes.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockContactNotesResult), 100)));

      const { result } = renderHook(() => useContactsStore());

      act(() => {
        result.current.fetchContactNotes('contact-1');
      });

      expect(result.current.isNotesLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isNotesLoading).toBe(false);
      });
    });

    it('should handle empty notes response', async () => {
      const emptyResult = { ...mockContactNotesResult, Data: [] };
      mockGetContactNotes.mockResolvedValueOnce(emptyResult);

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContactNotes('contact-1');
      });

      expect(result.current.contactNotes['contact-1']).toEqual([]);
    });
  });

  describe('setSearchQuery', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useContactsStore());

      act(() => {
        result.current.setSearchQuery('john');
      });

      expect(result.current.searchQuery).toBe('john');
    });
  });

  describe('selectContact', () => {
    it('should select contact and open details', () => {
      const { result } = renderHook(() => useContactsStore());

      act(() => {
        result.current.selectContact('contact-1');
      });

      expect(result.current.selectedContactId).toBe('contact-1');
      expect(result.current.isDetailsOpen).toBe(true);
    });
  });

  describe('closeDetails', () => {
    it('should close details modal', () => {
      // Set initial state as open
      useContactsStore.setState({
        selectedContactId: 'contact-1',
        isDetailsOpen: true,
      });

      const { result } = renderHook(() => useContactsStore());

      act(() => {
        result.current.closeDetails();
      });

      expect(result.current.isDetailsOpen).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple contact notes for different contacts', async () => {
      const contact2Note = { ...mockContactNote, ContactNoteId: 'note-2', ContactId: 'contact-2' };
      const contact2NotesResult = { ...mockContactNotesResult, Data: [contact2Note] };

      mockGetContactNotes.mockResolvedValueOnce(mockContactNotesResult).mockResolvedValueOnce(contact2NotesResult);

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContactNotes('contact-1');
        await result.current.fetchContactNotes('contact-2');
      });

      expect(result.current.contactNotes['contact-1']).toEqual([mockContactNote]);
      expect(result.current.contactNotes['contact-2']).toEqual([contact2Note]);
    });

    it('should maintain existing notes when fetching new ones', async () => {
      // Pre-populate with one contact's notes
      useContactsStore.setState({
        contactNotes: {
          'contact-1': [mockContactNote],
        },
      });

      const contact2Note = { ...mockContactNote, ContactNoteId: 'note-2', ContactId: 'contact-2' };
      const contact2NotesResult = { ...mockContactNotesResult, Data: [contact2Note] };
      mockGetContactNotes.mockResolvedValueOnce(contact2NotesResult);

      const { result } = renderHook(() => useContactsStore());

      await act(async () => {
        await result.current.fetchContactNotes('contact-2');
      });

      expect(result.current.contactNotes['contact-1']).toEqual([mockContactNote]);
      expect(result.current.contactNotes['contact-2']).toEqual([contact2Note]);
    });
  });
});
