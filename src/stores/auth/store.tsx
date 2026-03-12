import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { logger } from '@/lib/logging';

import { externalTokenRequest, loginRequest, refreshTokenRequest } from '../../lib/auth/api';
import type { AuthState, LoginCredentials, ProfileModel, SsoLoginCredentials } from '../../lib/auth/types';

// Create MMKV storage instance for auth persistence
const authStorage = new MMKV({
  id: 'auth-storage',
  encryptionKey: Platform.OS === 'web' ? undefined : '9f066882-5c07-47a4-9bf3-783074b590d5',
});

// MMKV storage adapter for Zustand
const mmkvStorage = {
  getItem: (name: string) => {
    const value = authStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    authStorage.set(name, value);
  },
  removeItem: (name: string) => {
    authStorage.delete(name);
  },
};

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      refreshTokenExpiresOn: null,
      status: 'idle',
      error: null,
      profile: null,
      userId: null,
      isFirstTime: true,
      login: async (credentials: LoginCredentials) => {
        try {
          set({ status: 'loading', error: null });
          logger.info({
            message: 'Login: Calling loginRequest API',
            context: { username: credentials.username, platform: Platform.OS },
          });

          const response = await loginRequest(credentials);

          logger.info({
            message: 'Login: Received response from API',
            context: { successful: response.successful },
          });

          if (response.successful) {
            if (!response.authResponse || !response.authResponse.id_token) {
              logger.error({
                message: 'Login: Missing auth response or id_token',
                context: { authResponse: response.authResponse },
              });
              throw new Error('Invalid authentication response: missing token data');
            }

            // Use jwt-decode to safely decode the JWT token
            let profileData: ProfileModel;
            try {
              profileData = jwtDecode<ProfileModel>(response.authResponse.id_token);

              logger.info({
                message: 'Login: Successfully decoded JWT token',
                context: { userId: profileData.sub },
              });
            } catch (jwtError) {
              logger.error({
                message: 'Login: Failed to decode JWT token',
                context: { error: jwtError instanceof Error ? jwtError.message : String(jwtError) },
              });
              throw new Error('Failed to decode authentication token');
            }

            const now = new Date();
            const expiresOn = new Date(now.getTime() + response.authResponse.expires_in * 1000).getTime().toString();

            set({
              accessToken: response.authResponse.access_token,
              refreshToken: response.authResponse.refresh_token,
              refreshTokenExpiresOn: expiresOn,
              status: 'signedIn',
              error: null,
              profile: profileData,
              userId: profileData.sub,
            });

            logger.info({
              message: 'Login: State updated to signedIn',
              context: { userId: profileData.sub },
            });

            // Set up automatic token refresh
            //const decodedToken: { exp: number } = jwtDecode(
            //);
            //const now = new Date();
            //const expiresIn =
            //  response.authResponse?.expires_in! * 1000 - Date.now() - 60000; // Refresh 1 minute before expiry
            //const expiresOn = new Date(
            //  now.getTime() + response.authResponse?.expires_in! * 1000
            //)
            //  .getTime()
            //  .toString();

            //setTimeout(() => get().refreshAccessToken(), expiresIn);
          } else {
            logger.error({
              message: 'Login: API returned unsuccessful response',
              context: { message: response.message },
            });
            set({
              status: 'error',
              error: response.message || 'Login failed',
            });
          }
        } catch (error) {
          logger.error({
            message: 'Login: Exception caught',
            context: { error: error instanceof Error ? error.message : String(error) },
          });
          set({
            status: 'error',
            error: error instanceof Error ? error.message : 'Login failed',
          });
        }
      },

      logout: async () => {
        logger.info({
          message: 'Logout: Clearing auth state',
        });

        set({
          accessToken: null,
          refreshToken: null,
          refreshTokenExpiresOn: null,
          status: 'signedOut',
          error: null,
          profile: null,
          userId: null,
          isFirstTime: true,
        });
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await refreshTokenRequest(refreshToken);

          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            status: 'signedIn',
            error: null,
          });

          // Set up next token refresh
          //const decodedToken: { exp: number } = jwt_decode(
          //  response.access_token
          //);
          const expiresIn = response.expires_in * 1000 - Date.now() - 60000; // Refresh 1 minute before expiry
          setTimeout(() => get().refreshAccessToken(), expiresIn);
        } catch {
          // If refresh fails, log out the user
          get().logout();
        }
      },
      isAuthenticated: (): boolean => {
        return get().status === 'signedIn' && get().accessToken !== null;
      },
      setIsOnboarding: () => {
        logger.info({
          message: 'Setting isOnboarding to true',
        });

        set({
          status: 'onboarding',
        });
      },

      loginWithSso: async (credentials: SsoLoginCredentials) => {
        try {
          set({ status: 'loading', error: null });
          logger.info({
            message: 'LoginWithSso: Calling external token API',
            context: { provider: credentials.provider },
          });

          const response = await externalTokenRequest({
            provider: credentials.provider,
            external_token: credentials.externalToken,
            department_code: credentials.departmentCode,
            scope: 'openid email profile offline_access mobile',
          });

          if (response.successful && response.authResponse) {
            if (!response.authResponse.access_token) {
              logger.error({
                message: 'LoginWithSso: Missing access_token in SSO response',
                context: { error: 'access_token is absent or empty in authResponse' },
              });
              throw new Error('Invalid SSO response: missing access_token');
            }

            let profileData: ProfileModel;
            try {
              const tokenToDecode = response.authResponse.id_token || response.authResponse.access_token;
              profileData = jwtDecode<ProfileModel>(tokenToDecode);
            } catch (jwtError) {
              logger.error({
                message: 'LoginWithSso: Failed to decode token',
                context: { error: jwtError instanceof Error ? jwtError.message : String(jwtError) },
              });
              throw new Error('Failed to decode SSO authentication token');
            }

            if (!profileData.sub || typeof profileData.sub !== 'string') {
              logger.error({
                message: 'LoginWithSso: Decoded token missing required claims',
                context: { error: 'Missing or invalid sub claim in decoded token' },
              });
              throw new Error('Invalid SSO token: missing sub');
            }

            logger.info({
              message: 'LoginWithSso: Successfully decoded token',
              context: { userId: profileData.sub },
            });

            const now = new Date();
            const expiresOn = new Date(now.getTime() + response.authResponse.expires_in * 1000).getTime().toString();

            set({
              accessToken: response.authResponse.access_token,
              refreshToken: response.authResponse.refresh_token,
              refreshTokenExpiresOn: expiresOn,
              status: 'signedIn',
              error: null,
              profile: profileData,
              userId: profileData.sub,
            });

            logger.info({
              message: 'LoginWithSso: State updated to signedIn',
              context: { userId: profileData.sub },
            });

            return { success: true };
          } else {
            const failureError = new Error(response.message || 'SSO login failed');
            logger.error({
              message: 'LoginWithSso: API returned unsuccessful response',
              context: { message: response.message },
            });
            set({ status: 'error', error: response.message || 'SSO login failed' });
            return { success: false, error: failureError };
          }
        } catch (error) {
          const caughtError = error instanceof Error ? error : new Error('SSO login failed');
          logger.error({
            message: 'LoginWithSso: Exception caught',
            context: { error: caughtError.message },
          });
          set({
            status: 'error',
            error: caughtError.message,
          });
          return { success: false, error: caughtError };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist essential auth data
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        refreshTokenExpiresOn: state.refreshTokenExpiresOn,
        profile: state.profile,
        userId: state.userId,
        status: state.status,
        isFirstTime: state.isFirstTime,
      }),
    }
  )
);

export default useAuthStore;
