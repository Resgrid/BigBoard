// Axios interceptor setup

import useAuthStore from '../../stores/auth/store';

export { default as useAuthStore } from '../../stores/auth/store';
export * from './api';
export * from './types';

// Utility hooks and selectors
export const useAuth = () => {
  const store = useAuthStore();
  return {
    isAuthenticated: !!store.accessToken,
    isLoading: store.status === 'loading',
    error: store.error,
    loginFailure: store.loginFailure,
    login: store.login,
    logout: store.logout,
    status: store.status,
  };
};
