import { EditIcon, MoreVerticalIcon, XIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Pressable } from '@/components/ui/';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { HStack } from '@/components/ui/hstack';
import { useAnalytics } from '@/hooks/use-analytics';

interface CallDetailMenuProps {
  onEditCall: () => void;
  onCloseCall: () => void;
  canUserCreateCalls?: boolean;
}

export const useCallDetailMenu = ({ onEditCall, onCloseCall, canUserCreateCalls = false }: CallDetailMenuProps) => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const [isKebabMenuOpen, setIsKebabMenuOpen] = useState(false);

  // Track when call detail menu is opened
  useEffect(() => {
    if (isKebabMenuOpen) {
      trackEvent('call_detail_menu_opened', {
        hasEditAction: canUserCreateCalls,
        hasCloseAction: canUserCreateCalls,
      });
    }
  }, [isKebabMenuOpen, trackEvent, canUserCreateCalls]);

  const openMenu = () => {
    setIsKebabMenuOpen(true);
  };
  const closeMenu = () => setIsKebabMenuOpen(false);

  const HeaderRightMenu = () => {
    // Don't show menu if user doesn't have create calls permission
    if (!canUserCreateCalls) {
      return null;
    }

    return (
      <Pressable onPressIn={openMenu} testID="kebab-menu-button" className="rounded p-2">
        <MoreVerticalIcon size={24} className="text-gray-700 dark:text-gray-300" />
      </Pressable>
    );
  };

  const CallDetailActionSheet = () => {
    // Don't show action sheet if user doesn't have create calls permission
    if (!canUserCreateCalls) {
      return null;
    }

    return (
      <Actionsheet isOpen={isKebabMenuOpen} onClose={closeMenu} testID="call-detail-actionsheet">
        <ActionsheetBackdrop />
        <ActionsheetContent className="bg-white dark:bg-gray-900">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ActionsheetItem
            onPress={() => {
              closeMenu();
              onEditCall();
            }}
            testID="edit-call-button"
          >
            <HStack className="items-center">
              <EditIcon size={16} className="mr-3 text-gray-700 dark:text-gray-300" />
              <ActionsheetItemText>{t('call_detail.edit_call')}</ActionsheetItemText>
            </HStack>
          </ActionsheetItem>

          <ActionsheetItem
            onPress={() => {
              closeMenu();
              onCloseCall();
            }}
            testID="close-call-button"
          >
            <HStack className="items-center">
              <XIcon size={16} className="mr-3 text-gray-700 dark:text-gray-300" />
              <ActionsheetItemText>{t('call_detail.close_call')}</ActionsheetItemText>
            </HStack>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    );
  };

  return {
    HeaderRightMenu,
    CallDetailActionSheet,
    isMenuOpen: isKebabMenuOpen,
    openMenu,
    closeMenu,
  };
};
