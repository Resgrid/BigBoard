import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { boxStyle } from './styles';

type IBoxProps = ViewProps & VariantProps<typeof boxStyle> & { className?: string };

const Box = React.forwardRef<React.ElementRef<typeof View>, IBoxProps>(({ className, testID, ...props }, ref) => {
  const testProps = Platform.OS === 'web' && testID ? { 'data-testid': testID } : testID ? { testID } : {};

  return <View ref={ref} {...testProps} {...props} className={boxStyle({ class: className })} />;
});

Box.displayName = 'Box';
export { Box };
