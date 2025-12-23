import { type LucideIcon } from 'lucide-react-native';
import { FileQuestion } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';

import { Box } from '../ui/box';
import { Center } from '../ui/center';
import { Heading } from '../ui/heading';
import { VStack } from '../ui/vstack';

interface ZeroStateProps {
  /**
   * Icon to display (Lucide React Native icon)
   * @default FileQuestion
   */
  icon?: LucideIcon;

  /**
   * Size of the icon
   * @default 80
   */
  iconSize?: number;

  /**
   * Color of the icon
   * @default "#64748b" (slate-500)
   */
  iconColor?: string;

  /**
   * Heading text
   * @default "No data available"
   */
  heading?: string;

  /**
   * Description text
   * @default "There's nothing to display at the moment"
   */
  description?: string;

  /**
   * Additional content to render below the description
   */
  children?: React.ReactNode;

  /**
   * Whether this is an error state
   * @default false
   */
  isError?: boolean;

  /**
   * Custom class name for additional styling of the Center component
   */
  className?: string;

  /**
   * Custom class name for the root View component
   * @default "size-full p-6"
   */
  viewClassName?: string;

  /**
   * Custom class name for the Center component (overrides default)
   * @default "flex-1 p-6"
   */
  centerClassName?: string;
}

/**
 * ZeroState component for displaying empty states or error messages
 */
const ZeroState: React.FC<ZeroStateProps> = ({
  icon: Icon = FileQuestion,
  iconSize = 80,
  iconColor = '#64748b', // slate-500
  heading,
  description,
  children,
  isError = false,
  className = '',
  viewClassName = 'size-full p-6',
  centerClassName = 'flex-1 p-6',
}) => {
  const { t } = useTranslation();

  // Default texts with translations
  const defaultHeading = isError ? t('common.errorOccurred', 'An error occurred') : t('common.noDataAvailable', 'No data available');

  const defaultDescription = isError ? t('common.tryAgainLater', 'Please try again later') : t('common.nothingToDisplay', "There's nothing to display at the moment");

  return (
    <View className={viewClassName}>
      <Center className={`${centerClassName} ${className}`} {...(Platform.OS === 'web' ? { 'data-testid': 'zero-state' } : { testID: 'zero-state' })}>
        <VStack space="md" className="items-center">
          <Box className="mb-4">
            <Icon size={iconSize} color={isError ? '#ef4444' : iconColor} />
          </Box>

          <Heading size="lg" className={`mb-2 text-center ${isError ? 'text-red-500' : 'text-info-500'}`}>
            {heading || defaultHeading}
          </Heading>

          <Text className="mb-6 text-center text-info-400">{description || defaultDescription}</Text>

          {children}
        </VStack>
      </Center>
    </View>
  );
};

export default ZeroState;
