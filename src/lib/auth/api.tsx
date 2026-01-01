import { Env } from '@env';
import axios from 'axios';
import queryString from 'query-string';

import { logger } from '@/lib/logging';

import { getBaseApiUrl } from '../storage/app';
import type { AuthResponse, LoginCredentials, LoginResponse } from './types';

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
