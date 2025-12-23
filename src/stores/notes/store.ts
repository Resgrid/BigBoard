import { create } from 'zustand';

import { getAllNotes } from '@/api/notes/notes';
import { type NoteResultData } from '@/models/v4/notes/noteResultData';
import { type SaveNoteInput } from '@/models/v4/notes/saveNoteInput';

interface NotesState {
  notes: NoteResultData[];
  searchQuery: string;
  selectedNoteId: string | null;
  isDetailsOpen: boolean;
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchNotes: () => Promise<void>;
  updateNote: (id: string, note: Partial<Omit<SaveNoteInput, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  setSearchQuery: (query: string) => void;
  selectNote: (id: string) => void;
  closeDetails: () => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  searchQuery: '',
  selectedNoteId: null,
  isDetailsOpen: false,
  isLoading: false,
  error: null,
  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getAllNotes();
      set({ notes: response.Data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  },
  updateNote: (id, updatedNote) =>
    set((state) => ({
      notes: state.notes.map((note) => (note.NoteId === id ? { ...note, ...updatedNote, UpdatedOn: new Date() } : note)),
    })),

  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.NoteId !== id),
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  selectNote: (id) => set({ selectedNoteId: id, isDetailsOpen: true }),

  closeDetails: () => set({ isDetailsOpen: false }),
}));
