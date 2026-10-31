import { describe, expect, it } from '@jest/globals';
import { AxiosError, type AxiosResponse } from 'axios';

import { isRefreshCredentialRejection } from '../token-refresh';

const axiosErrorWithStatus = (status: number): AxiosError => {
  const response = { status, statusText: '', data: {}, headers: {}, config: {} as never } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, response);
};

describe('isRefreshCredentialRejection', () => {
  it('returns true when the token endpoint rejects the refresh token (400 invalid_grant)', () => {
    expect(isRefreshCredentialRejection(axiosErrorWithStatus(400))).toBe(true);
  });

  it('returns true for a 401 from the token endpoint', () => {
    expect(isRefreshCredentialRejection(axiosErrorWithStatus(401))).toBe(true);
  });

  it.each([500, 502, 503, 504, 429])('returns false for transient server status %i (preserve session)', (status) => {
    expect(isRefreshCredentialRejection(axiosErrorWithStatus(status))).toBe(false);
  });

  it('returns false for 403 (ambiguous, not a definitive credential rejection)', () => {
    expect(isRefreshCredentialRejection(axiosErrorWithStatus(403))).toBe(false);
  });

  it('returns false for a network error (no response — offline/DNS/TLS)', () => {
    expect(isRefreshCredentialRejection(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(false);
  });

  it('returns false for a timeout (no response)', () => {
    expect(isRefreshCredentialRejection(new AxiosError('timeout exceeded', 'ECONNABORTED'))).toBe(false);
  });

  it('returns false for a non-Axios error (e.g. "no refresh token available")', () => {
    expect(isRefreshCredentialRejection(new Error('No refresh token available'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isRefreshCredentialRejection(null)).toBe(false);
    expect(isRefreshCredentialRejection(undefined)).toBe(false);
    expect(isRefreshCredentialRejection({ response: { status: 401 } })).toBe(false);
  });
});
