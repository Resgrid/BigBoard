jest.mock('@/lib/logging', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } }));
jest.mock('@/lib/mapbox-token', () => ({ clearMapboxToken: jest.fn() }));
jest.mock('@/lib/cache/cache-manager', () => ({ cacheManager: { clear: jest.fn() } }));
jest.mock('@/lib/cache/cache-scope', () => ({ clearCacheScope: jest.fn(), setCacheScope: jest.fn() }));
jest.mock('@/lib/auth/api', () => ({ loginRequest: jest.fn(), refreshTokenRequest: jest.fn(), externalTokenRequest: jest.fn() }));

import useAuthStore from '../store';

describe('auth store: a failed sign-in', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'signedOut', error: null, loginFailure: null, accessToken: null });
  });

  it('is never restored after a restart, since its reason is not stored', () => {
    useAuthStore.setState({ status: 'error', error: 'account_locked_out', loginFailure: { code: 'account_locked_out', lockoutMinutes: 9 } });

    const saved = useAuthStore.persist.getOptions().partialize!(useAuthStore.getState()) as Record<string, unknown>;

    expect(saved.status).toBe('signedOut');
    expect(saved).not.toHaveProperty('error');
    expect(saved).not.toHaveProperty('loginFailure');
  });

  it('keeps a signed-in status as it was', () => {
    useAuthStore.setState({ status: 'signedIn', accessToken: 'a' });

    const saved = useAuthStore.persist.getOptions().partialize!(useAuthStore.getState()) as Record<string, unknown>;

    expect(saved).toMatchObject({ status: 'signedIn', accessToken: 'a' });
  });

  it('is dropped on sign-out', async () => {
    useAuthStore.setState({ status: 'error', error: 'account_locked_out', loginFailure: { code: 'account_locked_out', lockoutMinutes: 9 } });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', error: null, loginFailure: null });
  });
});
