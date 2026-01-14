#!/bin/sh
# Docker entrypoint script for Resgrid BigBoard Web
# This script substitutes environment variables into the env-config.js file at container startup

set -e

# Define the paths
OUTPUT_FILE="/usr/share/nginx/html/env-config.js"
INDEX_HTML="/usr/share/nginx/html/index.html"

# Set default values for environment variables if not provided
export BIGBOARD_BASE_API_URL="${BIGBOARD_BASE_API_URL:-https://api.resgrid.com}"
export BIGBOARD_API_VERSION="${BIGBOARD_API_VERSION:-v4}"
export BIGBOARD_RESGRID_API_URL="${BIGBOARD_RESGRID_API_URL:-/api/v4}"
export BIGBOARD_CHANNEL_HUB_NAME="${BIGBOARD_CHANNEL_HUB_NAME:-eventingHub}"
export BIGBOARD_REALTIME_GEO_HUB_NAME="${BIGBOARD_REALTIME_GEO_HUB_NAME:-geolocationHub}"
export BIGBOARD_LOGGING_KEY="${BIGBOARD_LOGGING_KEY:-}"
export BIGBOARD_APP_KEY="${BIGBOARD_APP_KEY:-}"
export BIGBOARD_MAPBOX_PUBKEY="${BIGBOARD_MAPBOX_PUBKEY:-}"
export BIGBOARD_SENTRY_DSN="${BIGBOARD_SENTRY_DSN:-}"
export BIGBOARD_COUNTLY_APP_KEY="${BIGBOARD_COUNTLY_APP_KEY:-}"
export BIGBOARD_COUNTLY_SERVER_URL="${BIGBOARD_COUNTLY_SERVER_URL:-}"
export BIGBOARD_MAINTENANCE_MODE="${BIGBOARD_MAINTENANCE_MODE:-false}"

# Create the env-config.js with substituted values
cat > "$OUTPUT_FILE" << EOF
/**
 * Runtime Environment Configuration for Web
 * Generated at container startup time
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
  MAINTENANCE_MODE: ${BIGBOARD_MAINTENANCE_MODE},
};
EOF

echo "Environment configuration generated successfully"

# Inject env-config.js script tag into index.html if not already present
if [ -f "$INDEX_HTML" ]; then
  if ! grep -q "env-config.js" "$INDEX_HTML"; then
    # Insert the script tag right after the opening <head> tag
    sed -i 's|<head>|<head><script src="/env-config.js"></script>|' "$INDEX_HTML"
    echo "Injected env-config.js into index.html"
  fi
fi

# Execute the original CMD (nginx)
exec "$@"
