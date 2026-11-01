jest.mock('@/api/common/client', () => {
  const endpoints: Record<string, { get: jest.Mock }> = {};
  return {
    __endpoints: endpoints,
    createApiEndpoint: (path: string) => {
      const api = { get: jest.fn().mockResolvedValue({ data: { Data: {} } }) };
      endpoints[path] = api;
      return api;
    },
  };
});

import { getSetUnitState } from '../dispatch';

const mockEndpoints: Record<string, { get: jest.Mock }> = jest.requireMock('@/api/common/client').__endpoints;

describe('dispatch api', () => {
  it('reads set-unit-state data from GetSetUnitStatusData', async () => {
    await getSetUnitState('5');

    expect(Object.keys(mockEndpoints)).toEqual(['/Dispatch/GetSetUnitStatusData']);
    expect(mockEndpoints['/Dispatch/GetSetUnitStatusData'].get).toHaveBeenCalledWith({ unitId: '5' });
  });
});
