import React from 'react';

import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

interface UnitSelectionBottomSheetProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const UnitSelectionBottomSheet: React.FC<UnitSelectionBottomSheetProps> = ({ isOpen = false, onClose }) => {
  return (
    <VStack className="p-4">
      <Text>Unit Selection</Text>
    </VStack>
  );
};
