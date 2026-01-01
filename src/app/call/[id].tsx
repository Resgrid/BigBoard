import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ClockIcon, FileTextIcon, ImageIcon, InfoIcon, LoaderIcon, PaperclipIcon, RouteIcon, UserIcon, UsersIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import WebView from 'react-native-webview';

import { Loading } from '@/components/common/loading';
import ZeroState from '@/components/common/zero-state';
// Import a static map component instead of react-native-maps
import StaticMap from '@/components/maps/static-map';
import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { SharedTabs, type TabItem } from '@/components/ui/shared-tabs';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAnalytics } from '@/hooks/use-analytics';
import { logger } from '@/lib/logging';
import { openMapsWithDirections } from '@/lib/navigation';
import { useCoreStore } from '@/stores/app/core-store';
import { useLocationStore } from '@/stores/app/location-store';
import { useCallDetailStore } from '@/stores/calls/detail-store';
import { useSecurityStore } from '@/stores/security/store';
import { useStatusBottomSheetStore } from '@/stores/status/store';
import { useToastStore } from '@/stores/toast/store';

import { useCallDetailMenu } from '../../components/calls/call-detail-menu';
import CallFilesModal from '../../components/calls/call-files-modal';
import CallImagesModal from '../../components/calls/call-images-modal';
import CallNotesModal from '../../components/calls/call-notes-modal';
import { CloseCallBottomSheet } from '../../components/calls/close-call-bottom-sheet';
import { StatusBottomSheet } from '../../components/status/status-bottom-sheet';

export default function CallDetail() {
  const { id } = useLocalSearchParams();
  const callId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [coordinates, setCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({
    latitude: null,
    longitude: null,
  });
  const { call, callExtraData, callPriority, isLoading, error, fetchCallDetail, reset } = useCallDetailStore();
  const { canUserCreateCalls } = useSecurityStore();
  const { activeCall, activeStatuses, activeUnit } = useCoreStore();
  const { setIsOpen: setStatusBottomSheetOpen, setSelectedCall } = useStatusBottomSheetStore();
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [isCloseCallModalOpen, setIsCloseCallModalOpen] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const { colorScheme } = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

  // Get current user location from the location store
  const userLocation = useLocationStore((state) => ({
    latitude: state.latitude,
    longitude: state.longitude,
  }));

  const handleBack = () => {
    router.back();
  };

  const openNotesModal = () => {
    useCallDetailStore.getState().fetchCallNotes(callId);
    setIsNotesModalOpen(true);
  };

  const openImagesModal = () => {
    setIsImagesModalOpen(true);
  };

  const openFilesModal = () => {
    setIsFilesModalOpen(true);
  };

  const handleEditCall = () => {
    router.push(`/call/${callId}/edit`);
  };

  const handleCloseCall = () => {
    setIsCloseCallModalOpen(true);
  };

  const handleSetActive = async () => {
    if (!call) return;

    setIsSettingActive(true);

    try {
      // Set this call as the active call in the core store
      await useCoreStore.getState().setActiveCall(call.CallId);

      // Pre-select the current call and open the status bottom sheet without a pre-selected status
      setSelectedCall(call);
      setStatusBottomSheetOpen(true); // No status provided, will start with status selection

      // Show success message
      showToast('success', t('call_detail.set_active_success'));
    } catch (error) {
      logger.error({
        message: 'Failed to set call as active',
        context: { error, callId: call.CallId },
      });
      showToast('error', t('call_detail.set_active_error'));
    } finally {
      setIsSettingActive(false);
    }
  };

  // Initialize the call detail menu hook
  const { HeaderRightMenu, CallDetailActionSheet } = useCallDetailMenu({
    onEditCall: handleEditCall,
    onCloseCall: handleCloseCall,
    canUserCreateCalls,
  });

  useEffect(() => {
    reset();
    if (callId) {
      fetchCallDetail(callId);
    }
  }, [callId, fetchCallDetail, reset]);

  useEffect(() => {
    if (call) {
      if (call.Latitude && call.Longitude) {
        setCoordinates({
          latitude: parseFloat(call.Latitude),
          longitude: parseFloat(call.Longitude),
        });
      } else if (call.Geolocation) {
        const [lat, lng] = call.Geolocation.split(',');
        setCoordinates({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        });
      }
    }
  }, [call]);

  // Track when call detail view is rendered
  useEffect(() => {
    if (call) {
      trackEvent('call_detail_view_rendered', {
        callId: call.CallId || '',
        callName: call.Name || '',
        callNumber: call.Number || '',
        callPriority: call.Priority || 0,
        callType: call.Type || '',
        hasCoordinates: !!(call.Latitude && call.Longitude),
        hasAddress: !!call.Address,
        hasNotes: (call.NotesCount || 0) > 0,
        hasImages: (call.ImgagesCount || 0) > 0,
        hasFiles: (call.FileCount || 0) > 0,
        hasExtraData: !!callExtraData,
        hasProtocols: !!callExtraData?.Protocols?.length,
        hasDispatches: !!callExtraData?.Dispatches?.length,
        hasTimeline: !!callExtraData?.Activity?.length,
      });
    }
  }, [trackEvent, call, callExtraData]);

  /**
   * Opens the device's native maps application with directions to the call location
   */
  const handleRoute = async () => {
    if (!coordinates.latitude || !coordinates.longitude) {
      showToast('error', t('call_detail.no_location_for_routing'));
      return;
    }

    try {
      const destinationName = call?.Address || t('call_detail.call_location');
      const success = await openMapsWithDirections(coordinates.latitude, coordinates.longitude, destinationName, userLocation.latitude || undefined, userLocation.longitude || undefined);

      if (!success) {
        showToast('error', t('call_detail.failed_to_open_maps'));
      }
    } catch (error) {
      logger.error({
        message: 'Failed to open maps for routing',
        context: { error, callId, coordinates },
      });
      showToast('error', t('call_detail.failed_to_open_maps'));
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: t('call_detail.title'),
            headerShown: true,
            headerRight: () => <HeaderRightMenu />,
            headerBackTitle: '',
          }}
        />
        <View className="size-full flex-1">
          <FocusAwareStatusBar hidden={true} />
          <Loading />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: t('call_detail.title'),
            headerShown: true,
            headerRight: () => <HeaderRightMenu />,
            headerBackTitle: '',
          }}
        />
        <View className="size-full flex-1">
          <FocusAwareStatusBar hidden={true} />
          <Box className="m-3 mt-5 min-h-[200px] w-full max-w-[600px] gap-5 self-center rounded-lg bg-background-50 p-5 lg:min-w-[700px]">
            <ZeroState heading={t('call_detail.not_found')} description={error} isError={true} />
          </Box>
        </View>
      </>
    );
  }

  if (!call) {
    return (
      <>
        <Stack.Screen
          options={{
            title: t('call_detail.title'),
            headerShown: true,
            headerBackTitle: '',
          }}
        />
        <SafeAreaView className="size-full flex-1">
          <FocusAwareStatusBar hidden={true} />
          <Box className="m-3 mt-5 min-h-[200px] w-full max-w-[600px] gap-5 self-center rounded-lg bg-background-50 p-5 lg:min-w-[700px]">
            <Text className="text-center">{t('call_detail.not_found')}</Text>
            <Button onPress={handleBack} className="self-center">
              <ButtonText>{t('common.go_back')}</ButtonText>
            </Button>
          </Box>
        </SafeAreaView>
      </>
    );
  }

  const renderTabs = () => {
    const tabs: TabItem[] = [
      {
        key: 'info',
        title: t('call_detail.tabs.info'),
        icon: <InfoIcon size={16} />,
        content: (
          <Box className={`p-4 shadow-sm ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
            <VStack className="space-y-3">
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.priority')}</Text>
                <Text className="font-medium" style={{ color: callPriority?.Color }}>
                  {callPriority?.Name}
                </Text>
              </Box>
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.timestamp')}</Text>
                <Text className="font-medium">{format(new Date(call.LoggedOn), 'MMM d, h:mm a')}</Text>
              </Box>
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.type')}</Text>
                <Text className="font-medium">{call.Type}</Text>
              </Box>
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.address')}</Text>
                <Text className="font-medium">{call.Address}</Text>
              </Box>
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.note')}</Text>
                <Box>
                  <WebView
                    style={[styles.container, { height: 200 }]}
                    originWhitelist={['*']}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    source={{
                      html: `
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                                    <style>
                                      body {
                                        color: ${textColor};
                                        font-family: system-ui, -apple-system, sans-serif;
                                        margin: 0;
                                        padding: 0;
                                        font-size: 16px;
                                        line-height: 1.5;
                                      }
                                      * {
                                        max-width: 100%;
                                      }
                                    </style>
                                  </head>
                                  <body>${call.Note}</body>
                                </html>
                              `,
                    }}
                    androidLayerType="software"
                  />
                </Box>
              </Box>
            </VStack>
          </Box>
        ),
      },
      {
        key: 'contact',
        title: t('call_detail.tabs.contact'),
        icon: <UserIcon size={16} />,
        content: (
          <Box className="p-4">
            <VStack className="space-y-3">
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.reference_id')}</Text>
                <Text className="font-medium">{call.ReferenceId}</Text>
              </Box>
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.external_id')}</Text>
                <Text className="font-medium">{call.ExternalId}</Text>
              </Box>
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.contact_name')}</Text>
                <Text className="font-medium">{call.ContactName}</Text>
              </Box>
              <Box className="border-b border-outline-100 pb-2">
                <Text className="text-sm text-gray-500">{t('call_detail.contact_info')}</Text>
                <Text className="font-medium">{call.ContactInfo}</Text>
              </Box>
            </VStack>
          </Box>
        ),
      },
      {
        key: 'protocols',
        title: t('call_detail.tabs.protocols'),
        icon: <FileTextIcon size={16} />,
        content: (
          <Box className="p-4">
            {callExtraData?.Protocols && callExtraData.Protocols.length > 0 ? (
              <VStack className="space-y-3">
                {callExtraData.Protocols.map((protocol, index) => (
                  <Box key={index} className="rounded-lg bg-gray-50 p-3">
                    <Text className="font-semibold">{protocol.Name}</Text>
                    <Text className="text-sm text-gray-600">{protocol.Description}</Text>
                    <Box>
                      <WebView
                        style={[styles.container, { height: 200 }]}
                        originWhitelist={['*']}
                        scrollEnabled={false}
                        showsVerticalScrollIndicator={false}
                        source={{
                          html: `
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                                    <style>
                                      body {
                                        color: ${textColor};
                                        font-family: system-ui, -apple-system, sans-serif;
                                        margin: 0;
                                        padding: 0;
                                        font-size: 16px;
                                        line-height: 1.5;
                                      }
                                      * {
                                        max-width: 100%;
                                      }
                                    </style>
                                  </head>
                                  <body>${protocol.ProtocolText}</body>
                                </html>
                              `,
                        }}
                        androidLayerType="software"
                      />
                    </Box>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text>{t('call_detail.no_protocols')}</Text>
            )}
          </Box>
        ),
      },
      {
        key: 'dispatched',
        title: t('call_detail.tabs.dispatched'),
        icon: <UsersIcon size={16} />,
        content: (
          <Box className="p-4">
            {callExtraData?.Dispatches && callExtraData.Dispatches.length > 0 ? (
              <VStack className="space-y-3">
                {callExtraData.Dispatches.map((dispatched, index) => (
                  <Box key={index} className={`rounded-lg p-3 ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                    <Text className="font-semibold">{dispatched.Name}</Text>
                    <HStack className="mt-1">
                      <Text className="mr-2 text-sm text-gray-600">
                        {t('call_detail.group')}: {dispatched.Group}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {t('call_detail.type')}: {dispatched.Type}
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text>{t('call_detail.no_dispatched')}</Text>
            )}
          </Box>
        ),
      },
      {
        key: 'timeline',
        title: t('call_detail.tabs.timeline'),
        icon: <ClockIcon size={16} />,
        badge: callExtraData?.Activity?.length || 0,
        content: (
          <Box className="p-4">
            {callExtraData?.Activity && callExtraData.Activity.length > 0 ? (
              <VStack className="space-y-3">
                {callExtraData.Activity.map((event, index) => (
                  <Box key={index} className="border-l-4 border-blue-500 py-1 pl-3">
                    <Text className="font-semibold" style={{ color: event.StatusColor }}>
                      {event.StatusText}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {event.Name} - {event.Group}
                    </Text>
                    <Text className="text-xs text-gray-500">{new Date(event.Timestamp).toLocaleString()}</Text>
                    <Text className="text-xs text-gray-500">{event.Note}</Text>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text>{t('call_detail.no_timeline')}</Text>
            )}
          </Box>
        ),
      },
    ];

    return tabs;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('call_detail.title'),
          headerShown: true,
          headerRight: () => <HeaderRightMenu />,
          headerBackTitle: '',
        }}
      />
      <ScrollView className={`size-full w-full flex-1 ${colorScheme === 'dark' ? 'bg-neutral-950' : 'bg-neutral-50'}`}>
        {/* Header */}
        <Box className={`p-4 shadow-sm ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
          <HStack className="mb-2 items-center justify-between">
            <Heading size="md">
              {call.Name} ({call.Number})
            </Heading>
            {/* Show "Set Active" button if this call is not the active call and there is an active unit */}
            {activeUnit && activeCall?.CallId !== call.CallId && (
              <Button variant="solid" size="sm" onPress={handleSetActive} disabled={isSettingActive} className={`${isSettingActive ? 'bg-primary-400 opacity-80' : 'bg-primary-500'} shadow-lg`}>
                {isSettingActive && <ButtonIcon as={LoaderIcon} className="mr-1 animate-spin text-white" />}
                <ButtonText className="font-medium text-white">{isSettingActive ? t('call_detail.setting_active') : t('call_detail.set_active')}</ButtonText>
              </Button>
            )}
          </HStack>
          <VStack className="space-y-1">
            <Box style={{ height: 80 }}>
              <WebView
                style={[styles.container, { height: 80 }]}
                originWhitelist={['*']}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                source={{
                  html: `
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                                    <style>
                                      body {
                                        color: ${textColor};
                                        font-family: system-ui, -apple-system, sans-serif;
                                        margin: 0;
                                        padding: 0;
                                        font-size: 16px;
                                        line-height: 1.5;
                                      }
                                      * {
                                        max-width: 100%;
                                      }
                                    </style>
                                  </head>
                                  <body>${call.Nature}</body>
                                </html>
                              `,
                }}
                androidLayerType="software"
              />
            </Box>
          </VStack>
        </Box>

        {/* Map */}
        <Box className="w-full">
          {coordinates.latitude && coordinates.longitude ? <StaticMap latitude={coordinates.latitude} longitude={coordinates.longitude} address={call.Address} zoom={15} height={200} showUserLocation={true} /> : null}
        </Box>

        {/* Action Buttons */}
        <HStack className={`justify-around p-4 shadow-sm ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
          <Box className="relative mx-1 flex-1">
            <Button onPress={() => openNotesModal()} variant="outline" className="w-full" size={isLandscape ? 'md' : 'sm'}>
              <ButtonIcon as={FileTextIcon} />
              <ButtonText className={isLandscape ? '' : 'text-xs'}>{t('call_detail.notes')}</ButtonText>
            </Button>
            {call?.NotesCount ? (
              <Box className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1">
                <Text className="text-xs font-medium text-white">{call.NotesCount}</Text>
              </Box>
            ) : null}
          </Box>
          <Box className="relative mx-1 flex-1">
            <Button onPress={openImagesModal} variant="outline" className="w-full" size={isLandscape ? 'md' : 'sm'}>
              <ButtonIcon as={ImageIcon} />
              <ButtonText className={isLandscape ? '' : 'text-xs'}>{t('call_detail.images')}</ButtonText>
            </Button>
            {call?.ImgagesCount ? (
              <Box className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1">
                <Text className="text-xs font-medium text-white">{call.ImgagesCount}</Text>
              </Box>
            ) : null}
          </Box>
          <Box className="relative mx-1 flex-1">
            <Button onPress={openFilesModal} variant="outline" className="w-full" size={isLandscape ? 'md' : 'sm'}>
              <ButtonIcon as={PaperclipIcon} />
              <ButtonText className={isLandscape ? '' : 'text-xs'}>{t('call_detail.files.button')}</ButtonText>
            </Button>
            {call?.FileCount ? (
              <Box className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1">
                <Text className="text-xs font-medium text-white">{call.FileCount}</Text>
              </Box>
            ) : null}
          </Box>
          <Box className="relative mx-1 flex-1">
            <Button onPress={handleRoute} variant="outline" className="w-full" size={isLandscape ? 'md' : 'sm'}>
              <ButtonIcon as={RouteIcon} />
              <ButtonText className={isLandscape ? '' : 'text-xs'}>{t('common.route')}</ButtonText>
            </Button>
          </Box>
        </HStack>

        {/* Tabs */}
        <Box className={`mt-4 flex-1 pb-8 ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
          <SharedTabs tabs={renderTabs()} variant="underlined" size={isLandscape ? 'md' : 'sm'} />
        </Box>
      </ScrollView>
      <CallNotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} callId={callId} />
      <CallImagesModal isOpen={isImagesModalOpen} onClose={() => setIsImagesModalOpen(false)} callId={callId} />
      <CallFilesModal isOpen={isFilesModalOpen} onClose={() => setIsFilesModalOpen(false)} callId={callId} />

      {/* Close Call Bottom Sheet */}
      <CloseCallBottomSheet isOpen={isCloseCallModalOpen} onClose={() => setIsCloseCallModalOpen(false)} callId={callId} />

      {/* Status Bottom Sheet */}
      <StatusBottomSheet />

      {/* Call Detail Menu ActionSheet */}
      <CallDetailActionSheet />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});
