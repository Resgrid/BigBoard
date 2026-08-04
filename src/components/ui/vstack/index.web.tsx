import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import React from 'react';
import { Platform, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { vstackStyle } from './styles';

type IVStackProps = React.ComponentProps<'div'> & VariantProps<typeof vstackStyle> & { style?: StyleProp<ViewStyle>; testID?: string };

const VStack = React.forwardRef<React.ComponentRef<'div'>, IVStackProps>(function VStack({ className, space, reversed, style, testID, ...props }, ref) {
  const testProps = Platform.OS === 'web' && testID ? { 'data-testid': testID } : testID ? { testID } : {};
  const flatStyle = Array.isArray(style) ? StyleSheet.flatten(style) : style;
  return <div className={vstackStyle({ space, reversed, class: className })} style={flatStyle as React.CSSProperties} {...testProps} {...props} ref={ref} />;
});

VStack.displayName = 'VStack';

export { VStack };
