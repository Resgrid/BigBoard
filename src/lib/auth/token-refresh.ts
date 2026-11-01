import { isAxiosError } from 'axios';

/**
 * Decides whether a failed token-refresh attempt means the stored credentials are
 * known-bad and the user must be logged out.
 *
 * Returns true ONLY when the OAuth2 token endpoint explicitly rejected the refresh
 * token — a 400 or 401 whose body says `invalid_grant`. Every other failure is treated
 * as transient and recoverable:
 *   - no response at all (offline, DNS/TLS failure, request timeout)
 *   - 5xx server errors (the backend is down/degraded, e.g. 502 Bad Gateway)
 *   - 429 rate limiting
 *   - a 400/401 with any other OAuth error (`invalid_client`, `invalid_request`, ...) or
 *     no OAuth body at all (a proxy's error page): those say nothing about this token
 *   - any non-Axios error (e.g. "no refresh token available")
 *
 * Treating those as recoverable (reject + retry on the next request) instead of
 * forcing logout prevents a backend incident from logging out every active user at
 * once — critical for an emergency-response app. A refresh token that really is dead
 * still ends the session once it expires.
 */
export const isRefreshCredentialRejection = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  if (status !== 400 && status !== 401) {
    return false;
  }
  const data: unknown = error.response?.data;
  return typeof data === 'object' && data !== null && (data as { error?: unknown }).error === 'invalid_grant';
};
