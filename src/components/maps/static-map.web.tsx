import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { useDepartmentMapStyle } from '@/lib/map-style';
import { getMapboxAccessToken, onMapboxAccessTokenChange } from '@/lib/mapbox-token';

interface StaticMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  zoom?: number;
  height?: number;
  showUserLocation?: boolean;
}

const StaticMap: React.FC<StaticMapProps> = ({ latitude, longitude, address, zoom = 15, height = 200 }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // The department's day/night base map. Construction reads it through a ref so a style change
  // (config load, theme flip) restyles the map below instead of rebuilding it.
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

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    mapboxgl.accessToken = getMapboxAccessToken();

    // Add CSS if not already added
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    appliedMapStyleRef.current = mapStyleRef.current;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyleRef.current,
      center: [longitude, latitude],
      zoom: zoom,
      attributionControl: false,
    });

    new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
      appliedMapStyleRef.current = null;
    };
  }, [latitude, longitude, zoom]);

  // The marker is a DOM marker, so it survives setStyle
  useEffect(() => {
    if (map.current && appliedMapStyleRef.current !== mapStyle) {
      map.current.setStyle(mapStyle);
      appliedMapStyleRef.current = mapStyle;
    }
  }, [mapStyle]);

  return (
    <View style={{ height, width: '100%', overflow: 'hidden', borderRadius: 8 }}>
      <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
    </View>
  );
};

export default StaticMap;
