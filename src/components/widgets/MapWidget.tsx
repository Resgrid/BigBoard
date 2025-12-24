import Mapbox from '@rnmapbox/maps';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { getMapDataAndMarkers, getMapLayers } from '@/api/mapping/mapping';
import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useMapSignalRUpdates } from '@/hooks/use-map-signalr-updates';
import { logger } from '@/lib/logging';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';
import { useCoreStore } from '@/stores/app/core-store';
import useAuthStore from '@/stores/auth/store';
import { useMapStore } from '@/stores/mapping/map-store';

import MapPins from '../maps/map-pins';
import { WidgetContainer } from './WidgetContainer';

interface MapWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export const MapWidget: React.FC<MapWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 3, containerWidth, containerHeight }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [mapPins, setMapPins] = useState<MapMakerInfoData[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const cameraRef = useRef<Mapbox.Camera>(null);

  // Get auth and core store states
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useCoreStore((state) => state.isInitialized);
  const isAuthenticated = !!accessToken;
  
  // Get map store
  const { setMapData } = useMapStore();

  // Use SignalR updates to refresh map pins
  useMapSignalRUpdates(setMapPins);

  // Load initial map data when conditions are met
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isMapReady || !isAuthenticated || !isInitialized || hasLoadedInitialData) {
        return;
      }

      try {
        logger.info({ message: 'MapWidget: Loading initial map data' });

        // Fetch both map data and layers
        const [mapDataResult, layersResult] = await Promise.all([
          getMapDataAndMarkers(),
          getMapLayers(0), // 0 = All layers
        ]);

        if (mapDataResult?.Data?.MapMakerInfos) {
          logger.info({
            message: 'MapWidget: Initial map data loaded',
            context: { markerCount: mapDataResult.Data.MapMakerInfos.length },
          });
          setMapPins(mapDataResult.Data.MapMakerInfos);
          
          // Store map data in the map store for other widgets to access
          setMapData(mapDataResult.Data);
          
          setHasLoadedInitialData(true);
        }

        if (layersResult?.Data) {
          logger.info({
            message: 'MapWidget: Map layers loaded',
            context: { layerCount: layersResult.Data.Layers?.length || 0 },
          });
          // Store layers if needed for future use
        }
      } catch (error) {
        logger.error({
          message: 'MapWidget: Failed to load initial map data',
          context: { error },
        });
      }
    };

    loadInitialData();
  }, [isMapReady, isAuthenticated, isInitialized, hasLoadedInitialData, setMapData]);

  // Center on first pin if available
  useEffect(() => {
    if (isMapReady && mapPins.length > 0 && cameraRef.current) {
      const firstPin = mapPins[0];
      cameraRef.current.setCamera({
        centerCoordinate: [firstPin.Longitude, firstPin.Latitude],
        zoomLevel: 12,
        animationDuration: 1000,
      });
    }
  }, [isMapReady, mapPins]);

  const styleURL = {
    styleURL: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
  };

  return (
    <WidgetContainer title="Map" onRemove={onRemove} isEditMode={isEditMode} testID="map-widget" width={containerWidth} height={containerHeight}>
      <Box className="relative flex-1">
        {!isMapReady && (
          <Box className="absolute inset-0 z-10 items-center justify-center">
            <Spinner size="small" />
          </Box>
        )}
        <Mapbox.MapView styleURL={styleURL.styleURL} style={styles.map} onDidFinishLoadingMap={() => setIsMapReady(true)}>
          <Mapbox.Camera ref={cameraRef} zoomLevel={10} animationDuration={0} />
          <MapPins pins={mapPins} />
        </Mapbox.MapView>
      </Box>
    </WidgetContainer>
  );
};
