import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import React, { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

import { skeletonStyle, skeletonTextStyle } from './styles';

// Module-level: Easing.bezier returns a new function each call, so keeping it
// here gives a referentially stable easing for the pulse effect below.
const SKELETON_EASING = Easing.bezier(0.4, 0, 0.6, 1);

type ISkeletonProps = React.ComponentProps<typeof View> &
  VariantProps<typeof skeletonStyle> & {
    isLoaded?: boolean;
    startColor?: string;
  };

type ISkeletonTextProps = React.ComponentProps<typeof View> &
  VariantProps<typeof skeletonTextStyle> & {
    _lines?: number;
    isLoaded?: boolean;
    startColor?: string;
  };

const Skeleton = forwardRef<React.ElementRef<typeof View>, ISkeletonProps>(({ className, variant, children, startColor = 'bg-background-200', isLoaded = false, speed = 2, ...props }, ref) => {
  const isWeb = Platform.OS === 'web';
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const fadeDuration = 0.6;
  const animationDuration = (fadeDuration * 10000) / speed;

  useEffect(() => {
    // On web, use CSS animation instead to avoid Animated.loop JS driver overhead
    if (isWeb) return;

    if (!isLoaded) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: animationDuration / 2,
          easing: SKELETON_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: animationDuration / 2,
          easing: SKELETON_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: animationDuration / 2,
          easing: SKELETON_EASING,
          useNativeDriver: true,
        }),
      ]);
      animRef.current = Animated.loop(pulse);
      animRef.current.start();
    } else {
      animRef.current?.stop();
      animRef.current = null;
    }

    return () => {
      animRef.current?.stop();
      animRef.current = null;
    };
  }, [isLoaded, isWeb, animationDuration, pulseAnim]);

  if (!isLoaded) {
    // On web, use a CSS keyframe animation to avoid JS-driven Animated.loop
    if (isWeb) {
      return (
        <View
          style={{ animation: `skeleton-pulse ${animationDuration * 1.5}ms ease-in-out infinite` } as any}
          className={`${startColor} ${skeletonStyle({
            variant,
            class: className,
          })}`}
          {...props}
          ref={ref}
        />
      );
    }
    return (
      <Animated.View
        style={{ opacity: pulseAnim }}
        className={`${startColor} ${skeletonStyle({
          variant,
          class: className,
        })}`}
        {...props}
        ref={ref}
      />
    );
  } else {
    return children;
  }
});

const SkeletonText = forwardRef<React.ElementRef<typeof View>, ISkeletonTextProps>(({ className, _lines, isLoaded = false, startColor = 'bg-background-200', gap = 2, children, ...props }, ref) => {
  if (!isLoaded) {
    if (_lines) {
      return (
        <View
          className={`${skeletonTextStyle({
            gap,
          })}`}
          ref={ref}
        >
          {Array.from({ length: _lines }).map((_, index) => (
            <Skeleton
              key={index}
              className={`${startColor} ${skeletonTextStyle({
                class: className,
              })}`}
              {...props}
            />
          ))}
        </View>
      );
    } else {
      return (
        <Skeleton
          className={`${startColor} ${skeletonTextStyle({
            class: className,
          })}`}
          {...props}
          ref={ref}
        />
      );
    }
  } else {
    return children;
  }
});

Skeleton.displayName = 'Skeleton';
SkeletonText.displayName = 'SkeletonText';

export { Skeleton, SkeletonText };
