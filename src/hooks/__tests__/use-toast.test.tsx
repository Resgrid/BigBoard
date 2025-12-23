import { renderHook } from '@testing-library/react-native';

import { useToast } from '@/hooks/use-toast';
import { useToastStore } from '@/stores/toast/store';

// Mock the toast store
jest.mock('@/stores/toast/store', () => ({
  useToastStore: jest.fn(),
}));

describe('useToast', () => {
  const mockShowToast = jest.fn();
  const mockUseToastStore = useToastStore as jest.MockedFunction<typeof useToastStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToastStore.mockReturnValue({
      showToast: mockShowToast,
    });
  });

  it('should provide show method that calls showToast', () => {
    const { result } = renderHook(() => useToast());

    result.current.show('info', 'Test message', 'Test title');

    expect(mockShowToast).toHaveBeenCalledWith('info', 'Test message', 'Test title');
  });

  it('should provide success method that calls showToast with success type', () => {
    const { result } = renderHook(() => useToast());

    result.current.success('Success message', 'Success title');

    expect(mockShowToast).toHaveBeenCalledWith('success', 'Success message', 'Success title');
  });

  it('should provide error method that calls showToast with error type', () => {
    const { result } = renderHook(() => useToast());

    result.current.error('Error message', 'Error title');

    expect(mockShowToast).toHaveBeenCalledWith('error', 'Error message', 'Error title');
  });

  it('should provide warning method that calls showToast with warning type', () => {
    const { result } = renderHook(() => useToast());

    result.current.warning('Warning message', 'Warning title');

    expect(mockShowToast).toHaveBeenCalledWith('warning', 'Warning message', 'Warning title');
  });

  it('should provide info method that calls showToast with info type', () => {
    const { result } = renderHook(() => useToast());

    result.current.info('Info message', 'Info title');

    expect(mockShowToast).toHaveBeenCalledWith('info', 'Info message', 'Info title');
  });

  it('should work without title parameter', () => {
    const { result } = renderHook(() => useToast());

    result.current.success('Success message');

    expect(mockShowToast).toHaveBeenCalledWith('success', 'Success message', undefined);
  });
});