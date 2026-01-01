import { useColorScheme } from 'nativewind';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView } from 'react-native';

import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { useServerUrlStore } from '@/stores/app/server-url-store';

import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '../ui/actionsheet';
import { Button, ButtonSpinner, ButtonText } from '../ui/button';
import { Center } from '../ui/center';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelperText, FormControlLabel, FormControlLabelText } from '../ui/form-control';
import { HStack } from '../ui/hstack';
import { Input, InputField } from '../ui/input';
import { Text } from '../ui/text';
import { VStack } from '../ui/vstack';
interface ServerUrlForm {
  url: string;
}

interface ServerUrlBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const URL_PATTERN = /^https?:\/\/.+/;

export function ServerUrlBottomSheet({ isOpen, onClose }: ServerUrlBottomSheetProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const [isLoading, setIsLoading] = React.useState(false);
  const { setUrl, getUrl } = useServerUrlStore();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ServerUrlForm>();

  React.useEffect(() => {
    if (isOpen) {
      getUrl().then((url) => setValue('url', url.replace(`/api/${Env.API_VERSION}`, '')));
    }
  }, [isOpen, setValue, getUrl]);

  const onFormSubmit = async (data: ServerUrlForm) => {
    try {
      setIsLoading(true);
      await setUrl(`${data.url}/api/${Env.API_VERSION}`);
      logger.info({
        message: 'Server URL updated successfully',
        context: { url: data.url },
      });
      onClose();
    } catch (error) {
      logger.error({
        message: 'Failed to update server URL',
        context: { error },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose} snapPoints={[80]}>
      <ActionsheetBackdrop />
      <ActionsheetContent className={`rounded-t-3xl px-4 pb-6 ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
          <VStack space="lg" className="mt-4 w-full">
            <FormControl isRequired isInvalid={!!errors.url}>
              <FormControlLabel>
                <FormControlLabelText className={`text-sm font-medium ${colorScheme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}`}>{t('settings.server_url')}</FormControlLabelText>
              </FormControlLabel>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: t('form.required'),
                  pattern: {
                    value: URL_PATTERN,
                    message: t('form.invalid_url'),
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <Input className={`rounded-lg border ${colorScheme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'}`}>
                    <InputField
                      value={value}
                      onChangeText={onChange}
                      placeholder={t('settings.enter_server_url')}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      textContentType="URL"
                      returnKeyType="done"
                      autoFocus={false}
                      blurOnSubmit={true}
                    />
                  </Input>
                )}
              />
              <FormControlHelperText>
                <FormControlError>
                  <FormControlErrorText>{errors.url?.message}</FormControlErrorText>
                </FormControlError>
              </FormControlHelperText>
            </FormControl>
            <Center>
              <Text size="md" className="text-center text-red-500">
                {t('settings.server_url_note')}
              </Text>
            </Center>

            <HStack space="md" className="mt-4">
              <Button variant="outline" className="flex-1" onPress={onClose}>
                <ButtonText>{t('common.cancel')}</ButtonText>
              </Button>
              <Button className="flex-1 bg-primary-600" onPress={handleSubmit(onFormSubmit)} disabled={isLoading}>
                {isLoading ? <ButtonSpinner /> : <ButtonText>{t('common.save')}</ButtonText>}
              </Button>
            </HStack>
          </VStack>
        </ScrollView>
      </ActionsheetContent>
    </Actionsheet>
  );
}
