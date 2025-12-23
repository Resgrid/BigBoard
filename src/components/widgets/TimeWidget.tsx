import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';

import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { WidgetContainer } from './WidgetContainer';

interface TimeWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const TimeWidget: React.FC<TimeWidgetProps> = ({ onRemove, isEditMode, width = 1, height = 1, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <WidgetContainer title="Time" onRemove={onRemove} isEditMode={isEditMode} testID="time-widget" width={containerWidth} height={containerHeight}>
      <VStack space="sm" className="flex-1 items-center justify-center">
        <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatTime(time)}</Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(time)}</Text>
      </VStack>
    </WidgetContainer>
  );
};
