'use client';
import React from 'react';
import { Platform, ScrollView as RNScrollView, type ScrollViewProps } from 'react-native';

const ScrollView = React.forwardRef<RNScrollView, ScrollViewProps>(({ testID, ...props }, ref) => {
  const testProps = Platform.OS === 'web' && testID ? { 'data-testid': testID } : testID ? { testID } : {};
  
  return <RNScrollView ref={ref} {...testProps} {...props} />;
});

ScrollView.displayName = 'ScrollView';

export { ScrollView };
