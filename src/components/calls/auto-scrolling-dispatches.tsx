import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native';

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

export const AutoScrollingDispatches: React.FC<AutoScrollingDispatchesProps> = ({ dispatches, resolveDisplayName, scrollSpeed, fontSize }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [primaryWidth, setPrimaryWidth] = useState(0);

  useEffect(() => {
    // Stop any running animation and reset position whenever deps change
    animRef.current?.stop();
    animRef.current = null;
    scrollX.setValue(0);

    if (scrollSpeed <= 0 || primaryWidth <= 0) {
      return;
    }

    // Scroll the whole loopWidth (primary + gap) — the duplicate copy placed right
    // after fills the gap so the transition is seamless.
    const loopWidth = primaryWidth + SEPARATOR_WIDTH;
    const duration = (loopWidth / scrollSpeed) * 1000;

    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      // If the effect was cleaned up or the user has reduce-motion enabled,
      // leave scrollX at 0 and skip the animation entirely.
      if (cancelled || reduceMotion) return;

      const anim = Animated.loop(
        Animated.timing(scrollX, {
          toValue: -loopWidth,
          duration,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        })
      );
      animRef.current = anim;
      anim.start();
    });

    return () => {
      cancelled = true;
      animRef.current?.stop();
      animRef.current = null;
    };
  }, [primaryWidth, scrollSpeed, scrollX]);

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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.row, { transform: [{ translateX: scrollX }] }]}>
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
            <View
              style={styles.row}
              accessible={false}
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            >
              {renderChips(dispatches, 'b')}
            </View>
          </>
        ) : null}
      </Animated.View>
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
