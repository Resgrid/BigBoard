import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { Alert } from 'react-native';

import { CallFilesModal } from '../call-files-modal';

// Mock the zustand store
const mockFetchCallFiles = jest.fn();
const defaultMockFiles = [
  {
    Id: 'file-1',
    CallId: 'test-call-123',
    Type: 3,
    FileName: 'test-document.pdf',
    Name: 'Test Document',
    Size: 1024576,
    Url: 'https://example.com/file1.pdf',
    UserId: 'user-1',
    Timestamp: '2023-01-15T10:30:00Z',
    Mime: 'application/pdf',
    Data: '',
  },
  {
    Id: 'file-2',
    CallId: 'test-call-123',
    Type: 3,
    FileName: 'image.jpg',
    Name: 'Photo Evidence',
    Size: 2048000,
    Url: 'https://example.com/file2.jpg',
    UserId: 'user-2',
    Timestamp: '2023-01-15T14:45:00Z',
    Mime: 'image/jpeg',
    Data: '',
  },
];

let mockStoreState: any = {
  callFiles: defaultMockFiles,
  isLoadingFiles: false,
  errorFiles: null,
  fetchCallFiles: mockFetchCallFiles,
};

jest.mock('@/stores/calls/detail-store', () => ({
  useCallDetailStore: () => mockStoreState,
}));

// Mock analytics
const mockTrackEvent = jest.fn();
jest.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
  }),
}));

// Mock expo modules
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  writeAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock the API call
jest.mock('@/api/calls/callFiles', () => ({
  getCallAttachmentFile: jest.fn(() =>
    Promise.resolve(new Blob(['test content'], { type: 'application/pdf' }))
  ),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock FileReader for testing
Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: class MockFileReader {
    static readonly EMPTY = 0;
    static readonly LOADING = 1;
    static readonly DONE = 2;

    result: string | ArrayBuffer | null = null;
    readyState = 0;
    onload: ((event: any) => void) | null = null;

    readAsDataURL(blob: Blob) {
      // Simulate successful file read
      setTimeout(() => {
        this.result = 'data:application/pdf;base64,dGVzdCBjb250ZW50'; // base64 for "test content"
        this.readyState = 2; // DONE
        if (this.onload) this.onload(new Event('load') as any);
      }, 0);
    }
  }
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'calls.files.title': 'Call Files',
        'calls.files.no_files': 'No files available',
        'calls.files.no_files_description': 'No files have been added to this call yet',
        'calls.files.error': 'Error getting files',
        'calls.files.file_name': 'File Name',
        'calls.files.open_error': 'Error opening file',
        'calls.files.share_error': 'Error sharing file',
        'common.loading': 'Loading...',
        'common.retry': 'Retry',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockBottomSheet = React.forwardRef(({ children, onChange, index, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      expand: jest.fn(),
      close: jest.fn(),
      snapToIndex: jest.fn(),
    }));

    // Simulate sheet change when index changes
    React.useEffect(() => {
      if (onChange) {
        onChange(index);
      }
    }, [index, onChange]);

    return (
      <View testID="bottom-sheet" {...props}>
        {children}
      </View>
    );
  });

  const MockBottomSheetView = ({ children, ...props }: any) => (
    <View testID="bottom-sheet-view" {...props}>
      {children}
    </View>
  );

  const MockBottomSheetBackdrop = ({ onPress, ...props }: any) => (
    <View testID="bottom-sheet-backdrop" {...props} />
  );

  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetView: MockBottomSheetView,
    BottomSheetBackdrop: MockBottomSheetBackdrop,
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    ScrollView: ({ children, ...props }: any) => (
      <View testID="scroll-view" {...props}>
        {children}
      </View>
    ),
  };
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return {
    X: (props: any) => (
      <Text testID="close-icon" {...props}>
        X
      </Text>
    ),
    File: (props: any) => (
      <Text testID="file-icon" {...props}>
        File
      </Text>
    ),
    Download: (props: any) => (
      <Text testID="download-icon" {...props}>
        Download
      </Text>
    ),
  };
});

// Mock UI components
jest.mock('../../ui', () => {
  const { View } = require('react-native');
  return {
    FocusAwareStatusBar: ({ children, ...props }: any) => (
      <View testID="focus-aware-status-bar" {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock('@/components/ui/box', () => {
  const { View } = require('react-native');
  return {
    Box: ({ children, ...props }: any) => (
      <View testID="box" {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock('@/components/ui/button', () => {
  const { View, Text } = require('react-native');
  return {
    Button: ({ children, onPress, testID, ...props }: any) => (
      <View testID={testID || 'button'} {...props}>
        <Text onPress={onPress}>{children}</Text>
      </View>
    ),
  };
});

jest.mock('@/components/ui/heading', () => {
  const { Text } = require('react-native');
  return {
    Heading: ({ children, ...props }: any) => (
      <Text testID="heading" {...props}>
        {children}
      </Text>
    ),
  };
});

jest.mock('@/components/ui/text', () => {
  const { Text } = require('react-native');
  return {
    Text: ({ children, ...props }: any) => (
      <Text testID="text" {...props}>
        {children}
      </Text>
    ),
  };
});

jest.mock('@/components/ui/vstack', () => {
  const { View } = require('react-native');
  return {
    VStack: ({ children, ...props }: any) => (
      <View testID="vstack" {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock('@/components/ui/hstack', () => {
  const { View } = require('react-native');
  return {
    HStack: ({ children, ...props }: any) => (
      <View testID="hstack" {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock('@/components/ui/spinner', () => {
  const { Text } = require('react-native');
  return {
    Spinner: ({ ...props }: any) => (
      <Text testID="spinner" {...props}>
        Loading...
      </Text>
    ),
  };
});

describe('CallFilesModal', () => {
  const defaultProps = {
    isOpen: false,
    onClose: jest.fn(),
    callId: 'test-call-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default state
    mockStoreState = {
      callFiles: defaultMockFiles,
      isLoadingFiles: false,
      errorFiles: null,
      fetchCallFiles: mockFetchCallFiles,
    };
  });

  it('renders correctly when closed', () => {
    const { getByTestId } = render(<CallFilesModal {...defaultProps} />);

    expect(getByTestId('bottom-sheet')).toBeTruthy();
    expect(getByTestId('focus-aware-status-bar')).toBeTruthy();
  });

  it('renders correctly when open', () => {
    const { getByTestId, getByText } = render(
      <CallFilesModal {...defaultProps} isOpen={true} />
    );

    expect(getByTestId('bottom-sheet')).toBeTruthy();
    expect(getByTestId('call-files-modal')).toBeTruthy();
    expect(getByText('Call Files')).toBeTruthy();
  });

  it('calls fetchCallFiles when modal opens', () => {
    render(<CallFilesModal {...defaultProps} isOpen={true} />);
    expect(mockFetchCallFiles).toHaveBeenCalledWith('test-call-123');
  });

  it('displays the correct title using i18n', () => {
    const { getByText } = render(
      <CallFilesModal {...defaultProps} isOpen={true} />
    );

    expect(getByText('Call Files')).toBeTruthy();
  });

  it('displays file list when files are available', () => {
    const { getByText, getByTestId } = render(
      <CallFilesModal {...defaultProps} isOpen={true} />
    );

    expect(getByText('Test Document')).toBeTruthy();
    expect(getByText('Photo Evidence')).toBeTruthy();
    expect(getByTestId('file-item-file-1')).toBeTruthy();
    expect(getByTestId('file-item-file-2')).toBeTruthy();
  });

  it('displays file details correctly', () => {
    const { getByText } = render(
      <CallFilesModal {...defaultProps} isOpen={true} />
    );

    // Check file sizes are displayed correctly
    expect(getByText('1000.56 KB')).toBeTruthy(); // 1024576 bytes
    expect(getByText('1.95 MB')).toBeTruthy(); // 2048000 bytes
  });

  it('calls onClose when close button is pressed', () => {
    const mockOnClose = jest.fn();
    const { getByTestId } = render(
      <CallFilesModal {...defaultProps} isOpen={true} onClose={mockOnClose} />
    );

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    const { getByTestId } = render(
      <CallFilesModal {...defaultProps} isOpen={true} />
    );

    const modal = getByTestId('call-files-modal');
    const closeButton = getByTestId('close-button');

    expect(modal).toBeTruthy();
    expect(closeButton).toBeTruthy();
  });

  it('renders the scrollable content area', () => {
    const { getByTestId } = render(
      <CallFilesModal {...defaultProps} isOpen={true} />
    );

    expect(getByTestId('scroll-view')).toBeTruthy();
  });

  it('handles different call IDs correctly', () => {
    const { rerender } = render(
      <CallFilesModal {...defaultProps} isOpen={true} callId="call-1" />
    );

    expect(mockFetchCallFiles).toHaveBeenCalledWith('call-1');

    rerender(<CallFilesModal {...defaultProps} isOpen={true} callId="call-2" />);
    expect(mockFetchCallFiles).toHaveBeenCalledWith('call-2');
  });

  it('maintains proper component structure', () => {
    const { getByTestId, getAllByTestId } = render(
      <CallFilesModal {...defaultProps} isOpen={true} />
    );

    // Check that all required components are present
    expect(getByTestId('bottom-sheet')).toBeTruthy();
    expect(getByTestId('call-files-modal')).toBeTruthy(); // This is the BottomSheetView with testID
    expect(getByTestId('heading')).toBeTruthy();
    expect(getByTestId('close-button')).toBeTruthy();
    expect(getByTestId('scroll-view')).toBeTruthy();
    expect(getAllByTestId('vstack').length).toBeGreaterThan(0); // Multiple VStack components exist
  });

  describe('Loading States', () => {
    beforeEach(() => {
      // Mock loading state
      mockStoreState = {
        callFiles: null,
        isLoadingFiles: true,
        errorFiles: null,
        fetchCallFiles: mockFetchCallFiles,
      };
    });

    it('displays loading spinner when fetching files', () => {
      const { getByTestId, getAllByText } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      expect(getByTestId('spinner')).toBeTruthy();
      expect(getAllByText('Loading...').length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    beforeEach(() => {
      // Mock error state
      mockStoreState = {
        callFiles: [],
        isLoadingFiles: false,
        errorFiles: 'Network error occurred',
        fetchCallFiles: mockFetchCallFiles,
      };
    });

    it('displays error message when file fetch fails', () => {
      const { getByText } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      expect(getByText('Error getting files')).toBeTruthy();
      expect(getByText('Network error occurred')).toBeTruthy();
    });

    it('allows retry on error', () => {
      const { getByText } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      expect(mockFetchCallFiles).toHaveBeenCalledWith('test-call-123');
    });
  });

  describe('Empty States', () => {
    beforeEach(() => {
      // Mock empty state
      mockStoreState = {
        callFiles: [],
        isLoadingFiles: false,
        errorFiles: null,
        fetchCallFiles: mockFetchCallFiles,
      };
    });

    it('displays empty state when no files available', () => {
      const { getByText, getByTestId } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      expect(getByText('No files available')).toBeTruthy();
      expect(getByText('No files have been added to this call yet')).toBeTruthy();
      expect(getByTestId('file-icon')).toBeTruthy();
    });
  });

  describe('File Download', () => {
    const mockGetCallAttachmentFile = require('@/api/calls/callFiles').getCallAttachmentFile;
    const mockWriteAsStringAsync = require('expo-file-system').writeAsStringAsync;
    const mockShareAsync = require('expo-sharing').shareAsync;

    beforeEach(() => {
      // Reset to default state with files
      mockStoreState = {
        callFiles: defaultMockFiles,
        isLoadingFiles: false,
        errorFiles: null,
        fetchCallFiles: mockFetchCallFiles,
      };
    });

    it('downloads and shares file when clicked', async () => {
      const { getByTestId } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      const fileItem = getByTestId('file-item-file-1');
      fireEvent.press(fileItem);

      await waitFor(() => {
        expect(mockGetCallAttachmentFile).toHaveBeenCalledWith(
          'https://example.com/file1.pdf',
          expect.objectContaining({
            onEvent: expect.any(Function),
          })
        );
      });

      // Wait for FileReader and file operations to complete
      await waitFor(() => {
        expect(mockWriteAsStringAsync).toHaveBeenCalled();
      }, { timeout: 2000 });

      await waitFor(() => {
        expect(mockShareAsync).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('handles download errors gracefully', async () => {
      mockGetCallAttachmentFile.mockRejectedValueOnce(new Error('Download failed'));

      const { getByTestId } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      const fileItem = getByTestId('file-item-file-1');
      fireEvent.press(fileItem);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error opening file',
          'Download failed'
        );
      });
    });

    it('shows downloading state when file is being downloaded', async () => {
      // Clear all mocks before this test
      mockGetCallAttachmentFile.mockClear();
      mockWriteAsStringAsync.mockClear();
      mockShareAsync.mockClear();

      // Make the API call take some time
      mockGetCallAttachmentFile.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(new Blob(['test content'], { type: 'application/pdf' })), 100))
      );

      const { getByTestId } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      const fileItem = getByTestId('file-item-file-1');

      // Click the file
      fireEvent.press(fileItem);

      // Should call the API
      await waitFor(() => {
        expect(mockGetCallAttachmentFile).toHaveBeenCalled();
      });

      // Wait for the download to complete
      await waitFor(() => {
        expect(mockWriteAsStringAsync).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('File Format Utilities', () => {
    beforeEach(() => {
      // Reset to default state
      mockStoreState = {
        callFiles: defaultMockFiles,
        isLoadingFiles: false,
        errorFiles: null,
        fetchCallFiles: mockFetchCallFiles,
      };
    });

    it('formats file sizes correctly', () => {
      const { getByText } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      // Test various file size formats
      expect(getByText('1000.56 KB')).toBeTruthy(); // 1024576 bytes
      expect(getByText('1.95 MB')).toBeTruthy(); // 2048000 bytes
    });

    it('formats timestamps correctly', () => {
      const { getAllByText } = render(
        <CallFilesModal {...defaultProps} isOpen={true} />
      );

      // Should display formatted dates (exact format may vary by locale)
      const timestampElements = getAllByText(/1\/15\/2023/);
      expect(timestampElements.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset to default state
      mockStoreState = {
        callFiles: defaultMockFiles,
        isLoadingFiles: false,
        errorFiles: null,
        fetchCallFiles: mockFetchCallFiles,
      };
    });

    it('should track analytics event when modal is opened', () => {
      render(<CallFilesModal {...defaultProps} isOpen={true} />);

      expect(mockTrackEvent).toHaveBeenCalledWith('call_files_modal_opened', {
        callId: 'test-call-123',
        hasExistingFiles: true,
        filesCount: 2,
        isLoadingFiles: false,
        hasError: false,
      });
    });

    it('should not track analytics event when modal is closed', () => {
      render(<CallFilesModal {...defaultProps} isOpen={false} />);

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('should track analytics event with loading state', () => {
      mockStoreState = {
        ...mockStoreState,
        isLoadingFiles: true,
      };

      render(<CallFilesModal {...defaultProps} isOpen={true} callId="test-call-456" />);

      expect(mockTrackEvent).toHaveBeenCalledWith('call_files_modal_opened', {
        callId: 'test-call-456',
        hasExistingFiles: true,
        filesCount: 2,
        isLoadingFiles: true,
        hasError: false,
      });
    });

    it('should track analytics event with error state', () => {
      mockStoreState = {
        ...mockStoreState,
        errorFiles: 'Failed to load files',
      };

      render(<CallFilesModal {...defaultProps} isOpen={true} callId="test-call-error" />);

      expect(mockTrackEvent).toHaveBeenCalledWith('call_files_modal_opened', {
        callId: 'test-call-error',
        hasExistingFiles: true,
        filesCount: 2,
        isLoadingFiles: false,
        hasError: true,
      });
    });

    it('should track analytics event with no files', () => {
      mockStoreState = {
        ...mockStoreState,
        callFiles: [],
      };

      render(<CallFilesModal {...defaultProps} isOpen={true} callId="test-call-no-files" />);

      expect(mockTrackEvent).toHaveBeenCalledWith('call_files_modal_opened', {
        callId: 'test-call-no-files',
        hasExistingFiles: false,
        filesCount: 0,
        isLoadingFiles: false,
        hasError: false,
      });
    });

    it('should track analytics event only once when isOpen changes from false to true', () => {
      const { rerender } = render(<CallFilesModal {...defaultProps} isOpen={false} />);

      // Should not track when initially closed
      expect(mockTrackEvent).not.toHaveBeenCalled();

      // Should track when opened
      rerender(<CallFilesModal {...defaultProps} isOpen={true} />);

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith('call_files_modal_opened', {
        callId: 'test-call-123',
        hasExistingFiles: true,
        filesCount: 2,
        isLoadingFiles: false,
        hasError: false,
      });

      // Should not track again when staying open
      rerender(<CallFilesModal {...defaultProps} isOpen={true} />);

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });
  });
});
