(function (window) {
    window['env'] = window['env'] || {};
  
    // Environment variables
    window['env']['baseApiUrl'] = 'https://api.resgrid.com';
    window['env']['resgridApiUrl'] = '/api/v4';
    window['env']['channelUrl'] = 'https://events.resgrid.com/';
    window['env']['channelHubName'] = 'eventingHub';
    window['env']['realtimeGeolocationHubName'] = 'geolocationHub';
    window['env']['logLevel'] = '0';
    window['env']['loggingKey'] = 'LOGGINGKEY';
    window['env']['apiSettingsConfigKey'] = 'APISETTINGSKEY';
  })(this);