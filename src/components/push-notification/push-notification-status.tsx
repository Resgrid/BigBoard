import React from 'react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { usePushNotifications } from '@/services/push-notification';
import { useCoreStore } from '@/stores/app/core-store';

export function PushNotificationStatus() {
  const { pushToken, sendTestNotification } = usePushNotifications();
  const activeUnitId = useCoreStore((state) => state.activeUnitId);
  const activeUnit = useCoreStore((state) => state.activeUnit);

  const handleTestNotification = () => {
    sendTestNotification();
  };

  return (
    <Box className="my-2 rounded-md border border-gray-300 p-4">
      <Text className="mb-2 font-bold">Push Notification Status</Text>

      <Box className="mb-2">
        <Text className="text-sm text-gray-700">Active Unit: {activeUnit ? activeUnit.Name : 'None'}</Text>
        <Text className="text-sm text-gray-700">Unit ID: {activeUnitId ? activeUnitId : 'None'}</Text>
      </Box>

      <Box>
        <Text className="text-sm text-gray-700">Push Token: {pushToken ? `${pushToken.substring(0, 20)}...` : 'Not registered'}</Text>
        <Text className={`text-sm ${pushToken ? 'text-green-700' : 'text-red-700'}`}>Status: {pushToken ? 'Registered' : 'Not Registered'}</Text>
      </Box>

      <Box className="mt-4">
        <Button className="bg-blue-600 text-white" onPress={handleTestNotification} disabled={!pushToken}>
          Send Test Notification
        </Button>
      </Box>
    </Box>
  );
}
