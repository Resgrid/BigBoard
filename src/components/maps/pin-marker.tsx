import type Mapbox from '@rnmapbox/maps';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { MAP_ICONS } from '@/constants/map-icons';

interface PinMarkerProps {
  imagePath?: string;
  title: string;
  size?: number;
  markerRef?: Mapbox.PointAnnotation | null;
  onPress?: () => void;
}

const PinMarker: React.FC<PinMarkerProps> = ({ imagePath, title, size = 32, onPress }) => {
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Image fadeDuration={0} source={icon.uri} style={[styles.image, { width: size, height: size }]} />
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
  title: {
    marginTop: 2,
    overflow: 'visible',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PinMarker;
