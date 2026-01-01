import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { LoginFormProps } from '@/app/login/login-form';
import { ServerUrlBottomSheet } from '@/components/settings/server-url-bottom-sheet';
import { FocusAwareStatusBar } from '@/components/ui';
import { Button, ButtonText } from '@/components/ui/button';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/logging';

import { LoginForm } from './login-form';

export default function Login() {
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [showServerUrl, setShowServerUrl] = useState(false);
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const { login, status, error, isAuthenticated } = useAuth();

  // Track when login view is rendered
  useEffect(() => {
    trackEvent('login_view_rendered', {
      hasError: !!error,
      status: status,
    });
  }, [trackEvent, error, status]);

  useEffect(() => {
    logger.info({
      message: 'Login: Status or auth changed',
      context: { status, isAuthenticated },
    });

    if (status === 'signedIn' && isAuthenticated) {
      logger.info({
        message: 'Login successful, redirecting to home',
      });

      // Use replace to prevent going back to login screen
      router.replace('/(app)' as any);
    }
  }, [status, isAuthenticated, router]);

  useEffect(() => {
    if (status === 'error') {
      logger.error({
        message: 'Login failed',
        context: { error },
      });
      setIsErrorModalVisible(true);
    }
  }, [status, error]);

  const onSubmit: LoginFormProps['onSubmit'] = async (data) => {
    logger.info({
      message: 'Starting Login (button press)',
      context: { username: data.username },
    });
    try {
      await login({ username: data.username, password: data.password });
      logger.info({
        message: 'Login call completed',
        context: { status, isAuthenticated },
      });
    } catch (error) {
      logger.error({
        message: 'Login call failed with exception',
        context: { error },
      });
    }
  };

  return (
    <>
      <FocusAwareStatusBar />
      <LoginForm onSubmit={onSubmit} isLoading={status === 'loading'} error={error ?? undefined} onServerUrlPress={() => setShowServerUrl(true)} />

      <Modal
        isOpen={isErrorModalVisible}
        onClose={() => {
          setIsErrorModalVisible(false);
        }}
        size="full"
        {...({} as any)}
      >
        <ModalBackdrop />
        <ModalContent className="m-4 w-full max-w-3xl rounded-2xl">
          <ModalHeader>
            <Text className="text-xl font-semibold">{t('login.errorModal.title')}</Text>
          </ModalHeader>
          <ModalBody>
            <Text>{t('login.errorModal.message')}</Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="solid"
              size="sm"
              action="primary"
              onPress={() => {
                setIsErrorModalVisible(false);
              }}
            >
              <ButtonText>{t('login.errorModal.confirmButton')}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ServerUrlBottomSheet isOpen={showServerUrl} onClose={() => setShowServerUrl(false)} />
    </>
  );
}
