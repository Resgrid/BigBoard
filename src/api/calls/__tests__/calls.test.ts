jest.mock('@/api/common/client', () => {
  const posts: Record<string, jest.Mock> = {};
  return {
    __posts: posts,
    createApiEndpoint: (endpoint: string) => {
      posts[endpoint] = jest.fn().mockResolvedValue({ data: { Id: 'call-1' } });
      return { get: jest.fn(), post: posts[endpoint], put: jest.fn(), delete: jest.fn() };
    },
  };
});

import { createCall, updateCall } from '../calls';

const posts = (jest.requireMock('@/api/common/client') as { __posts: Record<string, jest.Mock> }).__posts;

const sentGeolocation = (endpoint: string): unknown => (posts[endpoint].mock.calls[0][0] as { Geolocation: unknown }).Geolocation;

describe('call save Geolocation', () => {
  beforeEach(() => {
    Object.values(posts).forEach((post) => post.mockClear());
  });

  it('does not send a bare comma on create when no location was picked', async () => {
    await createCall({ name: 'Structure Fire', nature: 'Smoke showing', address: '1 Main St', priority: 1 });

    expect(sentGeolocation('/Calls/SaveCall')).toBe('');
  });

  it('sends the picked location on create', async () => {
    await createCall({ name: 'Structure Fire', nature: 'Smoke showing', latitude: 39.2733, longitude: -119.5841, priority: 1 });

    expect(sentGeolocation('/Calls/SaveCall')).toBe('39.2733,-119.5841');
  });

  it('does not send a bare comma on update when no location was picked', async () => {
    await updateCall({ callId: '1', name: 'Structure Fire', nature: 'Smoke showing', address: '1 Main St', priority: 1 });

    expect(sentGeolocation('/Calls/UpdateCall')).toBe('');
  });

  it('sends the picked location on update', async () => {
    await updateCall({ callId: '1', name: 'Structure Fire', nature: 'Smoke showing', latitude: 0, longitude: 32.5, priority: 1 });

    expect(sentGeolocation('/Calls/UpdateCall')).toBe('0,32.5');
  });
});
