/**
 * @jest-environment jsdom
 */
import { act, render } from '@testing-library/react-native';
import React from 'react';

import PinMarker from '../pin-marker.web';

jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light' }),
}));

const ICON_URL = 'https://api.resgrid.dev/api/v4/TypeIcons/u12.png';

const images = (root: ReturnType<typeof render>) => root.UNSAFE_root.findAll((node) => node.type === 'img');

describe('PinMarker (web) uploaded icons', () => {
  it("shows the department's uploaded icon in place of the bundled one", () => {
    const view = render(<PinMarker imagePath="ambulance" iconUrl={ICON_URL} title="Medic 1" />);

    const [image] = images(view);
    expect(images(view)).toHaveLength(1);
    expect(image.props.src).toBe(ICON_URL);
    expect(image.props.style).toEqual(expect.objectContaining({ width: 32, height: 32, objectFit: 'contain' }));
  });

  it('falls back to the bundled icon when the upload fails to load, and tries a new upload afresh', () => {
    const view = render(<PinMarker imagePath="ambulance" iconUrl={ICON_URL} title="Medic 1" />);

    act(() => {
      images(view)[0].props.onError();
    });

    expect(images(view)).toHaveLength(1);
    expect(images(view)[0].props.src).not.toBe(ICON_URL);
    expect(images(view)[0].props.onError).toBeUndefined();

    const nextUrl = 'https://api.resgrid.dev/api/v4/TypeIcons/u13.png';
    view.rerender(<PinMarker imagePath="ambulance" iconUrl={nextUrl} title="Medic 1" />);

    expect(images(view)[0].props.src).toBe(nextUrl);
  });

  it('ignores an icon URL that is not an absolute http(s) URL', () => {
    const view = render(<PinMarker imagePath="ambulance" iconUrl="javascript:alert(1)" title="Medic 1" />);

    expect(images(view)).toHaveLength(1);
    expect(images(view)[0].props.src).not.toContain('javascript');
    expect(images(view)[0].props.onError).toBeUndefined();
  });
});
