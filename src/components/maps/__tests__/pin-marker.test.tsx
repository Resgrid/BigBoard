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
