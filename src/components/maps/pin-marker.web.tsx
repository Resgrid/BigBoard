import { useColorScheme } from 'nativewind';
import React from 'react';

import { MAP_ICONS } from '@/constants/map-icons';

interface PinMarkerProps {
  imagePath?: string;
  title: string;
  size?: number;
  onPress?: () => void;
}

const PinMarker: React.FC<PinMarkerProps> = ({ imagePath, title, size = 32, onPress }) => {
  const { colorScheme } = useColorScheme();

  // Convert imagePath to lowercase and clean it up
  // Remove any path separators and file extensions
  let iconName = 'call';
  if (imagePath) {
    iconName = imagePath
      .toLowerCase()
      .replace(/\\/g, '/') // normalize path separators
      .split('/').pop() || 'call'; // get filename only
    iconName = iconName.replace(/\.png$/i, ''); // remove .png extension if present
  }
  
  const icon = MAP_ICONS[iconName as keyof typeof MAP_ICONS] || MAP_ICONS['call'];
  
  // On web, the uri can be an object with nested uri property or a string
  let iconUrl: string;
  if (typeof icon?.uri === 'string') {
    iconUrl = icon.uri;
  } else if (icon?.uri && typeof icon.uri === 'object' && 'uri' in icon.uri) {
    // Handle nested uri structure from require(): {uri: '/assets/...', width: 32, height: 37}
    iconUrl = (icon.uri as any).uri;
  } else {
    iconUrl = String(icon?.uri || '');
  }

  return (
    <div
      onClick={onPress}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onPress ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <img
        src={iconUrl}
        alt={title}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          marginTop: 2,
          fontSize: 10,
          fontWeight: 600,
          textAlign: 'center',
          color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          maxWidth: 100,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textShadow: colorScheme === 'dark' ? '0 0 3px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.6)' : '0 0 3px rgba(255,255,255,0.8), 0 0 5px rgba(255,255,255,0.6)',
        }}
      >
        {title}
      </div>
    </div>
  );
};

export default PinMarker;
