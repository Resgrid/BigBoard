import Mapbox from '@rnmapbox/maps';
import React, { useCallback } from 'react';

import { type MAP_ICONS } from '@/constants/map-icons';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

import PinMarker from './pin-marker';

type MapIconKey = keyof typeof MAP_ICONS;

const MARKER_ANCHOR = { x: 0.5, y: 0.5 };

interface MapPinsProps {
  pins: MapMakerInfoData[];
  onPinPress?: (pin: MapMakerInfoData) => void;
}

interface MapPinProps {
  pin: MapMakerInfoData;
  onPinPress?: (pin: MapMakerInfoData) => void;
}

// Memoised per pin: a realtime position update replaces only the moved pin's object, so only that
// marker re-renders. The key/id never include coordinates, so the marker moves in place rather than
// being unmounted and recreated.
const MapPin = React.memo(({ pin, onPinPress }: MapPinProps) => {
  const handlePress = useCallback(() => onPinPress?.(pin), [onPinPress, pin]);

  return (
    <Mapbox.MarkerView id={`pin-${pin.Id}`} coordinate={[pin.Longitude, pin.Latitude]} anchor={MARKER_ANCHOR} allowOverlap={true}>
      <PinMarker imagePath={pin.ImagePath as MapIconKey} title={pin.Title} size={32} onPress={handlePress} />
    </Mapbox.MarkerView>
  );
});

const MapPins: React.FC<MapPinsProps> = ({ pins, onPinPress }) => {
  return (
    <>
      {pins.map((pin) => (
        <MapPin key={`pin-${pin.Id}`} pin={pin} onPinPress={onPinPress} />
      ))}
    </>
  );
};

export default MapPins;
