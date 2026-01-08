import React from 'react';

import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

interface AudioDeviceSelectionProps {
  showTitle?: boolean;
}

export const AudioDeviceSelection: React.FC<AudioDeviceSelectionProps> = ({ showTitle = true }) => {
  return <VStack className="p-4">{showTitle ? <Text>Audio Device Selection</Text> : null}</VStack>;
};
