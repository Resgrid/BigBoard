import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';

import { Box } from '@/components/ui/box';
import { ScrollView } from '@/components/ui/scroll-view';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useNotesStore } from '@/stores/notes/store';

import { WidgetContainer } from './WidgetContainer';

interface NotesWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 1, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { notes, isLoading, error, fetchNotes } = useNotesStore();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Get top 3 most recent notes
  const recentNotes = React.useMemo(() => {
    return notes.filter((note) => !note.ExpiresOn || new Date(note.ExpiresOn) > new Date()).slice(0, 3);
  }, [notes]);

  if (error) {
    return (
      <WidgetContainer title="Notes" onRemove={onRemove} isEditMode={isEditMode} testID="notes-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Notes" onRemove={onRemove} isEditMode={isEditMode} testID="notes-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  if (recentNotes.length === 0) {
    return (
      <WidgetContainer title="Notes" onRemove={onRemove} isEditMode={isEditMode} testID="notes-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No notes</Text>
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Notes" onRemove={onRemove} isEditMode={isEditMode} testID="notes-widget" width={containerWidth} height={containerHeight}>
      <ScrollView className="flex-1">
        <VStack space="sm">
          {recentNotes.map((note) => (
            <Box key={note.NoteId} className={`rounded p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                {note.Title}
              </Text>
              {note.Category && <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{note.Category}</Text>}
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`} numberOfLines={2}>
                {note.Body}
              </Text>
            </Box>
          ))}
        </VStack>
      </ScrollView>
    </WidgetContainer>
  );
};
