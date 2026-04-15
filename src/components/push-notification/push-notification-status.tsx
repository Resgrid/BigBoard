import React from 'react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n';
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
      <Text className="mb-2 font-bold">{translate('push_notifications.status_title')}</Text>

      <Box className="mb-2">
        <Text className="text-sm text-gray-700">
          {translate('push_notifications.active_unit_label')} {activeUnit ? activeUnit.Name : translate('common.none')}
        </Text>
        <Text className="text-sm text-gray-700">
          {translate('push_notifications.unit_id_label')} {activeUnitId ? activeUnitId : translate('common.none')}
        </Text>
      </Box>

      <Box>
        <Text className="text-sm text-gray-700">
          {translate('push_notifications.token_label')} {pushToken ? `${pushToken.substring(0, 20)}...` : translate('push_notifications.not_registered')}
        </Text>
        <Text className={`text-sm ${pushToken ? 'text-green-700' : 'text-red-700'}`}>
          {translate('push_notifications.status_label')} {pushToken ? translate('push_notifications.registered') : translate('push_notifications.not_registered')}
        </Text>
      </Box>

      <Box className="mt-4">
        <Button className="bg-blue-600 text-white" onPress={handleTestNotification} disabled={!pushToken}>
          {translate('push_notifications.send_test')}
        </Button>
      </Box>
    </Box>
  );
}
