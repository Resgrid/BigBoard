jest.mock('@/api/common/client', () => {
  const posts: Record<string, jest.Mock> = {};
  const puts: Record<string, jest.Mock> = {};
  return {
    __posts: posts,
    __puts: puts,
    createApiEndpoint: (endpoint: string) => {
      posts[endpoint] = jest.fn().mockResolvedValue({ data: { Id: 'call-1' } });
      puts[endpoint] = jest.fn().mockResolvedValue({ data: { Id: 'call-1' } });
      return { get: jest.fn(), post: posts[endpoint], put: puts[endpoint], delete: jest.fn() };
    },
  };
});

import { createCall, updateCall } from '../calls';

const { __posts: posts, __puts: puts } = jest.requireMock('@/api/common/client') as { __posts: Record<string, jest.Mock>; __puts: Record<string, jest.Mock> };

/** The body of the one save sent to `endpoint`; fails the test outright if that save never went out. */
const sentBody = (sends: Record<string, jest.Mock>, endpoint: string): Record<string, unknown> => {
  const send = sends[endpoint];
  expect(send).toHaveBeenCalledTimes(1);
  return send.mock.calls[0][0] as Record<string, unknown>;
};

describe('call save Geolocation', () => {
  beforeEach(() => {
    Object.values(posts).forEach((post) => post.mockClear());
    Object.values(puts).forEach((put) => put.mockClear());
  });

  it('does not send a bare comma on create when no location was picked', async () => {
    await createCall({ name: 'Structure Fire', nature: 'Smoke showing', address: '1 Main St', priority: 1 });

    expect(sentBody(posts, '/Calls/SaveCall').Geolocation).toBe('');
  });

  it('sends the picked location on create', async () => {
    await createCall({ name: 'Structure Fire', nature: 'Smoke showing', latitude: 39.2733, longitude: -119.5841, priority: 1 });

    expect(sentBody(posts, '/Calls/SaveCall').Geolocation).toBe('39.2733,-119.5841');
  });

  it('does not send a bare comma on update when no location was picked', async () => {
    await updateCall({ callId: '1', name: 'Structure Fire', nature: 'Smoke showing', address: '1 Main St', priority: 1 });

    expect(sentBody(puts, '/Calls/EditCall').Geolocation).toBe('');
  });

  it('sends the picked location on update', async () => {
    await updateCall({ callId: '1', name: 'Structure Fire', nature: 'Smoke showing', latitude: 0, longitude: 32.5, priority: 1 });

    expect(sentBody(puts, '/Calls/EditCall').Geolocation).toBe('0,32.5');
  });
});

describe('call update contract', () => {
  beforeEach(() => {
    Object.values(posts).forEach((post) => post.mockClear());
    Object.values(puts).forEach((put) => put.mockClear());
  });

  it('PUTs to EditCall with the call id as Id', async () => {
    await updateCall({ callId: '17', name: 'Structure Fire', nature: 'Smoke showing', priority: 1 });

    expect(posts['/Calls/EditCall']).not.toHaveBeenCalled();
    expect(sentBody(puts, '/Calls/EditCall')).toEqual(expect.objectContaining({ Id: '17', Name: 'Structure Fire', Nature: 'Smoke showing', Priority: 1 }));
    expect(sentBody(puts, '/Calls/EditCall')).not.toHaveProperty('CallId');
  });

  it('never creates the nonexistent UpdateCall route', () => {
    expect(posts['/Calls/UpdateCall']).toBeUndefined();
  });
});
