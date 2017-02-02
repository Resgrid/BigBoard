import {AppConfig} from './app.config-interface';

/**
 * This is the PRODUCTION configuration for your application.
 * The values provided here will be used when you run the application using
 * `npm run ionic:build`
 */

/**
 * Please change the value below with the value for your production backend
 * @type {{apiEndpoint: string}}
 */
export let APP_CONFIG: AppConfig = {
  apiEndpoint: 'http://localhost:8124',
};

/**
 * We need to set the APP_CONFIG as a global variable in order to be able
 * to read it in the configuration for the AppModule (app.module.ts)
 * @type {AppConfig}
 */
window['APP_CONFIG'] = APP_CONFIG;
