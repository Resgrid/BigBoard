import { isAxiosError } from 'axios';

/**
 * Decides whether a failed token-refresh attempt means the stored credentials are
 * known-bad and the user must be logged out.
 *
 * Returns true ONLY when the OAuth2 token endpoint explicitly rejected the refresh
 * token — HTTP 400 (`invalid_grant`) or 401. Every other failure is treated as
 * transient and recoverable:
 *   - no response at all (offline, DNS/TLS failure, request timeout)
 *   - 5xx server errors (the backend is down/degraded, e.g. 502 Bad Gateway)
 *   - 429 rate limiting
 *   - any non-Axios error (e.g. "no refresh token available")
 *
 * Treating those as recoverable (reject + retry on the next request) instead of
 * forcing logout prevents a backend incident from logging out every active user at
 * once — critical for an emergency-response app.
 */
export const isRefreshCredentialRejection = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status === 400 || status === 401;
};
