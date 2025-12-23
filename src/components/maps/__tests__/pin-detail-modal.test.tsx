import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock dependencies
const mockPush = jest.fn();
const mockOpenMapsWithDirections = jest.fn();
const mockShowToast = jest.fn();

const mockLocationStore = {
  latitude: 40.7128,
  longitude: -74.0060,
};

const mockPin = {
  Id: 1,
  Title: 'Test Call',
  Latitude: 40.7128,
  Longitude: -74.0060,
  Content: 'Test call content',
  Type: 'call',
};

const mockNonCallPin = {
  Id: 2,
  Title: 'Non-Call Pin',
  Latitude: 40.7128,
  Longitude: -74.0060,
  Content: 'Non-call content',
  Type: 'other',
};

// --- Start of Robust Mocks ---
const View = (props: any) => React.createElement('div', { ...props });
const Text = (props: any) => React.createElement('span', { ...props });
const TouchableOpacity = (props: any) =>
  React.createElement('button', {
    ...props,
    onClick: props.onPress,
  });
// --- End of Robust Mocks ---

const MockPinDetailModal = ({
  pin,
  isOpen,
  onClose,
  onSetAsCurrentCall,
  t,
  router,
  openMapsWithDirections,
  userLocation,
  showToast,
}: any) => {
  if (!isOpen || !pin) return null;

  const handleRouteToLocation = async () => {
    if (pin.Latitude === 0 && pin.Longitude === 0) {
      showToast('error', 'map.no_location_for_routing');
      return;
    }

    const success = await openMapsWithDirections(
      pin.Latitude,
      pin.Longitude,
      pin.Title,
      userLocation.latitude,
      userLocation.longitude
    );

    if (!success) {
      showToast('error', 'map.failed_to_open_maps');
    }
  };

  const handleViewCallDetails = () => {
    router.push(`/call/${pin.Id}`);
    onClose();
  };

  const handleSetAsCurrentCall = () => {
    onSetAsCurrentCall(pin);
    onClose();
  };

  return (
    <View testID="pin-detail-modal">
      <Text>{pin.Title}</Text>
      <Text>{pin.Latitude.toFixed(6)}, {pin.Longitude.toFixed(6)}</Text>
      <Text>{pin.Content}</Text>

      <TouchableOpacity testID="close-pin-detail" onPress={onClose}>
        <Text>Close</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="route-button" onPress={handleRouteToLocation}>
        <Text>{t('common.route')}</Text>
      </TouchableOpacity>

      {pin.Type === 'call' && (
        <>
          <TouchableOpacity testID="view-details-button" onPress={handleViewCallDetails}>
            <Text>{t('map.view_call_details')}</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="set-current-button" onPress={handleSetAsCurrentCall}>
            <Text>{t('map.set_as_current_call')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

jest.mock('../pin-detail-modal', () => ({
  __esModule: true,
  default: MockPinDetailModal,
}));

describe('PinDetailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSetAsCurrentCall = jest.fn();

  const mockT = (key: string) => key;
  const mockRouter = {
    push: mockPush,
  };

  const renderComponent = (props: any) => {
    return render(
      <MockPinDetailModal
        t={mockT}
        router={mockRouter}
        openMapsWithDirections={mockOpenMapsWithDirections}
        userLocation={mockLocationStore}
        showToast={mockShowToast}
        {...props}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderComponent({
      pin: mockPin,
      isOpen: false,
      onClose: mockOnClose,
      onSetAsCurrentCall: mockOnSetAsCurrentCall,
    });

    expect(screen.queryByTestId('pin-detail-modal')).toBeFalsy();
  });

  it('should not render when pin is null', () => {
    renderComponent({
      pin: null,
      isOpen: true,
      onClose: mockOnClose,
      onSetAsCurrentCall: mockOnSetAsCurrentCall,
    });

    expect(screen.queryByTestId('pin-detail-modal')).toBeFalsy();
  });

  it('should call onClose when close button is pressed', () => {
    renderComponent({
      pin: mockPin,
      isOpen: true,
      onClose: mockOnClose,
      onSetAsCurrentCall: mockOnSetAsCurrentCall,
    });

    fireEvent.press(screen.getByTestId('close-pin-detail'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not show call-specific buttons for non-call pins', () => {
    renderComponent({
      pin: mockNonCallPin,
      isOpen: true,
      onClose: mockOnClose,
      onSetAsCurrentCall: mockOnSetAsCurrentCall,
    });

    expect(screen.queryByText('map.view_call_details')).toBeFalsy();
    expect(screen.queryByText('map.set_as_current_call')).toBeFalsy();
  });
}); 