// Mock for @dev-plugins/react-query
// This module provides dev tools for React Query which are not needed in tests

export const useReactQueryDevTools = jest.fn();

export default {
  useReactQueryDevTools,
};
