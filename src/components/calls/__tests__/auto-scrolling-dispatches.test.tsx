import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

import { DispatchedEventResultData } from '@/models/v4/calls/dispatchedEventResultData';

import { AutoScrollingDispatches } from '../auto-scrolling-dispatches';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light' }),
  cssInterop: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

(global as any).cssInterop = jest.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDispatch = (overrides: Partial<DispatchedEventResultData> = {}): DispatchedEventResultData =>
  Object.assign(new DispatchedEventResultData(), { Id: '1', Type: 'Unit', Name: 'Engine 1' }, overrides);

const resolveDisplayName = (_type: string, _id: string, name: string) => name;

/** Fire the onLayout event on the primary inner row to unlock the animation. */
const triggerLayout = (getByTestId: ReturnType<typeof render>['getByTestId'], width = 200) => {
  fireEvent(getByTestId('auto-scroll-primary'), 'layout', {
    nativeEvent: { layout: { width, height: 20, x: 0, y: 0 } },
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AutoScrollingDispatches', () => {
  describe('reduce-motion accessibility gate', () => {
    let loopSpy: jest.SpyInstance;
    let startMock: jest.Mock;
    let stopMock: jest.Mock;

    beforeEach(() => {
      startMock = jest.fn();
      stopMock = jest.fn();
      // Intercept Animated.loop so we can assert whether an animation was
      // started without relying on the internal Animated scheduler.
      loopSpy = jest.spyOn(Animated, 'loop').mockReturnValue({
        start: startMock,
        stop: stopMock,
        reset: jest.fn(),
      } as unknown as Animated.CompositeAnimation);
    });

    afterEach(() => {
      loopSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('does NOT create or start an animation when reduce-motion is enabled', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true as never);

      const { getByTestId } = render(
        <AutoScrollingDispatches
          dispatches={[makeDispatch()]}
          resolveDisplayName={resolveDisplayName}
          scrollSpeed={50}
          fontSize={14}
        />
      );

      // Provide a non-zero primaryWidth so the effect proceeds past the early
      // return guard and reaches the isReduceMotionEnabled check.
      await act(async () => {
        triggerLayout(getByTestId);
      });

      expect(loopSpy).not.toHaveBeenCalled();
      expect(startMock).not.toHaveBeenCalled();
    });

    it('creates and starts an animation when reduce-motion is disabled', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false as never);

      const { getByTestId } = render(
        <AutoScrollingDispatches
          dispatches={[makeDispatch()]}
          resolveDisplayName={resolveDisplayName}
          scrollSpeed={50}
          fontSize={14}
        />
      );

      await act(async () => {
        triggerLayout(getByTestId);
      });

      expect(loopSpy).toHaveBeenCalledTimes(1);
      expect(startMock).toHaveBeenCalledTimes(1);
    });

    it('does NOT start an animation when scrollSpeed is 0, regardless of reduce-motion', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false as never);

      const { getByTestId } = render(
        <AutoScrollingDispatches
          dispatches={[makeDispatch()]}
          resolveDisplayName={resolveDisplayName}
          scrollSpeed={0}
          fontSize={14}
        />
      );

      await act(async () => {
        triggerLayout(getByTestId);
      });

      expect(loopSpy).not.toHaveBeenCalled();
      expect(startMock).not.toHaveBeenCalled();
    });

    it('stops a running animation on unmount without throwing when animRef is null', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true as never);

      const { getByTestId, unmount } = render(
        <AutoScrollingDispatches
          dispatches={[makeDispatch()]}
          resolveDisplayName={resolveDisplayName}
          scrollSpeed={50}
          fontSize={14}
        />
      );

      await act(async () => {
        triggerLayout(getByTestId);
      });

      // animRef.current is null (no animation was started); unmounting must not throw.
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('duplicate-row accessibility', () => {
    it('marks the duplicate copy row as inaccessible so screen readers skip it', () => {
      const { UNSAFE_getAllByType } = render(
        <AutoScrollingDispatches
          dispatches={[makeDispatch()]}
          resolveDisplayName={resolveDisplayName}
          scrollSpeed={50}
          fontSize={14}
        />
      );

      const { View } = require('react-native');
      const viewInstances = UNSAFE_getAllByType(View);

      // At least one View should carry accessible={false} (the duplicate row and
      // its separator spacer). Verify that such a view exists.
      const hiddenViews = viewInstances.filter(
        (v: any) => v.props.accessible === false
      );
      expect(hiddenViews.length).toBeGreaterThanOrEqual(1);

      // The duplicate chip container must also have accessibilityElementsHidden.
      const duplicateRow = viewInstances.find(
        (v: any) =>
          v.props.accessible === false && v.props.accessibilityElementsHidden === true
      );
      expect(duplicateRow).toBeDefined();
      expect(duplicateRow?.props.importantForAccessibility).toBe('no-hide-children');
    });

    it('does NOT render the duplicate row when scrollSpeed is 0', () => {
      const { UNSAFE_getAllByType } = render(
        <AutoScrollingDispatches
          dispatches={[makeDispatch()]}
          resolveDisplayName={resolveDisplayName}
          scrollSpeed={0}
          fontSize={14}
        />
      );

      const { View } = require('react-native');
      const viewInstances = UNSAFE_getAllByType(View);
      const hiddenViews = viewInstances.filter(
        (v: any) => v.props.accessible === false
      );
      expect(hiddenViews.length).toBe(0);
    });
  });
});
