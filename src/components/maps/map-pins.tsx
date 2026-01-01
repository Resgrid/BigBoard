import Mapbox from '@rnmapbox/maps';
import React from 'react';

import { type MAP_ICONS } from '@/constants/map-icons';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

import PinMarker from './pin-marker';

type MapIconKey = keyof typeof MAP_ICONS;

interface MapPinsProps {
  pins: MapMakerInfoData[];
  onPinPress?: (pin: MapMakerInfoData) => void;
}

const MapPins: React.FC<MapPinsProps> = ({ pins, onPinPress }) => {
  return (
    <>
      {pins.map((pin) => (
        <Mapbox.MarkerView key={`pin-${pin.Id}`} id={`pin-${pin.Id}`} coordinate={[pin.Longitude, pin.Latitude]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap={true}>
          <PinMarker imagePath={pin.ImagePath as MapIconKey} title={pin.Title} size={32} onPress={() => onPinPress?.(pin)} />
        </Mapbox.MarkerView>
      ))}
    </>
  );
};

export default MapPins;
