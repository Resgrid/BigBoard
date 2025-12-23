import { useColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { create } from 'zustand';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';

// Tab state management with zustand
interface TabState {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

const useTabStore = create<TabState>((set) => ({
  activeIndex: 0,
  setActiveIndex: (index) => set({ activeIndex: index }),
}));

// Types for the tab items
export interface TabItem {
  key: string;
  title: string | React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number;
}

interface SharedTabsProps {
  tabs: TabItem[];
  initialIndex?: number;
  scrollable?: boolean;
  variant?: 'default' | 'pills' | 'underlined' | 'segmented';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tabClassName?: string;
  tabsContainerClassName?: string;
  contentClassName?: string;
  onChange?: (index: number) => void;
}

export const SharedTabs: React.FC<SharedTabsProps> = ({
  tabs,
  initialIndex = 0,
  scrollable = true,
  variant = 'default',
  size = 'md',
  className = '',
  tabClassName = '',
  tabsContainerClassName = '',
  contentClassName = '',
  onChange,
}) => {
  const { t } = useTranslation();
  const [localActiveIndex, setLocalActiveIndex] = useState(initialIndex);
  const { activeIndex, setActiveIndex } = useTabStore();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { colorScheme } = useColorScheme();

  // Use local state if no external state management is needed
  const currentIndex = onChange ? activeIndex : localActiveIndex;

  const handleTabPress = useCallback(
    (index: number) => {
      if (onChange) {
        setActiveIndex(index);
        onChange(index);
      } else {
        setLocalActiveIndex(index);
      }
    },
    [onChange, setActiveIndex]
  );

  // Get appropriate text color based on theme
  const getTextColor = () => {
    return colorScheme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  };

  // Determine tab styles based on variant and size
  const getTabStyles = (index: number) => {
    const isActive = index === currentIndex;

    const baseStyles = 'flex-1 flex items-center justify-center';
    const sizeStyles = {
      sm: isLandscape ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-2xs',
      md: isLandscape ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
      lg: isLandscape ? 'px-5 py-2.5 text-base' : 'px-4 py-2 text-sm',
    }[size];

    const variantStyles = {
      default: isActive ? 'border-b-2 border-primary-500 text-primary-500' : `border-b-2 border-transparent ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`,
      pills: isActive ? 'bg-primary-500 text-white rounded-full' : `bg-transparent ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`,
      underlined: isActive ? 'border-b-2 border-primary-500 text-primary-500' : `border-b-2 border-transparent ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`,
      segmented: isActive ? 'bg-primary-500 text-white' : `${colorScheme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`,
    }[variant];

    return `${baseStyles} ${sizeStyles} ${variantStyles} ${tabClassName}`;
  };

  // Container styles based on variant
  const getContainerStyles = () => {
    const baseStyles = 'flex flex-row flex-1';

    const variantStyles = {
      default: colorScheme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200',
      pills: 'space-x-2 p-1',
      underlined: colorScheme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200',
      segmented: colorScheme === 'dark' ? 'bg-gray-800 p-1 rounded-lg' : 'bg-gray-100 p-1 rounded-lg',
    }[variant];

    return `${baseStyles} ${variantStyles} ${tabsContainerClassName}`;
  };

  // Convert Tailwind classes to style object
  const getContainerStyle = () => {
    const borderColor = colorScheme === 'dark' ? '#374151' : '#e5e7eb';
    const backgroundColor = colorScheme === 'dark' ? '#1f2937' : '#f3f4f6';

    const styles = StyleSheet.create({
      container: {
        flexDirection: 'row',
        flex: 1,
        ...(variant === 'default' && { borderBottomWidth: 1, borderBottomColor: borderColor }),
        ...(variant === 'pills' && { gap: 8, padding: 4 }),
        ...(variant === 'underlined' && { borderBottomWidth: 1, borderBottomColor: borderColor }),
        ...(variant === 'segmented' && { backgroundColor, padding: 4, borderRadius: 8 }),
      },
    });
    return styles.container;
  };

  return (
    <Box className={`flex-1 ${className}`}>
      {/* Tab Headers */}
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={getContainerStyle()}>
          {tabs.map((tab, index) => (
            <Pressable key={tab.key} className={getTabStyles(index)} onPress={() => handleTabPress(index)}>
              {tab.icon && <Box className={isLandscape ? 'mr-1.5' : 'mr-1'}>{tab.icon}</Box>}
              {typeof tab.title === 'string' ? (
                <Text className={isLandscape ? getTextColor() : `text-xs ${getTextColor()}`}>{t(tab.title)}</Text>
              ) : (
                <Text className={isLandscape ? getTextColor() : `text-xs ${getTextColor()}`}>{tab.title}</Text>
              )}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Box className={`${isLandscape ? 'ml-1.5' : 'ml-1'} min-w-[20px] items-center rounded-full bg-red-500 px-1.5 py-0.5`}>
                  <Text className="text-xs font-bold text-white">{tab.badge}</Text>
                </Box>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Box className={getContainerStyles()}>
          {tabs.map((tab, index) => (
            <Pressable key={tab.key} className={`flex-1 ${getTabStyles(index)}`} onPress={() => handleTabPress(index)}>
              {tab.icon && <Box className={isLandscape ? 'mr-1.5' : 'mr-1'}>{tab.icon}</Box>}
              {typeof tab.title === 'string' ? (
                <Text className={isLandscape ? getTextColor() : `text-xs ${getTextColor()}`}>{t(tab.title)}</Text>
              ) : (
                <Text className={isLandscape ? getTextColor() : `text-xs ${getTextColor()}`}>{tab.title}</Text>
              )}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Box className={`${isLandscape ? 'ml-1.5' : 'ml-1'} min-w-[20px] items-center rounded-full bg-red-500 px-1.5 py-0.5`}>
                  <Text className="text-xs font-bold text-white">{tab.badge}</Text>
                </Box>
              )}
            </Pressable>
          ))}
        </Box>
      )}

      {/* Tab Content */}
      <Box className={`flex-1 ${contentClassName}`}>{tabs[currentIndex]?.content}</Box>
    </Box>
  );
};
