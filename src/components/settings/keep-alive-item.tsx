import { Battery } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useKeepAlive } from '@/lib';

import { Alert, AlertIcon, AlertText } from '../ui/alert';
import { Switch } from '../ui/switch';
import { Text } from '../ui/text';
import { View } from '../ui/view';
import { VStack } from '../ui/vstack';

export const KeepAliveItem = () => {
  const { isKeepAliveEnabled, setKeepAliveEnabled } = useKeepAlive();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();

  const handleToggle = React.useCallback(
    (value: boolean) => {
      setKeepAliveEnabled(value);
    },
    [setKeepAliveEnabled]
  );

  return (
    <VStack space="sm">
      <View className="flex-1 flex-row items-center justify-between px-4 py-2">
        <View className="flex-row items-center">
          <Text>{t('settings.keep_alive')}</Text>
        </View>
        <View className="flex-row items-center">
          <Switch size="md" value={isKeepAliveEnabled} onValueChange={handleToggle} />
        </View>
      </View>

      {isKeepAliveEnabled && (
        <View className="px-4">
          <Alert className={`rounded-lg border ${colorScheme === 'dark' ? 'border-amber-800 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
            <AlertIcon as={Battery} className={`${colorScheme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
            <AlertText className={`text-sm ${colorScheme === 'dark' ? 'text-amber-200' : 'text-amber-700'}`}>{t('settings.keep_alive_warning')}</AlertText>
          </Alert>
        </View>
      )}
    </VStack>
  );
};
