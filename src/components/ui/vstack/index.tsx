import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import React from 'react';
import { Platform, View } from 'react-native';

import { vstackStyle } from './styles';

type IVStackProps = React.ComponentProps<typeof View> & VariantProps<typeof vstackStyle>;

const VStack = React.forwardRef<React.ComponentRef<typeof View>, IVStackProps>(function VStack({ className, space, reversed, testID, ...props }, ref) {
  const testProps = Platform.OS === 'web' && testID ? { 'data-testid': testID } : testID ? { testID } : {};

  return <View className={vstackStyle({ space, reversed, class: className })} {...testProps} {...props} ref={ref} />;
});

VStack.displayName = 'VStack';

export { VStack };
