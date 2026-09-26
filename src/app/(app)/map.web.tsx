import { NavigationIcon } from 'lucide-react-native';
import mapboxgl from 'mapbox-gl';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { getMapDataAndMarkers } from '@/api/mapping/mapping';
import PinDetailModal from '@/components/maps/pin-detail-modal';
import { MAP_ICONS } from '@/constants/map-icons';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppLifecycle } from '@/hooks/use-app-lifecycle';
import { useMapLiveLocations } from '@/hooks/use-map-live-locations';
import { useMapSignalRUpdates } from '@/hooks/use-map-signalr-updates';
import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { getDepartmentMapCenter } from '@/lib/map-center';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';
import { useCoreStore } from '@/stores/app/core-store';
import { useLocationStore } from '@/stores/app/location-store';
import useAuthStore from '@/stores/auth/store';
import { useToastStore } from '@/stores/toast/store';

// Helper function to get icon path from ImagePath
const getIconPath = (imagePath: string): string => {
  const iconKey = imagePath?.toLowerCase() as keyof typeof MAP_ICONS;
  // Never fall back to the call icon: it is a flame, and an unknown POI drawn as a structure fire
  // reads as a real incident on the board.
  const icon = MAP_ICONS[iconKey] || MAP_ICONS['flag'];
  return `/assets/mapping/${icon.imgName}.png`;
};

const hasCoordinates = (pin: MapMakerInfoData): boolean =>
  Number.isFinite(pin.Latitude) && Number.isFinite(pin.Longitude) && Math.abs(pin.Latitude) <= 90 && Math.abs(pin.Longitude) <= 180 && !(pin.Latitude === 0 && pin.Longitude === 0);

// Anything but the position needs the marker element (icon, label, popup) rebuilt.
const hasSameAppearance = (a: MapMakerInfoData, b: MapMakerInfoData): boolean =>
  a.Title === b.Title && a.ImagePath === b.ImagePath && a.Color === b.Color && a.InfoWindowContent === b.InfoWindowContent && a.Type === b.Type;

interface WebMarkerEntry {
  marker: mapboxgl.Marker;
  pin: MapMakerInfoData;
}

export default function Map() {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { colorScheme } = useColorScheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [mapPins, setMapPins] = useState<MapMakerInfoData[]>([]);
  const [selectedPin, setSelectedPin] = useState<MapMakerInfoData | null>(null);
  const [isPinDetailModalOpen, setIsPinDetailModalOpen] = useState(false);
  // Keyed by pin id so a realtime position update is a setLngLat, not a rebuild of every marker.
  const markers = useRef<globalThis.Map<string, WebMarkerEntry>>(new globalThis.Map());
  // The camera fits the pins once per map instance; after that only the user (or the location
  // follow/lock logic) moves it.
  const hasFittedPinsRef = useRef(false);
  const { isActive } = useAppLifecycle();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = !!accessToken;
  const isInitialized = useCoreStore((state) => state.isInitialized);
  const location = useLocationStore((state) => ({
    latitude: state.latitude,
    longitude: state.longitude,
    heading: state.heading,
    isMapLocked: state.isMapLocked,
  }));

  // Component render log
  console.log('🗺️ Map component rendered', { isMapReady, isAuthenticated, isInitialized, isActive });
  logger.debug({
    message: 'Map component rendered',
    context: { isMapReady, isAuthenticated, isInitialized, isActive },
  });

  // Realtime unit/personnel positions move pins in place; every REST snapshot goes through applySnapshot
  const { applySnapshot } = useMapLiveLocations(mapPins, setMapPins);
  const handleMarkersUpdate = useCallback((nextPins: MapMakerInfoData[], fetchStartedAt: number) => setMapPins(applySnapshot(nextPins, fetchStartedAt)), [applySnapshot]);

  useMapSignalRUpdates(handleMarkersUpdate);

  // Track dependency changes
  useEffect(() => {
    logger.debug({ message: 'isMapReady changed', context: { isMapReady } });
  }, [isMapReady]);

  useEffect(() => {
    logger.debug({ message: 'isAuthenticated changed', context: { isAuthenticated } });
  }, [isAuthenticated]);

  useEffect(() => {
    logger.debug({ message: 'isInitialized changed', context: { isInitialized } });
  }, [isInitialized]);

  useEffect(() => {
    logger.debug({ message: 'isActive changed', context: { isActive } });
  }, [isActive]);

  // Get map style based on current theme
  const getMapStyle = useCallback(() => {
    return colorScheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';
  }, [colorScheme]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;
    // Building the map before config lands pins it on the fallback centre permanently: the guard
    // above means this effect never constructs a second time once a map exists.
    if (!isInitialized) return;

    mapboxgl.accessToken = Env.MAPBOX_PUBKEY;

    // Add CSS if not already added
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    const center = getDepartmentMapCenter();
    // The same Map instance for the component's lifetime (only its contents change)
    const pinMarkers = markers.current;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: [center.longitude, center.latitude],
      zoom: center.zoomLevel,
    });

    // Track user interactions - only register if user manually moved map and it's not locked
    map.current.on('movestart', (e: any) => {
      if (e.originalEvent && !location.isMapLocked) {
        setHasUserMovedMap(true);
        logger.debug({ message: 'User moved map', context: { isMapLocked: location.isMapLocked } });
      }
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
    );

    map.current.on('load', () => {
      console.log('🗺️ Map load event fired, setting isMapReady to true');
      logger.info({ message: 'Web map load event fired, setting isMapReady to true' });
      setIsMapReady(true);
      console.log('🗺️ Map is now ready');
      logger.info({ message: 'Web map loaded and ready' });
    });

    return () => {
      userLocationMarker.current?.remove();
      userLocationMarker.current = null;
      // Pin markers belong to this map instance; a rebuilt map gets fresh ones (and one fit)
      pinMarkers.forEach((entry) => entry.marker.remove());
      pinMarkers.clear();
      hasFittedPinsRef.current = false;
      map.current?.remove();
      map.current = null;
      setIsMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getMapStyle, isInitialized]);

  // Update map style when theme changes
  useEffect(() => {
    if (map.current && isMapReady) {
      map.current.setStyle(getMapStyle());
      logger.info({ message: 'Map style updated', context: { theme: colorScheme } });
    }
  }, [colorScheme, getMapStyle, isMapReady]);

  // Update user location marker and camera position
  useEffect(() => {
    if (!map.current || !isMapReady || !location.latitude || !location.longitude) return;

    // Create or update user location marker
    if (!userLocationMarker.current) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.style.cssText = 'width:60px;height:60px;display:flex;align-items:center;justify-content:center;position:relative';

      const outerRing = document.createElement('div');
      outerRing.style.cssText = 'position:absolute;width:60px;height:60px;border-radius:50%;background-color:rgba(59,130,246,0.15);border:2px solid rgba(59,130,246,0.3);animation:pulse 2s infinite';

      const innerContainer = document.createElement('div');
      innerContainer.style.cssText =
        'width:24px;height:24px;display:flex;align-items:center;justify-content:center;background-color:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);position:relative;z-index:1';

      const innerDot = document.createElement('div');
      innerDot.style.cssText = 'width:8px;height:8px;border-radius:50%;background-color:#ffffff';

      innerContainer.appendChild(innerDot);
      el.appendChild(outerRing);
      el.appendChild(innerContainer);

      if (!document.getElementById('user-marker-animation')) {
        const style = document.createElement('style');
        style.id = 'user-marker-animation';
        style.textContent = '@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.8}}';
        document.head.appendChild(style);
      }

      userLocationMarker.current = new mapboxgl.Marker(el).setLngLat([location.longitude, location.latitude]).addTo(map.current);
    } else {
      userLocationMarker.current.setLngLat([location.longitude, location.latitude]);
    }

    logger.debug({
      message: 'Location updated and map is ready',
      context: {
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        isMapLocked: location.isMapLocked,
        hasUserMovedMap,
      },
    });

    // When map is locked, always follow the location
    // When map is unlocked, only follow if user hasn't moved the map
    if (location.isMapLocked || !hasUserMovedMap) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: location.isMapLocked ? 16 : 12,
        duration: location.isMapLocked ? 500 : 1000,
        bearing: location.isMapLocked && location.heading !== null ? location.heading : 0,
        pitch: location.isMapLocked ? 45 : 0,
      });
    }
  }, [isMapReady, location.latitude, location.longitude, location.heading, location.isMapLocked, hasUserMovedMap]);

  // Reset hasUserMovedMap when map gets locked and reset camera when unlocked
  useEffect(() => {
    if (location.isMapLocked) {
      setHasUserMovedMap(false);
    } else {
      // When exiting locked mode, reset camera to normal view and reset user interaction state
      setHasUserMovedMap(false);

      if (map.current && location.latitude && location.longitude) {
        map.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 12,
          bearing: 0,
          pitch: 0,
          duration: 1000,
        });
        logger.info({
          message: 'Map unlocked, resetting camera to normal view and user interaction state',
          context: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });
      }
    }
  }, [location.isMapLocked, location.latitude, location.longitude]);

  // Track when map view is rendered
  useEffect(() => {
    trackEvent('map_view_rendered', {
      hasMapPins: mapPins.length > 0,
      mapPinsCount: mapPins.length,
      isMapLocked: location.isMapLocked,
      theme: colorScheme || 'light',
    });
  }, [trackEvent, mapPins.length, location.isMapLocked, colorScheme]);

  // Fetch map data when conditions are met
  useEffect(() => {
    console.log('🔄 Map data fetch useEffect triggered', {
      isMapReady,
      isAuthenticated,
      isInitialized,
      isActive,
      hasUserMovedMap,
      isMapLocked: location.isMapLocked,
    });
    logger.debug({
      message: 'Map data fetch useEffect triggered',
      context: {
        isMapReady,
        isAuthenticated,
        isInitialized,
        isActive,
        hasUserMovedMap,
        isMapLocked: location.isMapLocked,
      },
    });

    if (!isMapReady || !isAuthenticated || !isInitialized || !isActive) {
      console.log('⏭️ Skipping map data fetch - conditions not met', { isMapReady, isAuthenticated, isInitialized, isActive });
      logger.debug({
        message: 'Skipping map data fetch - conditions not met',
        context: { isMapReady, isAuthenticated, isInitialized, isActive },
      });
      return;
    }

    console.log('✅ All conditions met, creating abortController and calling fetchMapDataAndMarkers');

    const abortController = new AbortController();

    const fetchMapDataAndMarkers = async () => {
      try {
        logger.info({
          message: 'Fetching map data and markers (web) - core store ready and map loaded',
          context: { isMapReady, isAuthenticated, isInitialized, isActive },
        });

        const fetchStartedAt = Date.now();
        const mapDataAndMarkers = await getMapDataAndMarkers(abortController.signal);

        if (mapDataAndMarkers && mapDataAndMarkers.Data) {
          setMapPins(applySnapshot(mapDataAndMarkers.Data.MapMakerInfos ?? [], fetchStartedAt));

          logger.info({
            message: 'Map pins set from API response',
            context: {
              pinCount: mapDataAndMarkers.Data.MapMakerInfos?.length || 0,
              pins: mapDataAndMarkers.Data.MapMakerInfos?.slice(0, 3).map((p) => ({ id: p.Id, title: p.Title })),
            },
          });

          if (map.current && mapDataAndMarkers.Data.CenterLat && mapDataAndMarkers.Data.CenterLon && !hasUserMovedMap && !location.isMapLocked) {
            const centerLat = parseFloat(mapDataAndMarkers.Data.CenterLat);
            const centerLon = parseFloat(mapDataAndMarkers.Data.CenterLon);
            const zoomLevel = mapDataAndMarkers.Data.ZoomLevel ? parseFloat(mapDataAndMarkers.Data.ZoomLevel) : 12;

            if (!isNaN(centerLat) && !isNaN(centerLon)) {
              map.current.flyTo({
                center: [centerLon, centerLat],
                zoom: isNaN(zoomLevel) ? 12 : zoomLevel,
                duration: 1000,
              });

              logger.info({
                message: 'Web map centered on coordinates from API',
                context: { centerLat, centerLon, zoomLevel },
              });
            }
          }

          logger.info({
            message: 'Map data loaded successfully (web)',
            context: { markerCount: mapDataAndMarkers.Data.MapMakerInfos?.length || 0 },
          });
        }
      } catch (error) {
        if (error instanceof Error && (error.name === 'AbortError' || error.message === 'canceled')) {
          logger.debug({ message: 'Map data fetch was aborted during component unmount' });
          return;
        }
        logger.error({ message: 'Failed to fetch map data and markers (web)', context: { error } });
      }
    };

    console.log('📞 Calling fetchMapDataAndMarkers function');
    fetchMapDataAndMarkers();
    return () => {
      console.log('🧹 Cleanup: aborting map data fetch');
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady, isAuthenticated, isInitialized, isActive]);

  const handlePinPress = useCallback((pin: MapMakerInfoData) => {
    setSelectedPin(pin);
    setIsPinDetailModalOpen(true);
  }, []);

  // Sync markers with pins by id. A moved pin is a setLngLat on its existing marker, so realtime
  // position updates and SignalR refreshes neither rebuild the layer nor touch the camera: the pins are
  // fitted once per map instance, after that only the user (or the location follow logic) moves it.
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    const currentMap = map.current;
    const entries = markers.current;

    const createMarker = (pin: MapMakerInfoData): WebMarkerEntry => {
      const markerContainer = document.createElement('div');
      markerContainer.className = 'custom-marker-container';
      markerContainer.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer';

      const iconEl = document.createElement('img');
      iconEl.style.cssText = 'width:32px;height:32px;object-fit:contain';
      iconEl.alt = pin.Title || 'Marker';

      if (pin.Color) {
        markerContainer.style.filter = `hue-rotate(${pin.Color})`;
      }

      iconEl.onerror = () => {
        iconEl.style.display = 'none';
        const fallbackIcon = document.createElement('div');
        fallbackIcon.style.cssText = `width:32px;height:32px;border-radius:50%;background-color:${pin.Color || '#3b82f6'};border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)`;
        markerContainer.insertBefore(fallbackIcon, markerContainer.firstChild);
      };

      iconEl.src = getIconPath(pin.ImagePath || 'flag');

      const titleEl = document.createElement('div');
      titleEl.className = 'marker-title';
      titleEl.textContent = pin.Title || '';
      titleEl.style.cssText =
        'margin-top:2px;font-size:10px;font-weight:600;text-align:center;color:#000;background-color:rgba(255,255,255,0.9);padding:2px 4px;border-radius:3px;max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 2px rgba(0,0,0,0.2)';

      markerContainer.appendChild(iconEl);
      markerContainer.appendChild(titleEl);

      const marker = new mapboxgl.Marker(markerContainer)
        .setLngLat([pin.Longitude, pin.Latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false }).setHTML(
            `<div style="padding:12px;min-width:200px">
              <h3 style="margin:0 0 8px 0;font-weight:bold;font-size:14px">${pin.Title || 'Unknown'}</h3>
              ${pin.InfoWindowContent ? `<div style="margin:8px 0;font-size:12px">${pin.InfoWindowContent}</div>` : ''}
              ${pin.Type ? `<p style="margin:4px 0 0 0;font-size:11px;color:#666">Type: ${pin.Type}</p>` : ''}
            </div>`
          )
        )
        .addTo(currentMap);

      const entry: WebMarkerEntry = { marker, pin };
      // Read the entry's pin at click time: it is updated in place as the pin moves.
      markerContainer.addEventListener('click', () => handlePinPress(entry.pin));
      return entry;
    };

    const currentIds = new Set<string>();

    mapPins.forEach((pin) => {
      if (!pin || !hasCoordinates(pin)) return;

      const id = String(pin.Id);
      if (currentIds.has(id)) return; // Duplicate id: the first one wins, as a single marker.
      currentIds.add(id);

      const existing = entries.get(id);
      if (existing && existing.pin === pin) return;

      if (existing && hasSameAppearance(existing.pin, pin)) {
        if (existing.pin.Latitude !== pin.Latitude || existing.pin.Longitude !== pin.Longitude) {
          existing.marker.setLngLat([pin.Longitude, pin.Latitude]);
        }
        existing.pin = pin;
        return;
      }

      existing?.marker.remove();
      entries.set(id, createMarker(pin));
    });

    entries.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        entry.marker.remove();
        entries.delete(id);
      }
    });

    if (!hasFittedPinsRef.current && currentIds.size > 0) {
      hasFittedPinsRef.current = true;
      const bounds = new mapboxgl.LngLatBounds();
      mapPins.forEach((pin) => {
        if (pin && hasCoordinates(pin)) {
          bounds.extend([pin.Longitude, pin.Latitude]);
        }
      });
      currentMap.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      logger.info({ message: 'Markers added to web map', context: { markerCount: entries.size } });
    }
  }, [mapPins, isMapReady, handlePinPress]);

  const handleRecenterMap = () => {
    if (map.current && location.latitude && location.longitude) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: location.isMapLocked ? 16 : 12,
        bearing: location.isMapLocked && location.heading !== null ? location.heading : 0,
        pitch: location.isMapLocked ? 45 : 0,
        duration: 1000,
      });
      setHasUserMovedMap(false);
      logger.debug({ message: 'Map recentered to user location' });
    }
  };

  const handleSetAsCurrentCall = async (pin: MapMakerInfoData) => {
    try {
      logger.info({ message: 'Setting call as current call', context: { callId: pin.Id, callTitle: pin.Title } });
      useToastStore.getState().showToast('success', t('map.call_set_as_current'));
    } catch (error) {
      logger.error({ message: 'Failed to set call as current call', context: { error, callId: pin.Id, callTitle: pin.Title } });
      useToastStore.getState().showToast('error', t('map.failed_to_set_current_call'));
    }
  };

  const handleClosePinDetail = () => {
    setIsPinDetailModalOpen(false);
    setSelectedPin(null);
  };

  const showRecenterButton = !location.isMapLocked && hasUserMovedMap && location.latitude && location.longitude;

  return (
    <View style={styles.container}>
      <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />

      {showRecenterButton && (
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenterMap} {...(Platform.OS === 'web' ? { 'data-testid': 'recenter-button' } : { testID: 'recenter-button' })}>
          <NavigationIcon size={20} color="#ffffff" />
        </TouchableOpacity>
      )}

      <PinDetailModal pin={selectedPin} isOpen={isPinDetailModalOpen} onClose={handleClosePinDetail} onSetAsCurrentCall={handleSetAsCurrentCall} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    cursor: 'pointer',
  },
});
