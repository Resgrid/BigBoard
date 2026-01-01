import React from 'react';
import { FlatList } from 'react-native';

// Mock FlashList to use FlatList for testing to avoid act() warnings
export const FlashList = React.forwardRef((props: any, ref: any) => {
  return React.createElement(FlatList, { ...props, ref });
});

FlashList.displayName = 'FlashList';

export default {
  FlashList,
};
