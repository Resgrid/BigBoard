import { useColorScheme } from 'nativewind';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';

import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '../ui/actionsheet';
import { Button, ButtonSpinner, ButtonText } from '../ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '../ui/form-control';
import { HStack } from '../ui/hstack';
import { Input, InputField } from '../ui/input';
import { VStack } from '../ui/vstack';

interface LoginInfoForm {
  username: string;
  password: string;
}

interface LoginInfoBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LoginInfoForm) => Promise<void>;
}

export function LoginInfoBottomSheet({ isOpen, onClose, onSubmit }: LoginInfoBottomSheetProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInfoForm>();

  const onFormSubmit = async (data: LoginInfoForm) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className={`rounded-t-3xl px-4 pb-6 ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full">
          <VStack space="lg" className="mt-4 w-full">
            <FormControl isRequired isInvalid={!!errors.username}>
              <FormControlLabel>
                <FormControlLabelText className={`text-sm font-medium ${colorScheme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}`}>{t('settings.username')}</FormControlLabelText>
              </FormControlLabel>
              <Controller
                control={control}
                name="username"
                rules={{ required: t('form.required') }}
                render={({ field: { onChange, value } }) => (
                  <Input className={`rounded-lg border ${colorScheme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'}`}>
                    <InputField value={value} onChangeText={onChange} placeholder={t('settings.enter_username')} autoCapitalize="none" autoCorrect={false} textContentType="username" autoComplete="username" />
                  </Input>
                )}
              />
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.password}>
              <FormControlLabel>
                <FormControlLabelText className={`text-sm font-medium ${colorScheme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}`}>{t('settings.password')}</FormControlLabelText>
              </FormControlLabel>
              <Controller
                control={control}
                name="password"
                rules={{ required: t('form.required') }}
                render={({ field: { onChange, value } }) => (
                  <Input className={`rounded-lg border ${colorScheme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'}`}>
                    <InputField
                      value={value}
                      onChangeText={onChange}
                      placeholder={t('settings.enter_password')}
                      type="password"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      autoComplete="password"
                    />
                  </Input>
                )}
              />
            </FormControl>

            <HStack space="md" className="mt-4">
              <Button variant="outline" className="flex-1" onPress={onClose} size={isLandscape ? 'md' : 'sm'}>
                <ButtonText className={isLandscape ? '' : 'text-xs'}>{t('common.cancel')}</ButtonText>
              </Button>
              <Button className="flex-1 bg-primary-600" onPress={handleSubmit(onFormSubmit)} disabled={isLoading} size={isLandscape ? 'md' : 'sm'}>
                {isLoading ? <ButtonSpinner /> : <ButtonText className={isLandscape ? '' : 'text-xs'}>{t('common.save')}</ButtonText>}
              </Button>
            </HStack>
          </VStack>
        </KeyboardAvoidingView>
      </ActionsheetContent>
    </Actionsheet>
  );
}
