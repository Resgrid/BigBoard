import { Env } from '@env';
import axios from 'axios';
import * as Crypto from 'expo-crypto';
import queryString from 'query-string';

import { logger } from '@/lib/logging';

import { getBaseApiUrl } from '../storage/app';
import type { AuthResponse, DepartmentSsoConfig, ExternalTokenRequest, LoginCredentials, LoginResponse } from './types';

const authApi = axios.create({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Add request interceptor to dynamically set baseURL
authApi.interceptors.request.use((config) => {
  config.baseURL = getBaseApiUrl();
  logger.info({
    message: 'Auth API request interceptor',
    context: { baseURL: config.baseURL, url: config.url },
  });
  return config;
});

export const loginRequest = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const data = queryString.stringify({
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password,
      scope: Env.IS_MOBILE_APP ? 'openid profile offline_access mobile' : 'openid profile offline_access',
    });

    logger.info({
      message: 'API: Sending login request',
      context: { username: credentials.username, baseURL: authApi.defaults.baseURL },
    });

    const response = await authApi.post<AuthResponse>('/connect/token', data);

    logger.info({
      message: 'API: Received response',
      context: { status: response.status, hasData: !!response.data },
    });

    if (response.status === 200) {
      logger.info({
        message: 'Login successful',
        context: { username: credentials.username },
      });

      return {
        successful: true,
        message: 'Login successful',
        authResponse: response.data,
      };
    } else {
      logger.error({
        message: 'Login failed',
        context: { response, username: credentials.username },
      });

      return {
        successful: false,
        message: 'Login failed',
        authResponse: null,
      };
    }
  } catch (error) {
    logger.error({
      message: 'Login API call failed with exception',
      context: { error, username: credentials.username },
    });

    // Return a failed response instead of throwing
    return {
      successful: false,
      message: error instanceof Error ? error.message : 'Login failed',
      authResponse: null,
    };
  }
};

export const refreshTokenRequest = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    const data = queryString.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: '',
    });

    const response = await authApi.post<AuthResponse>('/connect/token', data);

    logger.info({
      message: 'Token refresh successful',
    });

    return response.data;
  } catch (error) {
    logger.error({
      message: 'Token refresh failed',
      context: { error },
    });
    throw error;
  }
};

export const fetchSsoConfigForUser = async (username: string, departmentId?: number): Promise<DepartmentSsoConfig | null> => {
  try {
    const params: Record<string, string | number> = { username };
    if (departmentId !== undefined) {
      params.departmentId = departmentId;
    }

    const response = await authApi.get('/connect/sso-config-for-user', { params });

    const username_hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, username);
    logger.info({
      message: 'SSO config fetched successfully',
      context: { username_hash },
    });

    return Object.hasOwn(response.data ?? {}, 'Data') ? response.data.Data : (response.data ?? null);
  } catch (error) {
    logger.error({
      message: 'Failed to fetch SSO config',
      context: { error },
    });
    return null;
  }
};

export const externalTokenRequest = async (credentials: ExternalTokenRequest): Promise<LoginResponse> => {
  try {
    const data = queryString.stringify({
      provider: credentials.provider,
      external_token: credentials.external_token,
      ...(credentials.department_code ? { department_code: credentials.department_code } : {}),
      scope: credentials.scope,
    });

    logger.info({
      message: 'API: Sending external token request',
      context: { provider: credentials.provider },
    });

    const response = await authApi.post<AuthResponse>('/connect/external-token', data);

    if (response.status === 200) {
      logger.info({ message: 'External token exchange successful' });
      return {
        successful: true,
        message: 'Login successful',
        authResponse: response.data,
      };
    }

    return { successful: false, message: 'External token exchange failed', authResponse: null };
  } catch (error) {
    logger.error({
      message: 'External token request failed',
      context: { error },
    });
    return {
      successful: false,
      message: error instanceof Error ? error.message : 'SSO login failed',
      authResponse: null,
    };
  }
};
