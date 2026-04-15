import { Link, Stack } from 'expo-router';
import React from 'react';

import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { translate } from '@/lib/i18n';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: translate('errors.not_found_title') }} />
      <View className="flex-1 items-center justify-center p-4">
        <Text className="mb-4 text-2xl font-bold">{translate('errors.not_found_message')}</Text>

        <Link href={'/' as any} className="mt-4">
          <Text className="text-blue-500 underline">{translate('errors.go_home')}</Text>
        </Link>
      </View>
    </>
  );
}
