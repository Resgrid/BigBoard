import { GripVertical, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { type ReactNode } from 'react';
import { Platform, Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';

interface WidgetContainerProps {
  title: string;
  onRemove?: () => void;
  children: ReactNode;
  isEditMode?: boolean;
  testID?: string;
  width?: number;
  height?: number;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ title, onRemove, children, isEditMode = false, testID, width, height }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Box className={`overflow-hidden rounded-lg ${isDark ? 'border border-gray-700 bg-gray-800' : 'border border-gray-200 bg-white'}`} style={{ width, height }} {...(Platform.OS === 'web' ? { 'data-testid': testID } : { testID })}>
      {/* Header */}
      <HStack
        className={`items-center justify-between border-b px-3 py-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isEditMode ? (isDark ? 'bg-gray-700' : 'bg-gray-100') : isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        {isEditMode && <GripVertical size={16} color={isDark ? '#9CA3AF' : '#6B7280'} style={{ marginRight: 8 }} />}
        <Text className={`flex-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
        {isEditMode && onRemove && (
          <Pressable onPress={onRemove} className="p-1" {...(Platform.OS === 'web' ? { 'data-testid': `${testID}-remove-button` } : { testID: `${testID}-remove-button` })}>
            <X size={16} color={isDark ? '#EF4444' : '#DC2626'} />
          </Pressable>
        )}
      </HStack>

      {/* Content */}
      <Box className="p-3" style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
};
