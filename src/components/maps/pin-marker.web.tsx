import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';

import { MAP_ICONS } from '@/constants/map-icons';
import { getTypeIconUrl } from '@/lib/type-icons';

interface PinMarkerProps {
  imagePath?: string;
  /** The department's uploaded icon for the pin (its unit, call or POI type, or a person's role); wins over `imagePath`. */
  iconUrl?: string | null;
  /** The built-in pin recoloured to the call's priority or the unit's/person's status; wins over `imagePath`, not over `iconUrl`. */
  pinIconUrl?: string | null;
  title: string;
  size?: number;
  onPress?: () => void;
}

const PinMarker: React.FC<PinMarkerProps> = ({ imagePath, iconUrl: uploadedIcon, pinIconUrl: statusPinIcon, title, size = 32, onPress }) => {
  const { colorScheme } = useColorScheme();
  // The upload that failed to load, so the status pin (or the bundled icon) shows instead; a new upload (a new URL) is tried afresh.
  const [failedUploadUrl, setFailedUploadUrl] = useState<string | null>(null);
  // Likewise the status/priority pin that failed to load, so the bundled icon shows instead.
  const [failedPinUrl, setFailedPinUrl] = useState<string | null>(null);
  const uploadedIconUrl = getTypeIconUrl(uploadedIcon);
  const showUpload = uploadedIconUrl !== null && uploadedIconUrl !== failedUploadUrl;
  const pinIconUrl = getTypeIconUrl(statusPinIcon);
  const showPin = !showUpload && pinIconUrl !== null && pinIconUrl !== failedPinUrl;

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
      {showUpload ? (
        <img
          key={uploadedIconUrl}
          src={uploadedIconUrl}
          alt={title}
          onError={() => setFailedUploadUrl(uploadedIconUrl)}
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
          }}
        />
      ) : showPin ? (
        // The status/priority-coloured pin has the bundled pin's shape: same box and fit as the bundled icon, untinted.
        <img
          key={pinIconUrl}
          src={pinIconUrl}
          alt={title}
          onError={() => setFailedPinUrl(pinIconUrl)}
          style={{
            width: size,
            height: size,
            objectFit: 'cover',
          }}
        />
      ) : (
        <img
          src={iconUrl}
          alt={title}
          style={{
            width: size,
            height: size,
            objectFit: 'cover',
          }}
        />
      )}
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
