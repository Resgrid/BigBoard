/**
 * Runtime Environment Configuration for Web
 * 
 * This file is designed to be used with envsubst for Docker deployments.
 * The placeholder values (e.g., ${BIGBOARD_BASE_API_URL}) will be replaced
 * at container startup time with actual environment variable values.
 * 
 * Usage with envsubst:
 *   envsubst < /usr/share/nginx/html/env-config.template.js > /usr/share/nginx/html/env-config.js
 * 
 * For local development, these values will be replaced by the build-time values
 * if not substituted.
 */
window.__ENV__ = {
  BASE_API_URL: '${BIGBOARD_BASE_API_URL}',
  API_VERSION: '${BIGBOARD_API_VERSION}',
  RESGRID_API_URL: '${BIGBOARD_RESGRID_API_URL}',
  CHANNEL_HUB_NAME: '${BIGBOARD_CHANNEL_HUB_NAME}',
  REALTIME_GEO_HUB_NAME: '${BIGBOARD_REALTIME_GEO_HUB_NAME}',
  LOGGING_KEY: '${BIGBOARD_LOGGING_KEY}',
  APP_KEY: '${BIGBOARD_APP_KEY}',
  MAPBOX_PUBKEY: '${BIGBOARD_MAPBOX_PUBKEY}',
  SENTRY_DSN: '${BIGBOARD_SENTRY_DSN}',
  COUNTLY_APP_KEY: '${BIGBOARD_COUNTLY_APP_KEY}',
  COUNTLY_SERVER_URL: '${BIGBOARD_COUNTLY_SERVER_URL}',
  MAINTENANCE_MODE: '${BIGBOARD_MAINTENANCE_MODE}',
};
