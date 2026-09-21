import { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { api } from '@/api/common/client';
import { getConfig, getSystemConfig } from '@/api/config';
import { UnitStatusBaseType } from '@/lib/unit-status';
import { evaluateUnitStatusAlert } from '@/lib/unit-status-thresholds';
import useAuthStore from '@/stores/auth/store';

jest.mock('@/lib/logging', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/storage/app', () => ({
  getBaseApiUrl: () => 'https://example.test/api/v4',
}));

jest.mock('@/stores/auth/store', () => ({
  __esModule: true,
  default: { getState: jest.fn() },
}));

jest.mock('@/stores/app/core-store', () => ({ useCoreStore: jest.fn() }));

const getAuthState = useAuthStore.getState as jest.Mock;
const refreshAccessToken = jest.fn();
const thresholds = [
  { BaseType: UnitStatusBaseType.Dispatched, WarnSeconds: 60, AlertSeconds: 120 },
  { BaseType: UnitStatusBaseType.AtHospital, WarnSeconds: 600, AlertSeconds: 900 },
];

const unauthorized = (config: InternalAxiosRequestConfig): AxiosError => {
  const error = new Error('Unauthorized') as AxiosError;
  error.config = config;
  error.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config };
  return error;
};

describe('department configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete api.defaults.headers.common.Authorization;
    getAuthState.mockReturnValue({ accessToken: 'department-token', refreshToken: 'refresh-token', refreshAccessToken });
  });

  it('loads saved timers through the authenticated department endpoint', async () => {
    const requests: string[] = [];
    api.defaults.adapter = async (config) => {
      requests.push(config.url!);
      expect(config.params).toEqual({ key: 'bigboard-key' });
      expect(config.headers.Authorization).toBe('Bearer department-token');
      return { data: { Data: { UnitStatusThresholds: thresholds } }, status: 200, statusText: 'OK', headers: {}, config };
    };

    const result = await getConfig('bigboard-key');

    expect(requests).toEqual(['/Config/GetDepartmentConfig']);
    expect(result.Data.UnitStatusThresholds).toEqual(thresholds);
    const now = Date.parse('2026-09-21T12:15:00Z');
    expect(evaluateUnitStatusAlert({ CurrentStatusBaseType: UnitStatusBaseType.Dispatched, CurrentStatusTimestampUtc: '2026-09-21T12:14:00Z' }, result.Data.UnitStatusThresholds, now).level).toBe('warn');
    expect(evaluateUnitStatusAlert({ CurrentStatusBaseType: UnitStatusBaseType.AtHospital, CurrentStatusTimestampUtc: '2026-09-21T12:00:00Z' }, result.Data.UnitStatusThresholds, now).level).toBe('alert');
  });

  it('refreshes expired authentication instead of accepting an anonymous empty timer list', async () => {
    getAuthState.mockReturnValue({ accessToken: 'expired-token', refreshToken: 'refresh-token', refreshAccessToken });
    refreshAccessToken.mockImplementation(async () => {
      getAuthState.mockReturnValue({ accessToken: 'department-token', refreshToken: 'refresh-token', refreshAccessToken });
    });
    const requests: string[] = [];
    api.defaults.adapter = async (config) => {
      requests.push(config.url!);
      // The public bootstrap endpoint can succeed without a department. The protected
      // endpoint challenges the caller so the client's existing token refresh can run.
      if (config.url === '/Config/GetConfig') {
        return { data: { Data: { UnitStatusThresholds: [] } }, status: 200, statusText: 'OK', headers: {}, config };
      }
      if (config.headers.Authorization !== 'Bearer department-token') {
        throw unauthorized(config);
      }
      return { data: { Data: { UnitStatusThresholds: thresholds } }, status: 200, statusText: 'OK', headers: {}, config };
    };

    const result = await getConfig('bigboard-key');

    expect(result.Data.UnitStatusThresholds).toEqual(thresholds);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(requests).toEqual(['/Config/GetDepartmentConfig', '/Config/GetDepartmentConfig']);
  });

  it('propagates an authentication failure without falling back to public configuration', async () => {
    getAuthState.mockReturnValue({ accessToken: null, refreshToken: null, refreshAccessToken });
    const requests: string[] = [];
    api.defaults.adapter = async (config) => {
      requests.push(config.url!);
      throw unauthorized(config);
    };

    await expect(getConfig('bigboard-key')).rejects.toMatchObject({ response: { status: 401 } });

    expect(requests).toEqual(['/Config/GetDepartmentConfig']);
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('keeps system configuration on its existing endpoint', async () => {
    api.defaults.adapter = async (config) => {
      expect(config.url).toBe('/Config/GetSystemConfig');
      return { data: { Data: {} }, status: 200, statusText: 'OK', headers: {}, config };
    };

    await expect(getSystemConfig()).resolves.toEqual({ Data: {} });
  });
});
