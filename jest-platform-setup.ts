// Platform setup for Jest - must run before other modules
const mockPlatform = {
  OS: 'ios' as const,
  select: jest.fn().mockImplementation((obj: any) => obj.ios || obj.default),
  Version: 17,
  constants: {},
  isTesting: true,
};

// Set global Platform for testing library - must be set before other imports
Object.defineProperty(global, 'Platform', {
  value: mockPlatform,
  writable: true,
  enumerable: true,
  configurable: true,
});

// Also mock the react-native Platform module directly
jest.doMock('react-native/Libraries/Utilities/Platform', () => mockPlatform);

// Ensure Platform is available in the global scope for React Navigation and other libs
(global as any).Platform = mockPlatform;
