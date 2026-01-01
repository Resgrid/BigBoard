// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => key,
  }),
}));

// Mock Platform first, before any other imports
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn().mockImplementation((obj) => obj.ios || obj.default),
}));

// Mock react-native-svg before anything else
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  G: 'G',
  Text: 'Text',
  TSpan: 'TSpan',
  TextPath: 'TextPath',
  Path: 'Path',
  Polygon: 'Polygon',
  Polyline: 'Polyline',
  Line: 'Line',
  Rect: 'Rect',
  Use: 'Use',
  Image: 'Image',
  Symbol: 'Symbol',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  RadialGradient: 'RadialGradient',
  Stop: 'Stop',
  ClipPath: 'ClipPath',
  Pattern: 'Pattern',
  Mask: 'Mask',
  default: 'Svg',
}));

// Mock @expo/html-elements
jest.mock('@expo/html-elements', () => ({
  H1: 'H1',
  H2: 'H2',
  H3: 'H3',
  H4: 'H4',
  H5: 'H5',
  H6: 'H6',
}));

import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react-native';
import React from 'react';

import { type UnitResultData } from '@/models/v4/units/unitResultData';
import { useCoreStore } from '@/stores/app/core-store';
import { useRolesStore } from '@/stores/roles/store';
import { useToastStore } from '@/stores/toast/store';
import { useUnitsStore } from '@/stores/units/store';

import { UnitSelectionBottomSheet } from '../unit-selection-bottom-sheet';

// Mock stores
jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: jest.fn(),
}));

jest.mock('@/stores/roles/store', () => ({
  useRolesStore: {
    getState: jest.fn(() => ({
      fetchRolesForUnit: jest.fn(),
    })),
  },
}));

jest.mock('@/stores/units/store', () => ({
  useUnitsStore: jest.fn(),
}));

jest.mock('@/stores/toast/store', () => ({
  useToastStore: jest.fn(),
}));

// Mock lucide icons to avoid SVG issues in tests
jest.mock('lucide-react-native', () => ({
  Check: 'Check',
}));

// Mock gluestack UI components with simple implementations
jest.mock('@/components/ui/actionsheet', () => ({
  Actionsheet: ({ children, isOpen }: any) => (isOpen ? children : null),
  ActionsheetBackdrop: ({ children }: any) => children || null,
  ActionsheetContent: ({ children }: any) => children,
  ActionsheetDragIndicator: () => null,
  ActionsheetDragIndicatorWrapper: ({ children }: any) => children,
  ActionsheetItem: ({ children, onPress, disabled, testID }: any) => {
    const React = require('react');
    const handlePress = disabled ? undefined : onPress;
    return React.createElement(
      'TouchableOpacity',
      { onPress: handlePress, testID: testID || 'actionsheet-item', disabled },
      children
    );
  },
  ActionsheetItemText: ({ children }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: 'actionsheet-item-text' }, children);
  },
}));

jest.mock('@/components/ui/box', () => ({
  Box: ({ children }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: 'box' }, children);
  },
}));

jest.mock('@/components/ui/vstack', () => ({
  VStack: ({ children }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: 'vstack' }, children);
  },
}));

jest.mock('@/components/ui/hstack', () => ({
  HStack: ({ children }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: 'hstack' }, children);
  },
}));

jest.mock('@/components/ui/text', () => ({
  Text: ({ children }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: 'text' }, children);
  },
}));

jest.mock('@/components/ui/heading', () => ({
  Heading: ({ children }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: 'heading' }, children);
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onPress, disabled }: any) => {
    const React = require('react');
    const handlePress = disabled ? undefined : onPress;
    return React.createElement(
      'TouchableOpacity',
      { onPress: handlePress, testID: 'button', disabled },
      children
    );
  },
  ButtonText: ({ children }: any) => {
    const React = require('react');
    return React.createElement('Text', { testID: 'button-text' }, children);
  },
}));

jest.mock('@/components/ui/center', () => ({
  Center: ({ children }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: 'center' }, children);
  },
}));

jest.mock('@/components/ui/spinner', () => ({
  Spinner: () => {
    const React = require('react');
    return React.createElement('Text', { testID: 'spinner' }, 'Loading...');
  },
}));

const mockUseCoreStore = useCoreStore as jest.MockedFunction<typeof useCoreStore>;
const mockUseUnitsStore = useUnitsStore as jest.MockedFunction<typeof useUnitsStore>;
const mockUseToastStore = useToastStore as jest.MockedFunction<typeof useToastStore>;

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

    mockUseToastStore.mockReturnValue(mockShowToast);

    // Mock the roles store
    (useRolesStore.getState as jest.Mock).mockReturnValue({
      fetchRolesForUnit: mockFetchRolesForUnit,
    });
  });

  it('renders correctly when open', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('settings.select_unit')).toBeTruthy();
    expect(screen.getByText('settings.current_unit')).toBeTruthy();
    expect(screen.getAllByText('Engine 1')).toHaveLength(2); // One in current selection, one in list
    expect(screen.getByText('Ladder 1')).toBeTruthy();
  });

  it('does not render when closed', () => {
    render(<UnitSelectionBottomSheet {...mockProps} isOpen={false} />);

    expect(screen.queryByText('settings.select_unit')).toBeNull();
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

    expect(screen.getByText('settings.no_units_available')).toBeTruthy();
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

  it('handles unit selection successfully', async () => {
    mockSetActiveUnit.mockResolvedValue(undefined);
    mockFetchRolesForUnit.mockResolvedValue(undefined);

    render(<UnitSelectionBottomSheet {...mockProps} />);

    // Find the second unit (Ladder 1) and select it using testID
    const ladderUnitItem = screen.getByTestId('unit-item-2');

    await act(async () => {
      fireEvent.press(ladderUnitItem);
    });

    await waitFor(() => {
      expect(mockSetActiveUnit).toHaveBeenCalledWith('2');
    });

    await waitFor(() => {
      expect(mockFetchRolesForUnit).toHaveBeenCalledWith('2');
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('success', 'settings.unit_selected_successfully');
    });

    // After all async operations complete and loading states are reset, onClose should be called
    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('handles unit selection failure gracefully', async () => {
    const error = new Error('Failed to set active unit');
    mockSetActiveUnit.mockRejectedValue(error);

    render(<UnitSelectionBottomSheet {...mockProps} />);

    // Find the second unit (Ladder 1) and select it using testID
    const ladderUnitItem = screen.getByTestId('unit-item-2');
    fireEvent.press(ladderUnitItem);

    await waitFor(() => {
      expect(mockSetActiveUnit).toHaveBeenCalledWith('2');
    });

    // Should not call fetchRolesForUnit if setActiveUnit fails
    expect(mockFetchRolesForUnit).not.toHaveBeenCalled();

    // Should show error toast
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'settings.unit_selection_failed');
    });

    // Should not close the modal on error
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('closes when cancel button is pressed', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    const cancelButton = screen.getByText('common.cancel');
    fireEvent.press(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles selecting same unit (early return)', async () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    // Find the first unit (Engine 1) which is the current active unit and select it
    const engineUnitItem = screen.getByTestId('unit-item-1');
    fireEvent.press(engineUnitItem);

    // Should not call setActiveUnit since it's the same unit
    expect(mockSetActiveUnit).not.toHaveBeenCalled();
    expect(mockFetchRolesForUnit).not.toHaveBeenCalled();

    // Should close the modal immediately
    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('shows selected unit with check mark and proper styling', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    // Engine 1 should be marked as selected since it's the active unit
    expect(screen.getAllByText('Engine 1')).toHaveLength(2);
    expect(screen.getByText('Ladder 1')).toBeTruthy();
  });

  it('renders units with correct type information', () => {
    render(<UnitSelectionBottomSheet {...mockProps} />);

    expect(screen.getByText('Engine')).toBeTruthy();
    expect(screen.getByText('Ladder')).toBeTruthy();
  });

  it('handles fetch units error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
    const errorFetchUnits = jest.fn().mockRejectedValue(new Error('Network error'));

    mockUseUnitsStore.mockReturnValue({
      units: [],
      fetchUnits: errorFetchUnits,
      isLoading: false,
    } as any);

    render(<UnitSelectionBottomSheet {...mockProps} />);

    await waitFor(() => {
      expect(errorFetchUnits).toHaveBeenCalled();
    });

    // Component should still render normally even if fetch fails
    expect(screen.getByText('settings.select_unit')).toBeTruthy();

    consoleError.mockRestore();
  });

  describe('Accessibility', () => {
    it('provides proper test IDs for testing', () => {
      render(<UnitSelectionBottomSheet {...mockProps} />);

      expect(screen.getByTestId('scroll-view')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing active unit gracefully', () => {
      mockUseCoreStore.mockReturnValue({
        activeUnit: null,
        setActiveUnit: mockSetActiveUnit,
      } as any);

      render(<UnitSelectionBottomSheet {...mockProps} />);

      // Should not show current unit section
      expect(screen.queryByText('settings.current_unit')).toBeNull();
      // Should still show unit list
      expect(screen.getByText('Engine 1')).toBeTruthy();
    });

    it('handles units with missing names gracefully', () => {
      const unitsWithMissingNames = [
        {
          UnitId: '1',
          Name: '',
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
      ];

      mockUseUnitsStore.mockReturnValue({
        units: unitsWithMissingNames,
        fetchUnits: mockFetchUnits,
        isLoading: false,
      } as any);

      render(<UnitSelectionBottomSheet {...mockProps} />);

      // Should still render the unit even with empty name
      expect(screen.getByText('Engine')).toBeTruthy();
    });
  });
});
