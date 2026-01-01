import React from 'react';
import { useTranslation } from 'react-i18next';

import { VStack } from '@/components/ui/vstack';

import { type ToastType, useToastStore } from '../../stores/toast/store';
import { Toast, ToastDescription, ToastTitle } from '../ui/toast';

export const ToastMessage: React.FC<{
  //id: string;
  type: ToastType;
  title?: string;
  message: string;
}> = ({ /*id,*/ type, title, message }) => {
  //const { removeToast } = useToastStore();
  const { t } = useTranslation();

  return (
    <Toast className="rounded-lg border" action={type}>
      <VStack space="xs">
        {title && <ToastTitle className="font-medium text-white">{t(title)}</ToastTitle>}
        <ToastDescription className="text-white">{t(message)}</ToastDescription>
      </VStack>
    </Toast>
  );
};
