import { useRouter } from 'expo-router';
import { Calendar, CalendarCheck, Contact, Headphones, Home, ListTree, LogOut, type LucideIcon, Mail, Map, Megaphone, Mic, Notebook, Settings, Truck, User, Users, Wifi, WifiOff } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthStore } from '@/lib/auth';
import { logger } from '@/lib/logging';
import { getAvatarUrl } from '@/lib/utils';
import { useSecurityStore } from '@/stores/security/store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

interface MenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  route: string;
  testID: string;
}

interface SideMenuProps {
  onNavigate?: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = React.memo(({ onNavigate }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { logout } = useAuthStore();
  const { isUpdateHubConnected, lastUpdateTimestamp, reconnectUpdateHub, checkConnectionState } = useSignalRStore();
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  // Poll connection state every 2 seconds to ensure UI stays in sync
  React.useEffect(() => {
    // Check immediately on mount
    checkConnectionState();

    // Set up polling interval
    const interval = setInterval(() => {
      checkConnectionState();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkConnectionState]);

  // All hooks must be called before any early returns
  const handleNavigation = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    onNavigate?.();
  }, [logout, onNavigate]);

  const handleReconnect = useCallback(async () => {
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    try {
      await reconnectUpdateHub();
    } catch (error) {
      logger.error({
        message: 'Failed to reconnect from side menu',
        context: { error },
      });
    } finally {
      setIsReconnecting(false);
    }
  }, [reconnectUpdateHub, isReconnecting]);

  const getInitials = useCallback((name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, []);

  // Format the last update timestamp
  const formatLastUpdate = useCallback(() => {
    if (!lastUpdateTimestamp) return t('common.never', 'Never');
    return new Date(lastUpdateTimestamp).toLocaleString();
  }, [lastUpdateTimestamp, t]);

  // Get connection status text
  const getConnectionStatus = useCallback(() => {
    return isUpdateHubConnected ? t('common.connected', 'Connected') : t('common.disconnected', 'Disconnected');
  }, [isUpdateHubConnected, t]);

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      title: t('tabs.home', 'Home'),
      icon: Home,
      route: '/(app)/home',
      testID: 'side-menu-home',
    },
    {
      id: 'settings',
      title: t('tabs.settings'),
      icon: Settings,
      route: '/(app)/settings',
      testID: 'side-menu-settings',
    },
  ];

  // Get user display name and department name from security store
  const isDark = colorScheme === 'dark';

  return (
    <Box className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} {...(Platform.OS === 'web' ? { 'data-testid': 'side-menu-container' } : { testID: 'side-menu-container' })}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left']}>
        <ScrollView className="flex-1">
          <VStack space="md" className="flex-1 p-4">
            <Divider className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />

            {/* SignalR Status Block */}
            <Box className={`rounded-xl p-3 ${isDark ? 'border border-gray-700 bg-gray-800' : 'border border-gray-200 bg-gray-50'}`} {...(Platform.OS === 'web' ? { 'data-testid': 'side-menu-signalr-status' } : { testID: 'side-menu-signalr-status' })}>
              <VStack space="sm">
                <HStack space="md" className="items-center">
                  {isUpdateHubConnected ? <Wifi size={20} color="#10B981" /> : <WifiOff size={20} color="#EF4444" />}
                  <VStack space="xs" className="flex-1">
                    <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} {...(Platform.OS === 'web' ? { 'data-testid': 'side-menu-signalr-status-text' } : { testID: 'side-menu-signalr-status-text' })}>
                      {getConnectionStatus()}
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} {...(Platform.OS === 'web' ? { 'data-testid': 'side-menu-signalr-last-update' } : { testID: 'side-menu-signalr-last-update' })} numberOfLines={1}>
                      {t('common.last_update', 'Last Update')}: {formatLastUpdate()}
                    </Text>
                  </VStack>
                </HStack>
                {!isUpdateHubConnected && (
                  <Button
                    size="sm"
                    onPress={handleReconnect}
                    disabled={isReconnecting}
                    className="bg-primary-600"
                    {...(Platform.OS === 'web' ? { 'data-testid': 'side-menu-reconnect-button' } : { testID: 'side-menu-reconnect-button' })}
                  >
                    {isReconnecting && <ButtonSpinner className="mr-2" />}
                    <ButtonText>{isReconnecting ? t('common.reconnecting', 'Reconnecting...') : t('common.reconnect', 'Reconnect')}</ButtonText>
                  </Button>
                )}
              </VStack>
            </Box>

            <Divider className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />

            {/* Navigation Menu */}
            <VStack space="xs" className="flex-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      handleNavigation(item.route);
                      onNavigate?.();
                    }}
                    {...(Platform.OS === 'web' ? { 'data-testid': item.testID } : { testID: item.testID })}
                    className={`flex-row items-center rounded-lg p-3 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    <IconComponent size={20} color={isDark ? '#9CA3AF' : '#4B5563'} />
                    <Text className={`ml-3 text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.title}</Text>
                  </Pressable>
                );
              })}
            </VStack>

            <Divider className={`my-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

            {/* Logout Button */}
            <Pressable onPress={handleLogout} {...(Platform.OS === 'web' ? { 'data-testid': 'side-menu-logout' } : { testID: 'side-menu-logout' })} className={`flex-row items-center rounded-lg p-3 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              <LogOut size={20} color={isDark ? '#9CA3AF' : '#4B5563'} />
              <Text className={`ml-3 text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('settings.logout')}</Text>
            </Pressable>
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
});

SideMenu.displayName = 'SideMenu';

export default SideMenu;
