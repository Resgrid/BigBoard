import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { hstackStyle } from './styles';

type IHStackProps = ViewProps & VariantProps<typeof hstackStyle>;

const HStack = React.forwardRef<React.ElementRef<typeof View>, IHStackProps>(({ className, space, reversed, testID, ...props }, ref) => {
  const testProps = Platform.OS === 'web' && testID ? { 'data-testid': testID } : testID ? { testID } : {};
  
  return <View className={hstackStyle({ space, reversed, class: className })} {...testProps} {...props} ref={ref} />;
});

HStack.displayName = 'HStack';

export { HStack };
