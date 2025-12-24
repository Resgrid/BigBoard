import * as Location from 'expo-location';
import { Cloud, CloudDrizzle, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { getWeatherOutlook, type WeatherOutlook } from '@/api/weather/weather';
import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useCoreStore } from '@/stores/app/core-store';
import { useLocationStore } from '@/stores/app/location-store';
import { useMapStore } from '@/stores/mapping/map-store';

import { WidgetContainer } from './WidgetContainer';

interface WeatherWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
  metadata?: { lat?: number; lon?: number };
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 2, containerWidth, containerHeight, metadata }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { config } = useCoreStore();
  const { latitude, longitude, setLocation } = useLocationStore();
  const { mapData, fetchMapData } = useMapStore();
  const [weatherData, setWeatherData] = useState<WeatherOutlook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = config?.OpenWeatherApiKey;
      let lat: number | undefined;
      let lon: number | undefined;

      console.log('WeatherWidget - API Key:', apiKey ? 'Present' : 'Missing');

      if (!apiKey) {
        setIsLoading(false);
        setError('API key not configured');
        return;
      }

      // Priority 1: Widget metadata (lat/lon if set and non-zero)
      if (metadata?.lat && metadata?.lon && metadata.lat !== 0 && metadata.lon !== 0) {
        lat = metadata.lat;
        lon = metadata.lon;
        console.log('WeatherWidget - Using widget metadata:', { lat, lon });
      }
      // Priority 2: CenterLat and CenterLon from map data
      else if (mapData?.CenterLat && mapData?.CenterLon) {
        const mapLat = parseFloat(mapData.CenterLat);
        const mapLon = parseFloat(mapData.CenterLon);
        if (!isNaN(mapLat) && !isNaN(mapLon) && mapLat !== 0 && mapLon !== 0) {
          lat = mapLat;
          lon = mapLon;
          console.log('WeatherWidget - Using map center:', { lat, lon });
        }
      }
      // Priority 3: Location store (if already set)
      else if (latitude && longitude && latitude !== 0 && longitude !== 0) {
        lat = latitude;
        lon = longitude;
        console.log('WeatherWidget - Using location store:', { lat, lon });
      }

      // Priority 4: Request browser/device location
      if (!lat || !lon) {
        try {
          console.log('WeatherWidget - Requesting location permissions...');
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status !== 'granted') {
            // Try to fetch map data as fallback
            if (!mapData) {
              console.log('WeatherWidget - Fetching map data as fallback...');
              await fetchMapData();
              const newMapData = useMapStore.getState().mapData;
              if (newMapData?.CenterLat && newMapData?.CenterLon) {
                const mapLat = parseFloat(newMapData.CenterLat);
                const mapLon = parseFloat(newMapData.CenterLon);
                if (!isNaN(mapLat) && !isNaN(mapLon) && mapLat !== 0 && mapLon !== 0) {
                  lat = mapLat;
                  lon = mapLon;
                  console.log('WeatherWidget - Using map center from fetch:', { lat, lon });
                }
              }
            }
            
            if (!lat || !lon) {
              setIsLoading(false);
              setError('Location permission denied');
              return;
            }
          } else {
            console.log('WeatherWidget - Getting current position...');
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            setLocation(location);
            lat = location.coords.latitude;
            lon = location.coords.longitude;
            console.log('WeatherWidget - Location obtained:', { lat, lon });
          }
        } catch (err) {
          console.error('WeatherWidget - Error getting location:', err);
          // Try to fetch map data as final fallback
          if (!mapData) {
            console.log('WeatherWidget - Fetching map data as final fallback...');
            try {
              await fetchMapData();
              const newMapData = useMapStore.getState().mapData;
              if (newMapData?.CenterLat && newMapData?.CenterLon) {
                const mapLat = parseFloat(newMapData.CenterLat);
                const mapLon = parseFloat(newMapData.CenterLon);
                if (!isNaN(mapLat) && !isNaN(mapLon) && mapLat !== 0 && mapLon !== 0) {
                  lat = mapLat;
                  lon = mapLon;
                  console.log('WeatherWidget - Using map center from error fallback:', { lat, lon });
                }
              }
            } catch (mapErr) {
              console.error('WeatherWidget - Error fetching map data:', mapErr);
            }
          }
          
          if (!lat || !lon) {
            setIsLoading(false);
            setError('Unable to get location');
            return;
          }
        }
      }

      try {
        setIsLoading(true);
        console.log('WeatherWidget - Fetching weather data...');
        const data = await getWeatherOutlook(apiKey, lat!, lon!);
        if (data) {
          console.log('WeatherWidget - Data loaded successfully:', data.location);
          setWeatherData(data);
          setError(null);
        } else {
          console.log('WeatherWidget - No data returned');
          setError('Failed to load');
        }
      } catch (err) {
        console.error('WeatherWidget - Error fetching weather:', err);
        setError(`Failed to load: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [config?.OpenWeatherApiKey, latitude, longitude, setLocation, metadata, mapData, fetchMapData]);

  const getWeatherIcon = (condition: string, size: number = 48) => {
    const iconColor = isDark ? '#FCD34D' : '#F59E0B';
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('rain') || conditionLower.includes('thunderstorm')) {
      return <CloudRain size={size} color={iconColor} />;
    } else if (conditionLower.includes('drizzle')) {
      return <CloudDrizzle size={size} color={iconColor} />;
    } else if (conditionLower.includes('snow')) {
      return <CloudSnow size={size} color={iconColor} />;
    } else if (conditionLower.includes('cloud')) {
      return <Cloud size={size} color={iconColor} />;
    } else if (conditionLower.includes('wind')) {
      return <Wind size={size} color={iconColor} />;
    }
    return <Sun size={size} color={iconColor} />;
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

  // Determine if we should use horizontal layout (need at least 500px for comfortable horizontal display)
  const useHorizontalLayout = containerWidth && containerWidth >= 500;

  return (
    <WidgetContainer title={`Weather - ${weatherData.location}`} onRemove={onRemove} isEditMode={isEditMode} testID="weather-widget" width={containerWidth} height={containerHeight}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="sm" className="p-2">
          {/* Current Weather */}
          <VStack space="xs" className="items-center">
            {getWeatherIcon(weatherData.current.condition, 64)}
            <Text className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{weatherData.current.temperature}°F</Text>
            <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{weatherData.current.condition}</Text>
            <HStack space="md" className="mt-1">
              <VStack space="xs" className="items-center">
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Humidity</Text>
                <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{weatherData.current.humidity}%</Text>
              </VStack>
              <VStack space="xs" className="items-center">
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Wind</Text>
                <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{weatherData.current.windSpeed} mph</Text>
              </VStack>
            </HStack>
          </VStack>

          <Divider className="my-1" />

          {/* 5-Day Forecast */}
          <VStack space="xs">
            <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>5-Day Forecast</Text>
            
            {useHorizontalLayout ? (
              // Horizontal layout for wider screens
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2">
                <HStack space="xs">
                  {weatherData.forecast.map((day, index) => (
                    <Box key={index} className={`rounded-lg p-2 w-20 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <VStack space="xs" className="items-center">
                        <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-center`}>{day.dayName}</Text>
                        {getWeatherIcon(day.condition, 32)}
                        <VStack space="xs" className="items-center">
                          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.tempHigh}°</Text>
                          <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.tempLow}°</Text>
                        </VStack>
                        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`} numberOfLines={2}>{day.condition}</Text>
                      </VStack>
                    </Box>
                  ))}
                </HStack>
              </ScrollView>
            ) : (
              // Vertical layout for narrower screens
              weatherData.forecast.map((day, index) => (
                <Box key={index} className={`rounded-lg p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <HStack className="items-center justify-between">
                    <HStack space="sm" className="flex-1 items-center">
                      {getWeatherIcon(day.condition, 32)}
                      <VStack space="xs" className="flex-1">
                        <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.dayName}</Text>
                        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.condition}</Text>
                      </VStack>
                    </HStack>
                    <HStack space="xs" className="items-center">
                      <VStack space="xs" className="items-center">
                        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>High</Text>
                        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.tempHigh}°</Text>
                      </VStack>
                      <VStack space="xs" className="items-center">
                        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Low</Text>
                        <Text className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.tempLow}°</Text>
                      </VStack>
                    </HStack>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </WidgetContainer>
  );
};
