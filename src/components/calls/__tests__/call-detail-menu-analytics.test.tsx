import { renderHook, act } from '@testing-library/react-native';
import React from 'react';

import { useCallDetailMenu } from '../call-detail-menu';
import { useAnalytics } from '@/hooks/use-analytics';

// Mock dependencies
jest.mock('@/hooks/use-analytics');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock UI components that are used internally
jest.mock('@/components/ui/', () => ({
  Pressable: ({ children, ...props }: any) => {
    const { TouchableOpacity } = require('react-native');
    return <TouchableOpacity {...props}>{children}</TouchableOpacity>;
  },
}));

jest.mock('@/components/ui/actionsheet', () => ({
  Actionsheet: ({ children, isOpen, ...props }: any) => {
    const { View } = require('react-native');
    return isOpen ? <View {...props}>{children}</View> : null;
  },
  ActionsheetBackdrop: ({ ...props }) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
  ActionsheetContent: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  ActionsheetDragIndicator: ({ ...props }) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
  ActionsheetDragIndicatorWrapper: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  ActionsheetItem: ({ children, ...props }: any) => {
    const { TouchableOpacity } = require('react-native');
    return <TouchableOpacity {...props}>{children}</TouchableOpacity>;
  },
  ActionsheetItemText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('@/components/ui/hstack', () => ({
  HStack: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('lucide-react-native', () => ({
  EditIcon: ({ ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
  MoreVerticalIcon: ({ ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
  XIcon: ({ ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
}));

const mockTrackEvent = jest.fn();

describe('useCallDetailMenu Analytics', () => {
  const mockOnEditCall = jest.fn();
  const mockOnCloseCall = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAnalytics as jest.MockedFunction<typeof useAnalytics>).mockReturnValue({
      trackEvent: mockTrackEvent,
    });
  });

  it('should track analytics event when menu is opened', () => {
    const { result } = renderHook(() =>
      useCallDetailMenu({
        onEditCall: mockOnEditCall,
        onCloseCall: mockOnCloseCall,
        canUserCreateCalls: true, // Explicitly set to true for this test
      })
    );

    // Initially, menu should be closed and no analytics should be tracked
    expect(mockTrackEvent).not.toHaveBeenCalled();

    // Open the menu
    act(() => {
      result.current.openMenu();
    });

    // Should track analytics event when menu is opened
    expect(mockTrackEvent).toHaveBeenCalledWith('call_detail_menu_opened', {
      hasEditAction: true,
      hasCloseAction: true,
    });
    expect(result.current.isMenuOpen).toBe(true);
  });

  it('should not track analytics event when menu is closed', () => {
    const { result } = renderHook(() =>
      useCallDetailMenu({
        onEditCall: mockOnEditCall,
        onCloseCall: mockOnCloseCall,
        canUserCreateCalls: true, // Explicitly set to true for this test
      })
    );

    // Menu starts closed, no analytics should be tracked
    expect(mockTrackEvent).not.toHaveBeenCalled();
    expect(result.current.isMenuOpen).toBe(false);

    // Explicitly close the menu (should still be closed)
    act(() => {
      result.current.closeMenu();
    });

    // Still no analytics should be tracked
    expect(mockTrackEvent).not.toHaveBeenCalled();
    expect(result.current.isMenuOpen).toBe(false);
  });

  it('should track analytics event only once when menu is opened multiple times', () => {
    const { result } = renderHook(() =>
      useCallDetailMenu({
        onEditCall: mockOnEditCall,
        onCloseCall: mockOnCloseCall,
        canUserCreateCalls: true, // Explicitly set to true for this test
      })
    );

    // Open the menu first time
    act(() => {
      result.current.openMenu();
    });

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith('call_detail_menu_opened', {
      hasEditAction: true,
      hasCloseAction: true,
    });

    // Close the menu
    act(() => {
      result.current.closeMenu();
    });

    // Clear the mock to reset call count
    jest.clearAllMocks();

    // Open the menu again
    act(() => {
      result.current.openMenu();
    });

    // Should track analytics again since it was closed and reopened
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith('call_detail_menu_opened', {
      hasEditAction: true,
      hasCloseAction: true,
    });
  });

  it('should return correct menu state', () => {
    const { result } = renderHook(() =>
      useCallDetailMenu({
        onEditCall: mockOnEditCall,
        onCloseCall: mockOnCloseCall,
        canUserCreateCalls: true, // Explicitly set to true for this test
      })
    );

    // Initially closed
    expect(result.current.isMenuOpen).toBe(false);

    // Open menu
    act(() => {
      result.current.openMenu();
    });
    expect(result.current.isMenuOpen).toBe(true);

    // Close menu
    act(() => {
      result.current.closeMenu();
    });
    expect(result.current.isMenuOpen).toBe(false);
  });

  it('should provide HeaderRightMenu and CallDetailActionSheet components', () => {
    const { result } = renderHook(() =>
      useCallDetailMenu({
        onEditCall: mockOnEditCall,
        onCloseCall: mockOnCloseCall,
        canUserCreateCalls: true, // Explicitly set to true for this test
      })
    );

    expect(result.current.HeaderRightMenu).toBeDefined();
    expect(result.current.CallDetailActionSheet).toBeDefined();
    expect(typeof result.current.HeaderRightMenu).toBe('function');
    expect(typeof result.current.CallDetailActionSheet).toBe('function');
  });
});
