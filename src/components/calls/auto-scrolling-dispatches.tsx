import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { type DispatchedEventResultData } from '@/models/v4/calls/dispatchedEventResultData';

interface AutoScrollingDispatchesProps {
  dispatches: DispatchedEventResultData[];
  resolveDisplayName: (type: string, id: string, name: string) => string;
  /** Pixels per second. 0 = no auto-scroll. */
  scrollSpeed: number;
  fontSize: number;
}

const DISPATCH_TYPE_COLORS: Record<string, string> = {
  Unit: '#16a34a',
  unit: '#16a34a',
  Group: '#9333ea',
  group: '#9333ea',
  Station: '#9333ea',
  station: '#9333ea',
  Role: '#ea580c',
  role: '#ea580c',
  Personnel: '#2563eb',
  personnel: '#2563eb',
  User: '#2563eb',
  user: '#2563eb',
};

const SEPARATOR_WIDTH = 40;

const IS_WEB = Platform.OS === 'web';

export const AutoScrollingDispatches: React.FC<AutoScrollingDispatchesProps> = ({ dispatches, resolveDisplayName, scrollSpeed, fontSize }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [primaryWidth, setPrimaryWidth] = useState(0);

  const loopWidth = primaryWidth + SEPARATOR_WIDTH;
  const isScrolling = scrollSpeed > 0 && primaryWidth > 0;
  const durationMs = isScrolling ? (loopWidth / scrollSpeed) * 1000 : 0;

  useEffect(() => {
    // Stop any running animation and reset position whenever deps change
    animRef.current?.stop();
    animRef.current = null;
    scrollX.setValue(0);

    // Web drives this from CSS instead -- see the track style below. react-native-web has no
    // native animated module, so the JS path here would repaint from a 60fps rAF loop, and one
    // of these renders per dispatched call.
    if (IS_WEB) {
      return;
    }

    if (scrollSpeed <= 0 || primaryWidth <= 0) {
      return;
    }

    // Scroll the whole loopWidth (primary + gap) — the duplicate copy placed right
    // after fills the gap so the transition is seamless.
    const duration = durationMs;

    let active = true;

    // Use a recursive Animated.timing approach instead of Animated.loop so that
    // scrollX is explicitly reset to 0 at the start of each cycle. This avoids a
    // web/Electron quirk where Animated.loop does not reliably reset the value
    // between iterations, causing chips to scroll off-screen and then freeze.
    const runCycle = () => {
      if (!active) return;
      scrollX.setValue(0);
      const timing = Animated.timing(scrollX, {
        toValue: -loopWidth,
        duration,
        useNativeDriver: true,
        isInteraction: false,
      });
      animRef.current = timing;
      timing.start(({ finished }) => {
        if (finished && active) runCycle();
      });
    };

    runCycle();

    return () => {
      active = false;
      animRef.current?.stop();
      animRef.current = null;
    };
  }, [primaryWidth, scrollSpeed, scrollX, durationMs, loopWidth]);

  if (dispatches.length === 0) return null;

  const renderChips = (items: DispatchedEventResultData[], keyPrefix: string) =>
    items.map((dispatch, i) => {
      const color = DISPATCH_TYPE_COLORS[dispatch.Type] ?? '#6b7280';
      const displayName = resolveDisplayName(dispatch.Type, dispatch.Id, dispatch.Name);
      return (
        <Box
          key={`${keyPrefix}-${dispatch.Id}-${i}`}
          style={{
            backgroundColor: color + '22',
            borderColor: color,
            borderWidth: 1,
            borderRadius: 4,
            paddingHorizontal: 4,
            paddingVertical: 1,
            marginRight: 6,
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: fontSize - 1, color, flexShrink: 0 }} numberOfLines={1}>
            {displayName}
          </Text>
        </Box>
      );
    });

  // On web the whole track is one compositor-driven CSS animation, so it renders as a plain View
  // with no Animated wrapper and no per-frame JS. -50% of the track equals one half, which is why
  // the duplicate copy below gets its own trailing separator on web: the two halves must match.
  const Track = IS_WEB ? View : Animated.View;
  const trackStyle = IS_WEB
    ? [styles.row, isScrolling ? ({ animation: `dispatch-marquee ${durationMs}ms linear infinite`, willChange: 'transform' } as never) : null]
    : [styles.row, { transform: [{ translateX: scrollX }] }];

  return (
    <View style={styles.container}>
      <Track style={trackStyle}>
        {/* Primary copy — measure width to drive the animation */}
        <View
          testID="auto-scroll-primary"
          style={styles.row}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setPrimaryWidth(w);
          }}
        >
          {renderChips(dispatches, 'a')}
        </View>

        {/* Gap + duplicate copy for seamless looping — hidden from screen readers */}
        {scrollSpeed > 0 ? (
          <>
            <View style={{ width: SEPARATOR_WIDTH, flexShrink: 0 }} accessible={false} />
            <View style={styles.row} accessible={false} accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants">
              {renderChips(dispatches, 'b')}
            </View>
            {/* Trailing gap so the two halves are identical and -50% lands seamlessly (web only) */}
            {IS_WEB ? <View style={{ width: SEPARATOR_WIDTH, flexShrink: 0 }} accessible={false} /> : null}
          </>
        ) : null}
      </Track>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
});
