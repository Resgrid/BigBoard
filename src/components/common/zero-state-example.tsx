import { FileX, Search, WifiOff } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';

import ZeroState from './zero-state';

const ZeroStateExamples: React.FC = () => {
  return (
    <View className="flex-1">
      {/* Basic empty state */}
      <ZeroState icon={FileX} heading="No files found" description="You haven't uploaded any files yet" />

      {/* Error state */}
      <ZeroState isError icon={WifiOff} heading="Connection error" description="Unable to connect to the server">
        <Button variant="solid" size="md">
          Retry
        </Button>
      </ZeroState>

      {/* Search results empty state */}
      <ZeroState icon={Search} heading="No results found" description="Try adjusting your search terms" iconColor="#3b82f6">
        <HStack space="sm">
          <Button variant="outline" size="sm">
            Clear filters
          </Button>
          <Button variant="solid" size="sm">
            New search
          </Button>
        </HStack>
      </ZeroState>

      {/* Generic error state with default icon */}
      <ZeroState isError heading="Something went wrong" description="We're working on fixing the issue" />
    </View>
  );
};

export default ZeroStateExamples;
