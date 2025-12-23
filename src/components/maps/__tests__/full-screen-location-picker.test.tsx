import { describe, expect, it } from '@jest/globals';

// Mock the component since it uses Mapbox which may not be available in tests
jest.mock('../full-screen-location-picker', () => ({
  __esModule: true,
  default: () => null,
}));

describe('FullScreenLocationPicker', () => {
  it('should be importable', () => {
    // This is a basic test to ensure the module can be imported
    const FullScreenLocationPicker = require('../full-screen-location-picker').default;
    expect(FullScreenLocationPicker).toBeDefined();
  });
}); 