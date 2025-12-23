// Mock for expo-audio to understand the PermissionStatus structure
export const getRecordingPermissionsAsync = jest.fn();
export const requestRecordingPermissionsAsync = jest.fn();

// Default mock implementation
getRecordingPermissionsAsync.mockResolvedValue({
  granted: false,
  canAskAgain: true,
  expires: 'never',
  status: 'undetermined',
});

requestRecordingPermissionsAsync.mockResolvedValue({
  granted: true,
  canAskAgain: true,
  expires: 'never',
  status: 'granted',
});
