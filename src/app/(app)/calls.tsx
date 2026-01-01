import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { PlusIcon, RefreshCcwDotIcon, Search, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { CallCard } from '@/components/calls/call-card';
import { Loading } from '@/components/common/loading';
import ZeroState from '@/components/common/zero-state';
import { Box } from '@/components/ui/box';
import { Fab, FabIcon } from '@/components/ui/fab';
import { FlatList } from '@/components/ui/flat-list';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { RefreshControl } from '@/components/ui/refresh-control';
import { useAnalytics } from '@/hooks/use-analytics';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { useCallsStore } from '@/stores/calls/store';
import { useSecurityStore } from '@/stores/security/store';

export default function Calls() {
  const { calls, isLoading, error, fetchCalls, fetchCallPriorities, callPriorities } = useCallsStore();
  const { canUserCreateCalls } = useSecurityStore();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Track analytics when view becomes visible
      trackEvent('calls_viewed', {
        timestamp: new Date().toISOString(),
      });

      fetchCallPriorities();
      fetchCalls();

      return () => {
        // Clean up if needed when screen loses focus
      };
    }, [fetchCalls, fetchCallPriorities, trackEvent])
  );

  const handleRefresh = () => {
    fetchCalls();
    fetchCallPriorities();
  };

  const handleNewCall = () => {
    router.push('/call/new/');
  };

  // Filter calls based on search query
  const filteredCalls = calls.filter((call) => call.CallId.toLowerCase().includes(searchQuery.toLowerCase()) || (call.Nature?.toLowerCase() || '').includes(searchQuery.toLowerCase()));

  // Render content based on loading, error, and data states
  const renderContent = () => {
    if (isLoading) {
      return <Loading text={t('calls.loading')} />;
    }

    if (error) {
      return <ZeroState heading={t('common.errorOccurred')} description={error} isError={true} />;
    }

    return (
      <FlatList<CallResultData>
        data={filteredCalls}
        renderItem={({ item }: { item: CallResultData }) => (
          <Pressable onPress={() => router.push(`/call/${item.CallId}`)}>
            <CallCard call={item} priority={callPriorities.find((p: { Id: number }) => p.Id === item.Priority)} />
          </Pressable>
        )}
        keyExtractor={(item: CallResultData) => item.CallId}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
        ListEmptyComponent={<ZeroState heading={t('calls.no_calls')} description={t('calls.no_calls_description')} icon={RefreshCcwDotIcon} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    );
  };

  return (
    <View className="size-full flex-1 bg-gray-50 dark:bg-gray-900">
      <Box className="flex-1 px-4 pt-4">
        {/* Search input */}
        <Input className="mb-4 rounded-lg bg-white dark:bg-gray-800" size="md" variant="outline">
          <InputSlot className="pl-3">
            <InputIcon as={Search} />
          </InputSlot>
          <InputField placeholder={t('calls.search')} value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery ? (
            <InputSlot className="pr-3" onPress={() => setSearchQuery('')}>
              <InputIcon as={X} />
            </InputSlot>
          ) : null}
        </Input>

        {/* Main content */}
        <Box className="flex-1">{renderContent()}</Box>

        {/* FAB button for creating new call - only show if user can create calls */}
        {canUserCreateCalls ? (
          <Fab placement="bottom right" size="lg" onPress={handleNewCall} testID="new-call-fab">
            <FabIcon as={PlusIcon} size="lg" />
          </Fab>
        ) : null}
      </Box>
    </View>
  );
}
