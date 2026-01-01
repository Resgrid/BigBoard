import { useColorScheme } from 'nativewind';
import React from 'react';
import { Platform } from 'react-native';

import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from './actionsheet';
import { Center } from './center';
import { Spinner } from './spinner';
import { Text } from './text';
import { VStack } from './vstack';

interface CustomBottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  loadingText?: string;
  snapPoints?: number[];
  minHeight?: string;
  testID?: string;
}

export function CustomBottomSheet({ children, isOpen, onClose, isLoading = false, loadingText, snapPoints = [67], minHeight = 'min-h-[400px]', testID }: CustomBottomSheetProps) {
  const { colorScheme } = useColorScheme();
  const testProps = Platform.OS === 'web' && testID ? { 'data-testid': testID } : testID ? { testID } : {};

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose} snapPoints={snapPoints} {...testProps}>
      <ActionsheetBackdrop />
      <ActionsheetContent className={`rounded-t-3xl px-4 pb-6 ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <VStack className={`w-full ${minHeight}`} space="md">
          {isLoading ? (
            <Center className="h-32">
              <VStack space="sm" className="items-center">
                <Spinner size="large" />
                {loadingText && <Text className="text-sm text-gray-500">{loadingText}</Text>}
              </VStack>
            </Center>
          ) : (
            children
          )}
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}
