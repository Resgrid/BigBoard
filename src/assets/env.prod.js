(function (window) {
    window['env'] = window['env'] || {};
  
    // Environment variables
    window['env']['baseApiUrl'] = '${BASE_API_URL}';
    window['env']['resgridApiUrl'] = '${API_URL}';
    window['env']['channelUrl'] = '${CHANNEL_URL}';
    window['env']['channelHubName'] = '${CHANNEL_HUB_NAME}';
    window['env']['logLevel'] = '${LOG_LEVEL}';
    window['env']['loggingKey'] = '${LOGGING_KEY}';
    window['env']['apiSettingsConfigKey'] = '${APISETTINGS_KEY}';
  })(this);