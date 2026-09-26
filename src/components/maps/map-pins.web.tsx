import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';

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

interface MarkerEntry {
  marker: mapboxgl.Marker;
  root: Root;
  /** The pin this marker currently shows; the click handler reads it so it never goes stale. */
  pin: MapMakerInfoData;
}

const hasCoordinates = (pin: MapMakerInfoData): boolean =>
  Number.isFinite(pin.Latitude) && Number.isFinite(pin.Longitude) && Math.abs(pin.Latitude) <= 90 && Math.abs(pin.Longitude) <= 180 && !(pin.Latitude === 0 && pin.Longitude === 0);

// Unmounting a root synchronously while React is committing (we are inside an effect) warns and can
// race the parent render, so defer it to the next task.
const unmountRootLater = (root: Root) => {
  setTimeout(() => {
    try {
      root.unmount();
    } catch {
      // Already unmounted.
    }
  }, 0);
};

const removeEntry = (entry: MarkerEntry) => {
  try {
    entry.marker.remove();
  } catch {
    // The map may already have been torn down, taking the marker element with it.
  }
  unmountRootLater(entry.root);
};

/**
 * Renders pins as mapbox-gl markers, keyed by pin id. A pin whose object changes is updated in place --
 * a new position is a `setLngLat` -- so realtime location updates move markers without rebuilding the
 * layer, flickering, leaking React roots, or touching the camera.
 */
const MapPins: React.FC<MapPinsProps> = ({ map, pins, onPinPress, isMapReady }) => {
  const entriesRef = useRef<Map<string, MarkerEntry>>(new Map());
  const onPinPressRef = useRef(onPinPress);

  useEffect(() => {
    onPinPressRef.current = onPinPress;
  }, [onPinPress]);

  // Markers belong to one map instance: drop them all when it changes or this component unmounts.
  useEffect(() => {
    const entries = entriesRef.current;
    return () => {
      entries.forEach(removeEntry);
      entries.clear();
    };
  }, [map]);

  useEffect(() => {
    if (!map || !isMapReady) return;

    const entries = entriesRef.current;
    const renderPin = (entry: MarkerEntry) => {
      entry.root.render(<PinMarker imagePath={entry.pin.ImagePath as MapIconKey} title={entry.pin.Title} size={32} onPress={() => onPinPressRef.current?.(entry.pin)} />);
    };

    const currentIds = new Set<string>();

    pins.forEach((pin) => {
      if (!pin || !hasCoordinates(pin)) return;

      const id = String(pin.Id);
      if (currentIds.has(id)) return; // Duplicate id: the first one wins, as a single marker.
      currentIds.add(id);

      const existing = entries.get(id);
      if (!existing) {
        // Create a container div for the React component
        const markerElement = document.createElement('div');
        const root = createRoot(markerElement);
        const marker = new mapboxgl.Marker({
          element: markerElement,
          anchor: 'center',
        })
          .setLngLat([pin.Longitude, pin.Latitude])
          .addTo(map);

        const entry: MarkerEntry = { marker, root, pin };
        renderPin(entry);
        entries.set(id, entry);
        return;
      }

      if (existing.pin === pin) return;

      const previous = existing.pin;
      existing.pin = pin;

      if (previous.Latitude !== pin.Latitude || previous.Longitude !== pin.Longitude) {
        existing.marker.setLngLat([pin.Longitude, pin.Latitude]);
      }

      if (previous.ImagePath !== pin.ImagePath || previous.Title !== pin.Title) {
        renderPin(existing);
      }
    });

    entries.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        removeEntry(entry);
        entries.delete(id);
      }
    });
  }, [map, pins, isMapReady]);

  return null;
};

export default MapPins;
