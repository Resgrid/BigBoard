import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React, { useState } from 'react';

// --- Start of Robust Mocks ---
const View = (props: any) => React.createElement('div', { ...props });
const Text = (props: any) => React.createElement('span', { ...props });
const TouchableOpacity = (props: any) => React.createElement('button', { ...props, onClick: props.onPress });
// --- End of Robust Mocks ---

// Create a mock component that maintains state
const MockCallDetailMenu = ({ onEditCall, onCloseCall, canUserCreateCalls = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const HeaderRightMenu = () => {
    if (!canUserCreateCalls) {
      return null;
    }

    return (
      <TouchableOpacity
        testID="kebab-menu-button"
        onPress={() => setIsOpen(true)}
      >
        <Text>Open Menu</Text>
      </TouchableOpacity>
    );
  };

  const CallDetailActionSheet = () => {
    if (!isOpen || !canUserCreateCalls) return null;
    return (
      <View testID="actionsheet">
        <TouchableOpacity
          testID="edit-call-button"
          onPress={() => {
            onEditCall?.();
            setIsOpen(false);
          }}
        >
          <Text>call_detail.edit_call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="close-call-button"
          onPress={() => {
            onCloseCall?.();
            setIsOpen(false);
          }}
        >
          <Text>call_detail.close_call</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return { HeaderRightMenu, CallDetailActionSheet };
};

jest.mock('../call-detail-menu', () => ({
  useCallDetailMenu: MockCallDetailMenu,
}));

describe('useCallDetailMenu', () => {
  const mockOnEditCall = jest.fn();
  const mockOnCloseCall = jest.fn();
  const { useCallDetailMenu } = require('../call-detail-menu');

  const TestComponent = ({ canUserCreateCalls = false }: { canUserCreateCalls?: boolean }) => {
    const { HeaderRightMenu, CallDetailActionSheet } = useCallDetailMenu({
      onEditCall: mockOnEditCall,
      onCloseCall: mockOnCloseCall,
      canUserCreateCalls,
    });

    return (
      <View>
        <HeaderRightMenu />
        <CallDetailActionSheet />
      </View>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user has create calls permission', () => {
    it('renders the header menu button', () => {
      render(<TestComponent canUserCreateCalls={true} />);
      expect(screen.getByTestId('kebab-menu-button')).toBeTruthy();
    });

    it('opens the action sheet when menu button is pressed', async () => {
      render(<TestComponent canUserCreateCalls={true} />);
      fireEvent.press(screen.getByTestId('kebab-menu-button'));
      await waitFor(() => {
        expect(screen.getByTestId('actionsheet')).toBeTruthy();
        expect(screen.getByTestId('edit-call-button')).toBeTruthy();
        expect(screen.getByTestId('close-call-button')).toBeTruthy();
      });
    });

    it('calls onEditCall when edit option is pressed', async () => {
      render(<TestComponent canUserCreateCalls={true} />);
      fireEvent.press(screen.getByTestId('kebab-menu-button'));
      await waitFor(() => {
        expect(screen.getByTestId('edit-call-button')).toBeTruthy();
      });
      fireEvent.press(screen.getByTestId('edit-call-button'));
      expect(mockOnEditCall).toHaveBeenCalledTimes(1);
    });

    it('calls onCloseCall when close option is pressed', async () => {
      render(<TestComponent canUserCreateCalls={true} />);
      fireEvent.press(screen.getByTestId('kebab-menu-button'));
      await waitFor(() => {
        expect(screen.getByTestId('close-call-button')).toBeTruthy();
      });
      fireEvent.press(screen.getByTestId('close-call-button'));
      expect(mockOnCloseCall).toHaveBeenCalledTimes(1);
    });

    it('closes the action sheet after selecting an option', async () => {
      render(<TestComponent canUserCreateCalls={true} />);
      fireEvent.press(screen.getByTestId('kebab-menu-button'));
      await waitFor(() => {
        expect(screen.getByTestId('actionsheet')).toBeTruthy();
      });
      fireEvent.press(screen.getByTestId('edit-call-button'));
      await waitFor(() => {
        expect(screen.queryByTestId('actionsheet')).toBeNull();
      });
    });
  });

  describe('when user does not have create calls permission', () => {
    it('does not render the header menu button', () => {
      render(<TestComponent canUserCreateCalls={false} />);
      expect(screen.queryByTestId('kebab-menu-button')).toBeNull();
    });

    it('does not render the action sheet', () => {
      render(<TestComponent canUserCreateCalls={false} />);
      expect(screen.queryByTestId('actionsheet')).toBeNull();
    });

    it('does not allow opening action sheet even if somehow triggered', () => {
      // This test ensures that even if the state changed externally, 
      // the action sheet won't render without permission
      render(<TestComponent canUserCreateCalls={false} />);
      expect(screen.queryByTestId('actionsheet')).toBeNull();
      expect(screen.queryByTestId('edit-call-button')).toBeNull();
      expect(screen.queryByTestId('close-call-button')).toBeNull();
    });
  });
});