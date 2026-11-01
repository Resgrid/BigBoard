jest.mock('@/lib/logging', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } }));
jest.mock('@/lib/mapbox-token', () => ({ clearMapboxToken: jest.fn() }));
jest.mock('@/lib/cache/cache-manager', () => ({ cacheManager: { clear: jest.fn() } }));
jest.mock('@/lib/cache/cache-scope', () => ({ clearCacheScope: jest.fn(), setCacheScope: jest.fn() }));
jest.mock('@/lib/auth/api', () => ({ loginRequest: jest.fn(), refreshTokenRequest: jest.fn(), externalTokenRequest: jest.fn() }));

import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { refreshTokenRequest } from '@/lib/auth/api';
import type { AuthResponse } from '@/lib/auth/types';

import useAuthStore from '../store';

const mockedRefreshTokenRequest = refreshTokenRequest as jest.MockedFunction<typeof refreshTokenRequest>;

const axiosErrorWithStatus = (status: number, data: unknown = {}): AxiosError => {
  const response = { status, statusText: '', data, headers: {}, config: {} as InternalAxiosRequestConfig } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, response);
};

const refreshed: AuthResponse = { access_token: 'new-access', refresh_token: 'new-refresh', id_token: '', expires_in: 3600, token_type: 'Bearer', expiration_date: '' };

// A wall display must survive a server outage: only the token endpoint rejecting the refresh token signs it out.
describe('auth store: a failed token refresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedRefreshTokenRequest.mockReset();
    useAuthStore.setState({ status: 'signedIn', accessToken: 'access', refreshToken: 'refresh', error: null });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each([400, 401])('signs out when the token endpoint rejects the refresh token (%i invalid_grant)', async (status) => {
    mockedRefreshTokenRequest.mockRejectedValueOnce(axiosErrorWithStatus(status, { error: 'invalid_grant' }));

    await useAuthStore.getState().refreshAccessToken();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', accessToken: null, refreshToken: null, error: 'session_expired' });
  });

  it.each([
    [400, { error: 'invalid_request' }],
    [401, { error: 'invalid_client' }],
    [400, '<html>Bad Request</html>'],
  ])('keeps the session when the token endpoint answers %i without invalid_grant', async (status, data) => {
    mockedRefreshTokenRequest.mockRejectedValueOnce(axiosErrorWithStatus(status, data));

    await useAuthStore.getState().refreshAccessToken();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', accessToken: 'access', refreshToken: 'refresh', error: null });
  });

  it.each([500, 502, 503, 504, 429])('keeps the session when the token endpoint fails with %i', async (status) => {
    mockedRefreshTokenRequest.mockRejectedValueOnce(axiosErrorWithStatus(status));

    await useAuthStore.getState().refreshAccessToken();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', accessToken: 'access', refreshToken: 'refresh', error: null });
  });

  it('keeps the session when the server cannot be reached', async () => {
    mockedRefreshTokenRequest.mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'));

    await useAuthStore.getState().refreshAccessToken();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', accessToken: 'access', refreshToken: 'refresh' });
  });

  it('retries a transient failure', async () => {
    mockedRefreshTokenRequest.mockRejectedValueOnce(axiosErrorWithStatus(503)).mockResolvedValueOnce(refreshed);

    await useAuthStore.getState().refreshAccessToken();
    await jest.advanceTimersByTimeAsync(30_000);

    expect(mockedRefreshTokenRequest).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', accessToken: 'new-access', refreshToken: 'new-refresh' });
  });
});
