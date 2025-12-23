import { Cloud, CloudRain, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';

import { getWeather } from '@/api/weather/weather';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useCoreStore } from '@/stores/app/core-store';
import { useLocationStore } from '@/stores/app/location-store';

import { WidgetContainer } from './WidgetContainer';

interface WeatherWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { config } = useCoreStore();
  const { latitude, longitude } = useLocationStore();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = config?.OpenWeatherApiKey;
      const lat = latitude;
      const lon = longitude;

      if (!apiKey || !lat || !lon) {
        setIsLoading(false);
        setError('Weather not configured');
        return;
      }

      try {
        setIsLoading(true);
        const data = await getWeather(apiKey, lat, lon);
        if (data) {
          setWeatherData(data);
          setError(null);
        } else {
          setError('Failed to load');
        }
      } catch (err) {
        setError('Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [config?.OpenWeatherApiKey, latitude, longitude]);

  const WeatherIcon = () => {
    const iconColor = isDark ? '#FCD34D' : '#F59E0B';

    if (!weatherData) return <Sun size={48} color={iconColor} />;

    if (weatherData.condition.includes('Rain')) {
      return <CloudRain size={48} color={iconColor} />;
    } else if (weatherData.condition.includes('Cloud')) {
      return <Cloud size={48} color={iconColor} />;
    }
    return <Sun size={48} color={iconColor} />;
  };

  if (error) {
    return (
      <WidgetContainer title="Weather" onRemove={onRemove} isEditMode={isEditMode} testID="weather-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</Text>
        </Box>
      </WidgetContainer>
    );
  }

  if (isLoading) {
    return (
      <WidgetContainer title="Weather" onRemove={onRemove} isEditMode={isEditMode} testID="weather-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Spinner size="small" />
        </Box>
      </WidgetContainer>
    );
  }

  if (!weatherData) {
    return (
      <WidgetContainer title="Weather" onRemove={onRemove} isEditMode={isEditMode} testID="weather-widget" width={containerWidth} height={containerHeight}>
        <Box className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No data</Text>
        </Box>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Weather" onRemove={onRemove} isEditMode={isEditMode} testID="weather-widget" width={containerWidth} height={containerHeight}>
      <VStack space="md" className="flex-1 items-center justify-center">
        <WeatherIcon />
        <Text className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{weatherData.temperature}°F</Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{weatherData.condition}</Text>
        <HStack space="md" className="mt-2">
          <VStack space="xs" className="items-center">
            <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Humidity</Text>
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{weatherData.humidity}%</Text>
          </VStack>
          <VStack space="xs" className="items-center">
            <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Wind</Text>
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{weatherData.windSpeed} mph</Text>
          </VStack>
        </HStack>
      </VStack>
    </WidgetContainer>
  );
};
