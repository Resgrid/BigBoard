import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusBottomSheet } from '../status-bottom-sheet';
import { useStatusBottomSheetStore, useStatusesStore } from '@/stores/status/store';
import { useCoreStore } from '@/stores/app/core-store';
import { useLocationStore } from '@/stores/app/location-store';
import { useRolesStore } from '@/stores/roles/store';
import { saveUnitStatus } from '@/api/units/unitStatuses';

// Mock all the stores with the exact same approach as the working test
jest.mock('@/stores/status/store');
jest.mock('@/stores/app/core-store');
jest.mock('@/stores/app/location-store');
jest.mock('@/stores/roles/store');
jest.mock('@/api/units/unitStatuses');
jest.mock('@/services/offline-event-manager.service');

// Mock translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.submit': 'Submit',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.cancel': 'Cancel',
      };
      return translations[key] || key;
    }
  }),
}));

// Mock the Actionsheet components to render properly
jest.mock('@/components/ui/actionsheet', () => ({
  Actionsheet: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => {
    const { View } = require('react-native');
    return isOpen ? <View testID="actionsheet">{children}</View> : null;
  },
  ActionsheetBackdrop: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View testID="actionsheet-backdrop">{children}</View>;
  },
  ActionsheetContent: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View testID="actionsheet-content">{children}</View>;
  },
  ActionsheetDragIndicator: () => {
    const { View } = require('react-native');
    return <View testID="actionsheet-drag-indicator" />;
  },
  ActionsheetDragIndicatorWrapper: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View testID="actionsheet-drag-indicator-wrapper">{children}</View>;
  },
}));

const mockUseStatusBottomSheetStore = useStatusBottomSheetStore as jest.MockedFunction<any>;
const mockUseStatusesStore = useStatusesStore as jest.MockedFunction<any>;
const mockUseCoreStore = useCoreStore as jest.MockedFunction<any>;
const mockUseLocationStore = useLocationStore as jest.MockedFunction<any>;
const mockUseRolesStore = useRolesStore as jest.MockedFunction<any>;
const mockSaveUnitStatus = saveUnitStatus as jest.MockedFunction<typeof saveUnitStatus>;

describe('Status GPS Debug Test', () => {
  it('should render Submit button with minimal setup', () => {
    // Mock all required stores
    mockUseCoreStore.mockReturnValue({
      activeUnit: {
        UnitId: 'unit1',
        Name: 'Unit 1',
        Type: 'Engine',
      },
    });

    mockUseStatusesStore.mockReturnValue({
      saveUnitStatus: mockSaveUnitStatus,
    });

    mockUseLocationStore.mockReturnValue({
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      altitude: 50,
      speed: 0,
      heading: 180,
      timestamp: '2025-08-06T17:30:00.000Z',
    });

    mockUseRolesStore.mockReturnValue({
      unitRoleAssignments: [],
    });

    // Copy exact pattern from working status-bottom-sheet test
    const defaultBottomSheetStore = {
      isOpen: false,
      currentStep: 'select-destination' as const,
      selectedCall: null,
      selectedStation: null,
      selectedDestinationType: 'none' as const,
      selectedStatus: null,
      note: '',
      availableCalls: [],
      availableStations: [],
      isLoading: false,
      setIsOpen: jest.fn(),
      setCurrentStep: jest.fn(),
      setSelectedCall: jest.fn(),
      setSelectedStation: jest.fn(),
      setSelectedDestinationType: jest.fn(),
      setNote: jest.fn(),
      fetchDestinationData: jest.fn(),
      reset: jest.fn(),
    };

    const selectedStatus = {
      Id: 'status-1',
      Text: 'Available',
      Detail: 0, // No destination step
      Note: 0, // No note required
    };

    mockUseStatusBottomSheetStore.mockReturnValue({
      ...defaultBottomSheetStore,
      isOpen: true,
      selectedStatus,
    });

    // Verify the mock is being called
    console.log('Mock implementation:', mockUseStatusBottomSheetStore.getMockName());
    console.log('Mock return value:', mockUseStatusBottomSheetStore());

    render(<StatusBottomSheet />);

    console.log('Component rendered. Looking for Submit button...');

    // Check if the basic ActionSheet is rendered
    const actionsheet = screen.queryByTestId('actionsheet');
    console.log('Actionsheet found:', !!actionsheet);

    // Look for any text content
    const allText = screen.queryAllByText(/.*/, { exact: false });
    console.log('All text elements found:', allText.length);
    allText.forEach((element, index) => {
      console.log(`Text ${index}:`, element.props.children);
    });

    // Look for any button elements
    const allButtons = screen.queryAllByRole('button');
    console.log('All button elements found:', allButtons.length);

    // Always show debug to see what's rendered
    screen.debug();

    const submitButton = screen.queryByText('Submit');
    console.log('Submit button found:', !!submitButton);

    if (submitButton) {
      console.log('SUCCESS: Submit button is visible!');
    } else {
      console.log('FAILURE: Submit button not found');
    }

    expect(submitButton).toBeTruthy();
  });
});
