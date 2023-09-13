export const environment = {
  production: true,
  baseApiUrl: window['env']['baseApiUrl'] || 'https://api.resgrid.com',
  resgridApiUrl: window['env']['resgridApiUrl'] || '/api/v4',
  channelUrl: window['env']['channelUrl'] || 'https://events.resgrid.com/',
  channelHubName: window['env']['channelHubName'] || 'eventingHub',
  realtimeGeolocationHubName:
    window['env']['realtimeGeolocationHubName'] || 'geolocationHub',
  logLevel: 0,
  version: '99.99.99',
  loggingKey: window['env']['loggingKey'] || 'LOGGINGKEY',
  apiSettingsConfigKey:
    window['env']['apiSettingsConfigKey'] || 'APISETTINGSKEY',
};
