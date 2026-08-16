import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { cacheManager } from '@/lib/cache/cache-manager';
import { clearCacheScope, setCacheScope } from '@/lib/cache/cache-scope';
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

// Handle for the scheduled token-refresh timer so it can be cancelled
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

// In-flight refresh promise so concurrent callers share a single refresh
let refreshPromise: Promise<void> | null = null;

const clearRefreshTimer = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

const scheduleTokenRefresh = (msUntilRefresh: number) => {
  clearRefreshTimer();
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    useAuthStore.getState().refreshAccessToken();
  }, msUntilRefresh);
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
      _hasHydrated: false,
      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
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
                context: { hasAuthResponse: !!response.authResponse, hasIdToken: !!response.authResponse?.id_token },
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

            // Schedule automatic access-token refresh (1 min before expiry, minimum 60 s)
            const msUntilRefresh = Math.max(response.authResponse.expires_in * 1000 - 60_000, 60_000);
            scheduleTokenRefresh(msUntilRefresh);
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

        clearRefreshTimer();

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
        // Dedupe concurrent refreshes so the timer and the axios 401 interceptor share one request
        if (refreshPromise) {
          return refreshPromise;
        }

        refreshPromise = (async () => {
          try {
            const { refreshToken } = get();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await refreshTokenRequest(refreshToken);

            const now = new Date();
            const newExpiresOn = new Date(now.getTime() + response.expires_in * 1000).getTime().toString();

            set({
              accessToken: response.access_token,
              refreshToken: response.refresh_token,
              refreshTokenExpiresOn: newExpiresOn,
              status: 'signedIn',
              error: null,
            });

            // Schedule next refresh 1 min before the new access token expires (minimum 60 s)
            const msUntilRefresh = Math.max(response.expires_in * 1000 - 60_000, 60_000);
            scheduleTokenRefresh(msUntilRefresh);
          } catch {
            // If refresh fails, log out the user and flag the session as expired
            await get().logout();
            set({ error: 'session_expired' });
          } finally {
            refreshPromise = null;
          }
        })();

        return refreshPromise;
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
            const rawExpiresIn = response.authResponse.expires_in;
            const expiresInSeconds = typeof rawExpiresIn === 'number' && rawExpiresIn > 0 ? rawExpiresIn : 3600;
            if (!(typeof rawExpiresIn === 'number' && rawExpiresIn > 0)) {
              logger.warn({
                message: 'LoginWithSso: expires_in missing or invalid; defaulting to 3600s',
                context: { expires_in: rawExpiresIn },
              });
            }
            const expiresOn = new Date(now.getTime() + expiresInSeconds * 1000).getTime().toString();

            const hasRefreshToken = typeof response.authResponse.refresh_token === 'string' && response.authResponse.refresh_token.length > 0;
            if (!hasRefreshToken) {
              logger.warn({
                message: 'LoginWithSso: No refresh token in response; session cannot be silently refreshed',
                context: { userId: profileData.sub },
              });
            }

            set({
              accessToken: response.authResponse.access_token,
              refreshToken: hasRefreshToken ? response.authResponse.refresh_token : null,
              refreshTokenExpiresOn: expiresOn,
              status: 'signedIn',
              error: hasRefreshToken ? null : 'Session cannot be refreshed automatically; re-authentication will be required.',
              profile: profileData,
              userId: profileData.sub,
            });

            logger.info({
              message: 'LoginWithSso: State updated to signedIn',
              context: { userId: profileData.sub },
            });

            // Schedule automatic access-token refresh if we have a refresh token
            if (hasRefreshToken) {
              const msUntilRefresh = Math.max(expiresInSeconds * 1000 - 60_000, 60_000);
              scheduleTokenRefresh(msUntilRefresh);
            }

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
      // Only persist essential auth data (_hasHydrated is intentionally excluded)
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        refreshTokenExpiresOn: state.refreshTokenExpiresOn,
        profile: state.profile,
        userId: state.userId,
        status: state.status,
        isFirstTime: state.isFirstTime,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark the store as hydrated so the UI knows it can trust the status value
        state?.setHasHydrated(true);

        // If the user was signed in, check whether we need to refresh the access token
        if (state?.status === 'signedIn' && state?.refreshToken) {
          const expiresAt = state.refreshTokenExpiresOn ? parseInt(state.refreshTokenExpiresOn, 10) : 0;
          const now = Date.now();

          if (expiresAt > 0 && expiresAt - now > 60_000) {
            // Token still has more than 1 minute left — schedule a proactive refresh
            const msUntilRefresh = expiresAt - now - 60_000;
            scheduleTokenRefresh(msUntilRefresh);
          } else {
            // Token is expired or expiring very soon — refresh immediately
            Promise.resolve().then(() => useAuthStore.getState().refreshAccessToken());
          }
        }
      },
    }
  )
);

// Keep the API cache scoped to whoever is signed in. Cache keys embed this identity, so stamping it
// here means a second user on the same device can never be served the first user's cached rosters,
// units or contacts -- and signing out drops the scope so nothing leaks into an anonymous session.
useAuthStore.subscribe((state, previousState) => {
  if (state.userId === previousState.userId) {
    return;
  }

  try {
    // Drop everything the previous identity cached before the new scope goes live, so nothing from
    // the old account can be read back even if a key were to collide.
    cacheManager.clear();
  } catch (error) {
    // Cache hygiene must never be able to break sign-in or sign-out. Stale entries expire on their
    // own, and the scope moved on below, so they are no longer addressable by the new identity.
    logger.warn({
      message: 'Failed to clear the API cache on identity change',
      context: { error },
    });
  }

  // Deliberately outside the clear() attempt: leaving the scope on the previous user is the one
  // failure that actually leaks, since cache keys embed it and the entries we just failed to drop
  // are still there. The new identity has to take over the scope whether or not the clear worked.
  try {
    if (state.userId) {
      setCacheScope({ userId: state.userId });
    } else {
      clearCacheScope();
    }
  } catch (error) {
    logger.warn({
      message: 'Failed to reset the API cache scope on identity change',
      context: { error },
    });
  }
});

export default useAuthStore;
