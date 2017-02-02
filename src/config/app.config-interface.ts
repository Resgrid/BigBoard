import {OpaqueToken} from '@angular/core';

/**
 * Use an Angular2 OpaqueToken to avoid conflicts in case you import modules that define a token with the same name ('app.config')
 * @type {OpaqueToken}
 */
export let APP_CONFIG_TOKEN = new OpaqueToken('app.config');

/**
 * Every application that communicates with a backend service will need an endpoint
 * where to send the API request. This endpoint is different in development and production mode,
 * that's why it makes sense to keep it in an environment-aware config file (instead of constants.ts for example)
 */
export interface AppConfig {
  apiEndpoint:      string;
}
