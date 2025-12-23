// Mock react-i18next first
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'settings.select_unit': 'Select Unit',
        'settings.current_unit': 'Current Unit',
        'settings.no_units_available': 'No units available',
        'common.cancel': 'Cancel',
        'settings.unit_selected_successfully': `${options?.unitName || 'Unit'} selected successfully`,
        'settings.unit_selection_failed': 'Failed to select unit. Please try again.',
      };
      return translations[key] || key;
    }),
  }),
}));

// Mock stores before any imports
jest.mock('@/stores/app/core-store');
jest.mock('@/stores/roles/store');
jest.mock('@/stores/units/store');
jest.mock('@/stores/toast/store');

// Mock logger
jest.mock('@/lib/logging', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock lucide icons to avoid SVG issues in tests
jest.mock('lucide-react-native', () => ({
  Check: ({ size, className, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: testID || 'check-icon', ...props }, 'Check');
  },
}));

// Mock gluestack UI components
jest.mock('@/components/ui/actionsheet', () => ({
  Actionsheet: ({ children, isOpen, ...props }: any) => {
    const React = require('react');
    return isOpen ? React.createElement('View', { testID: 'actionsheet', ...props }, children) : null;
  },
  ActionsheetBackdrop: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: 'actionsheet-backdrop', ...props }, children);
  },
  ActionsheetContent: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: 'actionsheet-content', ...props }, children);
  },
  ActionsheetDragIndicator: ({ ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: 'actionsheet-drag-indicator', ...props });
  },
  ActionsheetDragIndicatorWrapper: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: 'actionsheet-drag-indicator-wrapper', ...props }, children);
  },
  ActionsheetItem: ({ children, onPress, disabled, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'TouchableOpacity',
      {
        onPress: disabled ? undefined : onPress,
        testID: testID || 'actionsheet-item',
        disabled,
        ...props,
      },
      children
    );
  },
  ActionsheetItemText: ({ children, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: testID || 'actionsheet-item-text', ...props }, children);
  },
}));

jest.mock('@/components/ui/spinner', () => ({
  Spinner: (props: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: 'spinner' }, 'Loading...');
  },
}));

jest.mock('@/components/ui/box', () => ({
  Box: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: props.testID || 'box', ...props }, children);
  },
}));

jest.mock('@/components/ui/vstack', () => ({
  VStack: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: props.testID || 'vstack', ...props }, children);
  },
}));

jest.mock('@/components/ui/hstack', () => ({
  HStack: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: props.testID || 'hstack', ...props }, children);
  },
}));

jest.mock('@/components/ui/text', () => ({
  Text: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: props.testID || 'text', ...props }, children);
  },
}));

jest.mock('@/components/ui/heading', () => ({
  Heading: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: props.testID || 'heading', ...props }, children);
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onPress, disabled, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'TouchableOpacity',
      {
        onPress: disabled ? undefined : onPress,
        testID: props.testID || 'button',
        disabled,
        ...props,
      },
      children
    );
  },
  ButtonText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: props.testID || 'button-text', ...props }, children);
  },
}));

jest.mock('@/components/ui/center', () => ({
  Center: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: props.testID || 'center', ...props }, children);
  },
}));

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';

import { type UnitResultData } from '@/models/v4/units/unitResultData';
import { useCoreStore } from '@/stores/app/core-store';
import { useRolesStore } from '@/stores/roles/store';
import { useUnitsStore } from '@/stores/units/store';

import { UnitSelectionBottomSheet } from '../unit-selection-bottom-sheet';

const mockUseCoreStore = useCoreStore as jest.MockedFunction<typeof useCoreStore>;
const mockUseUnitsStore = useUnitsStore as jest.MockedFunction<typeof useUnitsStore>;
const mockUseToastStore = require('@/stores/toast/store').useToastStore as jest.MockedFunction<any>;

// Test that imports work first
describe('UnitSelectionBottomSheet Import Test', () => {
  it('can import the component without errors', () => {
    const { UnitSelectionBottomSheet } = require('../unit-selection-bottom-sheet');
    expect(UnitSelectionBottomSheet).toBeDefined();
    // React.memo returns an object, not a function
    expect(typeof UnitSelectionBottomSheet).toBe('object');
    expect(UnitSelectionBottomSheet.displayName).toBe('UnitSelectionBottomSheet');
  });

  it('can create a simple mock component', () => {
    const MockComponent = () => React.createElement('View', { testID: 'mock-component' }, 'Mock');
    const { getByTestId } = render(React.createElement(MockComponent));
    expect(getByTestId('mock-component')).toBeTruthy();
  });

  it('can render the component with minimal props', () => {
    // Mock the necessary functions and store returns before rendering
    const mockUseCoreStore = require('@/stores/app/core-store').useCoreStore as jest.MockedFunction<any>;
    const mockUseUnitsStore = require('@/stores/units/store').useUnitsStore as jest.MockedFunction<any>;
    const mockUseToastStore = require('@/stores/toast/store').useToastStore as jest.MockedFunction<any>;
    const mockUseRolesStore = require('@/stores/roles/store').useRolesStore;

    // Minimal mock setup
    mockUseCoreStore.mockReturnValue({
      activeUnit: null,
      setActiveUnit: jest.fn(),
    });

    mockUseUnitsStore.mockReturnValue({
      units: [],
      fetchUnits: jest.fn().mockResolvedValue(undefined),
      isLoading: false,
    });

    mockUseRolesStore.getState = jest.fn(() => ({
      fetchRolesForUnit: jest.fn(),
    }));

    mockUseToastStore.mockImplementation((selector: any) => {
      const state = {
        showToast: jest.fn(),
        toasts: [],
        removeToast: jest.fn(),
      };
      return selector(state);
    });

    const { UnitSelectionBottomSheet } = require('../unit-selection-bottom-sheet');

    const testProps = { isOpen: false, onClose: jest.fn() };
    const renderResult = render(React.createElement(UnitSelectionBottomSheet, testProps));

    // Component should render without crashing (the actionsheet won't render anything when closed)
    expect(renderResult).toBeDefined();
    expect(renderResult.toJSON).toBeDefined();
  });
});

describe('UnitSelectionBottomSheet', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  const mockUnits: UnitResultData[] = [
    {
      UnitId: '1',
      Name: 'Engine 1',
      Type: 'Engine',
      DepartmentId: '1',
      TypeId: 1,
      CustomStatusSetId: '',
      GroupId: '1',
      GroupName: 'Station 1',
      Vin: '',
      PlateNumber: '',
      FourWheelDrive: false,
      SpecialPermit: false,
      CurrentDestinationId: '',
      CurrentStatusId: '',
      CurrentStatusTimestamp: '',
      Latitude: '',
      Longitude: '',
      Note: '',
    } as UnitResultData,
    {
      UnitId: '2',
      Name: 'Ladder 1',
      Type: 'Ladder',
      DepartmentId: '1',
      TypeId: 2,
      CustomStatusSetId: '',
      GroupId: '1',
      GroupName: 'Station 1',
      Vin: '',
      PlateNumber: '',
      FourWheelDrive: false,
      SpecialPermit: false,
      CurrentDestinationId: '',
      CurrentStatusId: '',
      CurrentStatusTimestamp: '',
      Latitude: '',
      Longitude: '',
      Note: '',
    } as UnitResultData,
    {
      UnitId: '3',
      Name: 'Rescue 1',
      Type: 'Rescue',
      DepartmentId: '1',
      TypeId: 3,
      CustomStatusSetId: '',
      GroupId: '2',
      GroupName: 'Station 2',
      Vin: '',
      PlateNumber: '',
      FourWheelDrive: false,
      SpecialPermit: false,
      CurrentDestinationId: '',
      CurrentStatusId: '',
      CurrentStatusTimestamp: '',
      Latitude: '',
      Longitude: '',
      Note: '',
    } as UnitResultData,
  ];

  const mockSetActiveUnit = jest.fn().mockResolvedValue(undefined);
  const mockFetchUnits = jest.fn().mockResolvedValue(undefined);
  const mockFetchRolesForUnit = jest.fn().mockResolvedValue(undefined);
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCoreStore.mockReturnValue({
      activeUnit: mockUnits[0],
      setActiveUnit: mockSetActiveUnit,
    } as any);

    mockUseUnitsStore.mockReturnValue({
      units: mockUnits,
      fetchUnits: mockFetchUnits,
      isLoading: false,
    } as any);

    // Mock the roles store
    (useRolesStore.getState as jest.Mock).mockReturnValue({
      fetchRolesForUnit: mockFetchRolesForUnit,
    });

    // Mock the toast store
    mockUseToastStore.mockImplementation((selector: any) => {
      const state = {
        showToast: mockShowToast,
        toasts: [],
        removeToast: jest.fn(),
      };
      return selector(state);
    });
  });

  it('renders correctly when open', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('Select Unit')).toBeTruthy();
    expect(screen.getByText('Current Unit')).toBeTruthy();
    // Engine 1 appears twice: once in current selection and once in the list
    expect(screen.getAllByText('Engine 1')).toHaveLength(2);
    expect(screen.getByText('Ladder 1')).toBeTruthy();
    expect(screen.getByText('Rescue 1')).toBeTruthy();
  });

  it('does not render when closed', () => {
    render(<UnitSelectionBottomSheet {...mockProps} isOpen={false} />);

    expect(screen.queryByText('Select Unit')).toBeNull();
  });

  it('displays current unit selection', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('Current Unit')).toBeTruthy();
    // The current unit (Engine 1) should be displayed - it appears twice: once in current section, once in list
    expect(screen.getAllByText('Engine 1')).toHaveLength(2);
  });

  it('displays loading state when fetching units', () => {
    mockUseUnitsStore.mockReturnValue({
      units: [],
      fetchUnits: jest.fn().mockResolvedValue(undefined),
      isLoading: true,
    } as any);

    render(<UnitSelectionBottomSheet {...mockProps} />);

    expect(screen.getByTestId('spinner')).toBeTruthy();
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('displays empty state when no units available', () => {
    mockUseUnitsStore.mockReturnValue({
      units: [],
      fetchUnits: jest.fn().mockResolvedValue(undefined),
      isLoading: false,
    } as any);

    render(<UnitSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('No units available')).toBeTruthy();
  });

  it('fetches units when sheet opens and no units are loaded', async () => {
    const spyFetchUnits = jest.fn().mockResolvedValue(undefined);

    mockUseUnitsStore.mockReturnValue({
      units: [],
      fetchUnits: spyFetchUnits,
      isLoading: false,
    } as any);

    render(<UnitSelectionBottomSheet {...mockProps} />);

    await waitFor(() => {
      expect(spyFetchUnits).toHaveBeenCalled();
    });
  });

  it('does not fetch units when sheet opens and units are already loaded', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    expect(mockFetchUnits).not.toHaveBeenCalled();
  });

  it('closes when cancel button is pressed', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles unit selection with success', async () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    const unitToSelect = screen.getByTestId('unit-item-2');

    await act(async () => {
      fireEvent.press(unitToSelect);
    });

    await waitFor(() => {
      expect(mockSetActiveUnit).toHaveBeenCalledWith('2');
    });

    expect(mockFetchRolesForUnit).toHaveBeenCalledWith('2');
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Ladder 1 selected successfully');
  });

  it('handles selecting the same unit that is already active', async () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    const sameUnitButton = screen.getByTestId('unit-item-1');

    await act(async () => {
      fireEvent.press(sameUnitButton);
    });

    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    // Should not call setActiveUnit for the same unit
    expect(mockSetActiveUnit).not.toHaveBeenCalled();
  });

  it('handles unit selection failure', async () => {
    mockSetActiveUnit.mockRejectedValueOnce(new Error('Network error'));

    render(<UnitSelectionBottomSheet {...mockProps} />);

    const unitToSelect = screen.getByTestId('unit-item-2');

    await act(async () => {
      fireEvent.press(unitToSelect);
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to select unit. Please try again.');
    });

    // Should not close on error
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('handles roles fetch failure gracefully', async () => {
    mockFetchRolesForUnit.mockRejectedValueOnce(new Error('Roles fetch failed'));

    render(<UnitSelectionBottomSheet {...mockProps} />);

    const unitToSelect = screen.getByTestId('unit-item-2');

    await act(async () => {
      fireEvent.press(unitToSelect);
    });

    await waitFor(() => {
      expect(mockSetActiveUnit).toHaveBeenCalledWith('2');
    });

    expect(mockFetchRolesForUnit).toHaveBeenCalledWith('2');
    expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to select unit. Please try again.');
  });

  it('prevents multiple concurrent unit selections', async () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    const unitToSelect = screen.getByTestId('unit-item-2');

    await act(async () => {
      // Trigger multiple rapid selections
      fireEvent.press(unitToSelect);
      fireEvent.press(unitToSelect);
      fireEvent.press(unitToSelect);
    });

    await waitFor(() => {
      expect(mockSetActiveUnit).toHaveBeenCalledTimes(1);
    });
  });

  it('does not close when loading', async () => {
    // Make setActiveUnit slow to simulate loading state
    mockSetActiveUnit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<UnitSelectionBottomSheet {...mockProps} />);

    const unitToSelect = screen.getByTestId('unit-item-2');

    await act(async () => {
      fireEvent.press(unitToSelect);
    });

    // During loading state, pressing cancel should not close
    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    // onClose should not be called while loading
    await new Promise((resolve) => setTimeout(resolve, 50)); // Wait a bit but not long enough for the async operation
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('renders with no active unit', () => {
    mockUseCoreStore.mockReturnValue({
      activeUnit: null,
      setActiveUnit: mockSetActiveUnit,
    } as any);

    render(<UnitSelectionBottomSheet {...mockProps} />);

    // Should not display current unit section
    expect(screen.queryByText('Current Unit')).toBeNull();
    expect(screen.getByText('Select Unit')).toBeTruthy();
    expect(screen.getByText('Engine 1')).toBeTruthy();
  });

  it('groups units correctly in the list', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    // All units should be displayed (Engine 1 appears twice: in current selection and in list)
    expect(screen.getAllByText('Engine 1')).toHaveLength(2);
    expect(screen.getByText('Ladder 1')).toBeTruthy();
    expect(screen.getByText('Rescue 1')).toBeTruthy();

    // Check that unit types are displayed
    expect(screen.getAllByText('Engine')).toBeTruthy();
    expect(screen.getAllByText('Ladder')).toBeTruthy();
    expect(screen.getAllByText('Rescue')).toBeTruthy();
  });
});
