import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { type MAP_ICONS } from '@/constants/map-icons';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

import PinMarker from './pin-marker';

type MapIconKey = keyof typeof MAP_ICONS;

interface MapPinsProps {
  map: mapboxgl.Map | null;
  pins: MapMakerInfoData[];
  onPinPress?: (pin: MapMakerInfoData) => void;
  isMapReady: boolean;
}

const MapPins: React.FC<MapPinsProps> = ({ map, pins, onPinPress, isMapReady }) => {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !isMapReady) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    pins.forEach((pin) => {
      // Create a container div for the React component
      const markerElement = document.createElement('div');
      
      // Create a React root and render the PinMarker component
      const root = createRoot(markerElement);
      root.render(<PinMarker imagePath={pin.ImagePath as MapIconKey} title={pin.Title} size={32} onPress={() => onPinPress?.(pin)} />);

      // Create the mapbox marker with the custom element
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([pin.Longitude, pin.Latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Cleanup function
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [map, pins, onPinPress, isMapReady]);

  return null;
};

export default MapPins;
