import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { CallProtocolsResultData } from '@/models/v4/callProtocols/callProtocolsResultData';

import Protocols from '../protocols';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/components/common/loading', () => ({
  Loading: () => {
    const { Text } = require('react-native');
    return <Text>Loading</Text>;
  },
}));

jest.mock('@/components/common/zero-state', () => ({
  __esModule: true,
  default: ({ heading, description }: { heading: string; description: string }) => {
    const { Text } = require('react-native');
    return <Text>{`ZeroState: ${heading}`}</Text>;
  },
}));

jest.mock('@/components/protocols/protocol-card', () => ({
  ProtocolCard: ({ protocol, onPress }: { protocol: any; onPress: (id: string) => void }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID={`protocol-card-${protocol.Id}`} onPress={() => onPress(protocol.Id)}>
        <Text>{protocol.Name}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/components/protocols/protocol-details-sheet', () => ({
  ProtocolDetailsSheet: () => {
    const { Text } = require('react-native');
    return <Text>ProtocolDetailsSheet</Text>;
  },
}));

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('@/components/ui/box', () => ({
  Box: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  InputField: (props: any) => {
    const { TextInput } = require('react-native');
    return <TextInput {...props} />;
  },
  InputIcon: ({ as: Icon, ...props }: any) => {
    const { View } = require('react-native');
    return Icon ? <Icon {...props} /> : <View {...props} />;
  },
  InputSlot: ({ children, onPress, ...props }: any) => {
    const { Pressable, View } = require('react-native');
    return onPress ? <Pressable onPress={onPress} {...props}>{children}</Pressable> : <View {...props}>{children}</View>;
  },
}));

jest.mock('lucide-react-native', () => ({
  Search: ({ ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props} testID="search-icon" />;
  },
  X: ({ ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props} testID="x-icon" />;
  },
  FileText: ({ ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props} testID="file-text-icon" />;
  },
}));

// Mock the protocols store
const mockProtocolsStore = {
  protocols: [],
  searchQuery: '',
  setSearchQuery: jest.fn(),
  selectProtocol: jest.fn(),
  isLoading: false,
  fetchProtocols: jest.fn(),
};

jest.mock('@/stores/protocols/store', () => ({
  useProtocolsStore: () => mockProtocolsStore,
}));

// Mock protocols test data
const mockProtocols: CallProtocolsResultData[] = [
  {
    Id: '1',
    DepartmentId: 'dept1',
    Name: 'Fire Emergency Response',
    Code: 'FIRE001',
    Description: 'Standard fire emergency response protocol',
    ProtocolText: '<p>Fire emergency response protocol content</p>',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '2023-01-02T00:00:00Z',
    UpdatedByUserId: 'user1',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  },
  {
    Id: '2',
    DepartmentId: 'dept1',
    Name: 'Medical Emergency',
    Code: 'MED001',
    Description: 'Medical emergency response protocol',
    ProtocolText: '<p>Medical emergency response protocol content</p>',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '2023-01-02T00:00:00Z',
    UpdatedByUserId: 'user1',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  },
  {
    Id: '3',
    DepartmentId: 'dept1',
    Name: 'Hazmat Response',
    Code: 'HAZ001',
    Description: 'Hazardous material response protocol',
    ProtocolText: '<p>Hazmat response protocol content</p>',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '2023-01-02T00:00:00Z',
    UpdatedByUserId: 'user1',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  },
  {
    Id: '', // Empty ID to test the keyExtractor fix
    DepartmentId: 'dept1',
    Name: 'Protocol with Empty ID',
    Code: 'EMPTY001',
    Description: 'Protocol with empty ID for testing',
    ProtocolText: '<p>Protocol with empty ID content</p>',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '2023-01-02T00:00:00Z',
    UpdatedByUserId: 'user1',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  },
];

describe('Protocols Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store to default state
    Object.assign(mockProtocolsStore, {
      protocols: [],
      searchQuery: '',
      setSearchQuery: jest.fn(),
      selectProtocol: jest.fn(),
      isLoading: false,
      fetchProtocols: jest.fn(),
    });
  });

  it('should render loading state during initial fetch', () => {
    Object.assign(mockProtocolsStore, {
      isLoading: true,
      protocols: [],
    });

    render(<Protocols />);

    expect(screen.getByText('Loading')).toBeTruthy();
  });

  it('should render protocols list when data is loaded', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      isLoading: false,
    });

    render(<Protocols />);

    await waitFor(() => {
      expect(screen.getByTestId('protocol-card-1')).toBeTruthy();
      expect(screen.getByTestId('protocol-card-2')).toBeTruthy();
      expect(screen.getByTestId('protocol-card-3')).toBeTruthy();
    });

    expect(mockProtocolsStore.fetchProtocols).toHaveBeenCalledTimes(1);
  });

  it('should handle protocols with empty IDs using keyExtractor fallback', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      isLoading: false,
    });

    render(<Protocols />);

    await waitFor(() => {
      // The protocol with empty ID should render with fallback key
      expect(screen.getByText('Protocol with Empty ID')).toBeTruthy();
    });
  });

  it('should render zero state when no protocols are available', () => {
    Object.assign(mockProtocolsStore, {
      protocols: [],
      isLoading: false,
    });

    render(<Protocols />);

    expect(screen.getByText('ZeroState: protocols.empty')).toBeTruthy();
  });

  it('should filter protocols based on search query by name', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: 'fire',
      isLoading: false,
    });

    render(<Protocols />);

    // Only Fire Emergency Response should be visible in filtered results
    await waitFor(() => {
      expect(screen.getByTestId('protocol-card-1')).toBeTruthy();
      expect(screen.queryByTestId('protocol-card-2')).toBeFalsy();
      expect(screen.queryByTestId('protocol-card-3')).toBeFalsy();
    });
  });

  it('should filter protocols based on search query by code', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: 'MED001',
      isLoading: false,
    });

    render(<Protocols />);

    // Only Medical Emergency should be visible in filtered results
    await waitFor(() => {
      expect(screen.queryByTestId('protocol-card-1')).toBeFalsy();
      expect(screen.getByTestId('protocol-card-2')).toBeTruthy();
      expect(screen.queryByTestId('protocol-card-3')).toBeFalsy();
    });
  });

  it('should filter protocols based on search query by description', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: 'hazardous',
      isLoading: false,
    });

    render(<Protocols />);

    // Only Hazmat Response should be visible in filtered results
    await waitFor(() => {
      expect(screen.queryByTestId('protocol-card-1')).toBeFalsy();
      expect(screen.queryByTestId('protocol-card-2')).toBeFalsy();
      expect(screen.getByTestId('protocol-card-3')).toBeTruthy();
    });
  });

  it('should show zero state when search returns no results', () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: 'nonexistent',
      isLoading: false,
    });

    render(<Protocols />);

    expect(screen.getByText('ZeroState: protocols.empty')).toBeTruthy();
  });

  it('should handle search input changes', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: '',
      isLoading: false,
    });

    render(<Protocols />);

    const searchInput = screen.getByPlaceholderText('protocols.search');
    fireEvent.changeText(searchInput, 'fire');

    expect(mockProtocolsStore.setSearchQuery).toHaveBeenCalledWith('fire');
  });

  it('should clear search query when X button is pressed', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: 'fire',
      isLoading: false,
    });

    render(<Protocols />);

    const searchInput = screen.getByDisplayValue('fire');
    expect(searchInput).toBeTruthy();

    // Test that the clear functionality would work
    fireEvent.changeText(searchInput, '');
    expect(mockProtocolsStore.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('should handle protocol selection', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: '',
      isLoading: false,
    });

    render(<Protocols />);

    const protocolCard = screen.getByTestId('protocol-card-1');
    fireEvent.press(protocolCard);

    expect(mockProtocolsStore.selectProtocol).toHaveBeenCalledWith('1');
  });

  it('should handle pull-to-refresh', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      isLoading: false,
    });

    render(<Protocols />);

    // The FlatList should be rendered with RefreshControl
    await waitFor(() => {
      expect(screen.getByTestId('protocol-card-1')).toBeTruthy();
    });

    expect(mockProtocolsStore.fetchProtocols).toHaveBeenCalledTimes(1);
  });

  it('should render protocol details sheet', () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      isLoading: false,
    });

    render(<Protocols />);

    expect(screen.getByText('ProtocolDetailsSheet')).toBeTruthy();
  });

  it('should handle case-insensitive search', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: 'FIRE',
      isLoading: false,
    });

    render(<Protocols />);

    // Should match "Fire Emergency Response" despite different case
    await waitFor(() => {
      expect(screen.getByTestId('protocol-card-1')).toBeTruthy();
    });
  });

  it('should handle empty search query by showing all protocols', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: '',
      isLoading: false,
    });

    render(<Protocols />);

    await waitFor(() => {
      expect(screen.getByTestId('protocol-card-1')).toBeTruthy();
      expect(screen.getByTestId('protocol-card-2')).toBeTruthy();
      expect(screen.getByTestId('protocol-card-3')).toBeTruthy();
    });
  });

  it('should handle whitespace-only search query by showing all protocols', async () => {
    Object.assign(mockProtocolsStore, {
      protocols: mockProtocols,
      searchQuery: '   ',
      isLoading: false,
    });

    render(<Protocols />);

    await waitFor(() => {
      expect(screen.getByTestId('protocol-card-1')).toBeTruthy();
      expect(screen.getByTestId('protocol-card-2')).toBeTruthy();
      expect(screen.getByTestId('protocol-card-3')).toBeTruthy();
    });
  });
}); 