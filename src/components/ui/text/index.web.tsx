import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import React from 'react';
import { Platform } from 'react-native';

import { textStyle } from './styles';

type ITextProps = React.ComponentProps<'span'> & VariantProps<typeof textStyle> & { testID?: string };

const Text = React.forwardRef<React.ElementRef<'span'>, ITextProps>(
  ({ className, isTruncated, bold, underline, strikeThrough, size = 'md', sub, italic, highlight, testID, ...props }: { className?: string } & ITextProps, ref) => {
    const testProps = Platform.OS === 'web' && testID ? { 'data-testid': testID } : testID ? { testID } : {};

    return (
      <span
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
  }
);

Text.displayName = 'Text';

export { Text };
