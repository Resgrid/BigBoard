jest.mock('../../common/client', () => {
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

import { getWeatherAlert } from '../weatherAlerts';

const mockEndpoints: Record<string, { get: jest.Mock }> = jest.requireMock('../../common/client').__endpoints;

describe('weather alerts api', () => {
  it('puts the alert id in the GetWeatherAlert path', async () => {
    await getWeatherAlert('abc-123');

    const api = mockEndpoints['/WeatherAlerts/GetWeatherAlert/abc-123'];
    expect(api).toBeDefined();
    expect(api.get).toHaveBeenCalledWith();
    expect(mockEndpoints['/WeatherAlerts/GetWeatherAlert']).toBeUndefined();
  });

  it('encodes the alert id as a path segment', async () => {
    await getWeatherAlert('a/b c');

    expect(mockEndpoints['/WeatherAlerts/GetWeatherAlert/a%2Fb%20c']).toBeDefined();
  });
});
