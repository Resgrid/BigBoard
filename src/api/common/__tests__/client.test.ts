import { type AxiosError, type AxiosRequestConfig } from 'axios';

import useAuthStore from '@/stores/auth/store';

jest.mock('@/lib/logging', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/storage/app', () => ({
  getBaseApiUrl: () => 'https://example.test/api/v4',
}));

jest.mock('@/stores/auth/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
  },
}));

const mockRefreshAccessToken = jest.fn();
const getState = (useAuthStore as unknown as { getState: jest.Mock }).getState;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { api } = require('../client') as typeof import('../client');

const unauthorized = (config: AxiosRequestConfig): AxiosError => {
  const error = new Error('Request failed with status code 401') as AxiosError;
  error.isAxiosError = true;
  error.config = config as AxiosError['config'];
  error.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: config as never };
  return error;
};

describe('api client 401 handling', () => {
  let adapterCalls: number;

  beforeEach(() => {
    adapterCalls = 0;
    mockRefreshAccessToken.mockReset();
    getState.mockReset();
    api.defaults.adapter = async (config) => {
      adapterCalls += 1;
      throw unauthorized(config);
    };
  });

  it('does not attempt a refresh once the refresh token is gone', async () => {
    getState.mockReturnValue({
      accessToken: null,
      refreshToken: null,
      refreshAccessToken: mockRefreshAccessToken,
    });

    await expect(api.get('/Calls/GetActiveCalls')).rejects.toMatchObject({ response: { status: 401 } });

    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    // The original request only -- no retry, no doomed refresh round-trip.
    expect(adapterCalls).toBe(1);
  });

  it('collapses a serial burst of 401s into a single refresh attempt', async () => {
    // Mirrors the startup chain: each store awaits the previous one, so the in-flight
    // dedupe never sees them overlap. The first 401 spends the refresh token; the rest
    // must fail fast rather than replay the refresh once each.
    let refreshToken: string | null = 'refresh-token';
    mockRefreshAccessToken.mockImplementation(async () => {
      refreshToken = null; // refresh failed -> store cleared the session
    });
    getState.mockImplementation(() => ({
      accessToken: null,
      refreshToken,
      refreshAccessToken: mockRefreshAccessToken,
    }));

    const endpoints = ['/Calls/GetActiveCalls', '/Security/GetCurrentUsersRights', '/WeatherAlerts/GetSettings', '/WeatherAlerts/GetActiveAlerts'];
    for (const endpoint of endpoints) {
      await expect(api.get(endpoint)).rejects.toBeDefined();
    }

    expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
    expect(adapterCalls).toBe(4);
  });

  it('refreshes and retries when a token is available', async () => {
    getState.mockReturnValue({
      accessToken: 'stale-token',
      refreshToken: 'refresh-token',
      refreshAccessToken: mockRefreshAccessToken,
    });
    mockRefreshAccessToken.mockImplementation(async () => {
      getState.mockReturnValue({
        accessToken: 'fresh-token',
        refreshToken: 'refresh-token',
        refreshAccessToken: mockRefreshAccessToken,
      });
    });

    api.defaults.adapter = async (config) => {
      adapterCalls += 1;
      if (adapterCalls === 1) {
        throw unauthorized(config);
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config } as never;
    };

    await expect(api.get('/Calls/GetActiveCalls')).resolves.toMatchObject({ status: 200 });

    expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
    expect(adapterCalls).toBe(2);
  });
});
