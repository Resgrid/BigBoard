/**
 * @jest-environment jsdom
 */

import { Platform } from 'react-native';

import { initializeLiveKitForPlatform } from '../livekit-platform-init';

// Mock the registerGlobals function
jest.mock('@livekit/react-native', () => ({
  registerGlobals: jest.fn(),
}));

// Import after mocking
// eslint-disable-next-line import/order
import { registerGlobals } from '@livekit/react-native';

describe('livekit-platform-init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeLiveKitForPlatform', () => {
    it('should call registerGlobals on iOS', () => {
      // Mock Platform.OS as iOS
      (Platform as any).OS = 'ios';

      initializeLiveKitForPlatform();

      expect(registerGlobals).toHaveBeenCalledTimes(1);
    });

    it('should call registerGlobals on Android', () => {
      // Mock Platform.OS as Android
      (Platform as any).OS = 'android';

      initializeLiveKitForPlatform();

      expect(registerGlobals).toHaveBeenCalledTimes(1);
    });

    it('should NOT call registerGlobals on web', () => {
      // Mock Platform.OS as web
      (Platform as any).OS = 'web';

      initializeLiveKitForPlatform();

      expect(registerGlobals).not.toHaveBeenCalled();
    });

    it('should NOT call registerGlobals on windows', () => {
      // Mock Platform.OS as windows
      (Platform as any).OS = 'windows';

      initializeLiveKitForPlatform();

      expect(registerGlobals).not.toHaveBeenCalled();
    });

    it('should NOT call registerGlobals on macos', () => {
      // Mock Platform.OS as macos
      (Platform as any).OS = 'macos';

      initializeLiveKitForPlatform();

      expect(registerGlobals).not.toHaveBeenCalled();
    });

    it('should be idempotent and safe to call multiple times', () => {
      // Mock Platform.OS as iOS
      (Platform as any).OS = 'ios';

      initializeLiveKitForPlatform();
      initializeLiveKitForPlatform();
      initializeLiveKitForPlatform();

      // Should be called once per invocation
      expect(registerGlobals).toHaveBeenCalledTimes(3);
    });

    it('should handle platform detection correctly when switching platforms', () => {
      // This simulates a hot reload scenario where platform might change
      (Platform as any).OS = 'ios';
      initializeLiveKitForPlatform();
      expect(registerGlobals).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      (Platform as any).OS = 'web';
      initializeLiveKitForPlatform();
      expect(registerGlobals).not.toHaveBeenCalled();

      jest.clearAllMocks();

      (Platform as any).OS = 'android';
      initializeLiveKitForPlatform();
      expect(registerGlobals).toHaveBeenCalledTimes(1);
    });
  });
});
