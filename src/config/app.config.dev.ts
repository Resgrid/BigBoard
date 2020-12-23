import {AppConfig} from './app.config-interface';

/**
 * This is the DEVELOPMENT configuration for your application.
 * The values provided here will be used when you run the application using
 * `ionic serve`
 */

/**
 * Please change the value below with the value for your local backend
 * @type {{apiEndpoint: string}}
 */
export let APP_DEV_CONFIG: AppConfig = {
  BaseApiUrl:       "https://api.resgrid.com",
  ResgridApiUrl:    "https://api.resgrid.com/api/v3",
  ChannelUrl:       "https://events.resgrid.com/",
  ChannelHubName:   "eventingHub",
  What3WordsKey:    "HIDDEN",
  IsDemo:           false,
  DemoToken:        "S2RoUU1jSFRFbU1oeHVmS0RCei9xUVk1STQxTnFObktTVmJ5V0NHMWxXTT0=",
  Version:          "3.0.0",
  GoogleMapKey:     "GOOGLEAPIHIDDEN"
};

/**
 * We need to set the APP_CONFIG as a global variable in order to be able
 * to read it in the configuration for the AppModule (app.module.ts)
 * @type {AppConfig}
 */
window['APP_CONFIG'] = APP_DEV_CONFIG;