import { render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import { ContactNotesList } from '../contact-notes-list';

// Mock dependencies
jest.mock('@/hooks/use-analytics');
jest.mock('@/stores/contacts/store');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      // Extract HTML content from source.html for testing
      const htmlContent = props.source?.html || '';
      // Simple extraction of text content from HTML (removing tags)
      const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();

      return React.createElement(View, {
        ...props,
        ref,
        testID: props.testID || 'webview',
      }, React.createElement(Text, { testID: 'webview-content' }, textContent));
    }),
  };
});

const mockTrackEvent = jest.fn();
const mockFetchContactNotes = jest.fn();

// Mock useAnalytics
const mockUseAnalytics = require('@/hooks/use-analytics').useAnalytics as jest.MockedFunction<any>;
mockUseAnalytics.mockReturnValue({
  trackEvent: mockTrackEvent,
});

// Mock useContactsStore
const mockUseContactsStore = require('@/stores/contacts/store').useContactsStore as jest.MockedFunction<any>;

describe('ContactNotesList', () => {
  const defaultProps = {
    contactId: 'test-contact-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock store state
    mockUseContactsStore.mockReturnValue({
      contactNotes: {
        'test-contact-123': [
          {
            ContactNoteId: 'note-1',
            ContactId: 'test-contact-123',
            Note: 'This is a test note',
            NoteType: 'General',
            Visibility: 1, // Public
            ShouldAlert: false,
            AddedBy: 'user-1',
            AddedByName: 'John Doe',
            AddedOn: '2023-01-15T10:30:00Z',
            AddedOnUtc: '2023-01-15T10:30:00Z',
            ExpiresOn: '2024-01-15T10:30:00Z',
            ExpiresOnUtc: '2024-01-15T10:30:00Z',
          },
          {
            ContactNoteId: 'note-2',
            ContactId: 'test-contact-123',
            Note: 'This is another test note',
            NoteType: 'Important',
            Visibility: 0, // Internal
            ShouldAlert: true,
            AddedBy: 'user-2',
            AddedByName: 'Jane Smith',
            AddedOn: '2023-02-15T14:30:00Z',
            AddedOnUtc: '2023-02-15T14:30:00Z',
            ExpiresOn: null,
            ExpiresOnUtc: null,
          },
        ],
      },
      isNotesLoading: false,
      fetchContactNotes: mockFetchContactNotes,
    });
  });

  describe('Component Rendering', () => {
    it('should render correctly with notes', () => {
      const { getByText } = render(<ContactNotesList {...defaultProps} />);

      // Check for note content within WebView mock
      expect(getByText(/This is a test note/)).toBeTruthy();
      expect(getByText(/This is another test note/)).toBeTruthy();
    });

    it('should render loading state', () => {
      mockUseContactsStore.mockReturnValue({
        contactNotes: {},
        isNotesLoading: true,
        fetchContactNotes: mockFetchContactNotes,
      });

      const { getByText } = render(<ContactNotesList {...defaultProps} />);

      expect(getByText('contacts.contactNotesLoading')).toBeTruthy();
    });

    it('should render empty state when no notes', () => {
      mockUseContactsStore.mockReturnValue({
        contactNotes: {
          'test-contact-123': [],
        },
        isNotesLoading: false,
        fetchContactNotes: mockFetchContactNotes,
      });

      const { getByText } = render(<ContactNotesList {...defaultProps} />);

      expect(getByText('contacts.contactNotesEmpty')).toBeTruthy();
      expect(getByText('contacts.contactNotesEmptyDescription')).toBeTruthy();
    });
  });

  describe('Analytics', () => {
    it('should track analytics event when component is rendered with notes', () => {
      render(<ContactNotesList {...defaultProps} />);

      expect(mockTrackEvent).toHaveBeenCalledWith('contact_notes_list_rendered', {
        contactId: 'test-contact-123',
        notesCount: 2,
        hasNotes: true,
        isLoading: false,
      });
    });

    it('should track analytics event when component is rendered without notes', () => {
      mockUseContactsStore.mockReturnValue({
        contactNotes: {
          'test-contact-123': [],
        },
        isNotesLoading: false,
        fetchContactNotes: mockFetchContactNotes,
      });

      render(<ContactNotesList {...defaultProps} />);

      expect(mockTrackEvent).toHaveBeenCalledWith('contact_notes_list_rendered', {
        contactId: 'test-contact-123',
        notesCount: 0,
        hasNotes: false,
        isLoading: false,
      });
    });

    it('should track analytics event when component is in loading state', () => {
      mockUseContactsStore.mockReturnValue({
        contactNotes: {},
        isNotesLoading: true,
        fetchContactNotes: mockFetchContactNotes,
      });

      render(<ContactNotesList {...defaultProps} />);

      expect(mockTrackEvent).toHaveBeenCalledWith('contact_notes_list_rendered', {
        contactId: 'test-contact-123',
        notesCount: 0,
        hasNotes: false,
        isLoading: true,
      });
    });

    it('should not track analytics event when contactId is not provided', () => {
      render(<ContactNotesList contactId="" />);

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('should track analytics event when contactId changes', () => {
      const { rerender } = render(<ContactNotesList contactId="contact-1" />);

      // Mock empty notes for contact-1
      mockUseContactsStore.mockReturnValue({
        contactNotes: {},
        isNotesLoading: false,
        fetchContactNotes: mockFetchContactNotes,
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('contact_notes_list_rendered', {
        contactId: 'contact-1',
        notesCount: 0,
        hasNotes: false,
        isLoading: false,
      });

      // Mock different notes for the new contact
      mockUseContactsStore.mockReturnValue({
        contactNotes: {
          'contact-2': [
            {
              ContactNoteId: 'note-3',
              ContactId: 'contact-2',
              Note: 'Note for contact 2',
              NoteType: 'General',
              Visibility: 1,
              ShouldAlert: false,
              AddedBy: 'user-1',
              AddedByName: 'John Doe',
              AddedOn: '2023-01-15T10:30:00Z',
              AddedOnUtc: '2023-01-15T10:30:00Z',
              ExpiresOn: null,
              ExpiresOnUtc: null,
            },
          ],
        },
        isNotesLoading: false,
        fetchContactNotes: mockFetchContactNotes,
      });

      rerender(<ContactNotesList contactId="contact-2" />);

      expect(mockTrackEvent).toHaveBeenCalledWith('contact_notes_list_rendered', {
        contactId: 'contact-2',
        notesCount: 1,
        hasNotes: true,
        isLoading: false,
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch contact notes when contactId is provided', () => {
      render(<ContactNotesList {...defaultProps} />);

      expect(mockFetchContactNotes).toHaveBeenCalledWith('test-contact-123');
    });

    it('should not fetch notes when contactId is not provided', () => {
      render(<ContactNotesList contactId="" />);

      expect(mockFetchContactNotes).not.toHaveBeenCalled();
    });
  });
}); 