import React from 'react';

import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

interface BluetoothDeviceSelectionBottomSheetProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const BluetoothDeviceSelectionBottomSheet: React.FC<BluetoothDeviceSelectionBottomSheetProps> = ({ isOpen = false, onClose }) => {
  return (
    <VStack className="p-4">
      <Text>Bluetooth Device Selection</Text>
    </VStack>
  );
};
