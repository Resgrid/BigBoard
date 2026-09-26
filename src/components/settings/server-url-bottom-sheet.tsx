import { ChevronDownIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView } from 'react-native';

import { getSystemConfig } from '@/api/config';
import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import type { ResgridSystemLocation } from '@/models/v4/configs/getSystemConfigResultData';
import { useServerUrlStore } from '@/stores/app/server-url-store';
import useAuthStore from '@/stores/auth/store';

import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '../ui/actionsheet';
import { Button, ButtonSpinner, ButtonText } from '../ui/button';
import { Center } from '../ui/center';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelperText, FormControlLabel, FormControlLabelText } from '../ui/form-control';
import { HStack } from '../ui/hstack';
import { Input, InputField } from '../ui/input';
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '../ui/select';
import { Text } from '../ui/text';
import { VStack } from '../ui/vstack';

interface ServerUrlForm {
  url: string;
}

interface ServerUrlBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a signed-in user saves a different server, so the caller can end the old server's session. */
  onUrlChanged?: () => Promise<void>;
}

const URL_PATTERN = /^https?:\/\/.+/;
const CUSTOM_SERVER_VALUE = '__custom__';
const API_PATH_SUFFIX = `/api/${Env.API_VERSION}`;
const SYSTEM_CONFIG_TIMEOUT_MS = 10000;

// The hosted Resgrid systems. The location list comes from the current server's system config, but
// that request fails when the current server is an unreachable custom URL -- these keep a way back.
export const DEFAULT_RESGRID_LOCATIONS: ResgridSystemLocation[] = [
  { Name: 'US-West', DisplayName: 'Resgrid North America (Global)', LocationInfo: '', IsDefault: true, ApiUrl: 'https://api.resgrid.com', AllowsFreeAccounts: true },
  { Name: 'EU-Central', DisplayName: 'Resgrid Europe', LocationInfo: '', IsDefault: false, ApiUrl: 'https://api-eu-central.resgrid.com', AllowsFreeAccounts: false },
];

const normalizeInputUrl = (url: string) => url.trim().replace(/\/+$/, '');

const normalizeBaseUrl = (url: string) => {
  const trimmedUrl = normalizeInputUrl(url);

  if (trimmedUrl.endsWith(API_PATH_SUFFIX)) {
    return trimmedUrl.slice(0, -API_PATH_SUFFIX.length).replace(/\/+$/, '');
  }

  return trimmedUrl;
};

const normalizeCustomDisplayUrl = (url: string) => normalizeBaseUrl(url).replace(/^(https?:\/\/[^/]+).*$/, '$1');

const buildApiUrl = (url: string) => `${normalizeBaseUrl(url)}${API_PATH_SUFFIX}`;

const findLocationForUrl = (locations: ResgridSystemLocation[], url: string) => {
  const normalizedUrl = normalizeBaseUrl(url);
  return locations.find((location) => normalizeBaseUrl(location.ApiUrl) === normalizedUrl);
};

const loadLocations = async (): Promise<ResgridSystemLocation[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SYSTEM_CONFIG_TIMEOUT_MS);

  try {
    const systemConfig = await getSystemConfig(controller.signal);
    const locations = (systemConfig?.Data?.Locations ?? []).filter((location) => !!location.Name && !!location.ApiUrl);
    return locations.length > 0 ? locations : DEFAULT_RESGRID_LOCATIONS;
  } catch (error) {
    logger.warn({
      message: 'Failed to load system config for server URLs, using built-in Resgrid locations',
      context: { error },
    });
    return DEFAULT_RESGRID_LOCATIONS;
  } finally {
    clearTimeout(timeout);
  }
};

export function ServerUrlBottomSheet({ isOpen, onClose, onUrlChanged }: ServerUrlBottomSheetProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingServerOptions, setIsLoadingServerOptions] = React.useState(true);
  const [locations, setLocations] = React.useState<ResgridSystemLocation[]>(DEFAULT_RESGRID_LOCATIONS);
  const [selectedServer, setSelectedServer] = React.useState<string>(CUSTOM_SERVER_VALUE);
  const currentApiUrlRef = React.useRef<string | null>(null);
  const { setUrl, getUrl } = useServerUrlStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ServerUrlForm>({ defaultValues: { url: '' } });

  React.useEffect(() => {
    if (!isOpen) {
      setIsLoadingServerOptions(true);
      return undefined;
    }

    let isMounted = true;

    const loadServerOptions = async () => {
      try {
        const [currentUrl, nextLocations] = await Promise.all([getUrl(), loadLocations()]);
        const matchingLocation = findLocationForUrl(nextLocations, currentUrl);

        if (isMounted) {
          currentApiUrlRef.current = buildApiUrl(currentUrl);
          setLocations(nextLocations);
          setValue('url', matchingLocation ? normalizeInputUrl(matchingLocation.ApiUrl) : normalizeCustomDisplayUrl(currentUrl));
          setSelectedServer(matchingLocation?.Name ?? CUSTOM_SERVER_VALUE);
        }
      } catch (error) {
        logger.error({
          message: 'Failed to load server URL options',
          context: { error },
        });
      } finally {
        if (isMounted) {
          setIsLoadingServerOptions(false);
        }
      }
    };

    loadServerOptions();

    return () => {
      isMounted = false;
    };
  }, [isOpen, setValue, getUrl]);

  const onFormSubmit = async (data: ServerUrlForm) => {
    try {
      setIsLoading(true);
      const selectedLocation = locations.find((location) => location.Name === selectedServer);
      const resolvedBaseUrl = selectedServer === CUSTOM_SERVER_VALUE ? data.url : (selectedLocation?.ApiUrl ?? data.url);
      const nextApiUrl = buildApiUrl(resolvedBaseUrl);
      const hasChanged = nextApiUrl !== currentApiUrlRef.current;

      await setUrl(nextApiUrl);
      currentApiUrlRef.current = nextApiUrl;

      if (hasChanged && isAuthenticated && onUrlChanged) {
        await onUrlChanged();
      }

      logger.info({
        message: 'Server URL updated successfully',
        context: { url: nextApiUrl, server: selectedServer },
      });
      onClose();
    } catch (error) {
      logger.error({
        message: 'Failed to update server URL',
        context: { error },
      });

      setError('root', {
        message: error instanceof Error ? error.message : t('common.error'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerChange = useCallback(
    (nextServer: string) => {
      setSelectedServer(nextServer);

      if (nextServer === CUSTOM_SERVER_VALUE) {
        return;
      }

      const selectedLocation = locations.find((location) => location.Name === nextServer);

      if (selectedLocation) {
        setValue('url', normalizeInputUrl(selectedLocation.ApiUrl));
      }
    },
    [locations, setValue]
  );

  const isCustomSelected = selectedServer === CUSTOM_SERVER_VALUE;

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose} snapPoints={[80]}>
      <ActionsheetBackdrop />
      <ActionsheetContent className={`rounded-t-3xl px-4 pb-6 ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
          <VStack space="lg" className="mt-4 w-full">
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className={`text-sm font-medium ${colorScheme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}`}>{t('settings.server')}</FormControlLabelText>
              </FormControlLabel>
              {isLoadingServerOptions ? (
                <Center className={`min-h-16 rounded-lg border p-4 ${colorScheme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'}`}>
                  <ButtonSpinner />
                  <Text className={`mt-2 ${colorScheme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>{t('loading.loadingData')}</Text>
                </Center>
              ) : (
                <Select onValueChange={handleServerChange} selectedValue={selectedServer}>
                  <SelectTrigger className={`rounded-lg border ${colorScheme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'}`}>
                    <SelectInput placeholder={t('settings.server')} value={isCustomSelected ? t('settings.custom') : selectedServer} />
                    <SelectIcon as={ChevronDownIcon} className="mr-3" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent className="max-h-[60vh] pb-20">
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {locations.map((location) => (
                        <SelectItem key={location.Name} label={location.Name} value={location.Name} />
                      ))}
                      <SelectItem label={t('settings.custom')} value={CUSTOM_SERVER_VALUE} />
                    </SelectContent>
                  </SelectPortal>
                </Select>
              )}
            </FormControl>
            <FormControl isRequired={isCustomSelected} isInvalid={isCustomSelected ? !!errors.url : false}>
              <FormControlLabel>
                <FormControlLabelText className={`text-sm font-medium ${colorScheme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}`}>{t('settings.server_url')}</FormControlLabelText>
              </FormControlLabel>
              <Controller
                control={control}
                name="url"
                rules={{
                  validate: (value) => {
                    if (!isCustomSelected) {
                      return true;
                    }

                    if (!value) {
                      return t('form.required');
                    }

                    return URL_PATTERN.test(value.trim()) ? true : t('form.invalid_url');
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <Input className={`rounded-lg border ${colorScheme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'}`}>
                    <InputField
                      value={value}
                      onChangeText={onChange}
                      placeholder={t('settings.enter_server_url')}
                      editable={isCustomSelected && !isLoadingServerOptions}
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

            {errors.root?.message ? (
              <Text size="sm" className="w-full text-center text-red-500">
                {errors.root.message}
              </Text>
            ) : null}

            <HStack space="md" className="mt-4">
              <Button variant="outline" className="flex-1" onPress={onClose}>
                <ButtonText>{t('common.cancel')}</ButtonText>
              </Button>
              <Button className="flex-1 bg-primary-600" onPress={handleSubmit(onFormSubmit)} disabled={isLoading || isLoadingServerOptions}>
                {isLoading ? <ButtonSpinner /> : <ButtonText>{t('common.save')}</ButtonText>}
              </Button>
            </HStack>
          </VStack>
        </ScrollView>
      </ActionsheetContent>
    </Actionsheet>
  );
}
