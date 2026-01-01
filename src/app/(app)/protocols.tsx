import { FileText, Search, X } from 'lucide-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View } from 'react-native';

import { Loading } from '@/components/common/loading';
import ZeroState from '@/components/common/zero-state';
import { ProtocolCard } from '@/components/protocols/protocol-card';
import { ProtocolDetailsSheet } from '@/components/protocols/protocol-details-sheet';
import { Box } from '@/components/ui/box';
import { FlatList } from '@/components/ui/flat-list';
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';
import { Input } from '@/components/ui/input';
import { InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { useAnalytics } from '@/hooks/use-analytics';
import { useProtocolsStore } from '@/stores/protocols/store';

export default function Protocols() {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { protocols, searchQuery, setSearchQuery, selectProtocol, isLoading, fetchProtocols } = useProtocolsStore();
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  // Track when protocols view is rendered
  React.useEffect(() => {
    trackEvent('protocols_view_rendered', {
      protocolsCount: protocols.length,
      hasSearchQuery: searchQuery.length > 0,
    });
  }, [trackEvent, protocols.length, searchQuery.length]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchProtocols();
    setRefreshing(false);
  }, [fetchProtocols]);

  const filteredProtocols = React.useMemo(() => {
    if (!searchQuery.trim()) return protocols;

    const query = searchQuery.toLowerCase();
    return protocols.filter((protocol) => protocol.Name.toLowerCase().includes(query) || protocol.Description?.toLowerCase().includes(query) || protocol.Code?.toLowerCase().includes(query));
  }, [protocols, searchQuery]);

  return (
    <>
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <FocusAwareStatusBar />
        <Box className="flex-1 px-4 pt-4">
          <Input className="mb-4 rounded-lg bg-white dark:bg-gray-800" size="md" variant="outline">
            <InputSlot className="pl-3">
              <InputIcon as={Search} />
            </InputSlot>
            <InputField placeholder={t('protocols.search')} value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery ? (
              <InputSlot className="pr-3" onPress={() => setSearchQuery('')}>
                <InputIcon as={X} />
              </InputSlot>
            ) : null}
          </Input>

          {isLoading && !refreshing ? (
            <Loading />
          ) : filteredProtocols.length > 0 ? (
            <FlatList
              testID="protocols-list"
              data={filteredProtocols}
              keyExtractor={(item, index) => item.Id || `protocol-${index}`}
              renderItem={({ item }) => <ProtocolCard protocol={item} onPress={selectProtocol} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          ) : (
            <ZeroState icon={FileText} heading={t('protocols.empty')} description={t('protocols.emptyDescription')} />
          )}
        </Box>

        <ProtocolDetailsSheet />
      </View>
    </>
  );
}
