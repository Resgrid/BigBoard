import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { MAP_ICONS } from '@/constants/map-icons';

import PinMarker from '../pin-marker';

jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light' }),
}));

// expo-image is a native view; stand in a plain View that keeps the props the component sets.
jest.mock('expo-image', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: Record<string, unknown>) => mockReact.createElement(View, { ...props, testID: 'uploaded-icon' }),
  };
});

const ICON_URL = 'https://api.resgrid.dev/api/v4/TypeIcons/u12.png';
const hidden = { includeHiddenElements: true };

const bundledIcons = () => screen.UNSAFE_queryAllByProps({ fadeDuration: 0 }).filter((node) => typeof node.type !== 'string');

describe('PinMarker (native) uploaded icons', () => {
  it("shows the department's uploaded icon in place of the bundled one", () => {
    render(<PinMarker imagePath="ambulance" iconUrl={ICON_URL} title="Medic 1" size={32} />);

    const uploaded = screen.getByTestId('uploaded-icon', hidden);
    expect(uploaded.props.source).toEqual({ uri: ICON_URL });
    expect(uploaded.props.style).toEqual(expect.objectContaining({ width: 32, height: 32 }));
    expect(bundledIcons()).toHaveLength(0);
    expect(screen.getByText('Medic 1')).toBeTruthy();
  });

  it('falls back to the bundled icon when the upload fails to load', () => {
    render(<PinMarker imagePath="ambulance" iconUrl={ICON_URL} title="Medic 1" />);

    fireEvent(screen.getByTestId('uploaded-icon', hidden), 'error');

    expect(screen.queryByTestId('uploaded-icon', hidden)).toBeNull();
    expect(bundledIcons()[0].props.source).toBe(MAP_ICONS.ambulance.uri);
  });

  it('keeps the bundled icon when the pin has no upload', () => {
    render(<PinMarker imagePath="Ambulance.png" iconUrl={null} title="Medic 1" />);

    expect(screen.queryByTestId('uploaded-icon', hidden)).toBeNull();
    expect(bundledIcons()[0].props.source).toBe(MAP_ICONS.ambulance.uri);
  });
});

describe('PinMarker (native) status pins', () => {
  const PIN_URL = 'https://api.resgrid.dev/api/v4/TypeIcons/Pins/ambulance-responding?v=1';
  const remoteImages = () => screen.queryAllByTestId('uploaded-icon', hidden);

  it("draws the status pin where the bundled pin goes: the bundled pin's box and cover fit, in place of the bundled pin", () => {
    render(<PinMarker imagePath="ambulance" pinIconUrl={PIN_URL} title="Medic 1" size={32} />);

    const [pinImage] = remoteImages();
    expect(remoteImages()).toHaveLength(1);
    expect(pinImage.props.source).toEqual({ uri: PIN_URL });
    expect(pinImage.props.contentFit).toBe('cover');
    expect(pinImage.props.style).toEqual(expect.objectContaining({ width: 32, height: 32 }));
    expect(bundledIcons()).toHaveLength(0);
    expect(screen.getByText('Medic 1')).toBeTruthy();
  });

  it('falls back to the bundled icon when the status pin fails to load', () => {
    render(<PinMarker imagePath="ambulance" pinIconUrl={PIN_URL} title="Medic 1" />);

    fireEvent(remoteImages()[0], 'error');

    expect(remoteImages()).toHaveLength(0);
    expect(bundledIcons()[0].props.source).toBe(MAP_ICONS.ambulance.uri);
  });

  it('prefers the upload over the status pin, then falls through to the status pin and the bundled icon as images fail', () => {
    render(<PinMarker imagePath="ambulance" iconUrl={ICON_URL} pinIconUrl={PIN_URL} title="Medic 1" />);

    expect(remoteImages()).toHaveLength(1);
    expect(remoteImages()[0].props.source).toEqual({ uri: ICON_URL });
    expect(remoteImages()[0].props.contentFit).toBe('contain');

    fireEvent(remoteImages()[0], 'error');

    expect(remoteImages()).toHaveLength(1);
    expect(remoteImages()[0].props.source).toEqual({ uri: PIN_URL });

    fireEvent(remoteImages()[0], 'error');

    expect(remoteImages()).toHaveLength(0);
    expect(bundledIcons()[0].props.source).toBe(MAP_ICONS.ambulance.uri);
  });

  it('ignores a status pin URL that is not an absolute http(s) URL', () => {
    render(<PinMarker imagePath="ambulance" pinIconUrl="/api/v4/TypeIcons/Pins/ambulance-responding" title="Medic 1" />);

    expect(remoteImages()).toHaveLength(0);
    expect(bundledIcons()[0].props.source).toBe(MAP_ICONS.ambulance.uri);
  });
});
