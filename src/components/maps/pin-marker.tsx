import type Mapbox from '@rnmapbox/maps';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { TypeIcon } from '@/components/common/type-icon';
import { MAP_ICONS } from '@/constants/map-icons';

interface PinMarkerProps {
  imagePath?: string;
  /** The department's uploaded icon for the pin (its unit, call or POI type, or a person's role); wins over `imagePath`. */
  iconUrl?: string | null;
  /** The built-in pin recoloured to the call's priority or the unit's/person's status; wins over `imagePath`, not over `iconUrl`. */
  pinIconUrl?: string | null;
  title: string;
  size?: number;
  markerRef?: Mapbox.PointAnnotation | null;
  onPress?: () => void;
}

const PinMarker: React.FC<PinMarkerProps> = ({ imagePath, iconUrl, pinIconUrl, title, size = 32, onPress }) => {
  const { colorScheme } = useColorScheme();

  // Convert imagePath to lowercase and clean it up
  // Remove any path separators and file extensions
  // A POI or an unrecognised marker must never fall through to the call icon -- that is a flame,
  // and drawing a hospital as a structure fire is worse than drawing it as a generic pin.
  let iconName = 'flag';
  if (imagePath) {
    iconName =
      imagePath
        .toLowerCase()
        .replace(/\\/g, '/') // normalize path separators
        .split('/')
        .pop() || 'flag'; // get filename only
    iconName = iconName.replace(/\.png$/i, ''); // remove .png extension if present
  }

  const icon = MAP_ICONS[iconName as keyof typeof MAP_ICONS] || MAP_ICONS['flag'];
  const bundledIcon = <Image fadeDuration={0} source={icon.uri} style={[styles.image, { width: size, height: size }]} />;
  // The status/priority-coloured pin has the bundled pin's shape, so it is drawn in the same box and fit, untinted;
  // absent or failing to load, the bundled icon shows.
  const pinIcon = <TypeIcon iconUrl={pinIconUrl} size={size} contentFit="cover" style={styles.pinImage} fallback={bundledIcon} />;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* An uploaded type/role icon shows in the bundled icon's footprint; absent or failing to load, the status pin (then the bundled icon) shows. */}
      <TypeIcon iconUrl={iconUrl} size={size} fallback={pinIcon} />
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    overflow: 'visible',
    resizeMode: 'cover',
  },
  pinImage: {
    overflow: 'visible',
  },
  title: {
    marginTop: 2,
    overflow: 'visible',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PinMarker;
