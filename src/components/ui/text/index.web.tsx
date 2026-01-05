import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import React from 'react';

import { textStyle } from './styles';

type ITextProps = React.ComponentProps<'span'> &
  VariantProps<typeof textStyle> & {
    numberOfLines?: number;
  };

const Text = React.forwardRef<React.ElementRef<'span'>, ITextProps>(
  ({ className, isTruncated, bold, underline, strikeThrough, size = 'md', sub, italic, highlight, numberOfLines, ...props }: { className?: string } & ITextProps, ref) => {
    // Convert numberOfLines to web-compatible CSS styles
    const webStyle = React.useMemo(() => {
      if (numberOfLines) {
        return {
          display: '-webkit-box',
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...props.style,
        };
      }
      return props.style;
    }, [numberOfLines, props.style]);

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
        {...props}
        style={webStyle}
        ref={ref}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text };
