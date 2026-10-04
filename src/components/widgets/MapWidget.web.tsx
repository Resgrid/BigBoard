import mapboxgl from 'mapbox-gl';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { getMapDataAndMarkers, getMapLayers } from '@/api/mapping/mapping';
import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { useMapLiveLocations } from '@/hooks/use-map-live-locations';
import { useMapSignalRUpdates } from '@/hooks/use-map-signalr-updates';
import { logger } from '@/lib/logging';
import { getDepartmentMapCenter } from '@/lib/map-center';
import { useDepartmentMapStyle } from '@/lib/map-style';
import { getMapboxAccessToken, onMapboxAccessTokenChange } from '@/lib/mapbox-token';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';
import { useCoreStore } from '@/stores/app/core-store';
import useAuthStore from '@/stores/auth/store';

import MapPins from '../maps/map-pins.web';
import { WidgetContainer } from './WidgetContainer';

interface MapWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const MapWidget: React.FC<MapWidgetProps> = ({ onRemove, isEditMode, width = 2, height = 3, containerWidth, containerHeight }) => {
  const [mapPins, setMapPins] = useState<MapMakerInfoData[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hasCenteredRef = useRef(false);

  // The department's day/night base map. It changes when config lands as well as when the theme
  // flips, so construction reads it through a ref and a separate effect restyles the live map
  // instead of tearing it (and its pins) down.
  const mapStyle = useDepartmentMapStyle();
  const mapStyleRef = useRef(mapStyle);
  const appliedMapStyleRef = useRef<string | null>(null);
  useEffect(() => {
    mapStyleRef.current = mapStyle;
  }, [mapStyle]);

  // mapbox-gl reads its global token on every request. The listener runs inside the token store's
  // update, before the re-render that may restyle the map with a style needing the new token.
  useEffect(
    () =>
      onMapboxAccessTokenChange((token) => {
        mapboxgl.accessToken = token;
      }),
    []
  );

  // Get auth and core store states
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useCoreStore((state) => state.isInitialized);
  const isAuthenticated = !!accessToken;

  // Realtime unit/personnel positions move pins in place; every REST snapshot goes through applySnapshot
  const { applySnapshot } = useMapLiveLocations(mapPins, setMapPins);
  const handleMarkersUpdate = useCallback((markers: MapMakerInfoData[], fetchStartedAt: number) => setMapPins(applySnapshot(markers, fetchStartedAt)), [applySnapshot]);

  // Use SignalR updates to refresh map pins
  useMapSignalRUpdates(handleMarkersUpdate);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;
    // Building the map before config lands pins it on the fallback centre permanently: the guard
    // above means this effect never constructs a second time once a map exists.
    if (!isInitialized) return;

    mapboxgl.accessToken = getMapboxAccessToken();

    // Add CSS if not already added
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    const center = getDepartmentMapCenter();

    appliedMapStyleRef.current = mapStyleRef.current;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyleRef.current,
      center: [center.longitude, center.latitude],
      zoom: center.zoomLevel,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setIsMapReady(true);
    });

    return () => {
      // Clean up map
      map.current?.remove();
      map.current = null;
      appliedMapStyleRef.current = null;
      // Reset loaded flag when map is cleaned up
      setHasLoadedInitialData(false);
      // A rebuilt map starts on the fallback centre again, so let it re-centre once
      hasCenteredRef.current = false;
    };
  }, [isInitialized]);

  // Restyle the live map when the department style changes (config load or theme flip). Pins are
  // DOM markers, so they survive setStyle.
  useEffect(() => {
    if (map.current && appliedMapStyleRef.current !== mapStyle) {
      map.current.setStyle(mapStyle);
      appliedMapStyleRef.current = mapStyle;
    }
  }, [mapStyle]);

  // Load initial map data when conditions are met
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isMapReady || !isAuthenticated || !isInitialized || hasLoadedInitialData) {
        return;
      }

      try {
        logger.info({ message: 'MapWidget.web: Loading initial map data' });

        // Fetch both map data and layers
        const fetchStartedAt = Date.now();
        const [mapDataResult, layersResult] = await Promise.all([
          getMapDataAndMarkers(),
          getMapLayers(0), // 0 = All layers
        ]);

        if (mapDataResult?.Data?.MapMakerInfos) {
          logger.info({
            message: 'MapWidget.web: Initial map data loaded',
            context: { markerCount: mapDataResult.Data.MapMakerInfos.length },
          });
          setMapPins(applySnapshot(mapDataResult.Data.MapMakerInfos, fetchStartedAt));
          setHasLoadedInitialData(true);
        }

        if (layersResult?.Data) {
          logger.info({
            message: 'MapWidget.web: Map layers loaded',
            context: { layerCount: layersResult.Data.Layers?.length || 0 },
          });
          // Store layers if needed for future use
        }
      } catch (error) {
        logger.error({
          message: 'MapWidget.web: Failed to load initial map data',
          context: { error },
        });
      }
    };

    loadInitialData();
  }, [isMapReady, isAuthenticated, isInitialized, hasLoadedInitialData, applySnapshot]);

  // Center on the first pin once. Every SignalR-driven refresh hands back a fresh array even when
  // the pins are unchanged, so re-running this per update meant a 1000ms WebGL fly animation on
  // every department event -- and a board that never stopped moving.
  useEffect(() => {
    if (hasCenteredRef.current) return;
    if (!map.current || !isMapReady || mapPins.length === 0) return;

    hasCenteredRef.current = true;
    const firstPin = mapPins[0];
    map.current.flyTo({
      center: [firstPin.Longitude, firstPin.Latitude],
      zoom: 12,
      duration: 1000,
    });
  }, [mapPins, isMapReady]);

  return (
    <WidgetContainer title="Map" onRemove={onRemove} isEditMode={isEditMode} testID="map-widget" width={containerWidth} height={containerHeight}>
      <Box className="relative flex-1">
        {!isMapReady && (
          <Box className="absolute inset-0 z-10 items-center justify-center">
            <Spinner size="small" />
          </Box>
        )}
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        <MapPins map={map.current} pins={mapPins} isMapReady={isMapReady} />
      </Box>
    </WidgetContainer>
  );
};
