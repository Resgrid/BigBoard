import { zodResolver } from '@hookform/resolvers/zod';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { AlertTriangle, LogIn, Shield } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { FocusAwareStatusBar, View } from '@/components/ui';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import colors from '@/constants/colors';
import { useOidcLogin } from '@/hooks/use-oidc-login';
import { useSamlLogin } from '@/hooks/use-saml-login';
import { fetchSsoConfigForUser } from '@/lib/auth/api';
import type { DepartmentSsoConfig } from '@/lib/auth/types';
import { logger } from '@/lib/logging';
import useAuthStore from '@/stores/auth/store';

// ─── Discovery form schema ────────────────────────────────────────────────────

const discoverySchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(3, 'Username must be at least 3 characters'),
  departmentId: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), { message: 'Department ID must be a number' }),
});

type DiscoveryFormType = z.infer<typeof discoverySchema>;

// ─── OIDC sub-component ───────────────────────────────────────────────────────

interface OidcLoginSectionProps {
  config: DepartmentSsoConfig;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function OidcLoginSection({ config, onSuccess, onError }: OidcLoginSectionProps) {
  const { t } = useTranslation();
  const loginWithSso = useAuthStore((s) => s.loginWithSso);
  const [isExchanging, setIsExchanging] = useState(false);

  // Stable refs so the exchange effect does not re-run when callback identity changes
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const tRef = useRef(t);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    tRef.current = t;
  });

  const { request, response, promptAsync, redirectUri, discovery } = useOidcLogin(config.authority, config.clientId);

  useEffect(() => {
    if (response?.type !== 'success') return;

    const clientId = config.clientId ?? '';
    const departmentCode = config.departmentCode ?? undefined;
    const code = response.params.code;
    const codeVerifier = request?.codeVerifier;
    const currentDiscovery = discovery;
    const currentRedirectUri = redirectUri;

    if (!codeVerifier || !currentDiscovery) {
      onErrorRef.current(tRef.current('sso.error_no_token'));
      return;
    }

    // Capture narrowed types explicitly so the async closure has no type ambiguity
    const verifier: string = codeVerifier;
    const discoveryDoc: AuthSession.DiscoveryDocument = currentDiscovery;

    async function doExchange() {
      setIsExchanging(true);
      try {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            redirectUri: currentRedirectUri,
            code,
            extraParams: { code_verifier: verifier },
          },
          discoveryDoc
        );

        const idToken = tokenResponse.idToken;
        if (!idToken) {
          onErrorRef.current(tRef.current('sso.error_no_token'));
          return;
        }

        await loginWithSso({ provider: 'oidc', externalToken: idToken, departmentCode });
        onSuccessRef.current();
      } catch (exchangeError) {
        logger.error({
          message: 'OidcLoginSection: Token exchange failed',
          context: { error: exchangeError instanceof Error ? exchangeError.message : String(exchangeError) },
        });
        onErrorRef.current(tRef.current('sso.error_login_failed'));
      } finally {
        setIsExchanging(false);
      }
    }

    doExchange();
  }, [response, request, discovery, redirectUri, config.clientId, config.departmentCode, loginWithSso]);

  if (isExchanging) {
    return (
      <Button className="w-full" disabled>
        <ButtonSpinner color={colors.light.neutral[400]} />
        <ButtonText className="ml-2">{t('sso.processing')}</ButtonText>
      </Button>
    );
  }

  return (
    <Button className="w-full bg-indigo-600 dark:bg-indigo-500" variant="solid" onPress={() => promptAsync()} disabled={!request}>
      <Shield size={18} color="white" />
      <ButtonText className="ml-2">{t('sso.login_with_sso')}</ButtonText>
    </Button>
  );
}

// ─── SAML sub-component ───────────────────────────────────────────────────────

interface SamlLoginSectionProps {
  config: DepartmentSsoConfig;
  onError: (message: string) => void;
}

function SamlLoginSection({ config, onError }: SamlLoginSectionProps) {
  const { t } = useTranslation();
  const [isOpening, setIsOpening] = useState(false);

  const { startSamlLogin } = useSamlLogin(config.metadataUrl);

  const handlePress = useCallback(async () => {
    if (!config.metadataUrl) {
      onError(t('sso.error_not_configured'));
      return;
    }
    setIsOpening(true);
    try {
      await startSamlLogin();
    } finally {
      setIsOpening(false);
    }
  }, [config.metadataUrl, onError, startSamlLogin, t]);

  return (
    <Button className="w-full bg-indigo-600 dark:bg-indigo-500" variant="solid" onPress={handlePress} disabled={isOpening}>
      {isOpening ? <ButtonSpinner color={colors.light.neutral[400]} /> : <Shield size={18} color="white" />}
      <ButtonText className="ml-2">{t('sso.login_with_sso')}</ButtonText>
    </Button>
  );
}

// ─── Main SSO screen ──────────────────────────────────────────────────────────

export default function SsoLoginScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [ssoConfig, setSsoConfig] = useState<DepartmentSsoConfig | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [ssoError, setSsoError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<DiscoveryFormType>({
    resolver: zodResolver(discoverySchema),
  });

  // Navigate to the app once SSO login completes
  useEffect(() => {
    if (authStatus === 'signedIn' && isAuthenticated()) {
      router.replace('/(app)' as never);
    }
  }, [authStatus, isAuthenticated, router]);

  const onDiscoverySubmit = useCallback(
    async (data: DiscoveryFormType) => {
      setConfigError(null);
      setSsoError(null);
      setSsoConfig(null);
      setIsFetching(true);

      try {
        const deptId = data.departmentId ? parseInt(data.departmentId, 10) : undefined;
        const config = await fetchSsoConfigForUser(data.username.trim(), deptId);

        if (!config) {
          setConfigError(t('sso.error_fetching_config'));
          return;
        }

        if (!config.ssoEnabled) {
          setConfigError(t('sso.error_not_configured'));
          return;
        }

        setSsoConfig(config);
      } finally {
        setIsFetching(false);
      }
    },
    [t]
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleSsoSuccess = useCallback(() => {}, []);

  const handleSsoError = useCallback((message: string) => {
    setSsoError(message);
    setSsoConfig(null);
  }, []);

  const handleBack = useCallback(() => {
    if (ssoConfig) {
      setSsoConfig(null);
      setSsoError(null);
      setConfigError(null);
    } else {
      router.back();
    }
  }, [ssoConfig, router]);

  return (
    <>
      <FocusAwareStatusBar />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={10}>
        <View className="flex-1 justify-center bg-white p-4 dark:bg-gray-950">
          {/* Logo */}
          <View className="mb-8 items-center justify-center">
            <Image style={{ width: '96%' }} source={colorScheme === 'dark' ? require('@assets/images/Resgrid_JustText_White.png') : require('@assets/images/Resgrid_JustText.png')} resizeMode="contain" />
            <Text className="pb-2 text-center text-4xl font-bold">{t('sso.page_title')}</Text>
            <Text className="max-w-xl text-center text-gray-500 dark:text-gray-400">{t('sso.page_subtitle')}</Text>
          </View>

          {/* Discovery form — shown until config is fetched */}
          {!ssoConfig ? (
            <>
              <FormControl isInvalid={!!errors?.username} className="mb-3 w-full">
                <FormControlLabel>
                  <FormControlLabelText>{t('sso.username')}</FormControlLabelText>
                </FormControlLabel>
                <Controller
                  defaultValue=""
                  name="username"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input>
                      <InputField placeholder={t('sso.username_placeholder')} value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" autoComplete="off" returnKeyType="next" />
                    </Input>
                  )}
                />
                <FormControlError>
                  <FormControlErrorIcon as={AlertTriangle} className="text-red-500" />
                  <FormControlErrorText className="text-red-500">{errors?.username?.message}</FormControlErrorText>
                </FormControlError>
              </FormControl>

              <FormControl isInvalid={!!errors?.departmentId} className="mb-6 w-full">
                <FormControlLabel>
                  <FormControlLabelText>
                    {t('sso.department_id')}
                    <Text className="text-gray-400 dark:text-gray-500"> ({t('common.optional')})</Text>
                  </FormControlLabelText>
                </FormControlLabel>
                <Controller
                  defaultValue=""
                  name="departmentId"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input>
                      <InputField
                        placeholder={t('sso.department_id_placeholder')}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onDiscoverySubmit)}
                      />
                    </Input>
                  )}
                />
                <FormControlError>
                  <FormControlErrorIcon as={AlertTriangle} className="text-red-500" />
                  <FormControlErrorText className="text-red-500">{errors?.departmentId?.message}</FormControlErrorText>
                </FormControlError>
              </FormControl>

              {/* Config fetch error */}
              {!!configError && (
                <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <Text className="text-center text-sm text-red-600 dark:text-red-400">{configError}</Text>
                </View>
              )}

              {isFetching ? (
                <Button className="w-full" disabled>
                  <ButtonSpinner color={colors.light.neutral[400]} />
                  <ButtonText className="ml-2">{t('sso.loading_config')}</ButtonText>
                </Button>
              ) : (
                <Button className="w-full" variant="solid" action="primary" onPress={handleSubmit(onDiscoverySubmit)}>
                  <LogIn size={18} color="white" />
                  <ButtonText className="ml-2">{t('sso.continue')}</ButtonText>
                </Button>
              )}
            </>
          ) : (
            /* SSO action section — shown after config is resolved */
            <>
              <View className="mb-6 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                <Text className="text-center text-sm font-medium text-blue-700 dark:text-blue-300">{getValues('username')}</Text>
                {!!getValues('departmentId') && (
                  <Text className="mt-1 text-center text-xs text-blue-500 dark:text-blue-400">
                    {t('sso.department_id')}: {getValues('departmentId')}
                  </Text>
                )}
              </View>

              {/* SSO error */}
              {!!ssoError && (
                <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <Text className="text-center text-sm text-red-600 dark:text-red-400">{ssoError}</Text>
                </View>
              )}

              {ssoConfig.providerType === 'oidc' ? (
                <OidcLoginSection config={ssoConfig} onSuccess={handleSsoSuccess} onError={handleSsoError} />
              ) : ssoConfig.providerType === 'saml2' ? (
                <SamlLoginSection config={ssoConfig} onError={handleSsoError} />
              ) : (
                <View className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                  <Text className="text-center text-sm text-amber-700 dark:text-amber-300">{t('sso.error_not_configured')}</Text>
                </View>
              )}
            </>
          )}

          {/* Back button */}
          <Button className="mt-6 w-full" variant="outline" action="secondary" onPress={handleBack}>
            <ButtonText>{ssoConfig ? t('common.back') : t('common.go_back')}</ButtonText>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
