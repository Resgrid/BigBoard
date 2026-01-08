import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import React from 'react';
import { Platform, Text as RNText } from 'react-native';

import { textStyle } from './styles';

type ITextProps = React.ComponentProps<typeof RNText> & VariantProps<typeof textStyle>;

const Text = React.forwardRef<React.ElementRef<typeof RNText>, ITextProps>(({ className, isTruncated, bold, underline, strikeThrough, size = 'md', sub, italic, highlight, testID, ...props }, ref) => {
  const testProps = Platform.OS === 'web' && testID ? { 'data-testid': testID } : testID ? { testID } : {};

  return (
    <RNText
      className={textStyle({
        isTruncated,
        bold,
        underline,
        strikeThrough,
        size,
        sub,
        italic,
        highlight,
        class: className,
      })}
      {...testProps}
      {...props}
      ref={ref}
    />
  );
});

Text.displayName = 'Text';

export { Text };
